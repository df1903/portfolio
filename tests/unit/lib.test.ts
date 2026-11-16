import { describe, expect, it } from 'vitest';

import { isLocale, localeRoot } from '@/i18n/config';
import { fill, UI } from '@/i18n/ui';
import {
	certificateCategories,
	certificateIdFromPath,
	mergeCertificates,
	titleFromCertificateId,
	totalCertificateHours,
} from '@/lib/certificates';
import {
	buildContactChannels,
	buildGitHubProfileUrl,
	buildLinkedInUrl,
	buildMailto,
	buildWhatsAppLink,
	formatWhatsAppUsername,
} from '@/lib/contactLinks';
import { formatDateRange, formatLongDate, formatMonthYear } from '@/lib/formatDate';
import { localize } from '@/lib/localize';
import { buildTechUsage, usageCount } from '@/lib/techUsage';

describe('i18n', () => {
	it('reconoce idiomas soportados y su raíz', () => {
		expect(isLocale('en')).toBe(true);
		expect(isLocale('fr')).toBe(false);
		expect(isLocale(undefined)).toBe(false);
		expect(localeRoot('es')).toBe('/');
		expect(localeRoot('en')).toBe('/en/');
	});

	it('rellena marcadores y deja intactos los desconocidos', () => {
		expect(fill('Hola {name}, {count} veces', { name: 'Ada', count: 2 })).toBe('Hola Ada, 2 veces');
		expect(fill('Hola {otro}', { name: 'Ada' })).toBe('Hola {otro}');
	});

	it('tiene el menú completo en ambos idiomas', () => {
		expect(Object.keys(UI.en.nav)).toEqual(Object.keys(UI.es.nav));
	});
});

describe('localize', () => {
	const entry = {
		title: 'Proyecto',
		summary: 'Resumen',
		order: 3,
		en: { title: 'Project', summary: undefined },
	};

	it('devuelve el contenido base en español, sin el bloque en', () => {
		expect(localize(entry, 'es')).toEqual({ title: 'Proyecto', summary: 'Resumen', order: 3 });
	});

	it('sobreescribe solo lo traducido y cae al español en lo demás', () => {
		expect(localize(entry, 'en')).toEqual({ title: 'Project', summary: 'Resumen', order: 3 });
		expect(localize({ title: 'Sin traducir' }, 'en')).toEqual({ title: 'Sin traducir' });
	});
});

describe('formatDate', () => {
	it('formatea mes y año en UTC sin desplazar el día', () => {
		expect(formatMonthYear(new Date('2025-04-01'))).toBe('abr 2025');
		expect(formatMonthYear(new Date('2024-12-31'))).toBe('dic 2024');
		expect(formatMonthYear(new Date('2025-04-01'), 'en')).toBe('Apr 2025');
	});

	it('formatea fecha larga', () => {
		expect(formatLongDate(new Date('2026-07-10'))).toBe('10 de julio de 2026');
		expect(formatLongDate(new Date('2026-07-10'), 'en')).toBe('July 10, 2026');
	});

	it('formatea rangos cerrados y vigentes', () => {
		const start = new Date('2025-04-01');
		expect(formatDateRange(start, new Date('2025-09-30'))).toBe('abr 2025 — sep 2025');
		expect(formatDateRange(start)).toBe('abr 2025 — Actualidad');
		expect(formatDateRange(start, undefined, 'en')).toBe('Apr 2025 — Present');
	});

	it('rechaza fechas inválidas', () => {
		expect(() => formatMonthYear(new Date('nope'))).toThrow(/fecha válida/);
		expect(() => formatLongDate(new Date('nope'))).toThrow(/fecha válida/);
	});
});

describe('contactLinks', () => {
	const strings = UI.es.contact;

	it('construye mailto con asunto codificado', () => {
		expect(buildMailto('a@b.co')).toBe('mailto:a@b.co');
		expect(buildMailto('a@b.co', 'Hola Daniel')).toBe('mailto:a@b.co?subject=Hola%20Daniel');
		expect(() => buildMailto('no-es-correo')).toThrow(/correo inválido/);
	});

	it('normaliza el número de WhatsApp', () => {
		expect(buildWhatsAppLink('+57 300 123-4567')).toBe('https://wa.me/573001234567');
		expect(buildWhatsAppLink('573001234567', '¡Hola!')).toBe(
			'https://wa.me/573001234567?text=%C2%A1Hola!',
		);
		expect(() => buildWhatsAppLink('12ab')).toThrow(/WhatsApp inválido/);
	});

	it('normaliza y valida el usuario de WhatsApp', () => {
		expect(formatWhatsAppUsername('@DanielFFR')).toBe('@danielffr');
		expect(formatWhatsAppUsername('ada.lovelace_1')).toBe('@ada.lovelace_1');
		expect(() => formatWhatsAppUsername('ab')).toThrow(/usuario de WhatsApp inválido/);
		expect(() => formatWhatsAppUsername('12345')).toThrow(/usuario de WhatsApp inválido/);
		expect(() => formatWhatsAppUsername('con espacio')).toThrow(/usuario de WhatsApp inválido/);
	});

	it('valida usuario de GitHub y URL de LinkedIn', () => {
		expect(buildGitHubProfileUrl('df1903')).toBe('https://github.com/df1903');
		expect(() => buildGitHubProfileUrl('no/valido')).toThrow(/GitHub inválido/);
		expect(buildLinkedInUrl('https://www.linkedin.com/in/alguien')).toBe(
			'https://www.linkedin.com/in/alguien',
		);
		expect(() => buildLinkedInUrl('https://evil.example/in/x')).toThrow(/LinkedIn inválida/);
		expect(() => buildLinkedInUrl('http://www.linkedin.com/in/x')).toThrow(/LinkedIn inválida/);
		expect(() => buildLinkedInUrl('no es url')).toThrow(/LinkedIn inválida/);
	});

	it('entrega los cuatro canales en el orden de R14', () => {
		const channels = buildContactChannels(
			{
				email: 'a@b.co',
				whatsappNumber: '573001234567',
				linkedinUrl: 'https://www.linkedin.com/in/alguien',
				githubUser: 'df1903',
			},
			strings,
		);
		expect(channels.map((channel) => channel.kind)).toEqual([
			'email',
			'whatsapp',
			'linkedin',
			'github',
		]);
		expect(channels[0].href).toBe('mailto:a@b.co?subject=Hola%20Daniel%2C%20vi%20tu%20portafolio');
		expect(channels[1].href).toContain('https://wa.me/573001234567?text=');
	});

	it('con solo usuario de WhatsApp no inventa un enlace: ofrece copiarlo', () => {
		const [whatsapp] = buildContactChannels({ whatsappUsername: 'danielffr' }, strings);
		expect(whatsapp).toMatchObject({ handle: '@danielffr', copyValue: '@danielffr' });
		expect(whatsapp.href).toBeUndefined();
	});

	it('prefiere el enlace de la app y luego el número, mostrando el usuario si existe', () => {
		const [withUrl] = buildContactChannels(
			{ whatsappUrl: 'https://wa.me/danielffr', whatsappNumber: '573001234567' },
			strings,
		);
		expect(withUrl).toMatchObject({ href: 'https://wa.me/danielffr', handle: 'Escríbeme' });

		const [withNumber] = buildContactChannels(
			{ whatsappNumber: '573001234567', whatsappUsername: 'danielffr' },
			strings,
		);
		expect(withNumber.handle).toBe('@danielffr');
		expect(withNumber.href).toContain('https://wa.me/573001234567');

		expect(() => buildContactChannels({ whatsappUrl: 'https://evil.example/x' }, strings)).toThrow(
			/WhatsApp inválida/,
		);
	});

	it('omite los canales sin configurar y traduce las etiquetas', () => {
		expect(
			buildContactChannels({ githubUser: 'df1903' }, strings).map((channel) => channel.kind),
		).toEqual(['github']);
		expect(buildContactChannels({}, strings)).toEqual([]);
		expect(buildContactChannels({ email: 'a@b.co' }, UI.en.contact)[0].label).toBe('Email');
	});
});

describe('certificates', () => {
	const metadata = [
		{
			id: 'diploma-a',
			title: 'A',
			issuer: 'Platzi',
			date: new Date('2025-01-01'),
			hours: 10,
			category: 'web',
		},
		{
			id: 'diploma-b',
			title: 'B',
			issuer: 'Platzi',
			date: new Date('2026-01-01'),
			hours: 5,
			category: 'ai',
		},
		{ id: 'diploma-c', title: 'C', issuer: 'Platzi', date: new Date('2026-01-01'), category: 'ai' },
	];
	const images = {
		'/src/assets/certificates/diploma-a.webp': 'img-a',
		'/src/assets/certificates/diploma-c.webp': 'img-c',
		'/src/assets/certificates/diploma-b.webp': 'img-b',
	};

	it('obtiene el id desde la ruta', () => {
		expect(certificateIdFromPath('/src/assets/certificates/diploma-css.webp')).toBe('diploma-css');
		expect(certificateIdFromPath('C:\\assets\\cert.final.PNG')).toBe('cert.final');
		expect(() => certificateIdFromPath('/carpeta/')).toThrow(/no se pudo obtener/);
	});

	it('deduce un título legible del nombre de archivo', () => {
		expect(titleFromCertificateId('diploma-fundamentos-python')).toBe('Fundamentos python');
		expect(titleFromCertificateId('aws_cloud-practitioner')).toBe('Aws cloud practitioner');
		expect(titleFromCertificateId('diploma-')).toBe('diploma-');
	});

	it('une imágenes con metadatos y ordena del más reciente al más antiguo', () => {
		const merged = mergeCertificates(images, metadata);
		expect(merged.map((certificate) => certificate.id)).toEqual([
			'diploma-b',
			'diploma-c',
			'diploma-a',
		]);
		expect(merged[0]).toMatchObject({ title: 'B', image: 'img-b', hours: 5 });
	});

	it('muestra primero las imágenes nuevas sin metadatos', () => {
		const merged = mergeCertificates(
			{
				...images,
				'/src/assets/certificates/diploma-zeta.webp': 'img-z',
				'/src/assets/certificates/diploma-nuevo.webp': 'img-n',
			},
			metadata,
		);
		expect(merged.slice(0, 2).map((certificate) => certificate.title)).toEqual(['Nuevo', 'Zeta']);
		expect(merged[0].category).toBe('other');
		expect(merged[0].date).toBeUndefined();
	});

	it('falla si hay metadatos sin imagen', () => {
		expect(() => mergeCertificates({}, metadata)).toThrow(/metadatos sin imagen.*diploma-a/);
	});

	it('suma horas y ordena categorías', () => {
		expect(totalCertificateHours(metadata)).toBe(15);
		expect(
			certificateCategories(
				[{ category: 'web' }, { category: 'zzz' }, { category: 'ai' }, { category: 'other' }],
				['ai', 'web'],
			),
		).toEqual(['ai', 'web', 'other', 'zzz']);
	});
});

describe('techUsage', () => {
	it('cruza tecnologías con proyectos y experiencia', () => {
		const usage = buildTechUsage(
			[
				{ label: 'Proyecto A', technologyIds: ['react', 'python'] },
				{ label: 'Proyecto B', technologyIds: ['react'] },
			],
			[{ label: 'Dev en ACME', technologyIds: ['react'] }],
		);
		expect(usage.get('react')).toEqual({
			projects: ['Proyecto A', 'Proyecto B'],
			experience: ['Dev en ACME'],
		});
		expect(usageCount(usage.get('react'))).toBe(3);
		expect(usageCount(usage.get('python'))).toBe(1);
		expect(usageCount(usage.get('cobol'))).toBe(0);
	});
});
