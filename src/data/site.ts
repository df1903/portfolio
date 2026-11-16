/**
 * Configuración global del sitio (no es contenido de una sección).
 * Los campos opcionales vacíos simplemente no se renderizan: completa los que falten y vuelve a desplegar.
 */
export interface SiteConfig {
	name: string;
	shortName: string;
	initials: string;
	role: string;
	location: string;
	description: string;
	/** URL pública del sitio (sin barra final). Habilita canonical, Open Graph absoluto y sitemap. */
	url?: string;
	contact: ContactConfig;
	/** Ruta dentro de `public/` (p. ej. `/cv-daniel-franco.pdf`). */
	cvPath?: string;
	nav: NavItem[];
}

export interface ContactConfig {
	email?: string;
	/** Solo dígitos, con indicativo de país (p. ej. `573001234567`). */
	whatsappNumber?: string;
	linkedinUrl?: string;
	githubUser?: string;
}

export interface NavItem {
	id: string;
	label: string;
}

export const site: SiteConfig = {
	name: 'Daniel Felipe Franco Rincón',
	shortName: 'Daniel Franco',
	initials: 'DF',
	role: 'Desarrollador Fullstack · Ingeniero de Sistemas en formación',
	location: 'Manizales, Colombia',
	description:
		'Portafolio de Daniel Franco: desarrollador fullstack e ingeniero de sistemas en formación. Proyectos, experiencia, tecnologías y certificaciones.',
	url: undefined,
	contact: {
		email: 'daniel.franco.rincon@gmail.com',
		whatsappNumber: undefined,
		linkedinUrl: undefined,
		githubUser: 'df1903',
	},
	cvPath: undefined,
	nav: [
		{ id: 'sobre-mi', label: 'Sobre mí' },
		{ id: 'experiencia', label: 'Experiencia' },
		{ id: 'proyectos', label: 'Proyectos' },
		{ id: 'tecnologias', label: 'Tecnologías' },
		{ id: 'habilidades', label: 'Habilidades' },
		{ id: 'estudios', label: 'Estudios' },
		{ id: 'certificaciones', label: 'Certificaciones' },
		{ id: 'contacto', label: 'Contacto' },
	],
};
