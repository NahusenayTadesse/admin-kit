<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The top of a page: its title (also the browser tab's), an optional line above and below it,
	 * badges beside it, and the page's buttons on the right. One component so every page reads
	 * the same, and a change to how pages open is made once.
	 *
	 *     <PageHeader title="Customers" description="Who buys on credit…">
	 *       {#snippet actions()}<Button>…</Button>{/snippet}
	 *     </PageHeader>
	 */
	let {
		title,
		description = undefined,
		eyebrow = undefined,
		tabTitle = undefined,
		badges = undefined,
		actions = undefined,
		children = undefined
	}: {
		title: string;
		/** A sentence under the title saying what the page is for. */
		description?: string;
		/** A small line above the title: what kind of thing this page is ("Customer"). */
		eyebrow?: string;
		/** The browser tab, when it should differ from the title. */
		tabTitle?: string;
		/** Status badges beside the title. */
		badges?: Snippet;
		/** The page's buttons, on the right. */
		actions?: Snippet;
		/** Anything else under the title (a note, a link). */
		children?: Snippet;
	} = $props();
</script>

<svelte:head>
	<title>{tabTitle ?? title}</title>
</svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div class="flex min-w-0 flex-col gap-1">
		{#if eyebrow}<p class="text-sm text-muted-foreground">{eyebrow}</p>{/if}
		<h1 class="flex flex-wrap items-center gap-2 text-2xl font-semibold">
			{title}
			{@render badges?.()}
		</h1>
		{#if description}<p class="text-muted-foreground">{description}</p>{/if}
		{@render children?.()}
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</div>
