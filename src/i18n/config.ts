export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English' };

/** Etiqueta BCP 47 completa, para `<html lang>` y Open Graph. */
export const LOCALE_TAGS: Record<Locale, string> = { es: 'es-CO', en: 'en-US' };

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Raíz de cada idioma: el idioma por defecto vive en `/`, el resto en `/<locale>/`. */
export function localeRoot(locale: Locale): string {
	return locale === DEFAULT_LOCALE ? '/' : `/${locale}/`;
}
