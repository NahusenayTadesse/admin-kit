import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PageHeader from './PageHeader.svelte';
import Notice from './Notice.svelte';
import ConfirmAction from './ConfirmAction.svelte';
import { createRawSnippet } from 'svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('PageHeader', () => {
	it('titles the page and the browser tab, with its line and its buttons', async () => {
		render(PageHeader, {
			title: 'Customers',
			eyebrow: 'Sales',
			description: 'Who buys on credit.',
			actions: text('New customer')
		});

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Customers');
		await expect.element(page.getByText('Sales')).toBeInTheDocument();
		await expect.element(page.getByText('Who buys on credit.')).toBeInTheDocument();
		await expect.element(page.getByText('New customer')).toBeInTheDocument();
		expect(document.title).toBe('Customers');
	});
});

describe('Notice', () => {
	it('is an alert when it is a refusal, a status otherwise', async () => {
		render(Notice, { tone: 'danger', title: 'Not posted.', children: text(' Stock is short.') });
		await expect.element(page.getByRole('alert')).toHaveTextContent('Not posted. Stock is short.');
	});

	it('shows its buttons', async () => {
		render(Notice, { tone: 'warning', children: text('Waiting'), actions: text('Withdraw') });
		await expect.element(page.getByRole('status')).toHaveTextContent('Waiting');
		await expect.element(page.getByText('Withdraw')).toBeInTheDocument();
	});
});

describe('ConfirmAction', () => {
	it('asks before posting, with the hidden fields in its form', async () => {
		render(ConfirmAction, {
			action: '?/post',
			label: 'Post',
			title: 'Post this receipt?',
			description: 'Stock changes now.',
			fields: { id: 7 }
		});

		await page.getByRole('button', { name: 'Post' }).click();
		await expect.element(page.getByText('Post this receipt?')).toBeInTheDocument();
		await expect.element(page.getByText('Stock changes now.')).toBeInTheDocument();
		const form = document.querySelector<HTMLFormElement>('form[action="?/post"]')!;
		expect(form.querySelector<HTMLInputElement>('input[name=id]')!.value).toBe('7');
	});
});
