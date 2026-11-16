import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Esquemas de contenido. Cada sección del portafolio es una colección independiente (R5):
 * agregar contenido = agregar una entrada, sin tocar componentes.
 *
 * Idiomas: el contenido base es español. Cada entrada admite un bloque opcional `en` con los
 * mismos campos de texto; lo que no se traduzca se muestra en español (ver `src/lib/localize.ts`).
 * Guía de edición: README.md → "Cómo agregar contenido".
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

/** Bloque `en`: los mismos campos de texto, todos opcionales. */
const translation = <Shape extends z.ZodRawShape>(shape: Shape) =>
	z.object(shape).partial().optional();

const aboutText = {
	headline: z.string(),
	roles: z.array(z.string()).min(1),
	tagline: z.string(),
	currently: z.array(z.string()),
	languages: z.array(z.object({ name: z.string(), level: z.string() })),
	interests: z.array(z.string()),
};

const about = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/about' }),
	schema: z.object({
		...aboutText,
		// El cuerpo Markdown es la biografía en español; en inglés va aquí, un párrafo por elemento.
		en: translation({ ...aboutText, bio: z.array(z.string()) }),
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

const skillText = {
	name: z.string(),
	description: z.string(),
	topics: z.array(z.string()).default([]),
};

const skills = defineCollection({
	loader: file('./src/content/skills/skills.yaml'),
	schema: z.object({
		...skillText,
		kind: z.enum(['soft', 'fundamental']),
		icon: z.string(),
		order: z.number().default(0),
		en: translation(skillText),
	}),
});

const studyText = {
	title: z.string(),
	location: z.string().optional(),
	summary: z.string(),
	highlights: z.array(z.string()).default([]),
	focusAreas: z.array(z.string()).default([]),
};

const studies = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/studies' }),
	schema: z.object({
		...studyText,
		institution: z.string(),
		status: z.enum(['in-progress', 'completed']),
		start: z.coerce.date().optional(),
		end: z.coerce.date().optional(),
		order: z.number().default(0),
		en: translation(studyText),
	}),
});

const experienceText = {
	role: z.string(),
	location: z.string(),
	summary: z.string(),
	responsibilities: z.array(z.string()).min(1),
};

const experience = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/experience' }),
	schema: z.object({
		...experienceText,
		company: z.string(),
		start: z.coerce.date(),
		/** Omitir `end` significa "actualidad". */
		end: z.coerce.date().optional(),
		/** R13: mismo vocabulario que la colección `technologies` (se valida en build). */
		technologies: z.array(reference('technologies')).default([]),
		en: translation(experienceText),
	}),
});

const projectText = {
	title: z.string(),
	summary: z.string(),
	description: z.string(),
	context: z.string().optional(),
	highlights: z.array(z.string()).default([]),
};

const projects = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			...projectText,
			category: z.enum(PROJECT_CATEGORIES),
			/** Sin imagen se genera una portada con el icono `coverIcon`. */
			image: image().optional(),
			coverIcon: z.string().default('mdi:code-braces'),
			technologies: z.array(reference('technologies')).min(1),
			repos: z
				.array(z.object({ label: z.string(), labelEn: z.string().optional(), url: z.url() }))
				.default([]),
			demo: z.url().optional(),
			featured: z.boolean().default(false),
			order: z.number().default(100),
			en: translation(projectText),
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
