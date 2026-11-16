import { wireDialog } from './dialog';

/** Detalle de proyecto: clona el `<template>` de la tarjeta dentro de un único `<dialog>` compartido. */

const dialog = document.querySelector<HTMLDialogElement>('[data-project-dialog]');
const body = dialog?.querySelector<HTMLElement>('[data-project-dialog-body]');

if (dialog && body) {
	wireDialog(dialog);

	document.addEventListener('click', (event) => {
		const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-project-open]');
		if (!trigger) return;
		const template = document.querySelector<HTMLTemplateElement>(
			`template[data-project-detail="${trigger.dataset.projectOpen}"]`,
		);
		if (!template) return;

		body.replaceChildren(template.content.cloneNode(true));
		body.querySelector('[data-dialog-title]')?.setAttribute('id', 'project-dialog-title');
		dialog.showModal();
	});
}
