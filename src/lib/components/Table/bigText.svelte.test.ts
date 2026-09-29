import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BigText from './bigText.svelte';

describe('bigText.svelte', () => {
	it('shows short text as-is, with nothing to click', async () => {
		render(BigText, { text: 'Short text' });

		await expect.element(page.getByText('Short text', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
	});

	it('shortens long text to 15 characters by default, behind a button that says it opens', async () => {
		render(BigText, { text: 'This is a very long piece of text' });

		const button = page.getByRole('button', { name: /Show all/ });
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).toHaveTextContent(/^\s*This is a very\s*…\s*Show all\s*$/);
		await expect.element(button).toHaveAttribute('title', 'Show all');
	});

	it('takes another length', async () => {
		render(BigText, { text: 'This is a very long piece of text', max: 25 });

		await expect
			.element(page.getByRole('button'))
			.toHaveTextContent(/^\s*This is a very long piece\s*…\s*Show all\s*$/);
	});

	it('never cuts a Ge’ez letter in half', async () => {
		render(BigText, { text: 'የተበላሸ ሲሚንቶ በዝናብ ምክንያት', max: 5 });

		await expect
			.element(page.getByRole('button'))
			.toHaveTextContent(/^\s*የተበላሸ\s*…\s*Show all\s*$/);
	});

	it('reveals the full text in a popover when clicked', async () => {
		const longText = 'This is a very long piece of text';
		render(BigText, { text: longText });

		await userEvent.click(page.getByRole('button', { name: /Show all/ }));

		await expect.element(page.getByText(longText, { exact: true })).toBeInTheDocument();
	});

	it('renders nothing for no text', async () => {
		const { container } = render(BigText, { text: null });

		expect(container.textContent?.trim()).toBe('');
	});
});
