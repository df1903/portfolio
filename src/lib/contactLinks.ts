import type { ContactConfig } from '@/data/site';

export type ContactChannelKind = 'email' | 'whatsapp' | 'linkedin' | 'github';

export interface ContactChannel {
	kind: ContactChannelKind;
	label: string;
	/** Texto corto visible (usuario, correo, etc.). */
	handle: string;
	href: string;
	icon: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GITHUB_USER_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

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

export function buildGitHubProfileUrl(user: string): string {
	if (!GITHUB_USER_PATTERN.test(user)) {
		throw new Error(`contactLinks: usuario de GitHub inválido "${user}"`);
	}
	return `https://github.com/${user}`;
}

export function buildLinkedInUrl(url: string): string {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`contactLinks: URL de LinkedIn inválida "${url}"`);
	}
	if (parsed.protocol !== 'https:' || !/(^|\.)linkedin\.com$/.test(parsed.hostname)) {
		throw new Error(`contactLinks: URL de LinkedIn inválida "${url}"`);
	}
	return parsed.toString();
}

/**
 * Canales de contacto en el orden de R14. Un canal sin dato configurado se omite
 * (en vez de renderizar un enlace roto).
 */
export function buildContactChannels(contact: ContactConfig, greeting?: string): ContactChannel[] {
	const channels: ContactChannel[] = [];
	if (contact.email) {
		channels.push({
			kind: 'email',
			label: 'Correo',
			handle: contact.email,
			href: buildMailto(contact.email, greeting),
			icon: 'mdi:email-outline',
		});
	}
	if (contact.whatsappNumber) {
		channels.push({
			kind: 'whatsapp',
			label: 'WhatsApp',
			handle: 'Escríbeme',
			href: buildWhatsAppLink(contact.whatsappNumber, greeting),
			icon: 'simple-icons:whatsapp',
		});
	}
	if (contact.linkedinUrl) {
		channels.push({
			kind: 'linkedin',
			label: 'LinkedIn',
			handle: 'Ver perfil',
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
