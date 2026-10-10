import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Statuses, { statusRole } from './statuses.svelte';

describe('statuses.svelte', () => {
	it('renders the status text in the app’s success colour for a known "good" status', async () => {
		const screen = render(Statuses, { status: 'active' });

		await expect.element(page.getByText('active')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-role="success"].bg-success')).not.toBeNull();
	});

	it('renders a known "bad" status in the app’s destructive colour', async () => {
		const screen = render(Statuses, { status: 'cancelled' });

		await expect.element(page.getByText('cancelled')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-role="danger"].bg-destructive')).not.toBeNull();
	});

	it('is case-insensitive and trims whitespace when matching', async () => {
		const screen = render(Statuses, { status: '  Active  ' });

		expect(screen.container.querySelector('[data-role="success"]')).not.toBeNull();
	});

	it('draws an unrecognised status as neutral', async () => {
		const screen = render(Statuses, { status: 'some-made-up-status' });

		await expect.element(page.getByText('some-made-up-status')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-role="neutral"]')).not.toBeNull();
	});

	it('maps every status to a role, and only the role decides the colour', () => {
		expect(statusRole('paid')).toBe('success');
		expect(statusRole('Overdue')).toBe('danger');
		expect(statusRole('pending_payment')).toBe('warning');
		expect(statusRole('sent')).toBe('info');
		expect(statusRole('draft')).toBe('neutral');
		expect(statusRole(null)).toBe('neutral');
	});

	it('draws from the app’s tokens in every style, never a fixed palette colour', async () => {
		for (const kitStyle of ['default', 'compact', 'soft', 'sharp', 'formal', 'bold'] as const) {
			const screen = render(Statuses, { status: 'overdue', kitStyle });
			const html = screen.container.innerHTML;
			expect(html).not.toMatch(/(bg|text|border)-(red|green|gray|sky|yellow|amber)-[0-9]/);
			screen.unmount();
		}
	});
});
