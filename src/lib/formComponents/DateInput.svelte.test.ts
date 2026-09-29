import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DateInput from './DateInput.svelte';

/**
 * The date input as a person uses it: Ethiopian by default, switchable, typed or clicked — and
 * the form only ever gets a Gregorian date.
 */
describe('DateInput.svelte', () => {
	beforeEach(() => localStorage.clear());

	const posted = () => document.querySelector<HTMLInputElement>('input[type=hidden][name=from]')!;

	it('shows the date on both calendars and posts it in Gregorian', async () => {
		render(DateInput, { name: 'from', value: '2026-09-29' });

		await expect.element(page.getByText(/19.*መስከረም.*2019/)).toBeInTheDocument();
		await expect.element(page.getByText(/29 Sept 2026/)).toBeInTheDocument();
		expect(posted().value).toBe('2026-09-29');
	});

	it('takes a day typed on the Ethiopian calendar and posts the Gregorian one', async () => {
		render(DateInput, { name: 'from', value: '2026-09-29' });
		await page.getByRole('button', { name: /መስከረም/ }).click();

		await page.getByLabelText('Day', { exact: true }).fill('1');
		// 1 መስከረም 2019 is 11 September 2026.
		await expect.poll(() => posted().value).toBe('2026-09-11');
		await expect.element(page.getByText(/= 11 September 2026 \(G\.C\.\)/)).toBeInTheDocument();
	});

	it('switches calendar without changing the date, and refuses days that do not exist', async () => {
		render(DateInput, { name: 'from', value: '2026-09-11' });
		await page.getByRole('button', { name: /መስከረም/ }).click();

		await page.getByRole('button', { name: 'G.C.' }).click();
		await expect.element(page.getByLabelText('Day', { exact: true })).toHaveValue(11);
		await expect.element(page.getByLabelText('Year', { exact: true })).toHaveValue(2026);
		expect(posted().value).toBe('2026-09-11');

		// There is no 31 September: refused, and the posted date stays as it was.
		await page.getByLabelText('Day', { exact: true }).fill('31');
		await expect.element(page.getByText('There is no such day in that month.')).toBeInTheDocument();
		expect(posted().value).toBe('2026-09-11');

		// The choice is remembered for the next date input.
		expect(localStorage.getItem('admin-kit.calendar')).toBe('gregorian');
	});

	it('draws Pagume, the thirteenth month, and a day clicked in it posts in Gregorian', async () => {
		// 3 ጳጉሜ 2018 is 8 September 2026.
		render(DateInput, { name: 'from', value: '2026-09-08' });
		await page.getByRole('button', { name: /ጳጉሜ/ }).click();
		// The choice is shared by every date input on the page; this one is about the Ethiopian grid.
		await page.getByRole('button', { name: 'E.C.' }).click();
		await expect.element(page.getByText(/ጳጉሜ.*2018/).first()).toBeInTheDocument();

		// Pagume 2018 has five days; the fifth is 10 September 2026.
		document.querySelector<HTMLElement>('[data-bits-day][data-value="2026-09-10"]')!.click();
		await expect.poll(() => posted().value).toBe('2026-09-10');
		// And no sixth day in it: the grid goes on into the new year.
		expect(
			document
				.querySelector('[data-bits-day][data-value="2026-09-11"]')
				?.hasAttribute('data-outside-month')
		).toBe(true);
	});

	it('can be left empty, and then posts nothing', async () => {
		render(DateInput, { name: 'from', value: '' });
		expect(posted().value).toBe('');
	});
});
