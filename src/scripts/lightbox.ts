import { wireDialog } from './dialog';

/** Visor de certificados a imagen completa (R6), con navegación por botones y teclado. */

const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
const gallery = document.querySelector<HTMLElement>('[data-lightbox-gallery]');

if (dialog && gallery) {
	const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
	const heading = dialog.querySelector<HTMLElement>('[data-lightbox-heading]')!;
	const subheading = dialog.querySelector<HTMLElement>('[data-lightbox-subheading]')!;
	const counter = dialog.querySelector<HTMLElement>('[data-lightbox-counter]')!;

	let sequence: HTMLElement[] = [];
	let index = 0;

	// Solo se recorre lo que el filtro deja visible en ese momento.
	const visibleTriggers = () =>
		[...gallery.querySelectorAll<HTMLElement>('[data-lightbox-src]')].filter(
			(trigger) => !trigger.closest('[hidden]'),
		);

	const show = (nextIndex: number) => {
		index = (nextIndex + sequence.length) % sequence.length;
		const { lightboxSrc = '', lightboxTitle = '', lightboxCaption = '' } = sequence[index].dataset;
		image.src = lightboxSrc;
		image.alt = `Certificado: ${lightboxTitle}`;
		heading.textContent = lightboxTitle;
		subheading.textContent = lightboxCaption;
		counter.textContent = `${index + 1} / ${sequence.length}`;
	};

	wireDialog(dialog);

	gallery.addEventListener('click', (event) => {
		const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-lightbox-src]');
		if (!trigger) return;
		sequence = visibleTriggers();
		show(sequence.indexOf(trigger));
		dialog.showModal();
	});

	dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
	dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));
	dialog.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') show(index - 1);
		if (event.key === 'ArrowRight') show(index + 1);
	});
	dialog.addEventListener('close', () => sequence[index]?.focus());
}
