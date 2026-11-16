import type { APIRoute } from 'astro';

import { loadPortfolio } from '@/data/portfolio';

/**
 * Base de conocimiento del asistente (es), generada en build desde las mismas colecciones que la página.
 * La consumen el chat del navegador (motor local) y el Worker (`worker/index.ts`) como contexto del modelo.
 */
export const GET: APIRoute = async () => {
	const { knowledge } = await loadPortfolio('es');
	return new Response(JSON.stringify(knowledge), {
		headers: { 'content-type': 'application/json; charset=utf-8' },
	});
};
