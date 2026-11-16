import { answerQuestion } from '@/lib/chat/engine';
import type { ChatAnswer, ChatMessage, Knowledge, KnowledgeLink } from '@/lib/chat/types';

/**
 * Asistente del portafolio.
 * Estrategia: se intenta el modelo de lenguaje (`POST /api/chat`, Worker de Cloudflare). Si no existe
 * (hosting estático, preview local) o falla, responde el motor local con la misma base de conocimiento.
 * El motor local siempre aporta los enlaces y la sección relacionada, que son datos verificados.
 */

const KNOWLEDGE_URL = '/knowledge.json';
const CHAT_API_URL = '/api/chat';
const REMOTE_TIMEOUT_MS = 15_000;
const HISTORY_LIMIT = 8;

const panel = document.querySelector<HTMLElement>('[data-chat-panel]');
const launcher = document.querySelector<HTMLElement>('[data-chat-launcher]');
const log = panel?.querySelector<HTMLElement>('[data-chat-messages]');
const form = panel?.querySelector<HTMLFormElement>('[data-chat-form]');
const input = form?.querySelector<HTMLInputElement>('input[name="question"]');
const suggestions = panel?.querySelector<HTMLElement>('[data-chat-suggestions]');

let knowledgePromise: Promise<Knowledge> | undefined;
let remoteAvailable = true;
let busy = false;
const history: ChatMessage[] = [];

function loadKnowledge(): Promise<Knowledge> {
	knowledgePromise ??= fetch(KNOWLEDGE_URL).then((response) => {
		if (!response.ok) throw new Error(`knowledge: HTTP ${response.status}`);
		return response.json() as Promise<Knowledge>;
	});
	return knowledgePromise;
}

/** `**negrita**` → <strong>, sin pasar nunca texto por innerHTML. */
function renderRichText(container: HTMLElement, text: string): void {
	text.split(/(\*\*[^*]+\*\*)/g).forEach((segment) => {
		if (segment.startsWith('**') && segment.endsWith('**') && segment.length > 4) {
			const strong = document.createElement('strong');
			strong.className = 'text-fg font-semibold';
			strong.textContent = segment.slice(2, -2);
			container.append(strong);
		} else if (segment) {
			container.append(segment);
		}
	});
}

function createLink(link: KnowledgeLink): HTMLAnchorElement {
	const anchor = document.createElement('a');
	anchor.className = 'filter-pill !py-1 !text-xs';
	anchor.href = link.url;
	anchor.textContent = link.label;
	if (/^https?:/.test(link.url)) {
		anchor.target = '_blank';
		anchor.rel = 'noopener noreferrer';
	}
	return anchor;
}

function addMessage(role: ChatMessage['role'], text: string, extras: KnowledgeLink[] = []): void {
	if (!log) return;
	const bubble = document.createElement('div');
	bubble.className =
		role === 'user'
			? 'bg-accent text-accent-contrast ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5'
			: 'bg-surface-raised text-muted mr-auto w-fit max-w-[92%] rounded-2xl rounded-bl-md px-3.5 py-2.5 whitespace-pre-line';
	if (role === 'user') bubble.textContent = text;
	else renderRichText(bubble, text);

	if (extras.length > 0) {
		const links = document.createElement('div');
		links.className = 'mt-3 flex flex-wrap gap-1.5';
		links.append(...extras.map(createLink));
		bubble.append(links);
	}
	log.append(bubble);
	log.scrollTop = log.scrollHeight;
}

function showTyping(): HTMLElement | undefined {
	if (!log) return undefined;
	const indicator = document.createElement('div');
	indicator.className =
		'bg-surface-raised mr-auto flex w-fit gap-1 rounded-2xl rounded-bl-md px-4 py-3.5';
	indicator.setAttribute('aria-label', 'Escribiendo…');
	for (let dot = 0; dot < 3; dot += 1) {
		const element = document.createElement('span');
		element.className = 'typing-dot bg-subtle size-1.5 rounded-full';
		element.style.animationDelay = `${dot * 0.15}s`;
		indicator.append(element);
	}
	log.append(indicator);
	log.scrollTop = log.scrollHeight;
	return indicator;
}

async function askRemote(): Promise<string | undefined> {
	if (!remoteAvailable) return undefined;
	try {
		const response = await fetch(CHAT_API_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ messages: history.slice(-HISTORY_LIMIT) }),
			signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
		});
		// 404/405: no hay Worker detrás (sitio estático). No se reintenta en esta visita.
		if (response.status === 404 || response.status === 405) remoteAvailable = false;
		if (!response.ok) return undefined;
		const data = (await response.json()) as { reply?: unknown };
		return typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : undefined;
	} catch {
		return undefined;
	}
}

function sectionLink(answer: ChatAnswer): KnowledgeLink[] {
	return answer.section ? [{ label: 'Ver sección ↓', url: `#${answer.section}` }] : [];
}

async function ask(question: string): Promise<void> {
	if (busy || !question.trim()) return;
	busy = true;
	suggestions?.setAttribute('hidden', '');
	addMessage('user', question);
	history.push({ role: 'user', content: question });
	const typing = showTyping();

	try {
		const [knowledge, remoteReply] = await Promise.all([loadKnowledge(), askRemote()]);
		const local = answerQuestion(knowledge, question);
		const text = remoteReply ?? local.text;
		typing?.remove();
		addMessage('assistant', text, [...local.links, ...sectionLink(local)]);
		history.push({ role: 'assistant', content: text });
	} catch {
		typing?.remove();
		addMessage(
			'assistant',
			'No pude cargar la información en este momento. Intenta de nuevo o usa la sección de contacto.',
			[{ label: 'Ir a contacto ↓', url: '#contacto' }],
		);
	} finally {
		busy = false;
	}
}

function setOpen(open: boolean): void {
	if (!panel) return;
	panel.hidden = !open;
	launcher?.toggleAttribute('hidden', open);
	if (!open) {
		launcher?.focus();
		return;
	}
	if (log && log.childElementCount === 0) {
		addMessage(
			'assistant',
			`¡Hola! Soy el asistente de ${panel.dataset.owner}. Pregúntame por su experiencia, proyectos, tecnologías o cómo contactarlo.`,
		);
		void loadKnowledge().catch(() => undefined);
	}
	input?.focus();
}

if (panel && form && input) {
	document.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		if (target.closest('[data-chat-open]')) setOpen(true);
		else if (target.closest('[data-chat-close]')) setOpen(false);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !panel.hidden) setOpen(false);
	});

	// Un enlace interno del chat (p. ej. "Ver sección") cierra el panel en móvil para dejar ver el destino.
	panel.addEventListener('click', (event) => {
		const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
		if (anchor && window.innerWidth < 640) setOpen(false);
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const question = input.value;
		input.value = '';
		void ask(question);
	});

	suggestions?.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement).closest<HTMLElement>('[data-chat-suggestion]');
		if (button?.textContent) void ask(button.textContent.trim());
	});
}
