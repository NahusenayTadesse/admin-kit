import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { writable } from 'svelte/store';
import type { ComponentProps } from 'svelte';
import { removeFileField } from '$lib/files';
import LookupFields from './LookupFields.svelte';
import type { LookupField } from './types';

type Props = ComponentProps<typeof LookupFields>;

/* Plain stores stand in for superforms' own, which the component only reads and writes. */
const stores = () => ({
	form: writable<Record<string, unknown>>({ logo: undefined }) as unknown as Props['form'],
	errors: writable<Record<string, unknown>>({}) as unknown as Props['errors']
});

describe('LookupFields.svelte — image fields', () => {
	const logo: LookupField = { name: 'logo', label: 'Logo', type: 'image' };

	it('offers images only when adding', async () => {
		const screen = render(LookupFields, { fields: [logo], entity: 'Brand', ...stores() });
		const input = screen.container.querySelector<HTMLInputElement>('input[type=file]');
		expect(input?.accept).toBe('image/*');
	});

	/*
	 * The ✕ is the only way from the stored image back to the picker. 0.1.24 hid it on a required
	 * image, which left the logo impossible to change; clearing must reopen the picker, but post
	 * no removal, since the column cannot be empty.
	 */
	it('lets a required image be replaced: clearing reopens the picker and removes nothing', async () => {
		const screen = render(LookupFields, {
			fields: [logo],
			entity: 'Brand',
			stored: { id: 1, logo: 'stored-logo.webp' },
			...stores()
		});
		await expect.element(page.getByText('stored-logo.webp')).toBeInTheDocument();

		await userEvent.click(page.getByRole('button', { name: 'Clear' }));

		await expect.element(page.getByText('Click to upload or drag and drop')).toBeInTheDocument();
		expect(screen.container.querySelector(`input[name="${removeFileField('logo')}"]`)).toBeNull();
	});

	it('takes an optional one off when it is cleared', async () => {
		const screen = render(LookupFields, {
			fields: [{ ...logo, required: false }],
			entity: 'Brand',
			stored: { id: 1, logo: 'stored-logo.webp' },
			...stores()
		});

		await userEvent.click(page.getByRole('button', { name: 'Clear' }));

		await expect
			.poll(
				() =>
					screen.container.querySelector<HTMLInputElement>(
						`input[name="${removeFileField('logo')}"]`
					)?.value
			)
			.toBe('1');
	});
});
