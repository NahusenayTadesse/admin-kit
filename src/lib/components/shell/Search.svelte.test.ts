import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Kit } from '$lib/context';
import Search from './Search.svelte';

const kit: Kit = {
	permList: [],
	access: undefined,
	navigation: [],
	searchExtra: [
		{ label: 'Employees', url: '/dashboard/employees' },
		{ label: 'Suppliers', url: '/dashboard/suppliers' }
	],
	entities: {},
	canOpen: () => true
};

/** Where a followed link would have gone — caught, so the test page itself does not leave. */
let followed: string[] = [];
const catchLinks = (event: MouseEvent) => {
	const link = (event.target as Element).closest('a');
	if (!link) return;
	event.preventDefault();
	followed.push(link.getAttribute('href') ?? '');
};

describe('shell/Search.svelte', () => {
	afterEach(() => {
		document.removeEventListener('click', catchLinks);
		followed = [];
	});

	/*
	 * Each result used to be a link nested inside the palette's item. Enter clicks the highlighted
	 * *item*, which was the wrapper around the link, so choosing a page from the keyboard did
	 * nothing at all.
	 */
	it('opens the highlighted page on Enter', async () => {
		document.addEventListener('click', catchLinks);
		render(Search, { context: new Map([[Symbol.for('admin-kit'), kit]]) });

		await userEvent.click(page.getByRole('button'));
		await userEvent.fill(page.getByRole('combobox'), 'Supp');
		await userEvent.keyboard('{Enter}');

		await expect.poll(() => followed).toEqual(['/dashboard/suppliers']);
	});
});
