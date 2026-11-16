import type { ContactConfig } from '@/data/site';

export type ContactChannelKind = 'email' | 'whatsapp' | 'linkedin' | 'github';

export interface ContactChannel {
	kind: ContactChannelKind;
	label: string;
	/** Texto corto visible (usuario, correo, etc.). */
	handle: string;
	/** Ausente cuando el canal no tiene enlace directo y solo se puede copiar `copyValue`. */
	href?: string;
	/** Valor que la tarjeta copia al portapapeles cuando no hay `href`. */
	copyValue?: string;
	icon: string;
}

/** Textos visibles de los canales, ya en el idioma de la página. */
export interface ContactStrings {
	greeting: string;
	email: string;
	whatsappAction: string;
	linkedinAction: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GITHUB_USER_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
/** Reglas de WhatsApp: 3–35 caracteres, minúsculas, números, punto y guion bajo, al menos una letra. */
const WHATSAPP_USERNAME_PATTERN = /^(?=.*[a-z])[a-z0-9._]{3,35}$/;

function assertHttpsUrl(url: string, hostPattern: RegExp, name: string): string {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`contactLinks: URL de ${name} inválida "${url}"`);
	}
	if (parsed.protocol !== 'https:' || !hostPattern.test(parsed.hostname)) {
		throw new Error(`contactLinks: URL de ${name} inválida "${url}"`);
	}
	return parsed.toString();
}

export function buildMailto(email: string, subject?: string): string {
	if (!EMAIL_PATTERN.test(email)) {
		throw new Error(`contactLinks: correo inválido "${email}"`);
	}
	const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
	return `mailto:${email}${query}`;
}

/** `phone` admite espacios, guiones o `+`; debe incluir indicativo de país. */
export function buildWhatsAppLink(phone: string, message?: string): string {
	const digits = phone.replace(/[\s+()-]/g, '');
	if (!/^\d{8,15}$/.test(digits)) {
		throw new Error(`contactLinks: número de WhatsApp inválido "${phone}"`);
	}
	const query = message ? `?text=${encodeURIComponent(message)}` : '';
	return `https://wa.me/${digits}${query}`;
}

/** Normaliza un usuario de WhatsApp (acepta `@usuario`) y lo devuelve con `@`. */
export function formatWhatsAppUsername(username: string): string {
	const handle = username.trim().replace(/^@/, '').toLowerCase();
	if (!WHATSAPP_USERNAME_PATTERN.test(handle)) {
		throw new Error(`contactLinks: usuario de WhatsApp inválido "${username}"`);
	}
	return `@${handle}`;
}

export function buildGitHubProfileUrl(user: string): string {
	if (!GITHUB_USER_PATTERN.test(user)) {
		throw new Error(`contactLinks: usuario de GitHub inválido "${user}"`);
	}
	return `https://github.com/${user}`;
}

export function buildLinkedInUrl(url: string): string {
	return assertHttpsUrl(url, /(^|\.)linkedin\.com$/, 'LinkedIn');
}

function buildWhatsAppChannel(
	contact: ContactConfig,
	strings: ContactStrings,
): ContactChannel | undefined {
	const { whatsappUrl, whatsappNumber, whatsappUsername } = contact;
	if (!whatsappUrl && !whatsappNumber && !whatsappUsername) return undefined;

	const handle = whatsappUsername ? formatWhatsAppUsername(whatsappUsername) : undefined;
	const channel = { kind: 'whatsapp', label: 'WhatsApp', icon: 'simple-icons:whatsapp' } as const;
	if (whatsappUrl) {
		const href = assertHttpsUrl(whatsappUrl, /(^|\.)(wa\.me|whatsapp\.com)$/, 'WhatsApp');
		return { ...channel, handle: handle ?? strings.whatsappAction, href };
	}
	if (whatsappNumber) {
		return {
			...channel,
			handle: handle ?? strings.whatsappAction,
			href: buildWhatsAppLink(whatsappNumber, strings.greeting),
		};
	}
	// Solo usuario: no se inventa un enlace; la tarjeta lo copia para buscarlo en WhatsApp.
	return { ...channel, handle: handle!, copyValue: handle };
}

/**
 * Canales de contacto en el orden de R14. Un canal sin dato configurado se omite
 * (en vez de renderizar un enlace roto).
 */
export function buildContactChannels(
	contact: ContactConfig,
	strings: ContactStrings,
): ContactChannel[] {
	const channels: ContactChannel[] = [];
	if (contact.email) {
		channels.push({
			kind: 'email',
			label: strings.email,
			handle: contact.email,
			href: buildMailto(contact.email, strings.greeting),
			icon: 'mdi:email-outline',
		});
	}
	const whatsapp = buildWhatsAppChannel(contact, strings);
	if (whatsapp) channels.push(whatsapp);
	if (contact.linkedinUrl) {
		channels.push({
			kind: 'linkedin',
			label: 'LinkedIn',
			handle: strings.linkedinAction,
			href: buildLinkedInUrl(contact.linkedinUrl),
			icon: 'simple-icons:linkedin',
		});
	}
	if (contact.githubUser) {
		channels.push({
			kind: 'github',
			label: 'GitHub',
			handle: `@${contact.githubUser}`,
			href: buildGitHubProfileUrl(contact.githubUser),
			icon: 'simple-icons:github',
		});
	}
	return channels;
}
