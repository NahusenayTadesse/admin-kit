import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './kit-style-harness.test.svelte';
import Colours from './kit-colours-harness.test.svelte';
import SingleTable from './SingleTable.svelte';
import { KIT_STYLE_NAMES } from '$lib/kitStyle';

const rows = [
	{ name: 'Name', value: 'Jane Doe' },
	{ name: 'Status', value: 'active', kind: 'status' as const, label: 'Active' }
];

const html = () => document.documentElement;
const style = (testId: string) =>
	getComputedStyle(document.querySelector(`[data-testid="${testId}"]`) as Element);

afterEach(() => html().classList.remove('dark'));

describe('KitStyle.svelte', () => {
	it('puts the look on <html> and gives the components the style’s layout', async () => {
		const screen = render(Harness, { look: { style: 'sharp', accent: 'teal' } });

		await expect.poll(() => html().dataset.kitStyle).toBe('sharp');
		expect(html().dataset.kitAccent).toBe('teal');
		expect(screen.container.querySelector('[data-layout="sharp"]')).not.toBeNull();
		// No wrapper element of its own: nothing between the app's CSS and the page.
		expect(screen.container.querySelector('[data-kit-style]')).toBeNull();
	});

	it('writes a head script that sets the look before the first paint', async () => {
		render(Harness, { look: { style: 'formal', radius: 'sm' } });

		await expect.poll(() => html().dataset.kitStyle).toBe('formal');
		const script = [...document.head.querySelectorAll('script')].find((s) =>
			s.textContent?.includes('data-kit-style')
		);
		expect(script?.textContent).toContain('"data-kit-style":"formal"');
		expect(script?.textContent).toContain('"data-kit-radius":"sm"');
	});

	it('clears the look when it leaves, or returns to the one around it', async () => {
		const screen = render(Harness, { look: { style: 'soft' }, inner: { style: 'bold' } });
		await expect.poll(() => html().dataset.kitStyle).toBe('bold');

		await screen.rerender({ look: { style: 'soft' }, inner: undefined });
		await expect.poll(() => html().dataset.kitStyle).toBe('soft');

		screen.unmount();
		expect(html().dataset.kitStyle).toBeUndefined();
	});

	it('draws the default layout outside any KitStyle', async () => {
		const screen = render(SingleTable, { singleTable: rows });

		expect(screen.container.querySelector('table')).not.toBeNull();
		expect(screen.container.querySelector('[data-layout]')).toBeNull();
	});
});

describe('the app’s colours and design win', () => {
	it('over any style and accent, in light and in dark', async () => {
		render(Colours, {
			look: { style: 'bold', accent: 'green' },
			appCss: ':root { --primary: rgb(1, 2, 3); } .dark { --primary: rgb(4, 5, 6); }'
		});
		await expect.poll(() => html().dataset.kitAccent).toBe('green');

		// The button eases its colour (and the app's CSS arrives after it mounts): wait it out.
		await expect.poll(() => style('plain').backgroundColor).toBe('rgb(1, 2, 3)');
		html().classList.add('dark');
		await expect.poll(() => style('plain').backgroundColor).toBe('rgb(4, 5, 6)');
	});

	it('lets the accent stand in only where the app sets no --primary', async () => {
		render(Colours, { look: { style: 'soft', accent: 'green' } });
		await expect.poll(() => html().dataset.kitAccent).toBe('green');

		await expect.poll(() => style('plain').backgroundColor).toContain('0.5 0.13 150');
	});

	it('never has a style set a colour', async () => {
		const screen = render(Colours, { look: { style: 'default' } });
		await expect.poll(() => html().dataset.kitStyle).toBe('default');
		const colours = ['--background', '--foreground', '--border', '--muted', '--card', '--primary'];
		const before = colours.map((c) => getComputedStyle(html()).getPropertyValue(c));
		screen.unmount();

		for (const name of KIT_STYLE_NAMES) {
			const s = render(Colours, { look: { style: name } });
			await expect.poll(() => html().dataset.kitStyle).toBe(name);
			expect(colours.map((c) => getComputedStyle(html()).getPropertyValue(c))).toEqual(before);
			s.unmount();
		}
	});

	it('keeps a subtree’s own radius, and the app’s own face', async () => {
		render(Colours, {
			look: { style: 'formal' },
			appCss: `.site { --radius: 1rem; } :root { --kit-font-sans: 'App Face', sans-serif; }`
		});
		await expect.poll(() => html().dataset.kitStyle).toBe('formal');

		// Formal's 0.25rem outside, the subtree's 1rem inside: each minus the button's 2px.
		expect(style('plain').borderTopLeftRadius).toBe('2px');
		expect(style('scoped').borderTopLeftRadius).toBe('14px');
		expect(getComputedStyle(document.body).fontFamily).toMatch(/^"App Face"/);
	});

	it('draws a button exactly as before when no style is set', async () => {
		render(Colours, { look: {} });
		await expect.poll(() => html().dataset.kitStyle).toBe('default');

		const button = style('plain');
		expect(button.height).toBe('36px');
		expect(button.borderTopLeftRadius).toBe('6px');
		expect(button.fontSize).toBe('14px');
		expect(button.fontWeight).toBe('500');
	});
});

describe('SingleTable layouts', () => {
	for (const name of KIT_STYLE_NAMES.filter((s) => s !== 'default')) {
		it(`draws ${name} as a description list with every row and its status`, async () => {
			const screen = render(SingleTable, { singleTable: rows, kitStyle: name });

			const list = screen.container.querySelector(`dl[data-layout="${name}"]`);
			expect(list).not.toBeNull();
			expect(list?.querySelectorAll('dt').length).toBe(2);
			await expect.element(page.getByText('Jane Doe')).toBeInTheDocument();
			await expect.element(page.getByText('Active')).toBeInTheDocument();
		});
	}
});
