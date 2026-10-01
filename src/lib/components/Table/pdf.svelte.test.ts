import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ComponentProps } from 'svelte';
import type { ColumnDef } from '@tanstack/table-core';
import DataTable from './data-table.svelte';
import Pdf from './pdf.svelte';

// A minimal stand-in for a TanStack table instance — enough to mount the menu without a table.
const fakeTable = {
	getHeaderGroups: () => [],
	getPrePaginationRowModel: () => ({ rows: [] })
};

describe('Table/pdf.svelte', () => {
	it('renders a download trigger button', async () => {
		render(Pdf, { fileName: 'Report', table: fakeTable });

		await expect.element(page.getByRole('button')).toBeInTheDocument();
	});

	it('offers Print and Export to CSV once opened', async () => {
		render(Pdf, { fileName: 'Report', table: fakeTable });

		await userEvent.click(page.getByRole('button'));

		await expect.element(page.getByText('Print')).toBeInTheDocument();
		await expect.element(page.getByText('Export to CSV')).toBeInTheDocument();
	});
});

/*
 * The export itself, through a real table. The download is caught rather than made: the blob the
 * component builds is what a person would open, so that is what is read back.
 */
describe('CSV export', () => {
	type Sale = { id: number; customer: string; amount: number; soldOn: Date };

	const saleColumns: ColumnDef<Sale, unknown>[] = [
		{ accessorKey: 'customer', header: 'Customer' },
		{ accessorKey: 'amount', header: 'Amount' },
		{ accessorKey: 'soldOn', header: 'Sold on' }
	];

	const sales: Sale[] = Array.from({ length: 25 }, (_, i) => ({
		id: i + 1,
		customer: `Customer ${i + 1}`,
		amount: (i + 1) * 10,
		soldOn: new Date('2026-09-30T00:00:00Z')
	}));

	afterEach(() => vi.restoreAllMocks());

	async function exported(data: Sale[]) {
		let blob: Blob | undefined;
		vi.spyOn(URL, 'createObjectURL').mockImplementation((made) => {
			blob = made as Blob;
			return 'blob:test';
		});
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		const screen = render(DataTable, {
			data,
			columns: saleColumns,
			defaultPageSize: 10
		} as ComponentProps<typeof DataTable>);

		// The export trigger is icon-only, so it is found by its icon.
		(
			screen.container.querySelector('button:has(svg.lucide-download)') as HTMLButtonElement
		).click();
		await userEvent.click(page.getByText('Export to CSV'));

		await expect.poll(() => blob).toBeDefined();
		const bytes = new Uint8Array(await blob!.arrayBuffer());
		return { bytes, lines: (await blob!.text()).split('\r\n') };
	}

	it('exports every row, not only the page on screen', async () => {
		const { lines } = await exported(sales);

		// Ten rows are on screen; the file has all twenty-five, under one header row.
		expect(lines).toHaveLength(26);
		expect(lines[0]).toBe('Customer,Amount,Sold on');
		expect(lines[25]).toContain('Customer 25');
	});

	it('starts with a byte-order mark, so Excel reads Amharic as UTF-8', async () => {
		const { bytes } = await exported(sales);

		expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
	});

	it('writes a date as a date, not as its millisecond count', async () => {
		const { lines } = await exported(sales.slice(0, 1));

		expect(lines[1]).toBe('Customer 1,10.00,2026-09-30');
	});

	it('defuses a cell a spreadsheet would run as a formula, and leaves a negative amount alone', async () => {
		const { lines } = await exported([
			{ id: 1, customer: '=HYPERLINK("http://evil.example")', amount: -50, soldOn: sales[0].soldOn }
		]);

		expect(lines[1].startsWith(`"'=HYPERLINK`)).toBe(true);
		expect(lines[1]).toContain(',-50.00,');
	});
});
