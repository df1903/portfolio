/** Aparición progresiva de los elementos `[data-reveal]` al entrar en pantalla. */

const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

if ('IntersectionObserver' in window) {
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
	);
	elements.forEach((element) => observer.observe(element));
} else {
	elements.forEach((element) => element.classList.add('is-visible'));
}
