import { expect, test } from '@playwright/test';

const SECTION_IDS = [
	'sobre-mi',
	'estudios',
	'certificaciones',
	'proyectos',
	'experiencia',
	'habilidades',
	'tecnologias',
	'contacto',
];

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test('renderiza las 8 secciones con contenido (R1, R4)', async ({ page }) => {
	for (const id of SECTION_IDS) {
		const section = page.locator(`section#${id}`);
		await expect(section).toBeAttached();
		await expect(section.getByRole('heading', { level: 2 })).not.toBeEmpty();
	}
});

test('no hay desbordamiento horizontal (R16)', async ({ page }) => {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(0);
});

test('la galería soporta al menos 24 certificados y los abre completos (R6, R7)', async ({
	page,
}) => {
	const gallery = page.locator('[data-lightbox-gallery]');
	expect(await gallery.locator('[data-lightbox-src]').count()).toBeGreaterThanOrEqual(24);

	await gallery.locator('[data-lightbox-src]').first().click();
	const lightbox = page.locator('[data-lightbox]');
	await expect(lightbox).toBeVisible();
	await expect(lightbox.locator('img')).toHaveAttribute('src', /\.webp$/);
	await page.keyboard.press('Escape');
	await expect(lightbox).toBeHidden();
});

test('filtrar proyectos deja solo los de la categoría elegida (R11)', async ({ page }) => {
	const group = page.locator('#proyectos [data-filter-group]');
	const filter = group.locator('[data-filter]:not([data-filter="all"])').first();
	const category = await filter.getAttribute('data-filter');
	await filter.click();

	const visible = group.locator('[data-filter-item]:visible');
	expect(await visible.count()).toBeGreaterThan(0);
	for (const item of await visible.all()) {
		await expect(item).toHaveAttribute('data-category', category!);
	}
});

test('cada proyecto enlaza a un recurso externo y abre su detalle (R9)', async ({ page }) => {
	const cards = page.locator('#proyectos [data-filter-item]');
	for (const card of await cards.all()) {
		await expect(card.locator('a[href^="https://"]').first()).toBeAttached();
	}
	await page.locator('[data-project-open]').first().click();
	await expect(page.locator('[data-project-dialog]')).toBeVisible();
});

test('los canales de contacto abren servicios externos (R14, R15)', async ({ page }) => {
	const channels = page.locator('#contacto [data-contact-channel]');
	expect(await channels.count()).toBeGreaterThan(0);
	for (const channel of await channels.all()) {
		await expect(channel).toHaveAttribute('href', /^(mailto:|https:\/\/)/);
	}
	await expect(page.locator('#contacto form')).toHaveCount(0);
});

test('el asistente cruza una tecnología con experiencia y proyectos (R13)', async ({ page }) => {
	await page.locator('[data-chat-launcher]').click();
	await page.locator('#chat-input').fill('¿Tiene experiencia con React?');
	await page.keyboard.press('Enter');
	await expect(page.locator('[data-chat-messages]')).toContainText('React', { timeout: 20_000 });
	await expect(page.locator('[data-chat-messages]')).toContainText('Softory');
});

test('el tema elegido persiste al recargar', async ({ page }) => {
	const initial = await page.locator('html').getAttribute('data-theme');
	await page.locator('[data-theme-toggle]').click();
	const toggled = initial === 'light' ? 'dark' : 'light';
	await expect(page.locator('html')).toHaveAttribute('data-theme', toggled);
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', toggled);
});
