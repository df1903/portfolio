import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from '@/i18n/config';

/** Abreviaturas propias: las de Intl cambian entre versiones de ICU ("sep" / "sept"). */
const MONTH_ABBREVIATIONS: Record<Locale, readonly string[]> = {
	es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
	en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const PRESENT_LABELS: Record<Locale, string> = { es: 'Actualidad', en: 'Present' };

function assertValidDate(date: Date): void {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		throw new Error('formatDate: se esperaba una fecha válida');
	}
}

/**
 * `2025-04-01` → `abr 2025` / `Apr 2025`.
 * Las fechas de contenido (YAML) llegan en UTC; se leen en UTC para no desplazar el día.
 */
export function formatMonthYear(date: Date, locale: Locale = DEFAULT_LOCALE): string {
	assertValidDate(date);
	return `${MONTH_ABBREVIATIONS[locale][date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `2026-07-10` → `10 de julio de 2026` / `July 10, 2026` */
export function formatLongDate(date: Date, locale: Locale = DEFAULT_LOCALE): string {
	assertValidDate(date);
	return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(date);
}

/** Rango legible; sin fecha de fin significa que sigue vigente. */
export function formatDateRange(start: Date, end?: Date, locale: Locale = DEFAULT_LOCALE): string {
	const endLabel = end ? formatMonthYear(end, locale) : PRESENT_LABELS[locale];
	return `${formatMonthYear(start, locale)} — ${endLabel}`;
}
