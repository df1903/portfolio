import type { ContactChannel } from '@/lib/contactLinks';
import { formatDateRange } from '@/lib/formatDate';

import type { Knowledge } from './types';

/** Datos planos (ya resueltos por la página) a partir de los cuales se arma la base de conocimiento. */
export interface KnowledgeSources {
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

const STUDY_STATUS_LABELS = { 'in-progress': 'en curso', completed: 'finalizado' } as const;

/** Extrae los párrafos de texto de un cuerpo Markdown simple (sin encabezados ni listas). */
export function markdownToParagraphs(markdown: string): string[] {
	return markdown
		.split(/\n{2,}/)
		.map((block) => block.replace(/\s+/g, ' ').trim())
		.filter((block) => block && !block.startsWith('#'));
}

export function buildKnowledge(sources: KnowledgeSources): Knowledge {
	const { site, about } = sources;
	const firstProject = sources.projects[0]?.title;
	const firstTechnology = sources.experience[0]?.technologyIds
		.map((id) => sources.technologies.find((technology) => technology.id === id)?.name)
		.find(Boolean);

	return {
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
		contact: sources.contactChannels.map((channel) => ({
			label: channel.label,
			url: channel.href,
		})),
		studies: sources.studies.map((study) => ({
			title: study.title,
			institution: study.institution,
			status: STUDY_STATUS_LABELS[study.status],
			summary: study.summary,
			focusAreas: study.focusAreas,
		})),
		experience: sources.experience.map((job) => ({
			company: job.company,
			role: job.role,
			period: formatDateRange(job.start, job.end),
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
				...project.repos.map((repo) => ({ label: `Repo · ${repo.label}`, url: repo.url })),
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
		suggestions: [
			'¿Quién es Daniel?',
			'¿Qué experiencia laboral tiene?',
			firstTechnology ? `¿Tiene experiencia con ${firstTechnology}?` : '¿Qué tecnologías maneja?',
			firstProject ? `Háblame de ${firstProject}` : '¿Qué proyectos ha hecho?',
			'¿Cómo lo contacto?',
		],
	};
}
