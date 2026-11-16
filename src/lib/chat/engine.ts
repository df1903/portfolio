import { containsPhrase, hasWordStartingWith, joinList, normalizeText } from './text';
import type { ChatAnswer, Knowledge } from './types';

/**
 * Motor local del asistente: responde de forma determinista a partir de la base de conocimiento,
 * sin red ni modelo. Es el respaldo cuando el modelo de lenguaje no está disponible y la razón por
 * la que el chat funciona también en un despliegue 100 % estático.
 */

type Technology = Knowledge['technologies'][number];
type Project = Knowledge['projects'][number];

interface Intent {
	stems: readonly string[];
	answer: (knowledge: Knowledge) => ChatAnswer;
}

const MAX_LISTED = 6;

export function answerQuestion(knowledge: Knowledge, question: string): ChatAnswer {
	const text = normalizeText(question);
	if (!text) return fallbackAnswer(knowledge);

	const project = findProject(knowledge, text);
	if (project) return projectAnswer(knowledge, project);

	const technologies = findTechnologies(knowledge, text);
	if (technologies.length > 0) return technologyAnswer(knowledge, technologies);

	const intent = INTENTS.find((candidate) => hasWordStartingWith(text, candidate.stems));
	return intent ? intent.answer(knowledge) : fallbackAnswer(knowledge);
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

function technologyAnswer(knowledge: Knowledge, technologies: Technology[]): ChatAnswer {
	const { shortName } = knowledge.profile;
	const lines = technologies.slice(0, 3).map((technology) => {
		const jobs = knowledge.experience.filter((job) => job.technologyIds.includes(technology.id));
		const projects = knowledge.projects.filter((project) =>
			project.technologyIds.includes(technology.id),
		);
		const parts: string[] = [];
		if (jobs.length > 0) {
			parts.push(
				`experiencia laboral como ${joinList(jobs.map((job) => `${job.role} en ${job.company} (${job.period})`))}`,
			);
		}
		if (projects.length > 0) {
			parts.push(
				`${projects.length === 1 ? 'el proyecto' : 'los proyectos'} ${joinList(projects.slice(0, MAX_LISTED).map((project) => project.title))}`,
			);
		}
		if (parts.length === 0) {
			return `**${technology.name}** hace parte del stack de ${shortName}, aunque no está ligada a un proyecto publicado en este portafolio.`;
		}
		return `Sí. ${shortName} ha usado **${technology.name}** en ${parts.join(' y en ')}.`;
	});
	return { text: lines.join('\n\n'), links: [], section: 'tecnologias' };
}

function projectAnswer(knowledge: Knowledge, project: Project): ChatAnswer {
	const stack = joinList(technologyNames(knowledge, project.technologyIds));
	const highlights = project.highlights.map((highlight) => `• ${highlight}`).join('\n');
	return {
		text: `**${project.title}**: ${project.description}\n\n${highlights}\n\nStack: ${stack}.`,
		links: project.links,
		section: 'proyectos',
	};
}

function aboutAnswer(knowledge: Knowledge): ChatAnswer {
	const { profile } = knowledge;
	return {
		text: `**${profile.name}** — ${profile.headline}.\n\n${profile.bio[0] ?? profile.tagline}`,
		links: [],
		section: 'sobre-mi',
	};
}

function currentlyAnswer(knowledge: Knowledge): ChatAnswer {
	const items = knowledge.profile.currently.map((item) => `• ${item}`).join('\n');
	return {
		text: `Esto es en lo que ${knowledge.profile.shortName} está trabajando ahora:\n${items}`,
		links: [],
		section: 'sobre-mi',
	};
}

function experienceAnswer(knowledge: Knowledge): ChatAnswer {
	const jobs = knowledge.experience
		.map((job) => {
			const stack = technologyNames(knowledge, job.technologyIds);
			const stackLine = stack.length > 0 ? `\n  Tecnologías: ${joinList(stack)}.` : '';
			return `• **${job.role}** en ${job.company} (${job.period}, ${job.location}). ${job.summary}${stackLine}`;
		})
		.join('\n');
	return {
		text: `Experiencia de ${knowledge.profile.shortName}:\n${jobs}`,
		links: [],
		section: 'experiencia',
	};
}

function projectsAnswer(knowledge: Knowledge): ChatAnswer {
	const listed = knowledge.projects.slice(0, MAX_LISTED);
	const items = listed.map((project) => `• **${project.title}**: ${project.summary}`).join('\n');
	const remaining = knowledge.projects.length - listed.length;
	const more =
		remaining > 0
			? `\n\nY ${remaining} más en la sección Proyectos. Pregúntame por cualquiera por su nombre.`
			: '';
	return {
		text: `${knowledge.profile.shortName} tiene ${knowledge.projects.length} proyectos publicados. Los principales:\n${items}${more}`,
		links: [],
		section: 'proyectos',
	};
}

function technologiesAnswer(knowledge: Knowledge): ChatAnswer {
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
	const lines = [...byCategory.entries()]
		.map(([category, names]) => `• **${category}**: ${names.join(', ')}`)
		.join('\n');
	return {
		text: `Tecnologías que ${knowledge.profile.shortName} ha aplicado en proyectos o trabajo:\n${lines}\n\nPregúntame por una en concreto, por ejemplo «¿tiene experiencia con React?».`,
		links: [],
		section: 'tecnologias',
	};
}

function skillsAnswer(knowledge: Knowledge): ChatAnswer {
	const soft = knowledge.skills
		.filter((skill) => skill.kind === 'soft')
		.map((skill) => `• **${skill.name}**: ${skill.description}`)
		.join('\n');
	const fundamentals = joinList(
		knowledge.skills.filter((skill) => skill.kind === 'fundamental').map((skill) => skill.name),
	);
	return {
		text: `Habilidades de ${knowledge.profile.shortName}:\n${soft}\n\nFundamentos: ${fundamentals}.`,
		links: [],
		section: 'habilidades',
	};
}

function studiesAnswer(knowledge: Knowledge): ChatAnswer {
	const items = knowledge.studies
		.map(
			(study) => `• **${study.title}** — ${study.institution} (${study.status}). ${study.summary}`,
		)
		.join('\n');
	return { text: `Formación:\n${items}`, links: [], section: 'estudios' };
}

function certificationsAnswer(knowledge: Knowledge): ChatAnswer {
	const { certifications } = knowledge;
	const hours = certifications.reduce((total, certificate) => total + (certificate.hours ?? 0), 0);
	const recent = certifications
		.slice(0, MAX_LISTED)
		.map((certificate) => {
			const details = [certificate.issuer, certificate.year].filter(Boolean).join(', ');
			return `• ${certificate.title}${details ? ` (${details})` : ''}`;
		})
		.join('\n');
	const hoursText = hours > 0 ? `, que suman ${hours} horas de formación` : '';
	return {
		text: `${knowledge.profile.shortName} tiene ${certifications.length} certificados${hoursText}. Los más recientes:\n${recent}\n\nPuedes ver cada certificado completo en la sección Certificaciones.`,
		links: [],
		section: 'certificaciones',
	};
}

function languagesAnswer(knowledge: Knowledge): ChatAnswer {
	const languages = joinList(
		knowledge.profile.languages.map((language) => `${language.name} (${language.level})`),
	);
	return { text: `Idiomas: ${languages}.`, links: [], section: 'sobre-mi' };
}

function contactAnswer(knowledge: Knowledge): ChatAnswer {
	return {
		text: `Puedes contactar a ${knowledge.profile.shortName} por cualquiera de estos canales:`,
		links: knowledge.contact,
		section: 'contacto',
	};
}

function locationAnswer(knowledge: Knowledge): ChatAnswer {
	return {
		text: `${knowledge.profile.shortName} está en ${knowledge.profile.location} y tiene experiencia trabajando en remoto.`,
		links: [],
		section: 'contacto',
	};
}

function greetingAnswer(knowledge: Knowledge): ChatAnswer {
	return {
		text: `¡Hola! Soy el asistente de ${knowledge.profile.shortName}. Puedo contarte sobre su experiencia, proyectos, tecnologías, estudios y certificaciones, o decirte cómo contactarlo.`,
		links: [],
	};
}

function thanksAnswer(knowledge: Knowledge): ChatAnswer {
	return {
		text: `¡Con gusto! Si quieres hablar directamente con ${knowledge.profile.shortName}, estos son sus canales:`,
		links: knowledge.contact,
		section: 'contacto',
	};
}

function fallbackAnswer(knowledge: Knowledge): ChatAnswer {
	const suggestions = knowledge.suggestions.map((suggestion) => `• ${suggestion}`).join('\n');
	return {
		text: `No tengo un dato concreto sobre eso, pero puedo responder sobre el perfil de ${knowledge.profile.shortName}. Prueba con:\n${suggestions}`,
		links: [],
	};
}

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
			'dispon',
			'freelance',
			'telefono',
		],
		answer: contactAnswer,
	},
	{ stems: ['certific', 'curso', 'diploma', 'platzi'], answer: certificationsAnswer },
	{ stems: ['idioma', 'ingles', 'english', 'espanol'], answer: languagesAnswer },
	{
		stems: ['estudi', 'universi', 'carrera', 'formacion', 'titulo', 'educa', 'semillero', 'grado'],
		answer: studiesAnswer,
	},
	{ stems: ['actual', 'ahora', 'ultimamente', 'currently'], answer: currentlyAnswer },
	{
		stems: ['experien', 'trabaj', 'laboral', 'empresa', 'empleo', 'cargo', 'work', 'job'],
		answer: experienceAnswer,
	},
	{ stems: ['proyecto', 'project', 'repositorio', 'repo'], answer: projectsAnswer },
	{
		stems: ['tecnolog', 'stack', 'lenguaje', 'herramienta', 'framework', 'programa', 'technolog'],
		answer: technologiesAnswer,
	},
	{
		stems: ['habilidad', 'skill', 'fortaleza', 'blanda', 'competencia', 'cualidad'],
		answer: skillsAnswer,
	},
	{
		stems: ['ubica', 'vive', 'ciudad', 'pais', 'donde', 'remoto', 'location'],
		answer: locationAnswer,
	},
	{
		stems: ['quien', 'sobre', 'perfil', 'presenta', 'cuenta', 'resum', 'daniel', 'about', 'who'],
		answer: aboutAnswer,
	},
	{ stems: ['gracias', 'thanks', 'genial', 'perfecto'], answer: thanksAnswer },
	{ stems: ['hola', 'buenas', 'buenos', 'hello', 'hey', 'saludos'], answer: greetingAnswer },
];
