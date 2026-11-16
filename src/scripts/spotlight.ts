/** Brillo que sigue al cursor en las tarjetas interactivas (ver `.card-interactive` en global.css). */

document.addEventListener(
	'pointermove',
	(event) => {
		if (event.pointerType !== 'mouse') return;
		const card = (event.target as HTMLElement).closest<HTMLElement>('.card-interactive');
		if (!card) return;
		const bounds = card.getBoundingClientRect();
		card.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
		card.style.setProperty('--my', `${event.clientY - bounds.top}px`);
	},
	{ passive: true },
);
