<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Button } from '$lib/components/ui/button/index';
	import { Download, Grid3x3, Printer } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import { page } from '$app/state';
	import Papa from 'papaparse';
	import { localClock, localDate } from '$lib/time';

	// Accept parameters directly from the parent Mega Component
	const {
		fileName = page.url.pathname.split('/').pop() || 'export',
		table
	}: { fileName: string; table: any } = $props();

	/**
	 * Extracts clean data rows out of TanStack Table's internal memory state machine.
	 * Completely isolates cell data values while bypassing UI components.
	 */
	/**
	 * A date as text a spreadsheet reads: `2026-09-30`, with the local time after it when there is
	 * one. Left to the number branch below, a `Date` is its millisecond count and was exported as
	 * `1,790,750,145,285.00`.
	 */
	function exportDate(value: Date): string {
		if (Number.isNaN(value.getTime())) return '';

		// A `date` column comes back as midnight UTC: the day is the value, and there is no time.
		if (value.getTime() % 86_400_000 === 0) return value.toISOString().slice(0, 10);

		const clock = localClock(value);
		return clock === '00:00' ? localDate(value) : `${localDate(value)} ${clock}`;
	}

	function getTableData() {
		if (!table) {
			console.error('TanStack table instance was not provided to the export component.');
			return null;
		}

		// 1. Map Headers (Ignore layout indices, selection toggles, and trailing actions)
		const headerGroups = table.getHeaderGroups();
		const headers: string[] = [];
		const validColumnIds: string[] = [];

		headerGroups.forEach((headerGroup: any) => {
			headerGroup.headers.forEach((header: any) => {
				const id = header.id.toLowerCase();
				if (id === 'index' || id === 'actions' || id.includes('select')) {
					return;
				}
				validColumnIds.push(header.id);

				const headerText =
					typeof header.column.columnDef.header === 'string'
						? header.column.columnDef.header
						: header.id;

				// Standard CamelCase to Header Title spacing mutations
				const cleanHeader = headerText
					.replace(/([A-Z])/g, ' $1')
					.replace(/^./, (str: string) => str.toUpperCase());
				headers.push(cleanHeader.trim());
			});
		});

		// 2. Map Row Data matrices
		// Every row the table holds, filtered and sorted as on screen, not only the page in view:
		// in client mode the browser has the whole list, and `getRowModel()` exported twenty rows
		// of two hundred. In server mode the page is all there is, so this is that page.
		const rowModel = table.getPrePaginationRowModel();
		const rows: string[][] = rowModel.rows.map((row: any) => {
			return validColumnIds.map((columnId) => {
				const cell = row.getAllCells().find((c: any) => c.column.id === columnId);
				if (!cell) return '';

				let value = cell.renderValue();

				if (value instanceof Date) return exportDate(value);

				// Handle complex fallback payloads gracefully
				if (typeof value === 'object' && value !== null) {
					value = row.original[columnId] ?? '';
				}

				if (value === undefined || value === null) {
					return '';
				}

				// --- FINANCIAL LEDGER FLOAT FORMATTER ---
				const num = Number(value);
				if (!isNaN(num) && typeof value !== 'boolean' && String(value).trim() !== '') {
					// Bypasses phone numbers, TIN numbers, national IDs, and zip codes
					const lowerKey = columnId.toLowerCase();
					const isIdentifier =
						lowerKey.includes('phone') ||
						lowerKey.includes('tin') ||
						lowerKey.includes('id') ||
						lowerKey.includes('code') ||
						lowerKey.includes('number') ||
						lowerKey.includes('index');

					if (isIdentifier) {
						return String(value).trim(); // Keep raw text format intact
					}

					// Otherwise, format as a standard financial ledger string: 6,000.00
					return num.toLocaleString('en-US', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					});
				}
				// ----------------------------------------

				return String(value).trim();
			});
		});

		return { headers, rows };
	}

	/** Escape user data so raw values can never break the print markup. */
	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/** Cells that look like formatted numbers get right-aligned, like a ledger. */
	function isNumericCell(value: string): boolean {
		return /^-?[\d,]+(\.\d+)?$/.test(value) && value !== '';
	}

	/**
	 * Prints the table via a hidden iframe.
	 * The browser's own layout engine handles column wrapping, page breaks,
	 * and repeating <thead> on every page — which scales to any column count.
	 */
	function printTable() {
		const parsed = getTableData();
		if (!parsed) return;

		const columnCount = parsed.headers.length;

		// Scalable blueprint sizing values, mirroring the old PDF tiers
		let pageSize = 'A4 portrait';
		let fontSize = 10;
		let cellPadding = 5;

		if (columnCount > 25) {
			pageSize = 'A3 landscape';
			fontSize = 7;
			cellPadding = 3;
		} else if (columnCount > 15) {
			pageSize = 'A3 landscape'; // Ideal layout for wide payroll structures
			fontSize = 8;
			cellPadding = 4;
		} else if (columnCount > 8) {
			pageSize = 'A4 landscape';
			fontSize = 9;
			cellPadding = 4;
		}

		const headHtml = parsed.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');

		const bodyHtml = parsed.rows
			.map(
				(row) =>
					`<tr>${row
						.map((cell) => {
							const safe = escapeHtml(cell);
							return isNumericCell(cell) ? `<td class="num">${safe}</td>` : `<td>${safe}</td>`;
						})
						.join('')}</tr>`
			)
			.join('');

		const printedAt = new Date().toLocaleString();

		const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(fileName)}</title>
<style>
	@page {
		size: ${pageSize};
		margin: 12mm 10mm;
	}
	* { box-sizing: border-box; }
	html, body {
		margin: 0;
		padding: 0;
		font-family: Helvetica, Arial, 'Noto Sans Ethiopic', 'Nyala', 'Kefa', 'Abyssinica SIL', sans-serif;
		color: #0f172a;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
	.report-title {
		font-size: ${fontSize + 4}px;
		font-weight: 700;
		margin: 0 0 2px 0;
		text-transform: capitalize;
	}
	.report-meta {
		font-size: ${Math.max(fontSize - 2, 6)}px;
		color: #64748b;
		margin: 0 0 8px 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: ${fontSize}px;
		table-layout: auto;
	}
	/* Repeats the header row automatically on every printed page */
	thead { display: table-header-group; }
	th {
		background: #1e293b; /* Dark Slate matching ERP structures */
		color: #ffffff;
		font-weight: 700;
		text-align: left;
		padding: ${cellPadding + 1}px ${cellPadding}px;
		border: 0.5px solid #334155;
		vertical-align: middle;
	}
	td {
		padding: ${cellPadding}px;
		border: 0.5px solid #e2e8f0;
		vertical-align: middle;
		word-break: break-word;
		overflow-wrap: anywhere; /* Continuous textual wraps inside narrow grids */
	}
	td.num {
		text-align: right;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	tbody tr:nth-child(even) td { background: #f8fafc; }
	tr { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>
	<h1 class="report-title">${escapeHtml(fileName.replace(/[-_]/g, ' '))}</h1>
	<p class="report-meta">${escapeHtml(L.tablePrinted(printedAt, parsed.rows.length))}</p>
	<table>
		<thead><tr>${headHtml}</tr></thead>
		<tbody>${bodyHtml}</tbody>
	</table>
</body>
</html>`;

		// Hidden iframe: no popup blockers, no navigation away, app state untouched
		const iframe = document.createElement('iframe');
		iframe.style.position = 'fixed';
		iframe.style.right = '0';
		iframe.style.bottom = '0';
		iframe.style.width = '0';
		iframe.style.height = '0';
		iframe.style.border = '0';
		iframe.setAttribute('aria-hidden', 'true');
		document.body.appendChild(iframe);

		const cleanup = () => {
			// Delay removal so the print dialog fully detaches from the frame
			setTimeout(() => iframe.remove(), 1000);
		};

		iframe.onload = () => {
			const frameWindow = iframe.contentWindow;
			if (!frameWindow) {
				cleanup();
				return;
			}
			frameWindow.onafterprint = cleanup;
			// Give the frame one paint frame so huge tables finish layout first
			requestAnimationFrame(() => {
				frameWindow.focus();
				frameWindow.print();
				// Fallback for browsers that never fire onafterprint
				setTimeout(cleanup, 60000);
			});
		};

		const frameDoc = iframe.contentWindow?.document;
		if (!frameDoc) {
			iframe.remove();
			console.error('Unable to access print frame document.');
			return;
		}
		frameDoc.open();
		frameDoc.write(html);
		frameDoc.close();
	}

	/**
	 * Cells a spreadsheet would run as a formula, which get a leading apostrophe so they open as
	 * text: a customer named `=HYPERLINK(…)` is data, not an instruction. A negative amount is the
	 * one thing that starts with `-` and must stay a number.
	 */
	const FORMULA = /^[=+@\t\r]|^-(?!\d[\d,]*(\.\d+)?$)/;

	function exportTableToCSV() {
		const parsed = getTableData();
		if (!parsed) return;

		const csvData = [parsed.headers, ...parsed.rows];
		const csv = Papa.unparse(csvData, { escapeFormulae: FORMULA });

		// The byte-order mark is what tells Excel the file is UTF-8; without it Amharic opens as
		// mojibake.
		const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = `${fileName}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	const L = useLabels();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="ml-auto">
				<Download class="size-5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item class="capitalize">
			<Button variant="default" class="w-full justify-start gap-2" onclick={printTable}>
				<Printer class="size-4 text-white dark:text-black" />
				{L.tablePrint}
			</Button>
		</DropdownMenu.Item>
		<DropdownMenu.Item class="capitalize">
			<Button variant="default" class="w-full justify-start gap-2" onclick={exportTableToCSV}>
				<Grid3x3 class="size-4 text-white dark:text-black" />
				{L.tableExportCsv}
			</Button>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
