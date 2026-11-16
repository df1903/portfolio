/**
 * Filtro genérico por categoría. Marcado esperado dentro de `[data-filter-group]`:
 *   botones `[data-filter="<categoría>|all"]` y elementos `[data-filter-item][data-category]`.
 * Opcional: `data-filter-limit="N"` colapsa la vista "Todos" a N elementos con un botón
 * `[data-filter-more]` para desplegar el resto.
 */

function initFilterGroup(group: HTMLElement): void {
	const buttons = [...group.querySelectorAll<HTMLButtonElement>('[data-filter]')];
	const items = [...group.querySelectorAll<HTMLElement>('[data-filter-item]')];
	const moreWrapper = group.querySelector<HTMLElement>('[data-filter-more-wrapper]');
	const moreButton = group.querySelector<HTMLButtonElement>('[data-filter-more]');
	const moreLabel = group.querySelector<HTMLElement>('[data-filter-more-label]');
	const limit = Number(group.dataset.filterLimit) || Infinity;
	const expandLabel = moreLabel?.textContent ?? '';

	let active = 'all';
	let expanded = false;

	const render = (userTriggered: boolean) => {
		const collapsible = active === 'all' && items.length > limit;
		let shown = 0;
		for (const item of items) {
			const matches = active === 'all' || item.dataset.category === active;
			const visible = matches && (!collapsible || expanded || shown < limit);
			item.hidden = !visible;
			if (visible) shown += 1;
			// Lo que aparece por un filtro ya no espera a la animación de entrada.
			if (visible && userTriggered) item.classList.add('is-visible');
		}
		for (const button of buttons) {
			button.setAttribute('aria-pressed', String(button.dataset.filter === active));
		}
		if (moreWrapper && moreButton && moreLabel) {
			moreWrapper.hidden = !collapsible;
			moreButton.setAttribute('aria-expanded', String(expanded));
			moreLabel.textContent = expanded ? 'Ver menos' : expandLabel;
		}
	};

	for (const button of buttons) {
		button.addEventListener('click', () => {
			active = button.dataset.filter ?? 'all';
			render(true);
		});
	}
	moreButton?.addEventListener('click', () => {
		expanded = !expanded;
		render(true);
		if (!expanded) group.scrollIntoView({ block: 'start' });
	});

	render(false);
}

document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach(initFilterGroup);
