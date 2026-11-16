import { CONTRIBUTIONS_QUERY, parseContributionCalendar } from '../src/lib/github';
import { json, type Env } from './shared';

/**
 * `GET /api/github` → calendario de contribuciones del último año.
 * Vive en el Worker porque la API GraphQL de GitHub exige un token, y un token no puede ir al
 * navegador. La respuesta se guarda en la caché del edge: GitHub recibe, como mucho, una petición
 * cada `CACHE_SECONDS` sin importar cuántas visitas haya.
 */

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const CACHE_SECONDS = 6 * 60 * 60;

interface CacheStorageLike {
	default: {
		match: (request: Request) => Promise<Response | undefined>;
		put: (request: Request, response: Response) => Promise<void>;
	};
}

interface ExecutionContextLike {
	waitUntil: (promise: Promise<unknown>) => void;
}

export async function handleGitHub(
	request: Request,
	env: Env,
	context: ExecutionContextLike,
): Promise<Response> {
	if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
	if (!env.GITHUB_TOKEN || !env.GITHUB_USER) return json({ error: 'not_configured' }, 404);

	const cache = (caches as unknown as CacheStorageLike).default;
	const cacheKey = new Request(new URL('/api/github', request.url));
	const cached = await cache.match(cacheKey);
	if (cached) return cached;

	try {
		const upstream = await fetch(GITHUB_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${env.GITHUB_TOKEN}`,
				'content-type': 'application/json',
				'user-agent': 'portfolio-worker',
			},
			body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login: env.GITHUB_USER } }),
		});
		if (!upstream.ok) throw new Error(`GitHub HTTP ${upstream.status}`);

		const calendar = parseContributionCalendar(await upstream.json());
		if (!calendar) throw new Error('respuesta sin calendario');

		const response = json(calendar, 200, {
			'cache-control': `public, max-age=${CACHE_SECONDS}`,
		});
		context.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	} catch (error) {
		// Nunca se devuelve el detalle del error: podría incluir datos de la petición autenticada.
		console.error('github:', error instanceof Error ? error.message : error);
		return json({ error: 'github_unavailable' }, 502);
	}
}
