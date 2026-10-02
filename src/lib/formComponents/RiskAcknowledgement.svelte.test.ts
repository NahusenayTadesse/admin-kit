import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RiskAcknowledgement from './RiskAcknowledgement.svelte';

describe('RiskAcknowledgement.svelte', () => {
	it('asks the user to accept the risk, in money terms by default', async () => {
		render(RiskAcknowledgement, { show: true, message: 'The balance would go negative.' });

		await expect.element(page.getByText('I understand the risks')).toBeInTheDocument();
	});

	it('says what the caller needs ticked instead, when it is not a money risk', async () => {
		render(RiskAcknowledgement, {
			show: true,
			title: 'Allergy on the chart',
			confirmLabel: 'I have checked, and prescribe it anyway'
		});

		await expect
			.element(page.getByText('I have checked, and prescribe it anyway'))
			.toBeInTheDocument();
		await expect.element(page.getByText('I understand the risks')).not.toBeInTheDocument();
	});
});
