import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';

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
import { buildTechUsage, usageCount, type TechUsage } from '@/lib/techUsage';

import {
	CERTIFICATE_CATEGORY_LABELS,
	PROJECT_CATEGORY_LABELS,
	TECHNOLOGY_CATEGORY_LABELS,
} from './labels';
import { site } from './site';

/**
 * Único punto que consulta las colecciones (IoC): resuelve referencias y entrega modelos de vista
 * planos a la página y al endpoint `/knowledge.json`. Los componentes solo reciben props.
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

const CONTACT_GREETING = 'Hola Daniel, vi tu portafolio';

const certificateImages = import.meta.glob<{ default: ImageMetadata }>(
	'/src/assets/certificates/*.{webp,png,jpg,jpeg,avif}',
	{ eager: true },
);

function categoryOptions(
	items: { category: string }[],
	order: string[],
	labels: Record<string, string>,
): CategoryOption[] {
	return order.map((id) => ({
		id,
		label: labels[id] ?? id,
		count: items.filter((item) => item.category === id).length,
	}));
}

export async function loadPortfolio(): Promise<Portfolio> {
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
	const about: AboutView = { ...aboutEntry.data, bio: markdownToParagraphs(aboutEntry.body ?? '') };

	const sortedProjects = projectEntries.toSorted((a, b) => a.data.order - b.data.order);
	const sortedExperience = experienceEntries.toSorted(
		(a, b) => b.data.start.getTime() - a.data.start.getTime(),
	);

	const usage = buildTechUsage(
		sortedProjects.map((entry) => ({
			label: entry.data.title,
			technologyIds: entry.data.technologies.map((technology) => technology.id),
		})),
		sortedExperience.map((entry) => ({
			label: `${entry.data.role} · ${entry.data.company}`,
			technologyIds: entry.data.technologies.map((technology) => technology.id),
		})),
	);

	const technologyCategoryOrder = Object.keys(TECHNOLOGY_CATEGORY_LABELS);
	const technologies: TechnologyView[] = technologyEntries
		.map((entry) => ({
			id: entry.id,
			...entry.data,
			categoryLabel: TECHNOLOGY_CATEGORY_LABELS[entry.data.category] ?? entry.data.category,
			usage: usage.get(entry.id) ?? { projects: [], experience: [] },
		}))
		// Por categoría y, dentro de cada una, primero las más usadas.
		.toSorted(
			(a, b) =>
				technologyCategoryOrder.indexOf(a.category) - technologyCategoryOrder.indexOf(b.category) ||
				usageCount(b.usage) - usageCount(a.usage) ||
				a.name.localeCompare(b.name, 'es'),
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
		...entry.data,
		categoryLabel: PROJECT_CATEGORY_LABELS[entry.data.category] ?? entry.data.category,
		technologies: resolveTechnologies(entry.data.technologies),
	}));

	const experience: ExperienceView[] = sortedExperience.map((entry) => ({
		id: entry.id,
		...entry.data,
		period: formatDateRange(entry.data.start, entry.data.end),
		technologies: resolveTechnologies(entry.data.technologies),
	}));

	const studies: StudyView[] = studyEntries
		.toSorted((a, b) => a.data.order - b.data.order)
		.map((entry) => ({
			id: entry.id,
			...entry.data,
			period: entry.data.start ? formatDateRange(entry.data.start, entry.data.end) : undefined,
		}));

	const skills: SkillView[] = skillEntries
		.toSorted((a, b) => a.data.order - b.data.order)
		.map((entry) => ({ id: entry.id, ...entry.data }));

	const certificates: CertificateView[] = mergeCertificates(
		Object.fromEntries(
			Object.entries(certificateImages).map(([path, module]) => [path, module.default]),
		),
		certificationEntries.map((entry) => ({ id: entry.id, ...entry.data })),
	).map((certificate) => ({
		...certificate,
		categoryLabel: CERTIFICATE_CATEGORY_LABELS[certificate.category] ?? certificate.category,
		dateLabel: certificate.date ? formatLongDate(certificate.date) : undefined,
	}));

	const contactChannels = buildContactChannels(site.contact, CONTACT_GREETING);

	const presentIn = (items: { category: string }[], order: string[]) =>
		order.filter((id) => items.some((item) => item.category === id));

	const knowledge = buildKnowledge({
		site,
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
		about,
		technologies,
		technologyCategories: categoryOptions(
			technologies,
			presentIn(technologies, Object.keys(TECHNOLOGY_CATEGORY_LABELS)),
			TECHNOLOGY_CATEGORY_LABELS,
		),
		projects,
		projectCategories: categoryOptions(
			projects,
			presentIn(projects, Object.keys(PROJECT_CATEGORY_LABELS)),
			PROJECT_CATEGORY_LABELS,
		),
		experience,
		studies,
		skills,
		certificates,
		certificateCategories: categoryOptions(
			certificates,
			certificateCategories(certificates, Object.keys(CERTIFICATE_CATEGORY_LABELS)),
			CERTIFICATE_CATEGORY_LABELS,
		),
		certificateHours: totalCertificateHours(certificates),
		contactChannels,
		knowledge,
	};
}
