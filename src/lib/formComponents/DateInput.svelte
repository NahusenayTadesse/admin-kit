<script lang="ts">
	import DatePicker from './DatePicker.svelte';
	import type { CalendarKind } from '$lib/calendars';

	/**
	 * A date field for a plain `<form>` — a GET filter bar, say — where `InputComp` (which wants
	 * a superform) does not fit. The picker is the same as everywhere: Ethiopian or Gregorian,
	 * switchable, typed or clicked. What the form submits under `name` is a Gregorian
	 * `YYYY-MM-DD`, or nothing when the field is left empty.
	 *
	 *     <form method="GET"><DateInput name="from" value={filters.from} /> …</form>
	 */
	let {
		name,
		value = $bindable(''),
		allowEmpty = true,
		oldDays = true,
		futureDays = false,
		year = true,
		calendar = undefined,
		id = undefined
	}: {
		name: string;
		/** Gregorian `YYYY-MM-DD`, or empty. */
		value?: string | null;
		allowEmpty?: boolean;
		oldDays?: boolean;
		futureDays?: boolean;
		year?: boolean;
		calendar?: CalendarKind;
		/** For a `<label for>`. */
		id?: string;
	} = $props();
</script>

<DatePicker
	bind:data={() => value ?? '', (v) => (value = v)}
	{allowEmpty}
	{oldDays}
	{futureDays}
	{year}
	{calendar}
	{id}
/>
<input type="hidden" {name} value={value ?? ''} />
