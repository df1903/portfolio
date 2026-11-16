/**
 * Lectura defensiva de las respuestas de GitHub. Llegan de la red, así que nada se da por hecho:
 * lo que no tenga la forma esperada se descarta en vez de llegar a la página.
 */

export interface GitHubRepo {
	name: string;
	description?: string;
	url: string;
	language?: string;
	stars: number;
	pushedAt: string;
}

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
	date: string;
	count: number;
	level: ContributionLevel;
}

export interface ContributionCalendar {
	total: number;
	weeks: ContributionDay[][];
}

/** Calendario del último año. `$login` es el usuario; requiere token (la API GraphQL no es anónima). */
export const CONTRIBUTIONS_QUERY = `query ($login: String!) {
	user(login: $login) {
		contributionsCollection {
			contributionCalendar {
				totalContributions
				weeks { contributionDays { date contributionCount contributionLevel } }
			}
		}
	}
}`;

const CONTRIBUTION_LEVELS: Record<string, ContributionLevel> = {
	NONE: 0,
	FIRST_QUARTILE: 1,
	SECOND_QUARTILE: 2,
	THIRD_QUARTILE: 3,
	FOURTH_QUARTILE: 4,
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null;
const optionalText = (value: unknown) =>
	typeof value === 'string' && value.trim() ? value.trim() : undefined;

/**
 * Repos propios con actividad reciente, a partir de `GET /users/:user/repos?sort=pushed`.
 * Excluye forks, archivados y el repo de perfil (`<usuario>/<usuario>`), que no son trabajo propio visible.
 */
export function parseRecentRepos(input: unknown, user: string, limit = 6): GitHubRepo[] {
	if (!Array.isArray(input)) return [];
	const repos: GitHubRepo[] = [];
	for (const item of input) {
		if (!isObject(item) || item.fork === true || item.archived === true) continue;
		const { name, html_url: url, pushed_at: pushedAt } = item;
		if (typeof name !== 'string' || typeof url !== 'string' || typeof pushedAt !== 'string')
			continue;
		if (!url.startsWith('https://github.com/') || Number.isNaN(Date.parse(pushedAt))) continue;
		if (name.toLowerCase() === user.toLowerCase()) continue;
		repos.push({
			name,
			url,
			pushedAt,
			description: optionalText(item.description),
			language: optionalText(item.language),
			stars: typeof item.stargazers_count === 'number' ? item.stargazers_count : 0,
		});
	}
	return repos
		.sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt))
		.slice(0, Math.max(0, limit));
}

function parseDay(input: unknown): ContributionDay | undefined {
	if (!isObject(input)) return undefined;
	const { date, contributionCount: count, contributionLevel: level } = input;
	if (typeof date !== 'string' || !ISO_DAY.test(date)) return undefined;
	if (typeof count !== 'number' || count < 0) return undefined;
	return { date, count, level: CONTRIBUTION_LEVELS[String(level)] ?? (count > 0 ? 1 : 0) };
}

/** Convierte la respuesta GraphQL de `CONTRIBUTIONS_QUERY`; `undefined` si no trae un calendario válido. */
export function parseContributionCalendar(input: unknown): ContributionCalendar | undefined {
	const user = isObject(input) && isObject(input.data) ? input.data.user : undefined;
	const collection = isObject(user) ? user.contributionsCollection : undefined;
	const calendar = isObject(collection) ? collection.contributionCalendar : undefined;
	if (!isObject(calendar) || !Array.isArray(calendar.weeks)) return undefined;

	const weeks = calendar.weeks
		.map((week) =>
			isObject(week) && Array.isArray(week.contributionDays)
				? week.contributionDays.flatMap((day) => parseDay(day) ?? [])
				: [],
		)
		.filter((week) => week.length > 0);
	if (weeks.length === 0) return undefined;

	const counted = weeks.flat().reduce((sum, day) => sum + day.count, 0);
	const total =
		typeof calendar.totalContributions === 'number' ? calendar.totalContributions : counted;
	return { total, weeks };
}

/** Valida el calendario que devuelve nuestro Worker (`/api/github`) antes de pintarlo. */
export function isContributionCalendar(input: unknown): input is ContributionCalendar {
	if (!isObject(input) || typeof input.total !== 'number' || !Array.isArray(input.weeks)) {
		return false;
	}
	return input.weeks.every(
		(week) =>
			Array.isArray(week) &&
			week.every(
				(day) =>
					isObject(day) &&
					typeof day.date === 'string' &&
					ISO_DAY.test(day.date) &&
					typeof day.count === 'number' &&
					typeof day.level === 'number' &&
					day.level >= 0 &&
					day.level <= 4,
			),
	);
}
