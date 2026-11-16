/** Botones `[data-copy]`: copian su valor al portapapeles y lo confirman un momento en su etiqueta. */

const FEEDBACK_MS = 2000;

document.addEventListener('click', async (event) => {
	const button = (event.target as HTMLElement).closest<HTMLElement>('[data-copy]');
	const value = button?.dataset.copy;
	if (!button || !value) return;

	try {
		await navigator.clipboard.writeText(value);
	} catch {
		// Sin permiso de portapapeles el valor sigue visible en la tarjeta: no hay nada que confirmar.
		return;
	}
	const label = button.querySelector<HTMLElement>('[data-copy-label]');
	if (!label || label.dataset.busy) return;
	const original = label.textContent;
	label.dataset.busy = 'true';
	label.textContent = button.dataset.copiedLabel ?? original;
	setTimeout(() => {
		label.textContent = original;
		delete label.dataset.busy;
	}, FEEDBACK_MS);
});
