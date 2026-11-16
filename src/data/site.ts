/**
 * Configuración global del sitio (no es contenido de una sección).
 * Los campos opcionales vacíos simplemente no se renderizan: completa los que falten y vuelve a desplegar.
 * Los textos traducibles (rol, descripción, menú) viven en `src/i18n/ui.ts`.
 */
export interface SiteConfig {
	name: string;
	shortName: string;
	initials: string;
	/** URL pública del sitio (sin barra final). Habilita canonical, hreflang y Open Graph absolutos. */
	url?: string;
	contact: ContactConfig;
	/** Ruta dentro de `public/` (p. ej. `/cv-daniel-franco.pdf`). */
	cvPath?: string;
	/** Anclas de las secciones, en el orden del menú. */
	sections: readonly SectionId[];
}

export interface ContactConfig {
	email?: string;
	/**
	 * WhatsApp admite tres formas, de más a menos directa:
	 *  - `whatsappUrl`: enlace que genera la app (Ajustes → nombre de usuario → compartir enlace).
	 *  - `whatsappNumber`: solo dígitos con indicativo (`573001234567`); expone el número.
	 *  - `whatsappUsername`: sin `@`; si no hay enlace ni número, la tarjeta copia el usuario.
	 */
	whatsappUrl?: string;
	whatsappNumber?: string;
	whatsappUsername?: string;
	linkedinUrl?: string;
	githubUser?: string;
}

export const SECTION_IDS = [
	'sobre-mi',
	'experiencia',
	'proyectos',
	'tecnologias',
	'habilidades',
	'estudios',
	'certificaciones',
	'contacto',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const site: SiteConfig = {
	name: 'Daniel Felipe Franco Rincón',
	shortName: 'Daniel Franco',
	initials: 'DF',
	url: undefined,
	contact: {
		email: 'daniel.franco.rincon@gmail.com',
		whatsappUrl: undefined,
		whatsappNumber: undefined,
		whatsappUsername: 'danielffr',
		linkedinUrl: 'https://www.linkedin.com/in/daniel-felipe-franco-rincon-1b3b84252/',
		githubUser: 'df1903',
	},
	cvPath: undefined,
	sections: SECTION_IDS,
};
