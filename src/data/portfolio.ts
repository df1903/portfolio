import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';

import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { buildKnowledge, markdownToParagraphs } from '@/lib/chat/knowledge';
import type { Knowledge } from '@/lib/chat/types';
import {
	certificateCategories,
	mergeCertificates,
	totalCertificateHours,
	type Certificate,
} from '@/lib/certificates';
import { buildContactChannels, type ContactChannel } from '@/lib/contactLinks';
import { formatDateRange, formatLongDate } from '@/lib/formatDate';
import { localize } from '@/lib/localize';
import { buildTechUsage, usageCount, type TechUsage } from '@/lib/techUsage';

import {
	CERTIFICATE_CATEGORY_LABELS,
	PROJECT_CATEGORY_LABELS,
	TECHNOLOGY_CATEGORY_LABELS,
} from './labels';
import { site } from './site';

/**
 * Único punto que consulta las colecciones (IoC): resuelve idioma y referencias, y entrega modelos
 * de vista planos a las páginas y a los endpoints `knowledge.json`. Los componentes solo reciben props.
 */

export interface TechnologyView {
	id: string;
	name: string;
	icon: string;
	category: string;
	categoryLabel: string;
	aliases: string[];
	featured: boolean;
	usage: TechUsage;
}

export interface ProjectView {
	id: string;
	title: string;
	summary: string;
	description: string;
	category: string;
	categoryLabel: string;
	context?: string;
	image?: ImageMetadata;
	coverIcon: string;
	technologies: TechnologyView[];
	highlights: string[];
	repos: { label: string; url: string }[];
	demo?: string;
	featured: boolean;
}

export interface ExperienceView {
	id: string;
	company: string;
	role: string;
	start: Date;
	end?: Date;
	period: string;
	location: string;
	summary: string;
	responsibilities: string[];
	technologies: TechnologyView[];
}

export interface StudyView {
	id: string;
	title: string;
	institution: string;
	location?: string;
	status: 'in-progress' | 'completed';
	period?: string;
	summary: string;
	highlights: string[];
	focusAreas: string[];
}

export interface SkillView {
	id: string;
	name: string;
	kind: 'soft' | 'fundamental';
	icon: string;
	description: string;
	topics: string[];
}

export interface CertificateView extends Certificate<ImageMetadata> {
	categoryLabel: string;
	dateLabel?: string;
}

export interface CategoryOption {
	id: string;
	label: string;
	count: number;
}

export interface AboutView {
	headline: string;
	roles: string[];
	tagline: string;
	bio: string[];
	currently: string[];
	languages: { name: string; level: string }[];
	interests: string[];
}

export interface Portfolio {
	locale: Locale;
	about: AboutView;
	technologies: TechnologyView[];
	technologyCategories: CategoryOption[];
	projects: ProjectView[];
	projectCategories: CategoryOption[];
	experience: ExperienceView[];
	studies: StudyView[];
	skills: SkillView[];
	certificates: CertificateView[];
	certificateCategories: CategoryOption[];
	certificateHours: number;
	contactChannels: ContactChannel[];
	knowledge: Knowledge;
}

const certificateImages = import.meta.glob<{ default: ImageMetadata }>(
	'/src/assets/certificates/*.{webp,png,jpg,jpeg,avif}',
	{ eager: true },
);

/** Opciones de filtro: solo categorías con elementos, en el orden de `labels`. */
function categoryOptions(
	items: { category: string }[],
	labels: Record<string, string>,
	order: string[] = Object.keys(labels),
): CategoryOption[] {
	return order
		.map((id) => ({
			id,
			label: labels[id] ?? id,
			count: items.filter((item) => item.category === id).length,
		}))
		.filter((option) => option.count > 0);
}

export async function loadPortfolio(locale: Locale): Promise<Portfolio> {
	const ui = UI[locale];
	const technologyLabels = TECHNOLOGY_CATEGORY_LABELS[locale];
	const projectLabels = PROJECT_CATEGORY_LABELS[locale];
	const certificateLabels = CERTIFICATE_CATEGORY_LABELS[locale];

	const [aboutEntries, technologyEntries, projectEntries, experienceEntries] = await Promise.all([
		getCollection('about'),
		getCollection('technologies'),
		getCollection('projects'),
		getCollection('experience'),
	]);
	const [studyEntries, skillEntries, certificationEntries] = await Promise.all([
		getCollection('studies'),
		getCollection('skills'),
		getCollection('certifications'),
	]);

	const aboutEntry = aboutEntries[0];
	if (!aboutEntry) throw new Error('portfolio: falta src/content/about/about.md');
	// La biografía en español es el cuerpo Markdown; en inglés viene de `en.bio`.
	const about: AboutView = {
		bio: markdownToParagraphs(aboutEntry.body ?? ''),
		...localize(aboutEntry.data, locale),
	};

	const sortedProjects = projectEntries.toSorted((a, b) => a.data.order - b.data.order);
	const sortedExperience = experienceEntries.toSorted(
		(a, b) => b.data.start.getTime() - a.data.start.getTime(),
	);

	const usage = buildTechUsage(
		sortedProjects.map((entry) => ({
			label: localize(entry.data, locale).title,
			technologyIds: entry.data.technologies.map((technology) => technology.id),
		})),
		sortedExperience.map((entry) => ({
			label: `${localize(entry.data, locale).role} · ${entry.data.company}`,
			technologyIds: entry.data.technologies.map((technology) => technology.id),
		})),
	);

	const technologyOrder = Object.keys(technologyLabels);
	const technologies: TechnologyView[] = technologyEntries
		.map((entry) => ({
			id: entry.id,
			...entry.data,
			categoryLabel: technologyLabels[entry.data.category] ?? entry.data.category,
			usage: usage.get(entry.id) ?? { projects: [], experience: [] },
		}))
		// Por categoría y, dentro de cada una, primero las más usadas.
		.toSorted(
			(a, b) =>
				technologyOrder.indexOf(a.category) - technologyOrder.indexOf(b.category) ||
				usageCount(b.usage) - usageCount(a.usage) ||
				a.name.localeCompare(b.name, locale),
		);
	const technologyById = new Map(technologies.map((technology) => [technology.id, technology]));
	const resolveTechnologies = (references: { id: string }[]): TechnologyView[] =>
		references.map(({ id }) => {
			const technology = technologyById.get(id);
			if (!technology) throw new Error(`portfolio: tecnología desconocida "${id}"`);
			return technology;
		});

	const projects: ProjectView[] = sortedProjects.map((entry) => ({
		id: entry.id,
		...localize(entry.data, locale),
		categoryLabel: projectLabels[entry.data.category] ?? entry.data.category,
		technologies: resolveTechnologies(entry.data.technologies),
		repos: entry.data.repos.map((repo) => ({
			label: (locale === 'en' && repo.labelEn) || repo.label,
			url: repo.url,
		})),
	}));

	const experience: ExperienceView[] = sortedExperience.map((entry) => ({
		id: entry.id,
		...localize(entry.data, locale),
		period: formatDateRange(entry.data.start, entry.data.end, locale),
		technologies: resolveTechnologies(entry.data.technologies),
	}));

	const studies: StudyView[] = studyEntries
		.toSorted((a, b) => a.data.order - b.data.order)
		.map((entry) => ({
			id: entry.id,
			...localize(entry.data, locale),
			period: entry.data.start
				? formatDateRange(entry.data.start, entry.data.end, locale)
				: undefined,
		}));

	const skills: SkillView[] = skillEntries
		.toSorted((a, b) => a.data.order - b.data.order)
		.map((entry) => ({ id: entry.id, ...localize(entry.data, locale) }));

	const certificates: CertificateView[] = mergeCertificates(
		Object.fromEntries(
			Object.entries(certificateImages).map(([path, module]) => [path, module.default]),
		),
		certificationEntries.map((entry) => ({ id: entry.id, ...entry.data })),
	).map((certificate) => ({
		...certificate,
		categoryLabel: certificateLabels[certificate.category] ?? certificate.category,
		dateLabel: certificate.date ? formatLongDate(certificate.date, locale) : undefined,
	}));

	const contactChannels = buildContactChannels(site.contact, ui.contact);

	const knowledge = buildKnowledge({
		locale,
		site: { name: site.name, shortName: site.shortName, location: ui.meta.location },
		about,
		contactChannels,
		studies,
		experience: experience.map((job) => ({
			...job,
			technologyIds: job.technologies.map((technology) => technology.id),
		})),
		projects: projects.map((project) => ({
			...project,
			technologyIds: project.technologies.map((technology) => technology.id),
		})),
		technologies,
		skills,
		certifications: certificates,
	});

	return {
		locale,
		about,
		technologies,
		technologyCategories: categoryOptions(technologies, technologyLabels),
		projects,
		projectCategories: categoryOptions(projects, projectLabels),
		experience,
		studies,
		skills,
		certificates,
		certificateCategories: categoryOptions(
			certificates,
			certificateLabels,
			certificateCategories(certificates, Object.keys(certificateLabels)),
		),
		certificateHours: totalCertificateHours(certificates),
		contactChannels,
		knowledge,
	};
}
