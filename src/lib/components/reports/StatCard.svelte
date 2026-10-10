<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { formatETB } from '$lib/global';
	import type { Stat } from './types';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

	let {
		stat,
		onselect,
		amharicMoney = true,
		kitStyle = undefined
	}: {
		stat: Stat;
		onselect?: (section: string) => void;
		/** Money as `ብር 1,300.00` (the default, as before) or, for an English screen, `ETB 1,300.00`. */
		amharicMoney?: boolean;
		/** The card's look, when it should differ from the app's style. */
		kitStyle?: KitStyleName;
	} = $props();

	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);

	const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
	const DECIMAL = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

	const L = useLabels();
	const display = $derived.by(() => {
		switch (stat.format) {
			case 'money':
				return formatETB(stat.value, amharicMoney);
			case 'percent':
				return `${DECIMAL.format(stat.value)}%`;
			case 'years':
				return L.statYears(DECIMAL.format(stat.value));
			case 'hours':
				return L.statHours(DECIMAL.format(stat.value));
			case 'days':
				return L.statDays(NUMBER.format(stat.value));
			default:
				return NUMBER.format(stat.value);
		}
	});

	/** The accent stripe: what the number means, not whether it went up. */
	const tone = $derived(stat.tone ?? 'neutral');
	const accent = $derived(
		{
			positive: 'border-l-success',
			negative: 'border-l-destructive',
			warning: 'border-l-warning',
			neutral: 'border-l-info'
		}[tone]
	);

	/* The tone in the other styles' terms — a dot, a tint, a top rule, an underline, a block — all
	 * from the app's `--success`, `--destructive`, `--warning` and `--info`. */
	const TONES = {
		positive: {
			dot: 'bg-success',
			tint: 'bg-success/10',
			top: 'border-t-success',
			rule: 'decoration-success',
			block: 'bg-success/30'
		},
		negative: {
			dot: 'bg-destructive',
			tint: 'bg-destructive/10',
			top: 'border-t-destructive',
			rule: 'decoration-destructive',
			block: 'bg-destructive/25'
		},
		warning: {
			dot: 'bg-warning',
			tint: 'bg-warning/15',
			top: 'border-t-warning',
			rule: 'decoration-warning',
			block: 'bg-warning/40'
		},
		neutral: {
			dot: 'bg-info',
			tint: 'bg-info/10',
			top: 'border-t-info',
			rule: 'decoration-info',
			block: 'bg-info/25'
		}
	} as const;
	const t = $derived(TONES[tone]);

	const LOOKS = $derived({
		default: {
			card: `${accent} border-l-4 transition-shadow hover:shadow-md`,
			content: 'p-4',
			label: 'text-xs font-medium tracking-wide text-muted-foreground uppercase',
			value: 'mt-1 text-2xl font-semibold'
		},
		compact: {
			card: 'gap-0 py-0 transition-colors hover:bg-muted/40',
			content: 'p-3',
			label: 'flex items-center gap-1.5 text-xs font-medium text-muted-foreground',
			value: 'mt-0.5 text-xl font-semibold'
		},
		soft: {
			card: `${t.tint} shadow-none transition-transform hover:-translate-y-0.5`,
			content: 'p-5',
			label: 'text-sm font-medium text-muted-foreground',
			value: 'mt-2 text-[1.625rem] leading-tight font-bold tracking-tight'
		},
		sharp: {
			card: `${t.top} border-t-2 py-0`,
			content: 'p-4',
			label: 'font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase',
			value: 'mt-2 font-mono text-2xl font-medium'
		},
		formal: {
			card: 'py-0',
			content: 'p-5',
			label: 'text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase',
			value: `mt-2 font-head text-[1.75rem] leading-tight font-semibold underline decoration-2 underline-offset-8 ${t.rule}`
		},
		bold: {
			card: `${t.block} py-0 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5`,
			content: 'p-5',
			label: 'text-xs font-bold tracking-wide uppercase',
			value: 'mt-1 text-[1.625rem] leading-tight font-bold tracking-tight'
		}
	} satisfies Record<
		KitStyleName,
		{ card: string; content: string; label: string; value: string }
	>);
	const parts = $derived(LOOKS[style] ?? LOOKS.default);
	const text = $derived(style === 'default' ? 'p' : 'div');

	const clickable = $derived(Boolean(stat.section && onselect));
</script>

<Card
	class="{parts.card} {clickable ? 'cursor-pointer' : ''}"
	data-layout={style}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
	onclick={() => clickable && onselect?.(stat.section as string)}
	onkeydown={(event: KeyboardEvent) => {
		if (!clickable) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onselect?.(stat.section as string);
		}
	}}
>
	<!-- `div` outside the default: the kit's own `p` rule would overrule these faces and weights. -->
	<CardContent class={parts.content}>
		<svelte:element this={text} class={parts.label}>
			{#if style === 'compact'}<span class="size-1.5 rounded-full {t.dot}"></span>{/if}
			{stat.label}
		</svelte:element>
		<svelte:element this={text} class="{parts.value} break-words tabular-nums"
			>{display}</svelte:element
		>
		{#if stat.hint}
			<p class="mt-1 text-xs {style === 'bold' ? 'text-foreground/75' : 'text-muted-foreground'}">
				{stat.hint}
			</p>
		{/if}
	</CardContent>
</Card>
