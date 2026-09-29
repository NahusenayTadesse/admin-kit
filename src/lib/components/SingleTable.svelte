<script lang="ts">
	import { useLabels } from '$lib/labels';
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
	};

	// The markup below iterates this, so it has always been a list of rows —
	// the old `SingleTable` (singular) annotation made every caller fail to typecheck.
	let { singleTable }: { singleTable: SingleTableRow[] } = $props();

	const L = useLabels();
</script>

<!--
 <div class="fixed right-2 top-24">
    <JSPDF {fileName} tableId="#table" {buttonName} />

</div> -->

{#await singleTable}
	<h1 class="m-2 flex flex-row">{L.loading} <LoaderCircle class="animate-spin" /></h1>
{:then table}
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
					<td class="break-words capitalize">
						{#if value.kind === 'phone' || (!value.kind && value.name === 'Phone')}
							<Copy data={String(value.value ?? '')} />
						{:else if value.kind === 'status' || (!value.kind && value.name === 'Status')}
							<Statuses status={String(value.value)} />
						{:else if value.long}
							<BigText
								text={value.value}
								max={typeof value.long === 'number' ? value.long : undefined}
							/>
						{:else if value.href}
							<a class="underline underline-offset-2 hover:no-underline" href={value.href}>
								{value.value}
							</a>
						{:else}
							{value.value}
						{/if}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
{/await}
