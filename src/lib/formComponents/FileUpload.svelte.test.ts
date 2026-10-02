import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { get, writable } from 'svelte/store';
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

	/** A noisy PNG well over the 1MB the uploader shrinks images to. */
	async function bigImage(): Promise<File> {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1400;
		const context = canvas.getContext('2d')!;
		const pixels = context.createImageData(canvas.width, canvas.height);
		for (let i = 0; i < pixels.data.length; i++) pixels.data[i] = (i * 2654435761) % 251;
		context.putImageData(pixels, 0, 0);
		const blob = await new Promise<Blob>((done) => canvas.toBlob((b) => done(b!), 'image/png'));
		return new File([blob], 'scan.png', { type: 'image/png' });
	}

	/** Drags a file onto the drop zone, the way a person does. */
	function drop(file: File) {
		const zone = page.getByText('Click to upload or drag and drop').element().closest('label')!;
		const data = new DataTransfer();
		data.items.add(file);
		zone.dispatchEvent(new DragEvent('dragover', { dataTransfer: data, bubbles: true }));
		zone.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true }));
	}

	const stored = (form: ReturnType<typeof writable<Record<string, unknown>>>) =>
		get(form).photo as File | undefined;

	it('shrinks a large image before it is sent', async () => {
		const form = writable<Record<string, unknown>>({ photo: undefined });
		render(FileUpload, { form, name: 'photo' });
		const original = await bigImage();

		drop(original);

		await expect.poll(() => stored(form)?.size, { timeout: 15_000 }).toBeLessThan(original.size);
	});

	it('sends an image exactly as chosen when compress is off — a radiograph keeps its detail', async () => {
		const form = writable<Record<string, unknown>>({ photo: undefined });
		render(FileUpload, { form, name: 'photo', compress: false });
		const original = await bigImage();

		drop(original);

		await expect.poll(() => stored(form)?.size, { timeout: 15_000 }).toBe(original.size);
	});
});
