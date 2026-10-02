import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { writable } from 'svelte/store';
import LookupFields from './LookupFields.svelte';
import type { LookupField } from './types';

const stores = () => ({
	form: writable<Record<string, unknown>>({ logo: undefined }),
	errors: writable<Record<string, unknown>>({})
});

describe('LookupFields.svelte — image fields', () => {
	const logo: LookupField = { name: 'logo', label: 'Logo', type: 'image' };

	it('offers images only when adding', async () => {
		const screen = render(LookupFields, { fields: [logo], entity: 'Brand', ...stores() });
		const input = screen.container.querySelector<HTMLInputElement>('input[type=file]');
		expect(input?.accept).toBe('image/*');
	});

	/*
	 * A required image's column cannot be empty, so its ✕ could only fail the save: the stored
	 * logo can be replaced by choosing another, not taken off.
	 */
	it('previews the stored image while editing, with no way to remove a required one', async () => {
		render(LookupFields, {
			fields: [logo],
			entity: 'Brand',
			stored: { id: 1, logo: 'stored-logo.webp' },
			...stores()
		});
		await expect.element(page.getByText('stored-logo.webp')).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Clear' }).elements()).toHaveLength(0);
	});

	it('lets an optional one be removed', async () => {
		render(LookupFields, {
			fields: [{ ...logo, required: false }],
			entity: 'Brand',
			stored: { id: 1, logo: 'stored-logo.webp' },
			...stores()
		});
		await expect.element(page.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
	});
});
