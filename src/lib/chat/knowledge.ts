import type { Locale } from '@/i18n/config';
import type { ContactChannel } from '@/lib/contactLinks';
import { formatDateRange } from '@/lib/formatDate';

import { CHAT_MESSAGES } from './messages';
import type { Knowledge } from './types';

/** Datos planos (ya resueltos a un idioma por la página) con los que se arma la base de conocimiento. */
export interface KnowledgeSources {
	locale: Locale;
	site: { name: string; shortName: string; location: string };
	about: {
		headline: string;
		tagline: string;
		bio: string[];
		currently: string[];
		languages: { name: string; level: string }[];
		interests: string[];
	};
	contactChannels: ContactChannel[];
	studies: {
		title: string;
		institution: string;
		status: 'in-progress' | 'completed';
		summary: string;
		focusAreas: string[];
	}[];
	experience: {
		company: string;
		role: string;
		start: Date;
		end?: Date;
		location: string;
		summary: string;
		responsibilities: string[];
		technologyIds: string[];
	}[];
	projects: {
		title: string;
		summary: string;
		description: string;
		categoryLabel: string;
		highlights: string[];
		technologyIds: string[];
		repos: { label: string; url: string }[];
		demo?: string;
	}[];
	technologies: { id: string; name: string; categoryLabel: string; aliases: string[] }[];
	skills: Knowledge['skills'];
	certifications: { title: string; issuer?: string; date?: Date; hours?: number }[];
}

/** Extrae los párrafos de texto de un cuerpo Markdown simple (sin encabezados ni listas). */
export function markdownToParagraphs(markdown: string): string[] {
	return markdown
		.split(/\n{2,}/)
		.map((block) => block.replace(/\s+/g, ' ').trim())
		.filter((block) => block && !block.startsWith('#'));
}

export function buildKnowledge(sources: KnowledgeSources): Knowledge {
	const { locale, site, about } = sources;
	const messages = CHAT_MESSAGES[locale];
	const firstName = site.shortName.split(' ')[0];
	const firstTechnology = sources.experience[0]?.technologyIds
		.map((id) => sources.technologies.find((technology) => technology.id === id)?.name)
		.find(Boolean);

	return {
		locale,
		profile: {
			name: site.name,
			shortName: site.shortName,
			headline: about.headline,
			tagline: about.tagline,
			location: site.location,
			bio: about.bio,
			currently: about.currently,
			languages: about.languages,
			interests: about.interests,
		},
		// Un canal sin enlace (p. ej. solo usuario de WhatsApp) no se puede ofrecer como enlace en el chat.
		contact: sources.contactChannels.flatMap((channel) =>
			channel.href ? [{ label: channel.label, url: channel.href }] : [],
		),
		studies: sources.studies.map((study) => ({
			title: study.title,
			institution: study.institution,
			status: messages.studyStatus[study.status],
			summary: study.summary,
			focusAreas: study.focusAreas,
		})),
		experience: sources.experience.map((job) => ({
			company: job.company,
			role: job.role,
			period: formatDateRange(job.start, job.end, locale),
			location: job.location,
			summary: job.summary,
			responsibilities: job.responsibilities,
			technologyIds: job.technologyIds,
		})),
		projects: sources.projects.map((project) => ({
			title: project.title,
			summary: project.summary,
			description: project.description,
			category: project.categoryLabel,
			highlights: project.highlights,
			technologyIds: project.technologyIds,
			links: [
				...(project.demo ? [{ label: 'Demo', url: project.demo }] : []),
				...project.repos.map((repo) => ({
					label: messages.repoLinkLabel(repo.label),
					url: repo.url,
				})),
			],
		})),
		technologies: sources.technologies.map((technology) => ({
			id: technology.id,
			name: technology.name,
			category: technology.categoryLabel,
			aliases: technology.aliases,
		})),
		skills: sources.skills,
		certifications: sources.certifications.map((certificate) => ({
			title: certificate.title,
			issuer: certificate.issuer,
			year: certificate.date?.getUTCFullYear(),
			hours: certificate.hours,
		})),
		suggestions: messages.suggestions({
			name: firstName,
			technology: firstTechnology,
			project: sources.projects[0]?.title,
		}),
	};
}
