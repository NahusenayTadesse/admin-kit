<script lang="ts">
	/**
	 * One card on a detail page: an icon, a title, an optional edit control, and the content.
	 *
	 * Shared since the patient page became its third user. The employee and customer pages each
	 * carried a byte-identical `section.svelte` of their own — the second copy is where extraction
	 * was due.
	 */
	import type { Component } from 'svelte';
	import type { Snippet } from 'svelte';

	const styles = {
		container: 'min-h-screen  p-4 transition-colors duration-300 md:p-8',
		sectionWrapper: 'mx-auto max-w-305! grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',

		// Card Styles
		card: 'rounded-lg border bg-card shadow-xs overflow-hidden',
		cardHeader: 'flex items-center gap-3 border-b px-5 py-3',
		cardContent: 'p-5',

		// Typography
		mainHeading: 'text-3xl text-cetner font-extrabold tracking-tight text-gray-900 dark:text-white',
		subHeading: 'mt-1 text-sm text-gray-500 dark:text-slate-400',
		sectionTitle: 'text-base font-semibold text-foreground',

		/*
		 * One neutral icon tile. The five variants were five colours — indigo, red, emerald, amber,
		 * slate — and are kept as names so callers keep compiling; colour on a card now means a
		 * warning, not a category.
		 */
		iconBox:
			'flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4',
		// Specific Icon Variants
		identityIcon: '',
		addressIcon: '',
		employmentIcon: '',
		personalIcon: '',
		systemIcon: ''
	};

	type Styles = 'identityIcon' | 'addressIcon' | 'employmentIcon' | 'personalIcon' | 'systemIcon';

	import type { IconProps } from '@lucide/svelte';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';
	let {
		title,
		IconComp,
		children,
		editDialog,
		style = 'identityIcon',
		class: className = '',
		kitStyle = undefined
	}: {
		title: string;
		IconComp: Component<IconProps>;
		children: Snippet;
		editDialog?: Snippet;
		style: Styles;
		class?: string;
		/** The card's look, when it should differ from the app's style. (`style` is the icon's.) */
		kitStyle?: KitStyleName;
	} = $props();

	const look = useKitLook();
	const kit = $derived(kitStyle ?? look.style);

	/* The default's classes are `styles` above; each other style replaces the card's parts. */
	const LOOKS: Record<
		Exclude<KitStyleName, 'default'>,
		{ card: string; header: string; icon: string; title: string; content: string }
	> = {
		compact: {
			card: 'rounded-md border bg-card overflow-hidden',
			header: 'flex items-center gap-2 border-b bg-muted/50 px-3 py-2',
			icon: 'flex size-6 items-center justify-center text-muted-foreground [&_svg]:size-4',
			title: 'text-sm font-semibold',
			content: 'p-3'
		},
		soft: {
			card: 'rounded-(--kit-card-radius) bg-card shadow-(--kit-card-shadow) overflow-hidden',
			header: 'flex items-center gap-3 px-6 pt-5 pb-1',
			icon: 'flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-4',
			title: 'text-base font-semibold',
			content: 'px-6 pt-2 pb-6'
		},
		sharp: {
			card: 'border bg-card overflow-hidden',
			header: 'flex items-center gap-2 border-b bg-muted px-4 py-2.5',
			icon: 'flex size-5 items-center justify-center text-muted-foreground [&_svg]:size-3.5',
			title: 'font-mono text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase',
			content: 'p-4'
		},
		formal: {
			card: 'rounded-(--radius) border bg-card overflow-hidden',
			header:
				'mx-5 flex items-center gap-3 border-b-2 border-double border-foreground/25 pt-4 pb-3',
			icon: 'flex size-5 items-center justify-center text-muted-foreground [&_svg]:size-4',
			title: 'font-head text-lg font-semibold',
			content: 'px-5 py-4'
		},
		bold: {
			card: 'rounded-lg border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)] overflow-hidden',
			header: 'flex items-center gap-3 border-b-2 border-foreground bg-primary/15 px-5 py-3',
			icon: 'flex size-8 items-center justify-center rounded-md border-2 border-foreground bg-background [&_svg]:size-4',
			title: 'text-base font-bold',
			content: 'p-5'
		}
	};
	const parts = $derived(kit === 'default' ? undefined : LOOKS[kit]);
</script>

{#if parts}
	<section class="{parts.card} {className}" data-layout={kit}>
		<div class={parts.header}>
			<div class={parts.icon}><IconComp /></div>
			<h4 class="min-w-0 flex-1"><span class={parts.title}>{title}</span></h4>
			{@render editDialog?.()}
		</div>
		<div class={parts.content}>
			{@render children?.()}
		</div>
	</section>
{:else}
	<section class="{styles.card} {className}">
		<div class={styles.cardHeader}>
			<div class="{styles.iconBox} {styles[style]}"><IconComp /></div>
			<h4 class={styles.sectionTitle}>{title}</h4>
			{@render editDialog?.()}
		</div>
		<div class={styles.cardContent}>
			{@render children?.()}
		</div>
	</section>
{/if}
