const LOCALE = 'es-CO';

/** Abreviaturas propias: las de Intl cambian entre versiones de ICU ("sep" / "sept"). */
const MONTH_ABBREVIATIONS = [
	'ene',
	'feb',
	'mar',
	'abr',
	'may',
	'jun',
	'jul',
	'ago',
	'sep',
	'oct',
	'nov',
	'dic',
] as const;

/** Las fechas de contenido (YAML) llegan en UTC; se formatean en UTC para no desplazar el día. */
const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
});

function assertValidDate(date: Date): void {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		throw new Error('formatDate: se esperaba una fecha válida');
	}
}

/** `2025-04-01` → `abr 2025` */
export function formatMonthYear(date: Date): string {
	assertValidDate(date);
	return `${MONTH_ABBREVIATIONS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `2026-07-10` → `10 de julio de 2026` */
export function formatLongDate(date: Date): string {
	assertValidDate(date);
	return longDateFormatter.format(date);
}

/** Rango legible; sin fecha de fin significa que sigue vigente. */
export function formatDateRange(start: Date, end?: Date): string {
	return `${formatMonthYear(start)} — ${end ? formatMonthYear(end) : 'Actualidad'}`;
}
