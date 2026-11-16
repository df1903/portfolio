/** Bindings y variables del Worker (declarados en wrangler.jsonc y en los secretos de Cloudflare). */
export interface Env {
	ASSETS: { fetch: (request: Request | string) => Promise<Response> };
	AI: { run: (model: string, input: unknown) => Promise<unknown> };
	/** Modelo de Workers AI; se cambia en wrangler.jsonc sin tocar código. */
	CHAT_MODEL: string;
	/** Usuario cuyo calendario de contribuciones se muestra. */
	GITHUB_USER: string;
	/**
	 * Secreto opcional (`wrangler secret put GITHUB_TOKEN`). Token de solo lectura; sin él
	 * `/api/github` responde 404 y la página omite el calendario.
	 */
	GITHUB_TOKEN?: string;
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...headers,
		},
	});
}
