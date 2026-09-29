<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Info from '@lucide/svelte/icons/info';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { cn } from '$lib/utils.js';

	/**
	 * A message in the page, not a toast: something the reader should see while they work — a
	 * refusal, a warning, a state the record is in. Four tones, one look, so a warning on one page
	 * reads like a warning on every other.
	 */
	let {
		tone = 'info',
		title = undefined,
		icon = undefined,
		class: className = '',
		children,
		actions = undefined
	}: {
		tone?: 'info' | 'warning' | 'danger' | 'success';
		/** Bold, before the message. */
		title?: string;
		/** Instead of the tone's own icon. */
		icon?: Component<IconProps>;
		class?: string;
		children: Snippet;
		/** Buttons on the right (withdraw, retry). */
		actions?: Snippet;
	} = $props();

	const TONES = {
		info: { box: 'border-sky-500/40 bg-sky-500/10', icon: Info, iconClass: 'text-sky-600' },
		warning: {
			box: 'border-amber-500/40 bg-amber-500/10',
			icon: TriangleAlert,
			iconClass: 'text-amber-600'
		},
		danger: {
			box: 'border-destructive/50 bg-destructive/10',
			icon: CircleAlert,
			iconClass: 'text-destructive'
		},
		success: {
			box: 'border-emerald-500/40 bg-emerald-500/10',
			icon: CircleCheck,
			iconClass: 'text-emerald-600'
		}
	} as const;
	const look = $derived(TONES[tone]);
	const Icon = $derived(icon ?? look.icon);
</script>

<div
	role={tone === 'danger' ? 'alert' : 'status'}
	class={cn(
		'flex flex-wrap items-start justify-between gap-3 rounded-md border p-3 text-sm',
		look.box,
		className
	)}
>
	<div class="flex min-w-0 items-start gap-2">
		<Icon class={cn('mt-0.5 size-4 shrink-0', look.iconClass)} />
		<div class="min-w-0">
			{#if title}<strong>{title}</strong>{/if}
			{@render children()}
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</div>
