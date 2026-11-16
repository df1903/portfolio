/** Hero: rol que se escribe solo y contadores que suben al entrar en pantalla. */

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TYPE_DELAY = 55;
const ERASE_DELAY = 28;
const HOLD_DELAY = 1900;

function initTypedRoles(): void {
	const element = document.querySelector<HTMLElement>('[data-typed]');
	if (!element || reducedMotion) return;

	const roles: string[] = JSON.parse(element.dataset.typed ?? '[]');
	if (roles.length < 2) return;

	let roleIndex = 0;
	let length = roles[0].length;
	let erasing = true;

	const tick = () => {
		const role = roles[roleIndex];
		length += erasing ? -1 : 1;
		element.textContent = role.slice(0, length);

		let delay = erasing ? ERASE_DELAY : TYPE_DELAY;
		if (!erasing && length === role.length) {
			erasing = true;
			delay = HOLD_DELAY;
		} else if (erasing && length === 0) {
			erasing = false;
			roleIndex = (roleIndex + 1) % roles.length;
		}
		setTimeout(tick, delay);
	};
	setTimeout(tick, HOLD_DELAY);
}

function initCounters(): void {
	const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
	if (reducedMotion || !('IntersectionObserver' in window)) return;

	const DURATION = 1400;
	const animate = (element: HTMLElement) => {
		const target = Number(element.dataset.countTo);
		const startedAt = performance.now();
		const step = (now: number) => {
			const progress = Math.min(1, (now - startedAt) / DURATION);
			const eased = 1 - (1 - progress) ** 3;
			element.textContent = String(Math.round(target * eased));
			if (progress < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	};

	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			animate(entry.target as HTMLElement);
			observer.unobserve(entry.target);
		}
	});
	counters.forEach((counter) => observer.observe(counter));
}

initTypedRoles();
initCounters();
