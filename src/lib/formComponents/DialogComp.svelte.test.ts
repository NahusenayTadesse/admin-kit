import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import DialogComp from './DialogComp.svelte';

function textSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<p>${text}</p>`
	}));
}

describe('DialogComp.svelte', () => {
	it('renders a trigger button with the title, closed by default', async () => {
		render(DialogComp, {
			title: 'Delete',
			variant: 'destructive',
			children: textSnippet('Are you sure?')
		});

		await expect.element(page.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('opens the dialog and shows the title and children when the trigger is clicked', async () => {
		render(DialogComp, {
			title: 'Edit Item',
			variant: 'default',
			children: textSnippet('Form goes here')
		});

		await userEvent.click(page.getByRole('button', { name: 'Edit Item' }));

		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Edit Item' })).toBeInTheDocument();
		await expect.element(page.getByText('Form goes here')).toBeInTheDocument();
	});

	it('renders a description when provided', async () => {
		render(DialogComp, {
			title: 'Edit Item',
			description: 'Update the details below',
			variant: 'default',
			children: textSnippet('Form goes here')
		});

		await userEvent.click(page.getByRole('button', { name: 'Edit Item' }));

		await expect.element(page.getByText('Update the details below')).toBeInTheDocument();
	});

	it('is open by default when bind:open is initialised to true', async () => {
		render(DialogComp, {
			title: 'Already Open',
			variant: 'default',
			open: true,
			children: textSnippet('Visible immediately')
		});

		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await expect.element(page.getByText('Visible immediately')).toBeInTheDocument();
	});

	it('closes when the dialog is dismissed (Escape key)', async () => {
		render(DialogComp, {
			title: 'Closable',
			variant: 'default',
			open: true,
			children: textSnippet('content')
		});

		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	/*
	 * The trigger's props are spread onto the button last, so a class written on the button was
	 * replaced: `triggerClass` never arrived, and the button kept `w-auto`, which a flex column
	 * stretches to its full width.
	 */
	it('sizes the trigger to its label and passes triggerClass through', async () => {
		render(DialogComp, {
			title: 'Add New Item',
			variant: 'default',
			triggerClass: 'ml-auto',
			children: textSnippet('Form')
		});

		const button = page.getByRole('button', { name: 'Add New Item' }).element();
		expect(button.classList).toContain('w-fit');
		expect(button.classList).toContain('ml-auto');
		expect(button.classList).not.toContain('w-auto');
	});
});
