import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { writable, get } from 'svelte/store';
import ImageSelect from './ImageSelect.svelte';
import InputComp from './InputComp.svelte';

const items = [
	{ value: 1, name: 'Basic', image: 'basic.webp', meta: '500 Br' },
	{ value: 2, name: 'Standard', image: 'https://example.com/standard.png' },
	{ value: 3, name: 'Premium', description: 'Everything included' }
];

describe('ImageSelect.svelte', () => {
	it('draws each item as a card, with its picture, price and description', async () => {
		const screen = render(ImageSelect, { items, name: 'package' });

		await expect.element(page.getByText('500 Br')).toBeInTheDocument();
		await expect.element(page.getByText('Everything included')).toBeInTheDocument();

		const srcs = [...screen.container.querySelectorAll('img')].map((img) =>
			img.getAttribute('src')
		);
		// A stored name goes through `fileUrl`, as on `FileUpload`; a URL is left as it is.
		expect(srcs).toEqual(['/dashboard/files/basic.webp', 'https://example.com/standard.png']);
	});

	it('is a radio group when single, and keeps the value a number', async () => {
		const screen = render(ImageSelect, { items, name: 'package', value: null });

		await expect.element(page.getByRole('radiogroup')).toBeInTheDocument();
		await userEvent.click(page.getByText('Standard'));
		await expect.element(page.getByRole('radio', { name: /Standard/ })).toBeChecked();

		await userEvent.click(page.getByText('Premium'));
		await expect.element(page.getByRole('radio', { name: /Standard/ })).not.toBeChecked();
		await expect.element(page.getByRole('radio', { name: /Premium/ })).toBeChecked();

		const form = screen.container.querySelectorAll<HTMLInputElement>('input[name="package"]');
		expect(form).toHaveLength(3);
	});

	it('is a checklist when multiple, and adds and removes values', async () => {
		render(ImageSelect, { items, name: 'extras', multiple: true, value: [3] });

		await expect.element(page.getByRole('checkbox', { name: /Premium/ })).toBeChecked();
		await userEvent.click(page.getByText('Basic'));
		await expect.element(page.getByRole('checkbox', { name: /Basic/ })).toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: /Premium/ })).toBeChecked();

		await userEvent.click(page.getByText('Premium'));
		await expect.element(page.getByRole('checkbox', { name: /Premium/ })).not.toBeChecked();
	});

	it('finds a value the form loaded as a string', async () => {
		render(ImageSelect, { items, name: 'package', value: '2' });

		await expect.element(page.getByRole('radio', { name: /Standard/ })).toBeChecked();
	});

	it('will not pick a disabled item', async () => {
		render(ImageSelect, {
			items: [...items, { value: 4, name: 'Sold out', disabled: true }],
			name: 'package'
		});

		await expect.element(page.getByRole('radio', { name: /Sold out/ })).toBeDisabled();
	});
});

describe('InputComp type="imageSelect"', () => {
	it('writes the chosen value to the form store, named by the field label', async () => {
		const form = writable<Record<string, unknown>>({ package: null });
		const errors = writable<Record<string, unknown>>({});

		render(InputComp, {
			label: 'Package',
			form,
			errors,
			type: 'imageSelect',
			name: 'package',
			items
		});

		await expect.element(page.getByRole('radiogroup', { name: 'Package' })).toBeInTheDocument();
		await userEvent.click(page.getByText('Premium'));
		expect(get(form).package).toBe(3);
	});

	it('writes an array for imageSelectMultiple, and marks the group invalid', async () => {
		const form = writable<Record<string, unknown>>({ extras: [] });
		const errors = writable<Record<string, unknown>>({ extras: { _errors: ['Pick one'] } });

		render(InputComp, {
			label: 'Extras',
			form,
			errors,
			type: 'imageSelectMultiple',
			name: 'extras',
			items
		});

		const group = page.getByRole('group', { name: 'Extras' });
		await expect.element(group).toHaveAttribute('aria-invalid', 'true');

		await userEvent.click(page.getByText('Standard'));
		await userEvent.click(page.getByText('Basic'));
		// In the list's order, not the order clicked.
		expect(get(form).extras).toEqual([1, 2]);
	});
});
