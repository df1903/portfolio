import type { Locale } from '@/i18n/config';

/**
 * Etiquetas visibles de las categorías definidas en `content.config.ts`.
 * El orden de las claves es el orden en que se muestran los filtros.
 */
type CategoryLabels = Record<Locale, Record<string, string>>;

export const TECHNOLOGY_CATEGORY_LABELS: CategoryLabels = {
	es: {
		languages: 'Lenguajes',
		frontend: 'Frontend',
		backend: 'Backend',
		'data-ai': 'Datos e IA',
		databases: 'Bases de datos',
		devops: 'DevOps y versiones',
		systems: 'Sistemas y HPC',
		tools: 'Herramientas',
	},
	en: {
		languages: 'Languages',
		frontend: 'Frontend',
		backend: 'Backend',
		'data-ai': 'Data & AI',
		databases: 'Databases',
		devops: 'DevOps & version control',
		systems: 'Systems & HPC',
		tools: 'Tools',
	},
};

export const PROJECT_CATEGORY_LABELS: CategoryLabels = {
	es: {
		web: 'Web',
		ai: 'Inteligencia artificial',
		data: 'Datos',
		systems: 'Sistemas y HPC',
		games: 'Videojuegos',
		tools: 'Herramientas',
	},
	en: {
		web: 'Web',
		ai: 'Artificial intelligence',
		data: 'Data',
		systems: 'Systems & HPC',
		games: 'Games',
		tools: 'Tools',
	},
};

export const CERTIFICATE_CATEGORY_LABELS: CategoryLabels = {
	es: {
		ai: 'Inteligencia artificial',
		web: 'Desarrollo web',
		programming: 'Programación',
		fundamentals: 'Fundamentos',
		tools: 'Herramientas',
		'soft-skills': 'Habilidades',
		other: 'Otros',
	},
	en: {
		ai: 'Artificial intelligence',
		web: 'Web development',
		programming: 'Programming',
		fundamentals: 'Fundamentals',
		tools: 'Tools',
		'soft-skills': 'Soft skills',
		other: 'Other',
	},
};
