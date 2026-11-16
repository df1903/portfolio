import { describe, expect, it } from 'vitest';

import { answerQuestion, findTechnologies } from '@/lib/chat/engine';
import { buildKnowledge, markdownToParagraphs } from '@/lib/chat/knowledge';
import { containsPhrase, hasWordStartingWith, joinList, normalizeText } from '@/lib/chat/text';

import { knowledge, sources } from './fixtures/knowledge';

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
	it('une con comas y "y"', () => {
		expect(joinList([])).toBe('');
		expect(joinList(['a'])).toBe('a');
		expect(joinList(['a', 'b', 'c'])).toBe('a, b y c');
	});
});

describe('markdownToParagraphs', () => {
	it('devuelve los párrafos y descarta encabezados', () => {
		expect(markdownToParagraphs('# Título\n\nUno\nsigue.\n\nDos.')).toEqual(['Uno sigue.', 'Dos.']);
	});
});

describe('buildKnowledge', () => {
	it('resuelve periodos, enlaces y año de los certificados', () => {
		expect(knowledge.experience[0].period).toBe('abr 2025 — sep 2025');
		expect(knowledge.projects[0].links.map((link) => link.label)).toEqual([
			'Demo',
			'Repo · Repositorio',
		]);
		expect(knowledge.certifications[0].year).toBe(2026);
		expect(knowledge.certifications[1].year).toBeUndefined();
		expect(knowledge.studies[0].status).toBe('en curso');
	});

	it('propone sugerencias basadas en el contenido', () => {
		expect(knowledge.suggestions).toContain('¿Tiene experiencia con React?');
		expect(knowledge.suggestions).toContain('Háblame de Motor Analítico');
	});

	it('usa sugerencias genéricas si no hay experiencia ni proyectos', () => {
		const empty = buildKnowledge({ ...sources, experience: [], projects: [] });
		expect(empty.suggestions).toContain('¿Qué tecnologías maneja?');
		expect(empty.suggestions).toContain('¿Qué proyectos ha hecho?');
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

describe('answerQuestion', () => {
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
		expect(answerQuestion(knowledge, 'xyzzy').text).toContain('¿Quién es Daniel?');
		expect(answerQuestion(knowledge, '   ').text).toContain('Prueba con');
	});
});
