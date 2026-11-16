import { buildSystemPrompt, sanitizeMessages } from '../src/lib/chat/prompt';
import type { ChatMessage, Knowledge } from '../src/lib/chat/types';

/**
 * Worker de Cloudflare delante del sitio estático.
 * Solo atiende `POST /api/chat` (ver `run_worker_first` en wrangler.jsonc); todo lo demás lo sirven
 * los assets. Si el modelo falla o se agota la cuota gratuita responde 503 y el navegador recurre a
 * su motor local, así que el chat nunca queda inservible.
 */

interface Env {
	ASSETS: { fetch: (request: Request | string) => Promise<Response> };
	AI: { run: (model: string, input: unknown) => Promise<unknown> };
	/** Modelo de Workers AI; se cambia en wrangler.jsonc sin tocar código. */
	CHAT_MODEL: string;
}

const MAX_BODY_BYTES = 16_000;
const MAX_REPLY_TOKENS = 400;

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
	});
}

async function loadKnowledge(env: Env, origin: string): Promise<Knowledge> {
	const response = await env.ASSETS.fetch(new Request(new URL('/knowledge.json', origin)));
	if (!response.ok) throw new Error(`knowledge.json: HTTP ${response.status}`);
	return (await response.json()) as Knowledge;
}

function extractReply(result: unknown): string | undefined {
	if (typeof result !== 'object' || result === null) return undefined;
	const { response, choices } = result as {
		response?: unknown;
		choices?: { message?: { content?: unknown } }[];
	};
	const text = typeof response === 'string' ? response : choices?.[0]?.message?.content;
	return typeof text === 'string' && text.trim() ? text.trim() : undefined;
}

async function handleChat(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

	// Solo el propio sitio puede usar el endpoint desde un navegador.
	const origin = request.headers.get('origin');
	if (origin && origin !== new URL(request.url).origin) return json({ error: 'forbidden' }, 403);

	const raw = await request.text();
	if (raw.length > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413);

	let messages: ChatMessage[];
	try {
		messages = sanitizeMessages((JSON.parse(raw) as { messages?: unknown }).messages);
	} catch {
		return json({ error: 'invalid_request' }, 400);
	}

	try {
		const knowledge = await loadKnowledge(env, request.url);
		const result = await env.AI.run(env.CHAT_MODEL, {
			messages: [{ role: 'system', content: buildSystemPrompt(knowledge) }, ...messages],
			max_tokens: MAX_REPLY_TOKENS,
			temperature: 0.3,
		});
		const reply = extractReply(result);
		return reply ? json({ reply }) : json({ error: 'empty_reply' }, 503);
	} catch (error) {
		console.error('chat:', error instanceof Error ? error.message : error);
		return json({ error: 'model_unavailable' }, 503);
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (new URL(request.url).pathname === '/api/chat') return handleChat(request, env);
		return env.ASSETS.fetch(request);
	},
};
