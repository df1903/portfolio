import type { Locale } from '@/i18n/config';

import { joinList } from './text';

/**
 * Frases del motor local, por idioma. Son funciones (no plantillas) porque el orden de las palabras
 * y los plurales cambian entre idiomas.
 */
export interface ChatMessages {
	and: string;
	studyStatus: Record<'in-progress' | 'completed', string>;
	repoLinkLabel: (label: string) => string;
	suggestions: (context: { name: string; technology?: string; project?: string }) => string[];
	techUsed: (context: {
		name: string;
		technology: string;
		jobs: string[];
		projects: string[];
	}) => string;
	techUnused: (context: { name: string; technology: string }) => string;
	jobReference: (job: { role: string; company: string; period: string }) => string;
	stack: (technologies: string) => string;
	currently: (name: string) => string;
	experience: (name: string) => string;
	jobLine: (job: { role: string; company: string; period: string; location: string }) => string;
	technologiesLine: (technologies: string) => string;
	projects: (context: { name: string; total: number }) => string;
	moreProjects: (remaining: number) => string;
	technologies: (name: string) => string;
	technologiesHint: string;
	skills: (name: string) => string;
	fundamentals: (skills: string) => string;
	studies: string;
	certifications: (context: { name: string; total: number; hours: number }) => string;
	certificationsHint: string;
	languages: (languages: string) => string;
	contact: (name: string) => string;
	location: (context: { name: string; location: string }) => string;
	greeting: (name: string) => string;
	thanks: (name: string) => string;
	fallback: (name: string) => string;
}

const es: ChatMessages = {
	and: 'y',
	studyStatus: { 'in-progress': 'en curso', completed: 'finalizado' },
	repoLinkLabel: (label) => `Repo · ${label}`,
	suggestions: ({ name, technology, project }) => [
		`¿Quién es ${name}?`,
		'¿Qué experiencia laboral tiene?',
		technology ? `¿Tiene experiencia con ${technology}?` : '¿Qué tecnologías maneja?',
		project ? `Háblame de ${project}` : '¿Qué proyectos ha hecho?',
		'¿Cómo lo contacto?',
	],
	techUsed: ({ name, technology, jobs, projects }) => {
		const parts: string[] = [];
		if (jobs.length > 0) parts.push(`experiencia laboral como ${joinList(jobs, 'y')}`);
		if (projects.length > 0) {
			parts.push(
				`${projects.length === 1 ? 'el proyecto' : 'los proyectos'} ${joinList(projects, 'y')}`,
			);
		}
		return `Sí. ${name} ha usado **${technology}** en ${parts.join(' y en ')}.`;
	},
	techUnused: ({ name, technology }) =>
		`**${technology}** hace parte del stack de ${name}, aunque no está ligada a un proyecto publicado en este portafolio.`,
	jobReference: ({ role, company, period }) => `${role} en ${company} (${period})`,
	stack: (technologies) => `Stack: ${technologies}.`,
	currently: (name) => `Esto es en lo que ${name} está trabajando ahora:`,
	experience: (name) => `Experiencia de ${name}:`,
	jobLine: ({ role, company, period, location }) =>
		`**${role}** en ${company} (${period}, ${location}).`,
	technologiesLine: (technologies) => `Tecnologías: ${technologies}.`,
	projects: ({ name, total }) => `${name} tiene ${total} proyectos publicados. Los principales:`,
	moreProjects: (remaining) =>
		`Y ${remaining} más en la sección Proyectos. Pregúntame por cualquiera por su nombre.`,
	technologies: (name) => `Tecnologías que ${name} ha aplicado en proyectos o trabajo:`,
	technologiesHint: 'Pregúntame por una en concreto, por ejemplo «¿tiene experiencia con React?».',
	skills: (name) => `Habilidades de ${name}:`,
	fundamentals: (skills) => `Fundamentos: ${skills}.`,
	studies: 'Formación:',
	certifications: ({ name, total, hours }) =>
		`${name} tiene ${total} certificados${hours > 0 ? `, que suman ${hours} horas de formación` : ''}. Los más recientes:`,
	certificationsHint: 'Puedes ver cada certificado completo en la sección Certificaciones.',
	languages: (languages) => `Idiomas: ${languages}.`,
	contact: (name) => `Puedes contactar a ${name} por cualquiera de estos canales:`,
	location: ({ name, location }) =>
		`${name} está en ${location} y tiene experiencia trabajando en remoto.`,
	greeting: (name) =>
		`¡Hola! Soy el asistente de ${name}. Puedo contarte sobre su experiencia, proyectos, tecnologías, estudios y certificaciones, o decirte cómo contactarlo.`,
	thanks: (name) =>
		`¡Con gusto! Si quieres hablar directamente con ${name}, estos son sus canales:`,
	fallback: (name) =>
		`No tengo un dato concreto sobre eso, pero puedo responder sobre el perfil de ${name}. Prueba con:`,
};

const en: ChatMessages = {
	and: 'and',
	studyStatus: { 'in-progress': 'in progress', completed: 'completed' },
	repoLinkLabel: (label) => `Repo · ${label}`,
	suggestions: ({ name, technology, project }) => [
		`Who is ${name}?`,
		'What work experience does he have?',
		technology ? `Does he have experience with ${technology}?` : 'Which technologies does he use?',
		project ? `Tell me about ${project}` : 'What projects has he built?',
		'How can I contact him?',
	],
	techUsed: ({ name, technology, jobs, projects }) => {
		const parts: string[] = [];
		if (jobs.length > 0) parts.push(`his work as ${joinList(jobs, 'and')}`);
		if (projects.length > 0) {
			parts.push(
				`the ${projects.length === 1 ? 'project' : 'projects'} ${joinList(projects, 'and')}`,
			);
		}
		return `Yes. ${name} has used **${technology}** in ${parts.join(' and in ')}.`;
	},
	techUnused: ({ name, technology }) =>
		`**${technology}** is part of ${name}'s stack, although it isn't tied to a project published in this portfolio.`,
	jobReference: ({ role, company, period }) => `${role} at ${company} (${period})`,
	stack: (technologies) => `Stack: ${technologies}.`,
	currently: (name) => `This is what ${name} is working on right now:`,
	experience: (name) => `${name}'s experience:`,
	jobLine: ({ role, company, period, location }) =>
		`**${role}** at ${company} (${period}, ${location}).`,
	technologiesLine: (technologies) => `Technologies: ${technologies}.`,
	projects: ({ name, total }) => `${name} has ${total} published projects. The main ones:`,
	moreProjects: (remaining) =>
		`And ${remaining} more in the Projects section. Ask me about any of them by name.`,
	technologies: (name) => `Technologies ${name} has applied in projects or at work:`,
	technologiesHint:
		'Ask me about a specific one, for example "does he have experience with React?".',
	skills: (name) => `${name}'s skills:`,
	fundamentals: (skills) => `Fundamentals: ${skills}.`,
	studies: 'Education:',
	certifications: ({ name, total, hours }) =>
		`${name} has ${total} certificates${hours > 0 ? `, adding up to ${hours} hours of training` : ''}. The most recent:`,
	certificationsHint: 'You can see every certificate in full in the Certifications section.',
	languages: (languages) => `Languages: ${languages}.`,
	contact: (name) => `You can reach ${name} through any of these channels:`,
	location: ({ name, location }) =>
		`${name} is based in ${location} and has experience working remotely.`,
	greeting: (name) =>
		`Hi! I'm ${name}'s assistant. I can tell you about his experience, projects, technologies, education and certifications, or how to contact him.`,
	thanks: (name) =>
		`You're welcome! If you'd like to talk to ${name} directly, here are his channels:`,
	fallback: (name) =>
		`I don't have a specific answer for that, but I can answer questions about ${name}'s profile. Try:`,
};

export const CHAT_MESSAGES: Record<Locale, ChatMessages> = { es, en };
