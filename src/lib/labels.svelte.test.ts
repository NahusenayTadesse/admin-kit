import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TablePagination from '$lib/components/Table/table-pagination.svelte';
import Harness from './labels-harness.test.svelte';

describe('kit labels', () => {
	it('are English when the app sets none', async () => {
		render(TablePagination, {
			page: 2,
			pageSize: 10,
			total: 45,
			onPage: () => {},
			onPageSize: () => {}
		});
		await expect.element(page.getByText('Page 2 of 5')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Next page')).toBeInTheDocument();
	});

	it("are the app's where it sets them, and English for the rest", async () => {
		render(Harness, {
			labels: {
				pagerPage: (current: string, pages: string) => `ገጽ ${current} ከ ${pages}`,
				pagerNext: 'ቀጣይ ገጽ'
			}
		});
		await expect.element(page.getByText('ገጽ 2 ከ 5')).toBeInTheDocument();
		await expect.element(page.getByLabelText('ቀጣይ ገጽ')).toBeInTheDocument();
		// Not given: still English.
		await expect.element(page.getByLabelText('Previous page')).toBeInTheDocument();
	});
});
