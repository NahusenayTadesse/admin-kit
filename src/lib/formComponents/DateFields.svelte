<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Input } from '$lib/components/ui/input/index';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import {
		formatDateIn,
		fromParts,
		inCalendar,
		monthNames,
		otherCalendar,
		partsOf,
		type CalendarKind
	} from '$lib/calendars';

	/**
	 * A date typed as day, month and year on the chosen calendar, with the same day on the other
	 * calendar written underneath as you type. `value` is only ever a Gregorian `YYYY-MM-DD`: a
	 * complete, real day is converted and written; anything else (half-typed, ጳጉሜ 7) is not, and
	 * says why.
	 */
	let {
		value = $bindable(''),
		kind,
		min = undefined,
		max = undefined
	}: {
		value?: string;
		kind: CalendarKind;
		/** Earliest and latest allowed, as Gregorian `YYYY-MM-DD`. */
		min?: string;
		max?: string;
	} = $props();

	const L = useLabels();
	const id = $props.id();

	// What is in the boxes: the value's parts on `kind`, until someone types — then what they
	// typed, until the value changes again.
	const parts = $derived(partsOf(value, kind));
	let day = $derived<number | null>(parts?.day ?? null);
	let month = $derived<number | null>(parts?.month ?? null);
	let year = $derived<number | null>(parts?.year ?? null);
	let problem = $state<string | null>(null);

	const thisYear = $derived(inCalendar(today(getLocalTimeZone()), kind).year);
	const months = $derived(monthNames(kind, year ?? thisYear, L.dateLocale));
	const other = $derived(otherCalendar(kind));
	const otherName = $derived(
		other === 'ethiopian' ? L.calendarEthiopianShort : L.calendarGregorianShort
	);

	function commit() {
		if (!day || !month || !year) {
			problem = null;
			return;
		}
		const iso = fromParts(kind, Number(year), Number(month), Number(day));
		if (!iso) {
			problem = L.dateNoSuchDay;
			return;
		}
		if ((min && iso < min) || (max && iso > max)) {
			problem = L.dateOutOfRange;
			return;
		}
		problem = null;
		value = iso;
	}
</script>

<div class="flex w-full flex-col gap-1">
	<div class="grid grid-cols-[4rem_1fr_5rem] gap-2">
		<label class="flex flex-col gap-1 text-xs text-muted-foreground" for="{id}-day">
			{L.dateDay}
			<Input
				id="{id}-day"
				type="number"
				inputmode="numeric"
				min="1"
				max="31"
				class="h-8"
				bind:value={day}
				oninput={commit}
			/>
		</label>
		<label class="flex flex-col gap-1 text-xs text-muted-foreground" for="{id}-month">
			{L.dateMonth}
			<select
				id="{id}-month"
				class="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
				bind:value={month}
				onchange={commit}
			>
				{#each months as m (m.value)}
					<option value={m.value}>{m.name}</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-xs text-muted-foreground" for="{id}-year">
			{L.dateYear}
			<Input
				id="{id}-year"
				type="number"
				inputmode="numeric"
				min="1"
				max="9999"
				class="h-8"
				bind:value={year}
				oninput={commit}
			/>
		</label>
	</div>
	<p class="min-h-4 text-xs" aria-live="polite">
		{#if problem}
			<span class="text-destructive">{problem}</span>
		{:else if value}
			<span class="text-muted-foreground"
				>= {L.dateSameAs(formatDateIn(value, other, L.dateLocale), otherName)}</span
			>
		{/if}
	</p>
</div>
