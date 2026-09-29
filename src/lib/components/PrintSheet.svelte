<script lang="ts">
	import type { Snippet } from 'svelte';
	import Printer from '@lucide/svelte/icons/printer';
	import { Button } from '$lib/components/ui/button/index.js';

	/**
	 * A document handed over on paper — a quote, a bill — with its letterhead and a print button
	 * that does not print.
	 *
	 * Render it from a page outside the dashboard layout (`+page@.svelte`), so it prints as a page
	 * and not as a screenshot of the app. The letterhead is the branch the document came from —
	 * the business, never the software.
	 */
	let {
		branch,
		fallbackName = '',
		children
	}: {
		branch: { name: string | null; address: string | null; phone: string | null };
		/** Shown when the branch has no name. */
		fallbackName?: string;
		children: Snippet;
	} = $props();
</script>

<main class="mx-auto flex max-w-3xl flex-col gap-6 bg-background p-8 text-foreground print:p-0">
	<div class="flex justify-end print:hidden">
		<Button onclick={() => window.print()}><Printer class="size-4" /> Print</Button>
	</div>

	<header class="flex flex-col gap-1 border-b pb-4">
		<p class="text-2xl font-bold">{branch.name ?? fallbackName}</p>
		{#if branch.address}<p class="text-sm">{branch.address}</p>{/if}
		{#if branch.phone}<p class="text-sm">Tel. {branch.phone}</p>{/if}
	</header>

	{@render children()}
</main>

<style>
	/* Print only: the page margin is not something Tailwind can say. */
	@page {
		margin: 18mm;
	}
</style>
