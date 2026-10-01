import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { writable } from 'svelte/store';
import { removeFileField } from '$lib/files';
import FileUpload from './FileUpload.svelte';

describe('FileUpload.svelte', () => {
	const removal = (container: Element) =>
		container.querySelector<HTMLInputElement>(`input[name="${removeFileField('photo')}"]`);

	it('posts nothing about removal while the stored file is left alone', async () => {
		const form = writable<Record<string, unknown>>({ photo: undefined });
		const screen = render(FileUpload, { form, name: 'photo', image: 'stored.png' });

		await expect.element(page.getByText('stored.png')).toBeInTheDocument();
		expect(removal(screen.container)).toBeNull();
	});

	/*
	 * The ✕ emptied the preview and nothing else: the form posted an empty file field, which the
	 * server reads as "keep what is stored", so the attachment came straight back.
	 */
	it('tells the server to take the stored file off when it is cleared', async () => {
		const form = writable<Record<string, unknown>>({ photo: undefined });
		const screen = render(FileUpload, { form, name: 'photo', image: 'stored.png' });

		await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

		await expect.poll(() => removal(screen.container)?.value).toBe('1');
		await expect.element(screen.getByText('stored.png')).not.toBeInTheDocument();
	});
});
