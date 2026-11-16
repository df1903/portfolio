import { describe, expect, it } from 'vitest';

import { answerQuestion, findTechnologies } from '@/lib/chat/engine';
import { buildKnowledge, markdownToParagraphs } from '@/lib/chat/knowledge';
import { containsPhrase, hasWordStartingWith, joinList, normalizeText } from '@/lib/chat/text';

import { englishKnowledge, knowledge, sources } from './fixtures/knowledge';

describe('normalizeText', () => {
	it('quita tildes, mayúsculas y puntuación', () => {
		expect(normalizeText('¿Qué TECNOLOGÍAS maneja?')).toBe('que tecnologias maneja');
	});

	it('conserva los símbolos que distinguen tecnologías', () => {
		expect(normalizeText('C++, C# y .NET.')).toBe('c++ c# y .net');
		expect(normalizeText('Usa Node.js.')).toBe('usa node.js');
	});
});

describe('containsPhrase', () => {
	it('solo coincide con palabras completas', () => {
		expect(containsPhrase('sabe react y python', 'React')).toBe(true);
		expect(containsPhrase('es reactivo', 'React')).toBe(false);
		expect(containsPhrase('algo', '')).toBe(false);
	});
});

describe('hasWordStartingWith', () => {
	it('reconoce variantes de una raíz', () => {
		expect(hasWordStartingWith('tiene certificaciones', ['certific'])).toBe(true);
		expect(hasWordStartingWith('tiene diplomas', ['certific'])).toBe(false);
	});
});

describe('joinList', () => {
	it('une con comas y la conjunción del idioma', () => {
		expect(joinList([])).toBe('');
		expect(joinList(['a'])).toBe('a');
		expect(joinList(['a', 'b', 'c'])).toBe('a, b y c');
		expect(joinList(['a', 'b'], 'and')).toBe('a and b');
	});
});

describe('markdownToParagraphs', () => {
	it('devuelve los párrafos y descarta encabezados', () => {
		expect(markdownToParagraphs('# Título\n\nUno\nsigue.\n\nDos.')).toEqual(['Uno sigue.', 'Dos.']);
	});
});

describe('buildKnowledge', () => {
	it('resuelve periodos, enlaces y año de los certificados', () => {
		expect(knowledge.locale).toBe('es');
		expect(knowledge.experience[0].period).toBe('abr 2025 — sep 2025');
		expect(knowledge.projects[0].links.map((link) => link.label)).toEqual([
			'Demo',
			'Repo · Repositorio',
		]);
		expect(knowledge.certifications[0].year).toBe(2026);
		expect(knowledge.certifications[1].year).toBeUndefined();
		expect(knowledge.studies[0].status).toBe('en curso');
	});

	it('solo ofrece como enlace los canales que tienen enlace', () => {
		// El fixture tiene WhatsApp por usuario (sin enlace): no debe aparecer.
		expect(knowledge.contact.map((link) => link.label)).toEqual(['Correo', 'GitHub']);
	});

	it('propone sugerencias basadas en el contenido', () => {
		expect(knowledge.suggestions).toContain('¿Quién es Ada?');
		expect(knowledge.suggestions).toContain('¿Tiene experiencia con React?');
		expect(knowledge.suggestions).toContain('Háblame de Motor Analítico');
	});

	it('usa sugerencias genéricas si no hay experiencia ni proyectos', () => {
		const empty = buildKnowledge({ ...sources, experience: [], projects: [] });
		expect(empty.suggestions).toContain('¿Qué tecnologías maneja?');
		expect(empty.suggestions).toContain('¿Qué proyectos ha hecho?');
	});

	it('genera la versión en inglés con fechas y textos en inglés', () => {
		expect(englishKnowledge.locale).toBe('en');
		expect(englishKnowledge.experience[0].period).toBe('Apr 2025 — Sep 2025');
		expect(englishKnowledge.studies[0].status).toBe('in progress');
		expect(englishKnowledge.contact.map((link) => link.label)).toEqual(['Email', 'GitHub']);
		expect(englishKnowledge.suggestions).toContain('Does he have experience with React?');
		const empty = buildKnowledge({ ...sources, locale: 'en', experience: [], projects: [] });
		expect(empty.suggestions).toContain('Which technologies does he use?');
		expect(empty.suggestions).toContain('What projects has he built?');
	});
});

describe('findTechnologies', () => {
	it('reconoce nombre, alias y símbolos', () => {
		const ids = (question: string) =>
			findTechnologies(knowledge, normalizeText(question)).map((technology) => technology.id);
		expect(ids('¿Sabe ReactJS?')).toEqual(['react']);
		expect(ids('¿Y C++?')).toEqual(['cpp']);
		expect(ids('¿Trabaja con .NET?')).toEqual(['dotnet']);
		expect(ids('¿Le gusta cocinar?')).toEqual([]);
	});
});

describe('answerQuestion (español)', () => {
	it('cruza una tecnología con experiencia y proyectos (R13)', () => {
		const answer = answerQuestion(knowledge, '¿Tiene experiencia con React?');
		expect(answer.text).toContain('Desarrolladora en Analytical Engines');
		expect(answer.text).toContain('el proyecto Telar');
		expect(answer.section).toBe('tecnologias');
	});

	it('distingue una tecnología usada solo en proyectos', () => {
		const answer = answerQuestion(knowledge, 'python?');
		expect(answer.text).toContain('Motor Analítico');
		expect(answer.text).not.toContain('experiencia laboral');
	});

	it('no inventa uso para una tecnología del stack sin proyectos', () => {
		expect(answerQuestion(knowledge, '¿Usa Figma?').text).toContain('hace parte del stack');
	});

	it('describe un proyecto cuando se le nombra', () => {
		const answer = answerQuestion(knowledge, 'Háblame de Motor Analítico');
		expect(answer.text).toContain('números de Bernoulli');
		expect(answer.text).toContain('Stack: Python y C++.');
		expect(answer.links).toHaveLength(2);
	});

	it.each([
		['¿Cómo lo contacto?', 'contacto'],
		['¿Qué certificados tiene?', 'certificaciones'],
		['¿Habla inglés?', 'sobre-mi'],
		['¿Dónde estudió?', 'estudios'],
		['¿Qué hace actualmente?', 'sobre-mi'],
		['¿Dónde ha trabajado?', 'experiencia'],
		['¿Qué proyectos tiene?', 'proyectos'],
		['¿Qué tecnologías maneja?', 'tecnologias'],
		['¿Cuáles son sus habilidades?', 'habilidades'],
		['¿En qué ciudad vive?', 'contacto'],
		['¿Quién es?', 'sobre-mi'],
		['Gracias', 'contacto'],
	])('responde "%s" apuntando a la sección %s', (question, section) => {
		const answer = answerQuestion(knowledge, question);
		expect(answer.section).toBe(section);
		expect(answer.text.length).toBeGreaterThan(10);
	});

	it('entrega los canales de contacto como enlaces', () => {
		expect(answerQuestion(knowledge, 'quiero contratarlo').links.map((link) => link.label)).toEqual(
			['Correo', 'GitHub'],
		);
	});

	it('resume certificados con total de horas', () => {
		const answer = answerQuestion(knowledge, 'cursos');
		expect(answer.text).toContain('2 certificados, que suman 10 horas');
		expect(answer.text).toContain('Curso de Cálculo (Academia, 2026)');
	});

	it('lista solo tecnologías aplicadas, agrupadas por categoría', () => {
		const answer = answerQuestion(knowledge, 'stack');
		expect(answer.text).toContain('**Lenguajes**: TypeScript, Python, C++');
		expect(answer.text).not.toContain('Figma');
	});

	it('saluda y ofrece sugerencias ante lo desconocido', () => {
		expect(answerQuestion(knowledge, 'Hola').text).toContain('asistente de Ada');
		expect(answerQuestion(knowledge, 'xyzzy').text).toContain('¿Quién es Ada?');
		expect(answerQuestion(knowledge, '   ').text).toContain('Prueba con');
	});
});

describe('answerQuestion (inglés)', () => {
	it('responde en inglés cuando la base de conocimiento es inglesa', () => {
		const answer = answerQuestion(englishKnowledge, 'Does he have experience with React?');
		expect(answer.text).toContain('Yes. Ada Lovelace has used **React**');
		expect(answer.text).toContain('Desarrolladora at Analytical Engines (Apr 2025 — Sep 2025)');
		expect(answer.text).toContain('the project Telar');
	});

	it('usa plural y conjunción en inglés', () => {
		const withTwo = buildKnowledge({
			...sources,
			locale: 'en',
			projects: sources.projects.map((project) => ({ ...project, technologyIds: ['python'] })),
		});
		expect(answerQuestion(withTwo, 'python').text).toContain(
			'the projects Motor Analítico and Telar',
		);
		expect(answerQuestion(englishKnowledge, 'Does he use Figma?').text).toContain(
			"is part of Ada Lovelace's stack",
		);
	});

	it.each([
		['How can I contact him?', 'contacto', 'reach'],
		['What certificates does he have?', 'certificaciones', '2 certificates, adding up to 10'],
		['Does he speak English?', 'sobre-mi', 'Languages:'],
		['Where did he study?', 'estudios', 'Education:'],
		['What is he currently doing?', 'sobre-mi', 'working on right now'],
		['Where has he worked?', 'experiencia', "Ada Lovelace's experience"],
		['What projects has he built?', 'proyectos', '2 published projects'],
		['Which technologies does he use?', 'tecnologias', 'has applied'],
		['What are his skills?', 'habilidades', 'Fundamentals:'],
		['Where is he located?', 'contacto', 'is based in'],
		['Who is he?', 'sobre-mi', 'Ada Lovelace Byron'],
		['Thanks!', 'contacto', "You're welcome"],
	])('responde "%s" apuntando a la sección %s', (question, section, fragment) => {
		const answer = answerQuestion(englishKnowledge, question);
		expect(answer.section).toBe(section);
		expect(answer.text).toContain(fragment);
	});

	it('saluda, describe proyectos y ofrece sugerencias en inglés', () => {
		expect(answerQuestion(englishKnowledge, 'Hello').text).toContain(
			"I'm Ada Lovelace's assistant",
		);
		expect(answerQuestion(englishKnowledge, 'Motor Analítico').text).toContain(
			'Stack: Python and C++.',
		);
		expect(answerQuestion(englishKnowledge, 'xyzzy').text).toContain('Who is Ada?');
	});
});
