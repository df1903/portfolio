import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { buildKnowledge, type KnowledgeSources } from '@/lib/chat/knowledge';
import { buildContactChannels } from '@/lib/contactLinks';

export function buildSources(locale: Locale = 'es'): KnowledgeSources {
	return {
		locale,
		site: { name: 'Ada Lovelace Byron', shortName: 'Ada Lovelace', location: 'Londres' },
		about: {
			headline: 'Ingeniera de software',
			tagline: 'Construye máquinas analíticas.',
			bio: ['Primera programadora de la historia.', 'Segundo párrafo.'],
			currently: ['Escribiendo notas sobre la máquina analítica.'],
			languages: [
				{ name: 'Inglés', level: 'Nativo' },
				{ name: 'Francés', level: 'B2' },
			],
			interests: ['Matemáticas'],
		},
		contactChannels: buildContactChannels(
			{ email: 'ada@example.com', whatsappUsername: 'ada.lovelace', githubUser: 'ada' },
			UI[locale].contact,
		),
		studies: [
			{
				title: 'Matemáticas',
				institution: 'Universidad de Londres',
				status: 'in-progress',
				summary: 'Estudios de análisis.',
				focusAreas: ['Álgebra'],
			},
		],
		experience: [
			{
				company: 'Analytical Engines',
				role: 'Desarrolladora',
				start: new Date('2025-04-01'),
				end: new Date('2025-09-30'),
				location: 'Remoto',
				summary: 'Programas para la máquina.',
				responsibilities: ['Escribí el primer algoritmo.'],
				technologyIds: ['react', 'typescript'],
			},
		],
		projects: [
			{
				title: 'Motor Analítico',
				summary: 'Calcula números de Bernoulli.',
				description: 'Programa que calcula números de Bernoulli.',
				categoryLabel: 'Datos',
				highlights: ['Primer algoritmo publicado.'],
				technologyIds: ['python', 'cpp'],
				repos: [{ label: 'Repositorio', url: 'https://github.com/ada/engine' }],
				demo: 'https://engine.example.com',
			},
			{
				title: 'Telar',
				summary: 'Patrones con tarjetas perforadas.',
				description: 'Generador de patrones.',
				categoryLabel: 'Web',
				highlights: [],
				technologyIds: ['react'],
				repos: [],
			},
		],
		technologies: [
			{ id: 'react', name: 'React', categoryLabel: 'Frontend', aliases: ['reactjs'] },
			{ id: 'typescript', name: 'TypeScript', categoryLabel: 'Lenguajes', aliases: ['ts'] },
			{ id: 'python', name: 'Python', categoryLabel: 'Lenguajes', aliases: [] },
			{ id: 'cpp', name: 'C++', categoryLabel: 'Lenguajes', aliases: [] },
			{ id: 'dotnet', name: '.NET Core', categoryLabel: 'Backend', aliases: ['.net'] },
			{ id: 'figma', name: 'Figma', categoryLabel: 'Herramientas', aliases: [] },
		],
		skills: [
			{ name: 'Lógica', kind: 'soft', description: 'Piensa con rigor.', topics: [] },
			{ name: 'Algoritmos', kind: 'fundamental', description: 'Diseño.', topics: ['Recursión'] },
		],
		certifications: [
			{ title: 'Curso de Cálculo', issuer: 'Academia', date: new Date('2026-01-05'), hours: 10 },
			{ title: 'Certificado nuevo' },
		],
	};
}

export const sources = buildSources('es');
export const knowledge = buildKnowledge(sources);
export const englishKnowledge = buildKnowledge(buildSources('en'));
