import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './kit-style-harness.test.svelte';
import SingleTable from './SingleTable.svelte';
import { KIT_STYLE_NAMES } from '$lib/kitStyle';

const rows = [
	{ name: 'Name', value: 'Jane Doe' },
	{ name: 'Status', value: 'active', kind: 'status' as const, label: 'Active' }
];

describe('KitStyle.svelte', () => {
	it('wraps its content in the look’s attributes and gives it the style’s layout', async () => {
		const screen = render(Harness, { look: { style: 'sharp', accent: 'teal' } });

		const wrapper = screen.container.querySelector('[data-kit-style]');
		expect(wrapper?.getAttribute('data-kit-style')).toBe('sharp');
		expect(wrapper?.getAttribute('data-kit-accent')).toBe('teal');
		expect(screen.container.querySelector('[data-layout="sharp"]')).not.toBeNull();
		await expect.element(page.getByText('Jane Doe')).toBeInTheDocument();
	});

	it('copies the look onto <html>, and takes it back when it leaves', async () => {
		const screen = render(Harness, { look: { style: 'formal', radius: 'sm' } });

		await expect.poll(() => document.documentElement.dataset.kitStyle).toBe('formal');
		expect(document.documentElement.dataset.kitRadius).toBe('sm');

		screen.unmount();
		expect(document.documentElement.dataset.kitStyle).toBeUndefined();
		expect(document.documentElement.dataset.kitRadius).toBeUndefined();
	});

	it('leaves <html> alone with global={false}', async () => {
		render(Harness, { look: { style: 'bold' }, global: false });

		await expect.element(page.getByText('Jane Doe')).toBeInTheDocument();
		expect(document.documentElement.dataset.kitStyle).toBeUndefined();
	});

	it('draws the default layout outside any KitStyle', async () => {
		const screen = render(SingleTable, { singleTable: rows });

		expect(screen.container.querySelector('table')).not.toBeNull();
		expect(screen.container.querySelector('[data-layout]')).toBeNull();
	});
});

describe('SingleTable layouts', () => {
	for (const style of KIT_STYLE_NAMES.filter((s) => s !== 'default')) {
		it(`draws ${style} as a description list with every row and its status`, async () => {
			const screen = render(SingleTable, { singleTable: rows, kitStyle: style });

			const list = screen.container.querySelector(`dl[data-layout="${style}"]`);
			expect(list).not.toBeNull();
			expect(list?.querySelectorAll('dt').length).toBe(2);
			await expect.element(page.getByText('Jane Doe')).toBeInTheDocument();
			await expect.element(page.getByText('Active')).toBeInTheDocument();
		});
	}
});
