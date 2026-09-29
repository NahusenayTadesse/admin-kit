<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { CALENDAR_KINDS, type CalendarKind } from '$lib/calendars';
	import { cn } from '$lib/utils.js';

	/**
	 * Ethiopian ⇄ Gregorian, as two small buttons. Only changes what the date inputs *show*: the
	 * date itself, and what is sent, stay the same.
	 */
	let {
		value,
		onchange,
		class: className
	}: { value: CalendarKind; onchange: (kind: CalendarKind) => void; class?: string } = $props();

	const L = useLabels();
	const short = (kind: CalendarKind) =>
		kind === 'ethiopian' ? L.calendarEthiopianShort : L.calendarGregorianShort;
	const long = (kind: CalendarKind) =>
		kind === 'ethiopian' ? L.calendarEthiopian : L.calendarGregorian;
</script>

<div
	role="group"
	aria-label={L.calendarSwitch}
	class={cn('inline-flex rounded-md border bg-muted/40 p-0.5 text-xs', className)}
>
	{#each CALENDAR_KINDS as kind (kind)}
		<button
			type="button"
			class={cn(
				'rounded px-2 py-1 font-medium transition-colors',
				value === kind
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'
			)}
			aria-pressed={value === kind}
			title={long(kind)}
			onclick={() => onchange(kind)}
		>
			{short(kind)}
		</button>
	{/each}
</div>
