/** Comportamiento común de los `<dialog>` modales: botón de cierre y clic en el fondo. */
export function wireDialog(dialog: HTMLDialogElement): void {
	dialog.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		// Un clic directamente sobre el <dialog> solo ocurre en el backdrop.
		if (target === dialog || target.closest('[data-dialog-close]')) dialog.close();
	});
}
