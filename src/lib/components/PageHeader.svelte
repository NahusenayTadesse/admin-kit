<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

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
		children = undefined,
		kitStyle = undefined
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
		/** The layout, when it should differ from the app's style. */
		kitStyle?: KitStyleName;
	} = $props();

	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);

	/*
	 * Each style's page opening. The title's size and face come from the style's `h1` tokens;
	 * these set what is around it: the line above, the rule below, how the description reads.
	 */
	const LOOKS: Record<KitStyleName, { root: string; eyebrow: string; description: string }> = {
		default: {
			root: '',
			eyebrow: 'text-sm text-muted-foreground',
			description: 'text-muted-foreground'
		},
		compact: {
			root: 'items-center border-b pb-3',
			eyebrow: 'text-xs text-muted-foreground',
			description: 'text-sm text-muted-foreground'
		},
		soft: {
			root: 'pb-2',
			eyebrow: 'w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary',
			description: 'max-w-2xl text-muted-foreground'
		},
		sharp: {
			root: 'border-b pb-4',
			eyebrow: 'font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase',
			description: 'text-sm text-muted-foreground'
		},
		formal: {
			root: 'border-b-4 border-double pb-5',
			eyebrow: 'text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase',
			description: 'font-head text-muted-foreground italic'
		},
		bold: {
			root: 'pb-2',
			eyebrow:
				'w-fit -rotate-1 border-2 border-foreground bg-primary px-2 py-0.5 text-xs font-bold tracking-wide text-primary-foreground uppercase',
			description: 'max-w-2xl text-lg font-medium'
		}
	};
	const parts = $derived(LOOKS[style] ?? LOOKS.default);
	// `div` outside the default: the kit's own `p` rule would overrule a style's face and weight.
	const text = $derived(style === 'default' ? 'p' : 'div');
</script>

<svelte:head>
	<title>{tabTitle ?? title}</title>
</svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4 {parts.root}" data-layout={style}>
	<div class="flex min-w-0 flex-col gap-1 {style === 'soft' || style === 'bold' ? 'gap-2' : ''}">
		{#if eyebrow}<svelte:element this={text} class={parts.eyebrow}>{eyebrow}</svelte:element>{/if}
		<h1 class="flex flex-wrap items-center gap-2 text-2xl font-semibold">
			{title}
			{@render badges?.()}
		</h1>
		{#if description}<svelte:element this={text} class={parts.description}
				>{description}</svelte:element
			>{/if}
		{@render children?.()}
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</div>
