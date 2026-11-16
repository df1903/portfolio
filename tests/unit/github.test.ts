import { describe, expect, it } from 'vitest';

import { isContributionCalendar, parseContributionCalendar, parseRecentRepos } from '@/lib/github';

const repo = (overrides: Record<string, unknown> = {}) => ({
	name: 'simacad',
	html_url: 'https://github.com/df1903/simacad',
	description: ' Monitoreo ambiental ',
	language: 'Python',
	stargazers_count: 3,
	pushed_at: '2026-11-10T15:22:47Z',
	fork: false,
	archived: false,
	...overrides,
});

describe('parseRecentRepos', () => {
	it('normaliza los campos y ordena por actividad más reciente', () => {
		const repos = parseRecentRepos(
			[
				repo(),
				repo({
					name: 'fragmento',
					html_url: 'https://github.com/df1903/fragmento',
					pushed_at: '2026-11-12T10:00:00Z',
				}),
			],
			'df1903',
		);
		expect(repos.map((item) => item.name)).toEqual(['fragmento', 'simacad']);
		expect(repos[1]).toEqual({
			name: 'simacad',
			url: 'https://github.com/df1903/simacad',
			description: 'Monitoreo ambiental',
			language: 'Python',
			stars: 3,
			pushedAt: '2026-11-10T15:22:47Z',
		});
	});

	it('excluye forks, archivados y el repo de perfil', () => {
		const repos = parseRecentRepos(
			[
				repo({ name: 'express', fork: true }),
				repo({ name: 'viejo', archived: true }),
				repo({ name: 'DF1903' }),
				repo({ name: 'valido' }),
			],
			'df1903',
		);
		expect(repos.map((item) => item.name)).toEqual(['valido']);
	});

	it('descarta entradas mal formadas o con URL ajena a GitHub', () => {
		const repos = parseRecentRepos(
			[
				null,
				'texto',
				repo({ name: 42 }),
				repo({ html_url: 'https://evil.example/df1903/x' }),
				repo({ html_url: 'javascript:alert(1)' }),
				repo({ pushed_at: 'ayer' }),
				repo({ name: 'sin-extras', description: null, language: '', stargazers_count: 'muchas' }),
			],
			'df1903',
		);
		expect(repos).toEqual([
			{
				name: 'sin-extras',
				url: 'https://github.com/df1903/simacad',
				description: undefined,
				language: undefined,
				stars: 0,
				pushedAt: '2026-11-10T15:22:47Z',
			},
		]);
	});

	it('respeta el límite y tolera respuestas que no son listas', () => {
		const many = Array.from({ length: 10 }, (_, index) => repo({ name: `repo-${index}` }));
		expect(parseRecentRepos(many, 'df1903', 4)).toHaveLength(4);
		expect(parseRecentRepos(many, 'df1903', -1)).toEqual([]);
		expect(parseRecentRepos({ message: 'API rate limit exceeded' }, 'df1903')).toEqual([]);
	});
});

const graphql = (calendar: unknown) => ({
	data: { user: { contributionsCollection: { contributionCalendar: calendar } } },
});
const day = (date: string, count: number, level: string) => ({
	date,
	contributionCount: count,
	contributionLevel: level,
});

describe('parseContributionCalendar', () => {
	it('convierte semanas y niveles de la respuesta GraphQL', () => {
		const calendar = parseContributionCalendar(
			graphql({
				totalContributions: 12,
				weeks: [
					{
						contributionDays: [
							day('2026-11-01', 0, 'NONE'),
							day('2026-11-02', 5, 'SECOND_QUARTILE'),
						],
					},
					{ contributionDays: [day('2026-11-08', 7, 'FOURTH_QUARTILE')] },
				],
			}),
		);
		expect(calendar).toEqual({
			total: 12,
			weeks: [
				[
					{ date: '2026-11-01', count: 0, level: 0 },
					{ date: '2026-11-02', count: 5, level: 2 },
				],
				[{ date: '2026-11-08', count: 7, level: 4 }],
			],
		});
	});

	it('deduce total y nivel cuando faltan, y descarta días inválidos', () => {
		const calendar = parseContributionCalendar(
			graphql({
				weeks: [
					{
						contributionDays: [
							day('2026-11-01', 3, 'DESCONOCIDO'),
							day('2026-11-02', 0, 'DESCONOCIDO'),
							day('no-es-fecha', 9, 'NONE'),
							day('2026-11-03', -1, 'NONE'),
							null,
						],
					},
					{ contributionDays: 'roto' },
					null,
				],
			}),
		);
		expect(calendar).toEqual({
			total: 3,
			weeks: [
				[
					{ date: '2026-11-01', count: 3, level: 1 },
					{ date: '2026-11-02', count: 0, level: 0 },
				],
			],
		});
	});

	it.each([
		['respuesta vacía', null],
		['error de GraphQL', { errors: [{ message: 'Bad credentials' }] }],
		['usuario inexistente', { data: { user: null } }],
		['sin semanas', graphql({ totalContributions: 0, weeks: [] })],
		['semanas no listables', graphql({ weeks: 'roto' })],
	])('devuelve undefined: %s', (_label, input) => {
		expect(parseContributionCalendar(input)).toBeUndefined();
	});
});

describe('isContributionCalendar', () => {
	const valid = { total: 1, weeks: [[{ date: '2026-11-01', count: 1, level: 1 }]] };

	it('acepta un calendario bien formado', () => {
		expect(isContributionCalendar(valid)).toBe(true);
		expect(isContributionCalendar({ total: 0, weeks: [] })).toBe(true);
	});

	it.each([
		['nulo', null],
		['error del worker', { error: 'not_configured' }],
		['total no numérico', { ...valid, total: '1' }],
		['semana no listable', { total: 1, weeks: ['x'] }],
		['día nulo', { total: 1, weeks: [[null]] }],
		['fecha inválida', { total: 1, weeks: [[{ date: 'hoy', count: 1, level: 1 }]] }],
		['nivel fuera de rango', { total: 1, weeks: [[{ date: '2026-11-01', count: 1, level: 9 }]] }],
		['conteo no numérico', { total: 1, weeks: [[{ date: '2026-11-01', count: '1', level: 1 }]] }],
	])('rechaza: %s', (_label, input) => {
		expect(isContributionCalendar(input)).toBe(false);
	});
});
