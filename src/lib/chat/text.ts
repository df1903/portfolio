/** Minúsculas, sin tildes y sin puntuación (conserva `+`, `#` y `.` para "c++", "c#", ".net", "node.js"). */
export function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9+#.\s]/g, ' ')
		.replace(/\.(?=\s|$)/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** ¿Aparece `phrase` como palabra(s) completa(s) dentro de `normalizedText`? */
export function containsPhrase(normalizedText: string, phrase: string): boolean {
	const normalizedPhrase = normalizeText(phrase);
	if (!normalizedPhrase) return false;
	return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
}

/** ¿Alguna palabra del texto empieza por alguna de las raíces? (`certific` → certificado, certificaciones). */
export function hasWordStartingWith(normalizedText: string, stems: readonly string[]): boolean {
	const words = normalizedText.split(' ');
	return stems.some((stem) => words.some((word) => word.startsWith(stem)));
}

export function joinList(items: string[], conjunction = 'y'): string {
	if (items.length <= 1) return items.join('');
	return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}
