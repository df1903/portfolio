import { wireDialog } from './dialog';

/** Detalle de proyecto: clona el contenido oculto de la tarjeta dentro de un único `<dialog>` compartido. */

const dialog = document.querySelector<HTMLDialogElement>('[data-project-dialog]');
const body = dialog?.querySelector<HTMLElement>('[data-project-dialog-body]');

if (dialog && body) {
	wireDialog(dialog);

	document.addEventListener('click', (event) => {
		const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-project-open]');
		if (!trigger) return;
		const detail = document.querySelector<HTMLElement>(
			`[data-project-detail="${trigger.dataset.projectOpen}"]`,
		);
		if (!detail) return;

		body.replaceChildren(...[...detail.children].map((child) => child.cloneNode(true)));
		body.querySelector('[data-dialog-title]')?.setAttribute('id', 'project-dialog-title');
		dialog.showModal();
	});
}
