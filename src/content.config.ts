import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Esquemas de contenido. Cada sección del portafolio es una colección independiente (R5):
 * agregar contenido = agregar una entrada, sin tocar componentes.
 * Guía de edición: ver README.md → "Cómo agregar contenido".
 */

export const TECHNOLOGY_CATEGORIES = [
	'languages',
	'frontend',
	'backend',
	'data-ai',
	'databases',
	'devops',
	'tools',
	'systems',
] as const;

export const PROJECT_CATEGORIES = ['web', 'ai', 'data', 'systems', 'games', 'tools'] as const;

export const CERTIFICATE_CATEGORIES = [
	'ai',
	'web',
	'programming',
	'fundamentals',
	'tools',
	'soft-skills',
] as const;

const about = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/about' }),
	schema: z.object({
		headline: z.string(),
		roles: z.array(z.string()).min(1),
		tagline: z.string(),
		currently: z.array(z.string()).default([]),
		languages: z.array(z.object({ name: z.string(), level: z.string() })).default([]),
		interests: z.array(z.string()).default([]),
	}),
});

const technologies = defineCollection({
	loader: file('./src/content/technologies/technologies.yaml'),
	schema: z.object({
		name: z.string(),
		icon: z.string(),
		category: z.enum(TECHNOLOGY_CATEGORIES),
		/** Formas alternativas de nombrarla; las usa el chat para reconocerla en una pregunta. */
		aliases: z.array(z.string()).default([]),
		/** Las destacadas aparecen en el hero. */
		featured: z.boolean().default(false),
	}),
});

const skills = defineCollection({
	loader: file('./src/content/skills/skills.yaml'),
	schema: z.object({
		name: z.string(),
		kind: z.enum(['soft', 'fundamental']),
		icon: z.string(),
		description: z.string(),
		topics: z.array(z.string()).default([]),
		order: z.number().default(0),
	}),
});

const studies = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/studies' }),
	schema: z.object({
		title: z.string(),
		institution: z.string(),
		location: z.string().optional(),
		status: z.enum(['in-progress', 'completed']),
		start: z.coerce.date().optional(),
		end: z.coerce.date().optional(),
		summary: z.string(),
		highlights: z.array(z.string()).default([]),
		focusAreas: z.array(z.string()).default([]),
		order: z.number().default(0),
	}),
});

const experience = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/experience' }),
	schema: z.object({
		company: z.string(),
		role: z.string(),
		start: z.coerce.date(),
		/** Omitir `end` significa "actualidad". */
		end: z.coerce.date().optional(),
		location: z.string(),
		summary: z.string(),
		responsibilities: z.array(z.string()).min(1),
		/** R13: mismo vocabulario que la colección `technologies` (se valida en build). */
		technologies: z.array(reference('technologies')).default([]),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			summary: z.string(),
			description: z.string(),
			category: z.enum(PROJECT_CATEGORIES),
			context: z.string().optional(),
			/** Sin imagen se genera una portada con el icono `coverIcon`. */
			image: image().optional(),
			coverIcon: z.string().default('mdi:code-braces'),
			technologies: z.array(reference('technologies')).min(1),
			highlights: z.array(z.string()).default([]),
			repos: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
			demo: z.url().optional(),
			featured: z.boolean().default(false),
			order: z.number().default(100),
		}),
});

const certifications = defineCollection({
	loader: file('./src/content/certifications/certifications.yaml'),
	schema: z.object({
		title: z.string(),
		issuer: z.string(),
		date: z.coerce.date(),
		hours: z.number().optional(),
		category: z.enum(CERTIFICATE_CATEGORIES),
	}),
});

export const collections = {
	about,
	technologies,
	skills,
	studies,
	experience,
	projects,
	certifications,
};
