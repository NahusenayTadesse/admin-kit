<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';
	import Copy from '$lib/Copy.svelte';
	import { LoaderCircle } from '@lucide/svelte';
	import Statuses from './Table/statuses.svelte';
	import BigText from './Table/bigText.svelte';
	// import JSPDF from "$lib/JSPDF.svelte"

	type SingleTableRow = {
		name: string;
		value: string | number | null | undefined;
		/** Optional destination — the value renders as a link when set. */
		href?: string | null;
		/**
		 * Free text of any length (a note, an address): shown with `BigText`, cut after its default
		 * 15 characters (`true`) or after this many, with a "…" that opens the rest.
		 */
		long?: boolean | number;
		/**
		 * How to show the value: a phone number with a copy button, a status badge. Say it here —
		 * matching the row's *name* ("Phone", "Status") only works in English, and is kept only for
		 * callers that do not say.
		 */
		kind?: 'phone' | 'status';
		/** A status row: what the badge says, in the viewer's language; `value` picks its colour. */
		label?: string;
	};

	// The markup below iterates this, so it has always been a list of rows —
	// the old `SingleTable` (singular) annotation made every caller fail to typecheck.
	let {
		singleTable,
		capitalize = false,
		kitStyle = undefined
	}: {
		singleTable: SingleTableRow[];
		/** Capitalise values. Off: it turned email addresses and codes into wrong ones. */
		capitalize?: boolean;
		/**
		 * The layout, when it should differ from the app's style: `default` is the Detail/Value table,
		 * `compact` a two-column spec sheet, `soft` tiles, `sharp` a ruled ledger, `formal` a filled-in
		 * paper form, `bold` inked blocks.
		 */
		kitStyle?: KitStyleName;
	} = $props();

	const L = useLabels();
	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);
</script>

<!--
 <div class="fixed right-2 top-24">
    <JSPDF {fileName} tableId="#table" {buttonName} />

</div> -->

{#snippet valueOf(value: SingleTableRow)}
	{#if value.kind === 'phone' || (!value.kind && value.name === 'Phone')}
		<Copy data={String(value.value ?? '')} />
	{:else if value.kind === 'status' || (!value.kind && value.name === 'Status')}
		<Statuses status={String(value.value)} label={value.label} />
	{:else if value.long}
		<BigText text={value.value} max={typeof value.long === 'number' ? value.long : undefined} />
	{:else if value.href}
		<a class="underline underline-offset-2 hover:no-underline" href={value.href}>
			{value.value}
		</a>
	{:else}
		{value.value}
	{/if}
{/snippet}

{#await singleTable}
	<h1 class="m-2 flex flex-row">{L.loading} <LoaderCircle class="animate-spin" /></h1>
{:then table}
	{#if style === 'compact'}
		<!-- A spec sheet: two columns of label … value on dashed rules. -->
		<dl
			id="table"
			data-layout="compact"
			class="grid w-full gap-x-8 px-4 pb-3 text-sm sm:grid-cols-2"
		>
			{#each table as value, i (i)}
				<div
					class="flex min-w-0 items-baseline justify-between gap-4 border-b border-dashed py-1.5"
				>
					<dt class="shrink-0 text-muted-foreground">{value.name}</dt>
					<dd class="min-w-0 text-right font-medium break-words {capitalize ? 'capitalize' : ''}">
						{@render valueOf(value)}
					</dd>
				</div>
			{/each}
		</dl>
	{:else if style === 'soft'}
		<!-- Tiles: the label small above a larger value. -->
		<dl id="table" data-layout="soft" class="grid w-full gap-3 p-4 sm:grid-cols-2">
			{#each table as value, i (i)}
				<div class="min-w-0 rounded-2xl bg-muted/70 px-4 py-3">
					<dt class="text-xs font-medium text-muted-foreground">{value.name}</dt>
					<dd class="mt-1 text-base font-semibold break-words {capitalize ? 'capitalize' : ''}">
						{@render valueOf(value)}
					</dd>
				</div>
			{/each}
		</dl>
	{:else if style === 'sharp'}
		<!-- A ledger: a ruled grid, monospaced keys in a shaded column. -->
		<dl id="table" data-layout="sharp" class="w-full border text-sm">
			{#each table as value, i (i)}
				<div class="grid grid-cols-[minmax(8rem,34%)_1fr] border-b last:border-b-0">
					<dt
						class="border-r bg-muted px-3 py-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase"
					>
						{value.name}
					</dt>
					<dd class="min-w-0 px-3 py-2 break-words {capitalize ? 'capitalize' : ''}">
						{@render valueOf(value)}
					</dd>
				</div>
			{/each}
		</dl>
	{:else if style === 'formal'}
		<!-- A filled-in paper form: capitals over a ruled answer line, between double rules. -->
		<dl
			id="table"
			data-layout="formal"
			class="grid w-full gap-x-10 gap-y-5 border-y-4 border-double px-6 py-6 sm:grid-cols-2"
		>
			{#each table as value, i (i)}
				<div class="min-w-0">
					<dt class="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
						{value.name}
					</dt>
					<dd
						class="mt-1 min-h-7 border-b border-foreground/25 pb-1 font-head text-[15px] break-words {capitalize
							? 'capitalize'
							: ''}"
					>
						{@render valueOf(value)}
					</dd>
				</div>
			{/each}
		</dl>
	{:else if style === 'bold'}
		<!-- Inked blocks: a tag for the label, a big value, a hard shadow. -->
		<dl id="table" data-layout="bold" class="grid w-full gap-4 p-4 sm:grid-cols-2">
			{#each table as value, i (i)}
				<div
					class="min-w-0 rounded-lg border-2 border-foreground bg-card p-3 shadow-[3px_3px_0_0_var(--foreground)]"
				>
					<dt
						class="inline-block bg-primary px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-primary-foreground uppercase"
					>
						{value.name}
					</dt>
					<dd class="mt-2 text-lg font-bold break-words {capitalize ? 'capitalize' : ''}">
						{@render valueOf(value)}
					</dd>
				</div>
			{/each}
		</dl>
	{:else}
		<table id="table" class="w-full table-fixed text-left lg:w-full">
			<thead
				class="bg-gray-100 font-semibold tracking-wider text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-300"
			>
				<tr>
					<th class="px-4 py-3">{L.detail}</th>
					<th class="px-4 py-3">{L.value}</th>
				</tr>
			</thead>
			<tbody class="text-gray-900 dark:text-gray-100">
				{#each singleTable as value, i (i)}
					<tr>
						<td class="px-4 py-3 font-semibold">{value.name}</td>
						<td class="break-words {capitalize ? 'capitalize' : ''}"> {@render valueOf(value)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
{/await}
