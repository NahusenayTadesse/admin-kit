<script lang="ts" generics="TData, TValue">
	import { useLabels } from '$lib/labels';
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import Frown from '@lucide/svelte/icons/frown';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ChartColumnBig from '@lucide/svelte/icons/chart-column-big';

	import { slide } from 'svelte/transition';

	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import Pdf from './pdf.svelte';
	import TableFacet from './table-facet.svelte';
	import TableCharts from './table-charts.svelte';
	import TablePagination from './table-pagination.svelte';
	import TableDateRange from './table-date-range.svelte';
	import {
		applyFacets,
		facetsFromRows,
		gotoPage,
		selectionCount,
		setServerFacet,
		setServerPageSize,
		setServerSearch,
		setServerSort,
		type Facet,
		type ServerTable
	} from './table-state.svelte';

	/**
	 * The table: rows, per-column filters, a chart pane, and paging — in one component, in either
	 * of two modes.
	 *
	 * It replaces an arrangement of three: this table, a separate client-side facet menu, and a
	 * separate server-side filter bar. Four pages ran two of them at once, and on those pages the
	 * facet counts and the chart were computed from whichever rows the server had already
	 * paginated down to — so `/dashboard/employees` drew a chart of twenty-five people and
	 * presented it as the clinic. Two components cannot be kept honest about a number neither of
	 * them owns; one can.
	 *
	 * **Client mode** (no `server` prop) is the default and what every existing caller gets.
	 * TanStack filters, sorts and pages in memory and facets are counted off the rows.
	 *
	 * **Server mode** (`server` given) hands all of that to SQL. TanStack is told not to redo it,
	 * page moves become URL changes that `parseTableQuery` reads, and the facet tallies arrive
	 * from `facetCounts` describing the whole result set rather than the page.
	 *
	 * **Behaviour change worth knowing:** the default page size used to be `data.length`, so every
	 * table rendered every row into the DOM and the pager never appeared. It is now
	 * `defaultPageSize`. That was the point — a patient list cannot put four thousand rows on one
	 * page — but it is visible on every list in the app.
	 *
	 * Non-goal: exporting more than you can see. In server mode the PDF and CSV export the current
	 * page, because that is the only data the browser has. A whole-result export is a server
	 * endpoint, not a button on the client.
	 */
	type Props = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		/**
		 * What kind of table this is, which sets the defaults below:
		 *
		 * - `list` — a page's main list: search, columns and export, pages, and most of the screen.
		 * - `compact` — a table inside a page (a document's lines, a customer's recent sales): no
		 *   toolbar, pages of 10, as tall as its rows.
		 * - `sheet` — rows to fill in, inside a form (quantities received, counted, returned): no
		 *   toolbar and no pages, so every input is on screen and submitted.
		 * - `print` — a paper document's lines (an invoice, a voucher, a count sheet): every row, as
		 *   plain ruled lines in the page's own ink, with no frame, toolbar, scrolling or sorting.
		 *
		 * `search`, `paginate`, `height` and `defaultPageSize` still override it.
		 */
		variant?: 'list' | 'compact' | 'sheet' | 'print';
		search?: boolean;
		class?: string;
		fileName?: string;
		selected?: TData[];
		/** Rows per page in client mode, and the initial size offered in server mode. */
		defaultPageSize?: number;
		/**
		 * How tall the whole table is, as a CSS length.
		 *
		 * The body was capped at `45vh` and the page scrolled past it, so on any normal screen
		 * half the window was empty while the rows had their own little scrollbar. The table now
		 * claims a height and divides it: toolbar and pager take what they need, the rows take
		 * the rest. An inline style rather than a class because the value is a prop, and a
		 * Tailwind arbitrary class built from one is not in the stylesheet.
		 */
		height?: string;
		pageSizes?: number[];
		/**
		 * Row properties (client mode) or URL params (server mode) offered as column filters.
		 * Empty means no facets and no charts, which is what every existing caller gets.
		 */
		facetKeys?: string[];
		/** Human wording per facet key, when the de-camel-cased key is not good enough. */
		facetLabels?: Record<string, string>;
		/**
		 * Column id → URL param, for server mode only.
		 *
		 * Facets are keyed by column id everywhere else, because that is what puts a filter in the
		 * right header. The param that carries it is often spelled differently — the `department`
		 * column is filtered by `departmentId` — and only the code writing the URL needs to know.
		 * Defaults to the column id.
		 */
		facetParams?: Record<string, string>;
		/**
		 * Offer the chart panel. Requires `facetKeys`.
		 *
		 * It is a button, not a pane. Beside the table it permanently narrowed the columns to make
		 * room for something most readers were not looking at — on the employees list it clipped
		 * the status column outright. It now opens above the rows, like the filter bar, and costs
		 * nothing until it is asked for.
		 */
		charts?: boolean;
		/** Present when the load already filtered and paged. See `ServerTable`. */
		server?: ServerTable;
		/**
		 * Offer a date window in the toolbar, labelled with what it narrows — "Registered". Server
		 * mode only: it writes `dateStart`/`dateEnd`, which the load applies to its `dateColumn`.
		 */
		dateFilter?: string;
		/**
		 * Page the rows (the default). Off, every row is on screen and there is no pager: for a sheet
		 * whose cells are inputs, which a form submits only if they are all in the page.
		 */
		paginate?: boolean;
		/**
		 * Classes for a row, from its data: a tint for a row that needs attention (a count that is
		 * off, a lot that expired).
		 */
		rowClass?: (row: TData) => string | null | undefined;
		/**
		 * Labelled figures under the rows — before tax, VAT, total — each a row of its own: the
		 * label across every column but the last, the figure in the last. `strong` for the one that
		 * matters (the total). For one figure per column, give the columns a `footer` instead.
		 */
		summary?: { label: string; value: string; strong?: boolean }[];
	};

	let {
		data,
		columns,
		variant = 'list',
		search = undefined,
		class: className = '',
		fileName = 'File',
		selected = $bindable(),
		defaultPageSize = undefined,
		height = undefined,
		pageSizes = [10, 20, 50, 100],
		facetKeys = [],
		facetLabels = {},
		facetParams = {},
		charts = false,
		server,
		dateFilter,
		paginate = undefined,
		rowClass = undefined,
		summary = []
	}: Props = $props();

	/**
	 * A column's alignment (`meta: { align: 'right' }` for amounts and quantities), and any classes
	 * of its own (`meta: { class: 'w-32' }`, a blank column wide enough to write in).
	 */
	const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;
	const alignOf = (meta: unknown) => {
		const align = (meta as { align?: keyof typeof ALIGN } | undefined)?.align;
		return align ? ALIGN[align] : '';
	};
	const classOf = (meta: unknown) =>
		[alignOf(meta), (meta as { class?: string } | undefined)?.class ?? ''].join(' ').trim();

	const VARIANTS = {
		list: { search: true, paginate: true, height: '80vh', pageSize: 20 },
		compact: { search: false, paginate: true, height: 'auto', pageSize: 10 },
		sheet: { search: false, paginate: false, height: 'auto', pageSize: 20 },
		print: { search: false, paginate: false, height: 'auto', pageSize: 20 }
	} as const;
	const showSearch = $derived(search ?? VARIANTS[variant].search);
	const pages = $derived(paginate ?? VARIANTS[variant].paginate);
	const frameHeight = $derived(height ?? VARIANTS[variant].height);
	const startPageSize = $derived(defaultPageSize ?? VARIANTS[variant].pageSize);

	const isServer = $derived(Boolean(server));

	/* ── Facet selection ──────────────────────────────────────────────────────
	 * Client mode keeps it here and filters in memory. Server mode reads it back off the URL,
	 * because there the selection is a query param and the rows have already been narrowed.
	 */
	let clientFacets = $state<Record<string, string[]>>({});

	const selectedFacets = $derived.by<Record<string, string[]>>(() => {
		if (!server) return clientFacets;

		const out: Record<string, string[]> = {};
		for (const key of facetKeys) {
			const value = server.filters?.[key];
			out[key] = value ? [String(value)] : [];
		}
		return out;
	});

	/*
	 * Facet helpers read rows by key, which needs an index signature; `TData` deliberately has no
	 * constraint, because `ColumnDef` is invariant in it and constraining it here rejects every
	 * caller that types its own rows. The cast is confined to these two lines.
	 */
	const indexable = $derived(data as readonly Record<string, unknown>[]);

	/* Client mode narrows the rows itself; server mode was handed rows already narrowed. */
	const rows = $derived(
		isServer ? data : (applyFacets([...indexable], clientFacets) as unknown as TData[])
	);

	const facets = $derived.by<Record<string, Facet[]>>(() => {
		if (!facetKeys.length) return {};

		// Server mode never counts its own rows — they are one page, and a tally of one page
		// presented as a tally of the result set is the bug this component was built to end.
		if (server) {
			const given = server.facets ?? {};
			const out: Record<string, Facet[]> = {};
			for (const key of facetKeys) out[key] = given[key] ?? [];
			return out;
		}

		return facetsFromRows([...indexable], facetKeys, clientFacets);
	});

	function toggleFacet(key: string, value: string) {
		if (isServer) {
			// One string per key is all `parseTableQuery` reads, so this is a replace, not an add.
			const already = selectedFacets[key]?.includes(value);
			setServerFacet(facetParams[key] ?? key, already ? null : value);
			return;
		}

		const current = clientFacets[key] ?? [];
		clientFacets = {
			...clientFacets,
			[key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
		};
	}

	function clearFacet(key: string) {
		if (isServer) setServerFacet(facetParams[key] ?? key, null);
		else clientFacets = { ...clientFacets, [key]: [] };
	}

	function clearAllFacets() {
		if (isServer) for (const key of facetKeys) setServerFacet(facetParams[key] ?? key, null);
		else clientFacets = {};
	}

	const activeFacetCount = $derived(selectionCount(selectedFacets));

	/* ── TanStack state ─────────────────────────────────────────────────────── */
	/*
	 * Split rather than one `$state` object, because `{ pageSize: defaultPageSize }` in an
	 * initialiser captures the prop's first value and never sees another — the same shape of bug
	 * as the `pageSize: data.length` this replaces. `null` means "the reader has not chosen", so
	 * the prop stays live until they do and is then left alone.
	 */
	let pageIndex = $state(0);
	let chosenPageSize = $state<number | null>(null);

	const pagination = $derived<PaginationState>({
		pageIndex,
		pageSize: chosenPageSize ?? startPageSize
	});
	/*
	 * Client mode sorts in memory. Server mode reflects what the URL asked for, because the rows
	 * arrived already ordered and re-sorting one page would only shuffle it within itself.
	 */
	let clientSorting = $state<SortingState>([]);

	const sorting = $derived<SortingState>(
		server
			? server.filters?.sort
				? [{ id: String(server.filters.sort), desc: server.filters.dir === 'desc' }]
				: []
			: clientSorting
	);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});
	let rowSelection = $state<RowSelectionState>({});
	/*
	 * In client mode this is TanStack's global filter over rows in memory. In server mode it is
	 * the `search` param, because filtering the twenty rows the server returned would search one
	 * page and look like it had searched the list — the same shape of lie the facet counts used
	 * to tell.
	 */
	// Both halves are strings: a search box cannot produce anything else, and typing this as
	// TanStack's wider `GlobalFilterColumn` made the shared binding below a union it could not set.
	let globalFilter = $state<string>('');
	let serverSearch = $state<string>('');

	$effect(() => {
		if (server) serverSearch = String(server.filters?.search ?? '');
	});

	function onSearchInput(value: string) {
		if (server) setServerSearch(value);
		else table.setGlobalFilter(value);
	}

	/*
	 * Server mode holds the page index at zero: the server already returned the right page, so
	 * letting TanStack slice it again would show the first N rows of page three.
	 */
	const tanstackPagination = $derived<PaginationState>(
		server
			? { pageIndex: 0, pageSize: Math.max(1, server.pagination.pageSize) }
			: pages
				? pagination
				: { pageIndex: 0, pageSize: Math.max(1, rows.length) }
	);

	/** Totals and the like: a footer row, drawn only when a column declares one. */
	const hasFooter = $derived(columns.some((column) => column.footer !== undefined));

	const table = createSvelteTable({
		get data() {
			return rows;
		},
		get columns() {
			return columns;
		},
		state: {
			get pagination() {
				return tanstackPagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get globalFilter() {
				return globalFilter;
			},
			get rowSelection() {
				return rowSelection;
			}
		},
		// Told once, so nothing downstream re-filters, re-sorts or re-slices what SQL already did.
		get manualPagination() {
			return Boolean(server);
		},
		get manualFiltering() {
			return Boolean(server);
		},
		get manualSorting() {
			return Boolean(server);
		},
		get rowCount() {
			return server?.pagination.total;
		},
		onPaginationChange: (updater) => {
			const next = typeof updater === 'function' ? updater(pagination) : updater;
			pageIndex = next.pageIndex;
			chosenPageSize = next.pageSize;
		},
		onSortingChange: (updater) => {
			const next = typeof updater === 'function' ? updater(sorting) : updater;

			if (server) {
				// The sort belongs to the query, not to the page of rows it returned.
				const first = next[0];
				setServerSort(first ? String(first.id) : null, first?.desc ? 'desc' : 'asc');
				return;
			}

			clientSorting = next;
		},
		onColumnFiltersChange: (updater) => {
			columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			columnVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
		},
		onRowSelectionChange: (updater) => {
			rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel()
	});

	if (selected) {
		$effect(() => {
			selected = table.getSelectedRowModel().rows.map((row) => row.original);
		});
	}

	/* ── What the pager shows, in whichever mode ─────────────────────────────── */
	const pagerPage = $derived(server ? server.pagination.page : pagination.pageIndex + 1);
	const pagerSize = $derived(server ? server.pagination.pageSize : pagination.pageSize);
	const pagerTotal = $derived(
		server ? server.pagination.total : table.getFilteredRowModel().rows.length
	);

	function goToPage(next: number) {
		if (server) gotoPage(next);
		else table.setPageIndex(next - 1);
	}

	function changePageSize(size: number) {
		if (server) setServerPageSize(size);
		else table.setPageSize(size);
	}

	/**
	 * On paper, a list whose cells say what they are ("Due 12 Tir") needs no header row; one
	 * without a header on any column keeps it for screen readers only.
	 */
	const hasHeader = $derived(columns.some((column) => Boolean(column.header)));

	/** How many columns are drawn: a summary's label spans all of them but the last. */
	const columnCount = $derived(table.getVisibleLeafColumns().length);

	const canChart = $derived(charts && facetKeys.length > 0);
	let chartsOpen = $state(false);

	const L = useLabels();
</script>

{#if variant === 'print'}
	<table class="w-full border-collapse text-sm {className}" data-testid="print-table">
		<thead class={hasHeader ? '' : 'sr-only'}>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<tr class="border-b-2 text-left">
					{#each headerGroup.headers as header (header.id)}
						<th
							colspan={header.colSpan}
							class="py-1 pr-2 last:pr-0 {classOf(header.column.columnDef.meta)}"
						>
							{#if !header.isPlaceholder}
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							{/if}
						</th>
					{/each}
				</tr>
			{/each}
		</thead>
		<tbody>
			{#each table.getRowModel().rows as row (row.id)}
				<tr class="border-b align-top {rowClass?.(row.original) ?? ''}">
					{#each row.getVisibleCells() as cell (cell.id)}
						<td class="py-1 pr-2 last:pr-0 {classOf(cell.column.columnDef.meta)}">
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</td>
					{/each}
				</tr>
			{:else}
				<tr class="border-b">
					<td colspan={columnCount} class="py-2 text-center">{L.tableEmpty}</td>
				</tr>
			{/each}
		</tbody>
		{#if hasFooter || summary.length}
			<tfoot>
				{#each hasFooter ? table.getFooterGroups() : [] as footerGroup (footerGroup.id)}
					<tr class="font-medium">
						{#each footerGroup.headers as footer (footer.id)}
							<td
								colspan={footer.colSpan}
								class="py-1 pr-2 last:pr-0 {classOf(footer.column.columnDef.meta)}"
							>
								{#if !footer.isPlaceholder}
									<FlexRender
										content={footer.column.columnDef.footer}
										context={footer.getContext()}
									/>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
				{#each summary as line, i (i)}
					<tr class={line.strong ? 'text-base font-bold' : ''}>
						{#if columnCount > 1}
							<td colspan={columnCount - 1} class="py-1 pr-2 text-right">{line.label}</td>
						{/if}
						<td class="py-1 text-right">{line.value}</td>
					</tr>
				{/each}
			</tfoot>
		{/if}
	</table>
{:else}
	<div class="mt-4 w-full {className}" style="height: {frameHeight}" data-testid="table-frame">
		<!--
		`min-h-0` on every flex child that scrolls: a flex item's default `min-height: auto` refuses
		to shrink below its content, so without it the rows push the container past the declared
		height and the page scrolls instead of the table.
	-->
		<div class="flex h-full min-h-0 flex-col gap-2 p-2">
			{#if showSearch}
				<ScrollArea orientation="horizontal" class="shrink-0 rounded-md border">
					<div class="flex max-w-4xl flex-row items-center justify-start gap-2 p-4">
						<Input
							type="search"
							placeholder={isServer ? L.tableSearchServer : L.tableSearch}
							class="w-64 lg:w-xl"
							bind:value={
								() => (isServer ? serverSearch : globalFilter),
								(v: string) => (isServer ? (serverSearch = v) : (globalFilter = v))
							}
							oninput={(e) => onSearchInput(e.currentTarget.value)}
						/>

						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="outline" class="ml-auto">
										{L.tableColumns}
										<ChevronDownIcon class="size-5" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								{#each table
									.getAllColumns()
									.filter((col) => col.getCanHide()) as column (column.id)}
									<DropdownMenu.CheckboxItem
										class="capitalize"
										bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
									>
										{typeof column.columnDef.header === 'string' && column.columnDef.header
											? column.columnDef.header
											: column.id.replace(/([a-z])([A-Z])/g, '$1 $2')}
									</DropdownMenu.CheckboxItem>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						{#if activeFacetCount}
							<Button variant="ghost" size="sm" class="gap-1" onclick={clearAllFacets}>
								<RotateCcw class="size-4" />
								{L.tableClear(activeFacetCount)}
							</Button>
						{/if}

						{#if server && dateFilter}
							<TableDateRange
								label={dateFilter}
								start={server.filters?.dateStart}
								end={server.filters?.dateEnd}
							/>
						{/if}

						<Pdf {fileName} {table} />

						{#if canChart}
							<Button
								variant={chartsOpen ? 'default' : 'outline'}
								aria-expanded={chartsOpen}
								onclick={() => (chartsOpen = !chartsOpen)}
							>
								<ChartColumnBig />
								{L.tableCharts}
							</Button>
						{/if}

						<Button variant="outline">
							<ListOrdered />
							{L.tableResults(pagerTotal.toLocaleString())}
						</Button>
					</div>
				</ScrollArea>
			{/if}

			<div class="flex min-h-0 flex-1 flex-col rounded-md border">
				{#if canChart && chartsOpen}
					<!-- Above the rows and below the toolbar: it pushes the table down rather than
					     squeezing it sideways, so no column is hidden to make room for it. -->
					<div class="h-64 shrink-0 border-b" transition:slide={{ duration: 150 }}>
						<TableCharts
							{facets}
							labels={facetLabels}
							selected={selectedFacets}
							onToggle={toggleFacet}
						/>
					</div>
				{/if}

				<div class="min-h-0 flex-1 overflow-auto">
					<Table.Root class="relative">
						<Table.Header
							class="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_var(--border)]"
						>
							{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row>
									{#each headerGroup.headers as header (header.id)}
										<Table.Head
											colspan={header.colSpan}
											class={classOf(header.column.columnDef.meta)}
										>
											{#if !header.isPlaceholder}
												<div
													class="flex items-center gap-1 {alignOf(header.column.columnDef.meta) ===
													'text-right'
														? 'justify-end'
														: ''}"
												>
													<FlexRender
														content={header.column.columnDef.header}
														context={header.getContext()}
													/>
													<!-- The filter belongs on the column it filters, not in a panel
												     the reader has to look away from the data to open. -->
													{#if facetKeys.includes(header.column.id)}
														<TableFacet
															label={facetLabels[header.column.id] ?? header.column.id}
															facets={facets[header.column.id] ?? []}
															selected={selectedFacets[header.column.id] ?? []}
															multi={!isServer}
															onToggle={(v) => toggleFacet(header.column.id, v)}
															onClear={() => clearFacet(header.column.id)}
														/>
													{/if}
												</div>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							{/each}
						</Table.Header>

						<Table.Body>
							{#each table.getRowModel().rows as row (row.id)}
								<Table.Row
									data-state={row.getIsSelected() && 'selected'}
									class={rowClass?.(row.original) ?? ''}
								>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell class={classOf(cell.column.columnDef.meta)}>
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={columns.length} class="text-center font-2xl">
										<div class="flex flex-row items-center justify-center gap-2">
											<Frown class="animate-bounce" />
											{L.tableEmpty}
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
						{#if hasFooter || summary.length}
							<Table.Footer class="sticky bottom-0 bg-muted/60 font-medium">
								{#each hasFooter ? table.getFooterGroups() : [] as footerGroup (footerGroup.id)}
									<Table.Row>
										{#each footerGroup.headers as footer (footer.id)}
											<Table.Cell
												colspan={footer.colSpan}
												class={classOf(footer.column.columnDef.meta)}
											>
												{#if !footer.isPlaceholder}
													<FlexRender
														content={footer.column.columnDef.footer}
														context={footer.getContext()}
													/>
												{/if}
											</Table.Cell>
										{/each}
									</Table.Row>
								{/each}
								{#each summary as line, i (i)}
									<Table.Row class={line.strong ? 'font-bold' : ''}>
										{#if columnCount > 1}
											<Table.Cell colspan={columnCount - 1} class="text-right"
												>{line.label}</Table.Cell
											>
										{/if}
										<Table.Cell class="text-right">{line.value}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Footer>
						{/if}
					</Table.Root>
				</div>

				{#if pages || server}
					<TablePagination
						page={pagerPage}
						pageSize={pagerSize}
						total={pagerTotal}
						{pageSizes}
						onPage={goToPage}
						onPageSize={changePageSize}
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}
