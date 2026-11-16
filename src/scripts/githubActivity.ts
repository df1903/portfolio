import {
	isContributionCalendar,
	parseRecentRepos,
	type ContributionCalendar,
	type GitHubRepo,
} from '@/lib/github';

/**
 * Actividad de GitHub en vivo, con dos fuentes independientes:
 *  - Repos recientes: API REST pública de GitHub, directo desde el navegador (sin token).
 *  - Calendario de contribuciones: `/api/github` (nuestro Worker), porque la API que lo expone
 *    exige un token que no puede vivir en el navegador. Si el Worker no está configurado, se omite.
 * Cada fuente se pinta si responde; el bloque completo solo aparece si alguna lo hizo.
 */

const CALENDAR_URL = '/api/github';
const CACHE_MS = 30 * 60 * 1000;
const REPO_LIMIT = 6;
const FETCH_SIZE = 20;

const root = document.querySelector<HTMLElement>('[data-github-activity]');

/** Caché por pestaña: la API anónima de GitHub da 60 peticiones por hora a cada visitante. */
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
	try {
		const stored = JSON.parse(sessionStorage.getItem(key) ?? 'null') as {
			at: number;
			value: T;
		} | null;
		if (stored && Date.now() - stored.at < CACHE_MS) return stored.value;
	} catch {
		/* caché ilegible o almacenamiento bloqueado: se vuelve a pedir */
	}
	const value = await load();
	try {
		sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
	} catch {
		/* sin almacenamiento no hay caché, pero el dato ya está */
	}
	return value;
}

async function fetchJson(url: string): Promise<unknown> {
	const response = await fetch(url, { headers: { accept: 'application/json' } });
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	return response.json();
}

function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className: string,
	text?: string,
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function renderRepos(container: HTMLElement, repos: GitHubRepo[]): void {
	const { locale, updatedLabel = '', noDescription = '' } = container.dataset;
	const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
	const list = container.querySelector<HTMLElement>('[data-github-repos]');
	if (!list) return;

	list.replaceChildren(
		...repos.map((repo) => {
			const link = element('a', 'card card-interactive flex h-full flex-col gap-2 p-5');
			link.href = repo.url;
			link.target = '_blank';
			link.rel = 'noopener noreferrer';

			const meta = element('p', 'text-subtle mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs');
			if (repo.language) meta.append(element('span', 'text-accent font-medium', repo.language));
			if (repo.stars > 0) meta.append(element('span', '', `★ ${repo.stars}`));
			meta.append(
				element('span', '', `${updatedLabel} ${dateFormat.format(new Date(repo.pushedAt))}`),
			);

			link.append(
				element('span', 'font-display font-semibold break-all', repo.name),
				element('span', 'text-muted text-sm', repo.description ?? noDescription),
				meta,
			);
			const item = document.createElement('li');
			item.append(link);
			return item;
		}),
	);
}

function renderCalendar(container: HTMLElement, calendar: ContributionCalendar): void {
	const block = container.querySelector<HTMLElement>('[data-github-calendar]');
	const grid = block?.querySelector<HTMLElement>('[data-github-grid]');
	const total = block?.querySelector<HTMLElement>('[data-github-total]');
	if (!block || !grid || !total) return;

	total.textContent = new Intl.NumberFormat(container.dataset.locale).format(calendar.total);
	grid.replaceChildren(
		...calendar.weeks.flat().map((day) => {
			const cell = element('span', 'contribution-cell');
			cell.dataset.level = String(day.level);
			cell.title = `${day.date}: ${day.count}`;
			return cell;
		}),
	);
	block.hidden = false;
}

async function init(container: HTMLElement): Promise<void> {
	const user = container.dataset.user;
	if (!user) return;

	const [repos, calendar] = await Promise.allSettled([
		cached(`github:repos:${user}`, async () =>
			parseRecentRepos(
				await fetchJson(
					`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=${FETCH_SIZE}`,
				),
				user,
				REPO_LIMIT,
			),
		),
		cached('github:calendar', async () => {
			const data = await fetchJson(CALENDAR_URL);
			if (!isContributionCalendar(data)) throw new Error('calendario con formato inesperado');
			return data;
		}),
	]);

	const hasRepos = repos.status === 'fulfilled' && repos.value.length > 0;
	if (hasRepos) renderRepos(container, repos.value);
	else container.querySelector('[data-github-repos-title]')?.setAttribute('hidden', '');
	if (calendar.status === 'fulfilled') renderCalendar(container, calendar.value);

	container.hidden = !hasRepos && calendar.status !== 'fulfilled';
}

// Solo se piden datos cuando el bloque está por verse: quien no baja hasta ahí no gasta la cuota.
if (root) {
	const start = () => void init(root);
	if ('IntersectionObserver' in window) {
		const anchor = root.parentElement ?? root;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				start();
			},
			{ rootMargin: '600px 0px' },
		);
		observer.observe(anchor);
	} else {
		start();
	}
}
