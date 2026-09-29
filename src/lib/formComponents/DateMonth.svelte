<script lang="ts">
	import { useLabels } from '$lib/labels';
	import RangeCalendar from '$lib/components/ui/range-calendar/range-calendar.svelte';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { CalendarIcon, SlidersHorizontal } from '@lucide/svelte';
	import type { DateRange } from 'bits-ui';
	import * as Popover from '$lib/components/ui/popover/index.js';

	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { isMobile } from '$lib/global';
	import { goto } from '$app/navigation';
	import { formatDateIn, isoDate, parseIsoDate } from '$lib/calendars';
	import { useCalendar } from '$lib/calendarPreference.svelte';
	import CalendarSwitch from '$lib/formComponents/CalendarSwitch.svelte';

	let {
		id = null,
		link,
		start = '2025-11-08',
		end = '2025-11-08'
	}: { id?: number | null; link: string; start?: string; end?: string } = $props();

	// Seeded once from the link's window; the picker owns it from then on. Parsed as the calendar
	// day it names (`new Date('2025-11-08')` is UTC midnight, the day before west of Greenwich).
	let value = $state<DateRange>(
		untrack(() => ({
			start: parseIsoDate(start) ?? today(getLocalTimeZone()),
			end: parseIsoDate(end) ?? today(getLocalTimeZone())
		}))
	);

	const L = useLabels();
	const preference = useCalendar();
	$effect(() => preference.restore());
	const kind = $derived(preference.kind);
	let open = $state(false);
	let contentRef = $state<HTMLElement | null>(null);

	/** A date on the calendar in view; the link carries it in Gregorian. */
	function formatDate(input: DateValue | null | undefined) {
		return input ? formatDateIn(input, kind, L.dateLocale, 'short') || L.pickADate : L.pickADate;
	}
	const link_ = (v: DateRange) =>
		id === null
			? `${link}/${isoDate(v.start!)}-${isoDate(v.end!)}`
			: `${link}/ranges/${isoDate(v.start!)}-${isoDate(v.end!)}-${id}`;

	let number = isMobile;
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			buttonVariants({
				variant: 'outline',
				class: 'w-70 justify-start text-start font-normal'
			}),
			!value && 'text-muted-foreground'
		)}
	>
		<CalendarIcon />
		{value ? formatDate(value.start) + ' - ' + formatDate(value.end) : L.pickADate}
	</Popover.Trigger>
	<Popover.Content bind:ref={contentRef} class="w-full p-0">
		<div class="ti flex flex-row justify-between text-sm text-muted-foreground">
			<CalendarSwitch value={kind} onchange={(k) => preference.set(k)} />
			<p>
				<span class="font-semibold text-foreground"
					>{formatDate(value.start) + ' - ' + formatDate(value.end)}</span
				>
			</p>
			<Button
				disabled={!value.start || !value.end}
				onclick={() => {
					open = false;

					goto(link_(value));
				}}
			>
				<SlidersHorizontal />
				{L.filter}
			</Button>
		</div>

		<RangeCalendar
			bind:value
			calendar={kind}
			locale={L.dateLocale}
			class="relative w-auto rounded-lg border pb-16 shadow-sm"
			numberOfMonths={isMobile() ? 1 : 2}
		/>
		<Button
			disabled={!value.start || !value.end}
			class="absolute right-2 bottom-2"
			onclick={() => {
				open = false;

				goto(link_(value));
			}}
		>
			<SlidersHorizontal />
			{L.filter}
		</Button>
	</Popover.Content>
</Popover.Root>
