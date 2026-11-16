/** Cabecera: tema claro/oscuro, menú móvil, sección activa y barra de progreso de lectura. */

const root = document.documentElement;

function initThemeToggle(): void {
	document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
		button.addEventListener('click', () => {
			const next = root.dataset.theme === 'light' ? 'dark' : 'light';
			root.dataset.theme = next;
			try {
				localStorage.setItem('theme', next);
			} catch {
				/* sin almacenamiento el tema simplemente no persiste */
			}
		});
	});
}

function initMobileMenu(): void {
	const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
	const menu = document.getElementById('mobile-menu');
	if (!toggle || !menu) return;

	const setOpen = (open: boolean) => {
		menu.hidden = !open;
		toggle.setAttribute('aria-expanded', String(open));
		const label = open ? toggle.dataset.closeLabel : toggle.dataset.openLabel;
		if (label) toggle.setAttribute('aria-label', label);
		toggle.querySelector<SVGElement>('[data-menu-icon="closed"]')?.toggleAttribute('hidden', open);
		toggle.querySelector<SVGElement>('[data-menu-icon="open"]')?.toggleAttribute('hidden', !open);
	};

	toggle.addEventListener('click', () => setOpen(menu.hidden));
	menu.addEventListener('click', (event) => {
		if ((event.target as HTMLElement).closest('a')) setOpen(false);
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !menu.hidden) {
			setOpen(false);
			toggle.focus();
		}
	});
}

function initScrollSpy(): void {
	const links = document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]');
	const sections = document.querySelectorAll<HTMLElement>('[data-section]');
	if (links.length === 0 || sections.length === 0) return;

	const setCurrent = (id: string) => {
		links.forEach((link) => {
			if (link.dataset.navLink === id) link.setAttribute('aria-current', 'true');
			else link.removeAttribute('aria-current');
		});
	};

	// Banda estrecha a media pantalla: la sección que la cruza es la activa.
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) setCurrent(entry.target.id);
			}
		},
		{ rootMargin: '-45% 0px -50% 0px' },
	);
	sections.forEach((section) => observer.observe(section));
}

function initScrollProgress(): void {
	const bar = document.querySelector<HTMLElement>('[data-scroll-progress]');
	if (!bar) return;

	let scheduled = false;
	const update = () => {
		scheduled = false;
		const scrollable = root.scrollHeight - window.innerHeight;
		const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
		bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
	};
	window.addEventListener(
		'scroll',
		() => {
			if (scheduled) return;
			scheduled = true;
			requestAnimationFrame(update);
		},
		{ passive: true },
	);
	update();
}

initThemeToggle();
initMobileMenu();
initScrollSpy();
initScrollProgress();
