<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

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
		class: className = '',
		kitStyle = undefined
	}: {
		title: string;
		/** A sentence under the title. */
		hint?: string;
		actions?: Snippet;
		children: Snippet;
		class?: string;
		/** The layout, when it should differ from the app's style. */
		kitStyle?: KitStyleName;
	} = $props();

	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);
</script>

<section
	class="flex flex-col gap-2 {style === 'soft' || style === 'bold' ? 'gap-3' : ''} {className}"
	data-layout={style}
>
	{#if style === 'sharp'}
		<!-- A monospaced label running into a hairline. -->
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex min-w-0 flex-1 items-center gap-3">
				<h2 class="shrink-0">
					<span
						class="font-mono text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
						>{title}</span
					>
				</h2>
				<span class="h-px min-w-8 flex-1 bg-border" aria-hidden="true"></span>
			</div>
			{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
		</div>
		{#if hint}<p class="text-sm text-muted-foreground">{hint}</p>{/if}
	{:else}
		<div
			class="flex flex-wrap items-end justify-between gap-2 {style === 'compact'
				? 'border-b pb-1.5'
				: style === 'formal'
					? 'border-b pb-2'
					: ''}"
		>
			<div class="flex flex-col gap-1">
				<h2
					class={style === 'bold'
						? 'underline decoration-primary decoration-4 underline-offset-[6px]'
						: style === 'compact'
							? 'text-base'
							: 'text-xl font-semibold'}
				>
					{#if style === 'compact'}<span class="text-base">{title}</span>{:else}{title}{/if}
				</h2>
				{#if hint}<p class="text-sm text-muted-foreground {style === 'formal' ? 'italic' : ''}">
						{hint}
					</p>{/if}
			</div>
			{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
		</div>
	{/if}
	{@render children()}
</section>
