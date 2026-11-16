import { CHAT_MESSAGES, type ChatMessages } from './messages';
import { containsPhrase, hasWordStartingWith, joinList, normalizeText } from './text';
import type { ChatAnswer, Knowledge } from './types';

/**
 * Motor local del asistente: responde de forma determinista a partir de la base de conocimiento,
 * sin red ni modelo. Es el respaldo cuando el modelo de lenguaje no está disponible y la razón por
 * la que el chat funciona también en un despliegue 100 % estático.
 * Responde en el idioma de la base de conocimiento (`knowledge.locale`).
 */

type Technology = Knowledge['technologies'][number];
type Project = Knowledge['projects'][number];
type AnswerBuilder = (knowledge: Knowledge, messages: ChatMessages) => ChatAnswer;

interface Intent {
	/** Raíces en español e inglés: la pregunta puede venir en cualquiera de los dos. */
	stems: readonly string[];
	answer: AnswerBuilder;
}

const MAX_LISTED = 6;
const bullets = (items: string[]) => items.map((item) => `• ${item}`).join('\n');

export function answerQuestion(knowledge: Knowledge, question: string): ChatAnswer {
	const messages = CHAT_MESSAGES[knowledge.locale];
	const text = normalizeText(question);
	if (!text) return fallbackAnswer(knowledge, messages);

	const project = findProject(knowledge, text);
	if (project) return projectAnswer(knowledge, messages, project);

	const technologies = findTechnologies(knowledge, text);
	if (technologies.length > 0) return technologyAnswer(knowledge, messages, technologies);

	const intent = INTENTS.find((candidate) => hasWordStartingWith(text, candidate.stems));
	return (intent?.answer ?? fallbackAnswer)(knowledge, messages);
}

export function findTechnologies(knowledge: Knowledge, normalizedText: string): Technology[] {
	return knowledge.technologies.filter((technology) =>
		[technology.name, technology.id, ...technology.aliases].some((name) =>
			containsPhrase(normalizedText, name),
		),
	);
}

function findProject(knowledge: Knowledge, normalizedText: string): Project | undefined {
	return knowledge.projects.find((project) => containsPhrase(normalizedText, project.title));
}

function technologyNames(knowledge: Knowledge, ids: string[]): string[] {
	const byId = new Map(knowledge.technologies.map((technology) => [technology.id, technology]));
	return ids.map((id) => byId.get(id)?.name ?? id);
}

function technologyAnswer(
	knowledge: Knowledge,
	messages: ChatMessages,
	technologies: Technology[],
): ChatAnswer {
	const name = knowledge.profile.shortName;
	const lines = technologies.slice(0, 3).map((technology) => {
		const jobs = knowledge.experience
			.filter((job) => job.technologyIds.includes(technology.id))
			.map(messages.jobReference);
		const projects = knowledge.projects
			.filter((project) => project.technologyIds.includes(technology.id))
			.slice(0, MAX_LISTED)
			.map((project) => project.title);
		return jobs.length + projects.length > 0
			? messages.techUsed({ name, technology: technology.name, jobs, projects })
			: messages.techUnused({ name, technology: technology.name });
	});
	return { text: lines.join('\n\n'), links: [], section: 'tecnologias' };
}

function projectAnswer(knowledge: Knowledge, messages: ChatMessages, project: Project): ChatAnswer {
	const stack = joinList(technologyNames(knowledge, project.technologyIds), messages.and);
	return {
		text: `**${project.title}**: ${project.description}\n\n${bullets(project.highlights)}\n\n${messages.stack(stack)}`,
		links: project.links,
		section: 'proyectos',
	};
}

const aboutAnswer: AnswerBuilder = ({ profile }) => ({
	text: `**${profile.name}** — ${profile.headline}.\n\n${profile.bio[0] ?? profile.tagline}`,
	links: [],
	section: 'sobre-mi',
});

const currentlyAnswer: AnswerBuilder = ({ profile }, messages) => ({
	text: `${messages.currently(profile.shortName)}\n${bullets(profile.currently)}`,
	links: [],
	section: 'sobre-mi',
});

const experienceAnswer: AnswerBuilder = (knowledge, messages) => {
	const jobs = knowledge.experience.map((job) => {
		const stack = technologyNames(knowledge, job.technologyIds);
		const stackLine =
			stack.length > 0 ? `\n  ${messages.technologiesLine(joinList(stack, messages.and))}` : '';
		return `${messages.jobLine(job)} ${job.summary}${stackLine}`;
	});
	return {
		text: `${messages.experience(knowledge.profile.shortName)}\n${bullets(jobs)}`,
		links: [],
		section: 'experiencia',
	};
};

const projectsAnswer: AnswerBuilder = (knowledge, messages) => {
	const listed = knowledge.projects.slice(0, MAX_LISTED);
	const remaining = knowledge.projects.length - listed.length;
	const intro = messages.projects({
		name: knowledge.profile.shortName,
		total: knowledge.projects.length,
	});
	const items = bullets(listed.map((project) => `**${project.title}**: ${project.summary}`));
	const more = remaining > 0 ? `\n\n${messages.moreProjects(remaining)}` : '';
	return { text: `${intro}\n${items}${more}`, links: [], section: 'proyectos' };
};

const technologiesAnswer: AnswerBuilder = (knowledge, messages) => {
	const used = new Set([
		...knowledge.projects.flatMap((project) => project.technologyIds),
		...knowledge.experience.flatMap((job) => job.technologyIds),
	]);
	const byCategory = new Map<string, string[]>();
	for (const technology of knowledge.technologies) {
		if (!used.has(technology.id)) continue;
		byCategory.set(technology.category, [
			...(byCategory.get(technology.category) ?? []),
			technology.name,
		]);
	}
	const lines = [...byCategory.entries()].map(
		([category, names]) => `**${category}**: ${names.join(', ')}`,
	);
	return {
		text: `${messages.technologies(knowledge.profile.shortName)}\n${bullets(lines)}\n\n${messages.technologiesHint}`,
		links: [],
		section: 'tecnologias',
	};
};

const skillsAnswer: AnswerBuilder = (knowledge, messages) => {
	const soft = knowledge.skills
		.filter((skill) => skill.kind === 'soft')
		.map((skill) => `**${skill.name}**: ${skill.description}`);
	const fundamentals = knowledge.skills
		.filter((skill) => skill.kind === 'fundamental')
		.map((skill) => skill.name);
	return {
		text: `${messages.skills(knowledge.profile.shortName)}\n${bullets(soft)}\n\n${messages.fundamentals(joinList(fundamentals, messages.and))}`,
		links: [],
		section: 'habilidades',
	};
};

const studiesAnswer: AnswerBuilder = (knowledge, messages) => ({
	text: `${messages.studies}\n${bullets(
		knowledge.studies.map(
			(study) => `**${study.title}** — ${study.institution} (${study.status}). ${study.summary}`,
		),
	)}`,
	links: [],
	section: 'estudios',
});

const certificationsAnswer: AnswerBuilder = (knowledge, messages) => {
	const { certifications } = knowledge;
	const hours = certifications.reduce((total, certificate) => total + (certificate.hours ?? 0), 0);
	const recent = certifications.slice(0, MAX_LISTED).map((certificate) => {
		const details = [certificate.issuer, certificate.year].filter(Boolean).join(', ');
		return `${certificate.title}${details ? ` (${details})` : ''}`;
	});
	const intro = messages.certifications({
		name: knowledge.profile.shortName,
		total: certifications.length,
		hours,
	});
	return {
		text: `${intro}\n${bullets(recent)}\n\n${messages.certificationsHint}`,
		links: [],
		section: 'certificaciones',
	};
};

const languagesAnswer: AnswerBuilder = ({ profile }, messages) => ({
	text: messages.languages(
		joinList(
			profile.languages.map((language) => `${language.name} (${language.level})`),
			messages.and,
		),
	),
	links: [],
	section: 'sobre-mi',
});

const contactAnswer: AnswerBuilder = (knowledge, messages) => ({
	text: messages.contact(knowledge.profile.shortName),
	links: knowledge.contact,
	section: 'contacto',
});

const locationAnswer: AnswerBuilder = ({ profile }, messages) => ({
	text: messages.location({ name: profile.shortName, location: profile.location }),
	links: [],
	section: 'contacto',
});

const greetingAnswer: AnswerBuilder = ({ profile }, messages) => ({
	text: messages.greeting(profile.shortName),
	links: [],
});

const thanksAnswer: AnswerBuilder = (knowledge, messages) => ({
	text: messages.thanks(knowledge.profile.shortName),
	links: knowledge.contact,
	section: 'contacto',
});

const fallbackAnswer: AnswerBuilder = (knowledge, messages) => ({
	text: `${messages.fallback(knowledge.profile.shortName)}\n${bullets(knowledge.suggestions)}`,
	links: [],
});

/** El orden importa: gana la primera intención que coincide (de más específica a más general). */
const INTENTS: readonly Intent[] = [
	{
		stems: [
			'contact',
			'correo',
			'email',
			'mail',
			'whatsapp',
			'linkedin',
			'contrat',
			'escrib',
			'hire',
			'hiring',
			'reach',
			'dispon',
			'availab',
			'freelance',
			'telefono',
			'phone',
		],
		answer: contactAnswer,
	},
	{ stems: ['certific', 'curso', 'course', 'diploma', 'platzi'], answer: certificationsAnswer },
	{
		stems: ['idioma', 'ingles', 'english', 'espanol', 'spanish', 'speak'],
		answer: languagesAnswer,
	},
	{
		stems: [
			'estudi',
			'universi',
			'carrera',
			'formacion',
			'titulo',
			'educa',
			'semillero',
			'grado',
			'study',
			'studied',
			'degree',
			'school',
		],
		answer: studiesAnswer,
	},
	{
		stems: ['actual', 'ahora', 'ultimamente', 'current', 'nowadays', 'lately'],
		answer: currentlyAnswer,
	},
	{
		stems: ['experien', 'trabaj', 'laboral', 'empresa', 'empleo', 'cargo', 'work', 'job', 'compan'],
		answer: experienceAnswer,
	},
	{ stems: ['proyecto', 'project', 'repositor', 'repo', 'built', 'build'], answer: projectsAnswer },
	{
		stems: [
			'tecnolog',
			'stack',
			'lenguaje',
			'herramienta',
			'framework',
			'programa',
			'technolog',
			'tool',
		],
		answer: technologiesAnswer,
	},
	{
		stems: ['habilidad', 'skill', 'fortaleza', 'blanda', 'competencia', 'cualidad', 'strength'],
		answer: skillsAnswer,
	},
	{
		stems: [
			'ubica',
			'vive',
			'ciudad',
			'pais',
			'donde',
			'remoto',
			'location',
			'located',
			'where',
			'remote',
			'based',
		],
		answer: locationAnswer,
	},
	{
		stems: [
			'quien',
			'sobre',
			'perfil',
			'presenta',
			'cuenta',
			'resum',
			'daniel',
			'about',
			'who',
			'profile',
			'summar',
		],
		answer: aboutAnswer,
	},
	{ stems: ['gracias', 'thank', 'genial', 'perfecto', 'great'], answer: thanksAnswer },
	{ stems: ['hola', 'buenas', 'buenos', 'hello', 'hey', 'saludos'], answer: greetingAnswer },
];
