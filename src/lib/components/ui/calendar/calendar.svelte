<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	// Not `* as Calendar`: the packaged .d.ts would then declare two `Calendar`s, and an app importing
	// this component gets TypeScript's "Cannot access ambient const enums" error.
	import * as Parts from './index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { ButtonVariant } from '../button/button.svelte';
	import { getLocalTimeZone, isEqualMonth, today, type DateValue } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { calendarLocale, inCalendar, toGregorian, type CalendarKind } from '$lib/calendars';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = 'short',
		buttonVariant = 'ghost',
		captionLayout = 'label',
		locale = 'en-US',
		months: monthsProp,
		years,
		monthFormat: monthFormatProp,
		yearFormat = 'numeric',
		day,
		disableDaysOutsideMonth = false,
		calendar: kind = undefined,
		minValue,
		maxValue,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
		/**
		 * Draw the grid on this calendar. With it, `value` and `placeholder` stay **Gregorian** on
		 * the way in and out — the grid shows the same days counted on `kind` — so whoever binds
		 * them never sees an Ethiopian date. Without it, the calendar is whatever the values are in.
		 */
		calendar?: CalendarKind;
		buttonVariant?: ButtonVariant;
		captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
		months?: CalendarPrimitive.MonthSelectProps['months'];
		years?: CalendarPrimitive.YearSelectProps['years'];
		monthFormat?: CalendarPrimitive.MonthSelectProps['monthFormat'];
		yearFormat?: CalendarPrimitive.YearSelectProps['yearFormat'];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} = $props();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith('dropdown')) return 'short';
		return 'long';
	});

	type Value = DateValue | DateValue[] | undefined;
	const show = (d: DateValue) => (kind ? inCalendar(d, kind) : d);
	const store = (d: DateValue) => (kind ? toGregorian(d) : d);
	// Memoised, so bits-ui sees the same object until the value or the calendar really changes.
	const shownValue = $derived.by(() => {
		const v = value as Value;
		if (!kind || !v) return v;
		return Array.isArray(v) ? v.map(show) : show(v);
	});
	function setValue(next: Value) {
		value = (kind && next ? (Array.isArray(next) ? next.map(store) : store(next)) : next) as never;
	}
	const anchor = (v: Value) => (Array.isArray(v) ? v[v.length - 1] : v);

	/**
	 * The month in view, on `kind`: the value's month (so a date typed or preset elsewhere, or a
	 * switch of calendar, brings it into view), else the given placeholder, else today. The
	 * arrows and dropdowns move it by writing to it; the next change of value moves it back.
	 */
	let shownPlaceholder = $derived.by<DateValue | undefined>(() => {
		if (!kind) return undefined;
		const start = anchor(value as never) ?? untrack(() => placeholder);
		return inCalendar(start ?? today(getLocalTimeZone()), kind);
	});
	const placeholderBinding = {
		get: () => (kind ? shownPlaceholder : placeholder),
		set: (p: DateValue | undefined) => {
			if (kind) {
				shownPlaceholder = p;
				placeholder = p && toGregorian(p);
			} else {
				placeholder = p;
			}
		}
	};

	const shownLocale = $derived(kind ? calendarLocale(kind, locale) : locale);
	/** Thirteen months on the Ethiopian calendar: Pagume is a month of its own. */
	const shownMonths = $derived(
		kind === 'ethiopian' ? Array.from({ length: 13 }, (_, i) => i + 1) : monthsProp
	);
	const shownMin = $derived(minValue && kind ? inCalendar(minValue, kind) : minValue);
	const shownMax = $derived(maxValue && kind ? inCalendar(maxValue, kind) : maxValue);
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={() => shownValue as never, (v) => setValue(v as never)}
	bind:ref
	bind:placeholder={placeholderBinding.get, placeholderBinding.set}
	minValue={shownMin}
	maxValue={shownMax}
	{weekdayFormat}
	{disableDaysOutsideMonth}
	class={cn(
		'group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
		className
	)}
	locale={shownLocale}
	{monthFormat}
	{yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<Parts.Months>
			<Parts.Nav>
				<Parts.PrevButton variant={buttonVariant} />
				<Parts.NextButton variant={buttonVariant} />
			</Parts.Nav>
			{#each months as month, monthIndex (month)}
				<Parts.Month>
					<Parts.Header>
						<Parts.Caption
							{captionLayout}
							months={shownMonths}
							{monthFormat}
							{years}
							{yearFormat}
							month={month.value}
							bind:placeholder={placeholderBinding.get, placeholderBinding.set}
							locale={shownLocale}
							{monthIndex}
						/>
					</Parts.Header>
					<Parts.Grid>
						<Parts.GridHead>
							<Parts.GridRow class="select-none">
								{#each weekdays as weekday (weekday)}
									<Parts.HeadCell>
										{weekday.slice(0, 2)}
									</Parts.HeadCell>
								{/each}
							</Parts.GridRow>
						</Parts.GridHead>
						<Parts.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<Parts.GridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<Parts.Cell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value)
												})}
											{:else}
												<Parts.Day />
											{/if}
										</Parts.Cell>
									{/each}
								</Parts.GridRow>
							{/each}
						</Parts.GridBody>
					</Parts.Grid>
				</Parts.Month>
			{/each}
		</Parts.Months>
	{/snippet}
</CalendarPrimitive.Root>
