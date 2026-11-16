import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

type Translatable = { en?: object };

/** `T` sin el bloque `en`: lo que ve un componente, ya resuelto a un idioma. */
export type Localized<T extends Translatable> = Omit<T, 'en'>;

/**
 * Resuelve una entrada de contenido a un idioma. El español es el contenido base; el bloque
 * opcional `en` sobreescribe solo los campos traducidos, así que una entrada sin traducir
 * (o a medio traducir) se muestra en español en vez de romper la página en inglés.
 */
export function localize<T extends Translatable>(data: T, locale: Locale): Localized<T> {
	const { en, ...base } = data;
	if (locale === DEFAULT_LOCALE || !en) return base;
	const overrides = Object.fromEntries(
		Object.entries(en).filter(([, value]) => value !== undefined),
	);
	return { ...base, ...overrides };
}
