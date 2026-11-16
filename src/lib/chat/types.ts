/**
 * Base de conocimiento del asistente. Se genera en build a partir de las colecciones de contenido
 * (`/knowledge.json`) y la consumen tanto el motor local como el Worker con el modelo de lenguaje.
 */
export interface Knowledge {
	profile: {
		name: string;
		shortName: string;
		headline: string;
		tagline: string;
		location: string;
		bio: string[];
		currently: string[];
		languages: { name: string; level: string }[];
		interests: string[];
	};
	contact: KnowledgeLink[];
	studies: {
		title: string;
		institution: string;
		status: string;
		summary: string;
		focusAreas: string[];
	}[];
	experience: {
		company: string;
		role: string;
		period: string;
		location: string;
		summary: string;
		responsibilities: string[];
		technologyIds: string[];
	}[];
	projects: {
		title: string;
		summary: string;
		description: string;
		category: string;
		highlights: string[];
		technologyIds: string[];
		links: KnowledgeLink[];
	}[];
	technologies: {
		id: string;
		name: string;
		category: string;
		aliases: string[];
	}[];
	skills: {
		name: string;
		kind: 'soft' | 'fundamental';
		description: string;
		topics: string[];
	}[];
	certifications: {
		title: string;
		issuer?: string;
		year?: number;
		hours?: number;
	}[];
	suggestions: string[];
}

export interface KnowledgeLink {
	label: string;
	url: string;
}

export interface ChatAnswer {
	/** Texto plano; admite `**negrita**` y saltos de línea. */
	text: string;
	links: KnowledgeLink[];
	/** Ancla de la sección relacionada (p. ej. `proyectos`). */
	section?: string;
}

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}
