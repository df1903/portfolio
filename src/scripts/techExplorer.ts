/** Explorador de tecnologías: al elegir una muestra en qué proyectos y trabajos se usó (R13). */

function fillGroup(panel: HTMLElement, name: string, entries: string[]): void {
	const group = panel.querySelector<HTMLElement>(`[data-tech-panel-group="${name}"]`);
	const list = group?.querySelector('ul');
	if (!group || !list) return;
	group.hidden = entries.length === 0;
	list.replaceChildren(
		...entries.map((entry) => {
			const item = document.createElement('li');
			item.textContent = entry;
			return item;
		}),
	);
}

function initTechExplorer(explorer: HTMLElement): void {
	const panel = explorer.querySelector<HTMLElement>('[data-tech-panel]');
	const title = panel?.querySelector<HTMLElement>('[data-tech-panel-title]');
	const empty = panel?.querySelector<HTMLElement>('[data-tech-panel-empty]');
	const buttons = [...explorer.querySelectorAll<HTMLButtonElement>('[data-tech]')];
	if (!panel || !title || !empty) return;

	const select = (selected: HTMLButtonElement | null) => {
		for (const button of buttons) {
			button.setAttribute('aria-pressed', String(button === selected));
		}
		panel.hidden = !selected;
		if (!selected) return;

		const projects: string[] = JSON.parse(selected.dataset.techProjects ?? '[]');
		const experience: string[] = JSON.parse(selected.dataset.techExperience ?? '[]');
		title.textContent = `Dónde he usado ${selected.dataset.techName}`;
		fillGroup(panel, 'projects', projects);
		fillGroup(panel, 'experience', experience);
		empty.hidden = projects.length + experience.length > 0;
		panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	};

	for (const button of buttons) {
		button.addEventListener('click', () => {
			const alreadySelected = button.getAttribute('aria-pressed') === 'true';
			select(alreadySelected ? null : button);
		});
	}
}

document.querySelectorAll<HTMLElement>('[data-tech-explorer]').forEach(initTechExplorer);
