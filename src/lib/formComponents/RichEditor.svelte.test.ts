import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RichEditor from './RichEditor.svelte';

describe('RichEditor.svelte', () => {
	const posted = (container: Element) =>
		container.querySelector<HTMLInputElement>('input[type=hidden][name="body"]')?.value;

	it('posts the starting HTML through a hidden field', async () => {
		const screen = render(RichEditor, { name: 'body', value: '<p>Hello</p>' });
		await expect.element(page.getByText('Hello')).toBeInTheDocument();
		expect(posted(screen.container)).toBe('<p>Hello</p>');
	});

	it('posts what is typed, and nothing at all once it is emptied', async () => {
		const screen = render(RichEditor, { name: 'body', value: '' });
		const area = screen.container.querySelector<HTMLElement>('.ProseMirror')!;

		await userEvent.click(area);
		await userEvent.keyboard('Draft');
		await expect.poll(() => posted(screen.container)).toBe('<p>Draft</p>');

		await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
		// An emptied editor still holds <p></p>; it must post as nothing.
		await expect.poll(() => posted(screen.container)).toBe('');
	});

	it('shows the image button only when there is somewhere to upload to', async () => {
		render(RichEditor, { name: 'body' });
		await expect.element(page.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Insert image' }).elements()).toHaveLength(0);
	});
});
