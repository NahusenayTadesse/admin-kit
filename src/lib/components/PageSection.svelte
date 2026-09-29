<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A titled part of a page — "Lines", "What moved", "Landed costs" — with an optional line
	 * saying what it is, buttons on the right, and its content below. One component, so every
	 * page's parts are spaced and titled the same.
	 */
	let {
		title,
		hint = undefined,
		actions = undefined,
		children,
		class: className = ''
	}: {
		title: string;
		/** A sentence under the title. */
		hint?: string;
		actions?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<section class="flex flex-col gap-2 {className}">
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h2 class="text-xl font-semibold">{title}</h2>
			{#if hint}<p class="text-sm text-muted-foreground">{hint}</p>{/if}
		</div>
		{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
	</div>
	{@render children()}
</section>
