<script lang="ts">
	import { useLabels } from '$lib/labels';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import X from '@lucide/svelte/icons/x';
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	import RangeCalendar from '$lib/components/ui/range-calendar/range-calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { setServerParams } from './table-state.svelte';
	import { formatDateIn, isoDate } from '$lib/calendars';
	import { useCalendar } from '$lib/calendarPreference.svelte';
	import CalendarSwitch from '$lib/formComponents/CalendarSwitch.svelte';

	/**
	 * A date window for a server-mode table, written to `dateStart`/`dateEnd`.
	 *
	 * Those two params were already understood by every load — `parseTableQuery` reads them and
	 * `buildWhere` applies them to the spec's `dateColumn` — but since the filter bar left the
	 * list pages, nothing on screen could set them. This is that control, in the table's own
	 * toolbar, so a list does not grow a second bar to get one back.
	 *
	 * Both ends or neither: `buildWhere` ignores a half-open window, so this never writes one.
	 * Presets first, because "registered this month" is the question almost every time and a
	 * two-month calendar is a lot of clicking to ask it.
	 *
	 * Non-goal: client mode. A table holding every row can filter them itself, and a date column
	 * there is better served by a facet.
	 */
	let {
		label,
		start,
		end
	}: {
		/** What the window applies to — "Registered", "Issued". */
		label: string;
		/** The current `dateStart`/`dateEnd`, as `YYYY-MM-DD`. */
		start?: string | null;
		end?: string | null;
	} = $props();

	let open = $state(false);

	const tz = getLocalTimeZone();

	/** The window as the URL holds it, or empty when the URL holds none (or holds rubbish). */
	function fromUrl(): DateRange {
		try {
			return start && end
				? { start: parseDate(start), end: parseDate(end) }
				: { start: undefined, end: undefined };
		} catch {
			return { start: undefined, end: undefined };
		}
	}

	// Follows the URL — a back button, a cleared filter — and is overwritten while picking.
	let range = $derived<DateRange>(fromUrl());

	const L = useLabels();
	const preference = useCalendar();
	$effect(() => preference.restore());
	const kind = $derived(preference.kind);

	/** The window on the calendar in view; the URL holds it in Gregorian. */
	const summary = $derived(
		start && end
			? `${formatDateIn(start, kind, L.dateLocale, 'short')} – ${formatDateIn(end, kind, L.dateLocale, 'short')}`
			: null
	);

	function apply(from: DateValue, to: DateValue) {
		open = false;
		setServerParams({ dateStart: isoDate(from), dateEnd: isoDate(to) });
	}

	function clear() {
		open = false;
		setServerParams({ dateStart: null, dateEnd: null });
	}

	const presets = $derived([
		{ label: L.dateToday, days: 0 },
		{ label: L.dateLast7, days: 6 },
		{ label: L.dateLast30, days: 29 },
		{ label: L.dateLast90, days: 89 },
		{ label: L.dateLast12Months, days: 364 }
	]);
</script>

<div class="flex items-center">
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant={summary ? 'default' : 'outline'} class="gap-2">
					<CalendarRange class="size-4" />
					{label}{summary ? `: ${summary}` : ''}
				</Button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content class="flex w-auto flex-col gap-3 p-3" align="start">
			<div class="flex flex-wrap gap-2">
				{#each presets as preset (preset.label)}
					<Button
						variant="outline"
						size="sm"
						onclick={() => apply(today(tz).subtract({ days: preset.days }), today(tz))}
					>
						{preset.label}
					</Button>
				{/each}
			</div>

			<CalendarSwitch value={kind} onchange={(k) => preference.set(k)} class="self-start" />
			<RangeCalendar
				bind:value={range}
				calendar={kind}
				locale={L.dateLocale}
				class="rounded-md border"
				captionLayout="dropdown"
			/>

			<div class="flex justify-end gap-2">
				{#if summary}
					<Button variant="ghost" size="sm" onclick={clear}>{L.dateClear}</Button>
				{/if}
				<Button
					size="sm"
					disabled={!range.start || !range.end}
					onclick={() => range.start && range.end && apply(range.start, range.end)}
				>
					{L.dateApply}
				</Button>
			</div>
		</Popover.Content>
	</Popover.Root>

	{#if summary}
		<Button variant="ghost" size="icon" aria-label={L.dateClearAria(label)} onclick={clear}>
			<X class="size-4" />
		</Button>
	{/if}
</div>
