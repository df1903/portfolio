import { DEFAULT_LOCALE, isLocale, localeRoot } from '../src/i18n/config';
import { buildSystemPrompt, sanitizeMessages } from '../src/lib/chat/prompt';
import type { ChatMessage, Knowledge } from '../src/lib/chat/types';
import { handleGitHub } from './github';
import { json, type Env } from './shared';

/**
 * Worker de Cloudflare delante del sitio estático.
 * Solo atiende `/api/*` (ver `run_worker_first` en wrangler.jsonc); todo lo demás lo sirven los
 * assets. Cada endpoint degrada con un código de error y el navegador sigue sin él: el chat recurre
 * a su motor local y el bloque de GitHub simplemente no muestra el calendario.
 */

const MAX_BODY_BYTES = 16_000;
const MAX_REPLY_TOKENS = 400;

async function loadKnowledge(env: Env, request: Request, locale: unknown): Promise<Knowledge> {
	const root = localeRoot(isLocale(locale) ? locale : DEFAULT_LOCALE);
	const response = await env.ASSETS.fetch(
		new Request(new URL(`${root}knowledge.json`, request.url)),
	);
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
	let locale: unknown;
	try {
		const body = JSON.parse(raw) as { messages?: unknown; locale?: unknown };
		messages = sanitizeMessages(body.messages);
		locale = body.locale;
	} catch {
		return json({ error: 'invalid_request' }, 400);
	}

	try {
		const knowledge = await loadKnowledge(env, request, locale);
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
	async fetch(request: Request, env: Env, context: ExecutionContextLike): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname === '/api/chat') return handleChat(request, env);
		if (pathname === '/api/github') return handleGitHub(request, env, context);
		if (pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
		return env.ASSETS.fetch(request);
	},
};

interface ExecutionContextLike {
	waitUntil: (promise: Promise<unknown>) => void;
}
