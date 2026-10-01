import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { get, writable } from 'svelte/store';
import GalleryUpload from './GalleryUpload.svelte';

/** A tiny real PNG, so the browser can decode it for the preview and the compressor. */
async function png(name: string): Promise<File> {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 4;
	const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
	return new File([blob], name, { type: 'image/png' });
}

describe('GalleryUpload.svelte', () => {
	it('puts every picked image into the form field, and the ✕ takes one out', async () => {
		const form = writable<Record<string, unknown>>({ images: undefined });
		const screen = render(GalleryUpload, { form, name: 'images' });
		const input = screen.container.querySelector<HTMLInputElement>('input[type=file]')!;

		await userEvent.upload(input, [await png('a.png'), await png('b.png')]);

		await expect.element(page.getByText('2 images ready to upload')).toBeInTheDocument();
		expect(Array.from(get(form).images as FileList).map((f) => f.name)).toEqual(['a.png', 'b.png']);

		await userEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));

		await expect.element(page.getByText('1 image ready to upload')).toBeInTheDocument();
		expect(Array.from(get(form).images as FileList).map((f) => f.name)).toEqual(['b.png']);
	});

	it('leaves files that are not images out', async () => {
		const form = writable<Record<string, unknown>>({ images: undefined });
		const screen = render(GalleryUpload, { form, name: 'images' });
		const input = screen.container.querySelector<HTMLInputElement>('input[type=file]')!;

		await userEvent.upload(input, [new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' })]);

		await expect
			.poll(() => Array.from((get(form).images as FileList | undefined) ?? []).length)
			.toBe(0);
	});
});
