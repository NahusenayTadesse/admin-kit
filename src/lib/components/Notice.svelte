<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Info from '@lucide/svelte/icons/info';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { cn } from '$lib/utils.js';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

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
		actions = undefined,
		kitStyle = undefined
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
		/** The look, when it should differ from the app's style. */
		kitStyle?: KitStyleName;
	} = $props();

	const kit = useKitLook();
	const style = $derived(kitStyle ?? kit.style);

	/* The frame each style puts around the tone's colours; `default` is the kit's original. */
	const FRAMES: Record<KitStyleName, { box: string; title: string }> = {
		default: { box: '', title: '' },
		compact: { box: 'gap-2 px-2.5 py-2 text-[13px]', title: '' },
		soft: { box: 'rounded-2xl border-transparent p-4', title: '' },
		sharp: {
			box: 'rounded-none border-0 border-l-[3px] px-4',
			title: 'mr-1 font-mono text-xs tracking-[0.08em] uppercase'
		},
		formal: {
			box: 'rounded-none border-x-0 bg-transparent px-1 py-3',
			title: 'mr-1 font-head text-[15px]'
		},
		bold: {
			box: 'rounded-lg border-2 border-foreground p-4 font-medium shadow-[4px_4px_0_0_var(--foreground)]',
			title: 'mr-1 font-bold uppercase'
		}
	};
	const frame = $derived(FRAMES[style] ?? FRAMES.default);

	const TONES = {
		info: { box: 'border-info/40 bg-info/10', icon: Info, iconClass: 'text-info' },
		warning: {
			box: 'border-warning/50 bg-warning/12',
			icon: TriangleAlert,
			iconClass: 'text-warning'
		},
		danger: {
			box: 'border-destructive/50 bg-destructive/10',
			icon: CircleAlert,
			iconClass: 'text-destructive'
		},
		success: {
			box: 'border-success/40 bg-success/10',
			icon: CircleCheck,
			iconClass: 'text-success'
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
		frame.box,
		className
	)}
	data-layout={style}
>
	<div class="flex min-w-0 items-start gap-2">
		<Icon class={cn('mt-0.5 size-4 shrink-0', look.iconClass)} />
		<div class="min-w-0">
			{#if title}<strong class={frame.title}>{title}</strong>{/if}
			{@render children()}
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</div>
