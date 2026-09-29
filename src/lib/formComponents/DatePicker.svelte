<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { CalendarIcon } from '@lucide/svelte';
	import {
		formatDateIn,
		isoDate,
		otherCalendar,
		parseIsoDate,
		type CalendarKind
	} from '$lib/calendars';
	import { useCalendar } from '$lib/calendarPreference.svelte';
	import CalendarSwitch from './CalendarSwitch.svelte';
	import DateFields from './DateFields.svelte';

	/**
	 * One date, picked on the Ethiopian or the Gregorian calendar — switchable in the picker, and
	 * typed or clicked — with the same day on the other calendar shown alongside.
	 *
	 * **`data` is always a Gregorian `YYYY-MM-DD`**, whichever calendar is on screen: that is what
	 * the form posts and what the database keeps. The calendar only changes what is shown.
	 */
	let {
		data = $bindable(),
		oldDays = false,
		year = false,
		futureDays = false,
		allowEmpty = false,
		calendar: fixedCalendar = undefined,
		id = undefined
	}: {
		data: string;
		/** Allow days before today. Off: the earliest day offered is today. */
		oldDays?: boolean;
		/** A year dropdown in the calendar's heading, for dates years away. */
		year?: boolean;
		/** Refuse days after today (a birth date, a delivery that already arrived). */
		futureDays?: boolean;
		/**
		 * Let the field stay empty, and offer a way back to empty.
		 *
		 * Off by default, because most dates here are required and starting on today saves a click.
		 * On an *optional* date that default is a lie the form tells silently: a licence expiry left
		 * alone was saved as today, and the providers list then said the licence expired in zero
		 * days. A date nobody entered has to stay blank.
		 */
		allowEmpty?: boolean;
		/** Always this calendar, with no switch. Otherwise the person's choice (see `useCalendar`). */
		calendar?: CalendarKind;
		/** For a `<label for>`: goes on the button that opens the picker. */
		id?: string;
	} = $props();

	const L = useLabels();
	const preference = useCalendar();
	// The calendar this browser chose last time; after the first render, so the server's matches.
	$effect(() => preference.restore());

	const kind = $derived(fixedCalendar ?? preference.kind);
	const other = $derived(otherCalendar(kind));

	const tz = getLocalTimeZone();
	const todayIso = today(tz).toString();
	const min = $derived(oldDays ? undefined : todayIso);
	const max = $derived(futureDays ? todayIso : undefined);

	/*
	 * `data` is the only copy of the date; the calendar and the typed fields read it and write it
	 * back. (A private copy, seeded once, once let a value written from outside after mounting be
	 * overwritten with a stale one: every booking silently landed on today.)
	 */
	const value = $derived(parseIsoDate(data) ?? today(tz));

	// An empty field still starts at today — but only when it is empty, so it can never replace a
	// date somebody set, and never when the field may be left blank.
	$effect(() => {
		if (!data && !allowEmpty) untrack(() => (data = value.toString()));
	});

	/** Empty and allowed to be: the trigger says so rather than showing a date nobody chose. */
	const isEmpty = $derived(allowEmpty && !data);
	const shown = $derived(isEmpty ? L.notSet : formatDateIn(value, kind, L.dateLocale));
	const alongside = $derived(isEmpty ? '' : formatDateIn(value, other, L.dateLocale, 'short'));

	const presets = $derived(
		[
			{ label: L.dateToday, days: 0 },
			{ label: L.dateTomorrow, days: 1 },
			{ label: L.dateIn3Days, days: 3 },
			{ label: L.dateInAWeek, days: 7 },
			{ label: L.dateIn2Weeks, days: 14 }
		]
			.map((p) => ({ ...p, iso: today(tz).add({ days: p.days }).toString() }))
			.filter((p) => (!min || p.iso >= min) && (!max || p.iso <= max))
	);
</script>

<Popover.Root>
	<Popover.Trigger
		{id}
		class={cn(
			buttonVariants({
				variant: 'outline',
				class: 'h-auto min-h-9 justify-between py-1.5'
			})
		)}
	>
		<span class="flex items-center gap-2">
			<CalendarIcon />
			<span class="flex flex-col items-start leading-tight">
				<span>{shown}</span>
				{#if alongside}
					<span class="text-xs font-normal text-muted-foreground">{alongside}</span>
				{/if}
			</span>
		</span>
	</Popover.Trigger>

	<Popover.Content class="flex w-auto max-w-[20rem] flex-col gap-3 p-3">
		<div class="flex items-center justify-between gap-2">
			{#if fixedCalendar}
				<span class="text-xs text-muted-foreground">
					{kind === 'ethiopian' ? L.calendarEthiopian : L.calendarGregorian}
				</span>
			{:else}
				<CalendarSwitch value={kind} onchange={(k) => preference.set(k)} />
			{/if}
			{#if allowEmpty && data}
				<Button variant="ghost" size="sm" onclick={() => (data = '')}>{L.clear}</Button>
			{/if}
		</div>

		<DateFields bind:value={() => data ?? '', (v) => (data = v)} {kind} {min} {max} />

		<Calendar
			calendar={kind}
			locale={L.dateLocale}
			type="single"
			captionLayout={year ? 'dropdown-years' : 'label'}
			minValue={parseIsoDate(min) ?? undefined}
			maxValue={parseIsoDate(max) ?? undefined}
			bind:value={() => value, (next) => next && (data = isoDate(next))}
			class="rounded-md border"
		/>

		{#if presets.length}
			<div class="flex flex-wrap gap-2">
				{#each presets as preset (preset.days)}
					<Button variant="outline" size="sm" class="flex-1" onclick={() => (data = preset.iso)}>
						{preset.label}
					</Button>
				{/each}
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
