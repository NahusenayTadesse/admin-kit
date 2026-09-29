<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import * as RangeCalendar from './index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { ButtonVariant } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import { getLocalTimeZone, isEqualMonth, today, type DateValue } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { calendarLocale, inCalendar, toGregorian, type CalendarKind } from '$lib/calendars';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		weekdayFormat = 'short',
		class: className,
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
	}: WithoutChildrenOrChild<RangeCalendarPrimitive.RootProps> & {
		/**
		 * Draw the grid on this calendar. With it, `value` and `placeholder` stay **Gregorian** on
		 * the way in and out — the grid shows the same days counted on `kind` — so whoever binds
		 * them never sees an Ethiopian date. Without it, the calendar is whatever the values are in.
		 */
		calendar?: CalendarKind;
		buttonVariant?: ButtonVariant;
		captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
		months?: RangeCalendarPrimitive.MonthSelectProps['months'];
		years?: RangeCalendarPrimitive.YearSelectProps['years'];
		monthFormat?: RangeCalendarPrimitive.MonthSelectProps['monthFormat'];
		yearFormat?: RangeCalendarPrimitive.YearSelectProps['yearFormat'];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} = $props();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith('dropdown')) return 'short';
		return 'long';
	});

	type Range = { start: DateValue | undefined; end: DateValue | undefined } | undefined;
	const show = (d: DateValue | undefined) => (d && kind ? inCalendar(d, kind) : d);
	const store = (d: DateValue | undefined) => (d && kind ? toGregorian(d) : d);
	// Memoised, so bits-ui sees the same object until the value or the calendar really changes.
	const shownValue = $derived.by(() => {
		const v = value as Range;
		return kind && v ? { start: show(v.start), end: show(v.end) } : v;
	});
	function setValue(next: Range) {
		value = (kind && next ? { start: store(next.start), end: store(next.end) } : next) as never;
	}
	const anchor = (v: Range) => v?.end ?? v?.start;

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

<RangeCalendarPrimitive.Root
	bind:ref
	bind:value={() => shownValue as never, (v) => setValue(v as never)}
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
		<RangeCalendar.Months>
			<RangeCalendar.Nav>
				<RangeCalendar.PrevButton variant={buttonVariant} />
				<RangeCalendar.NextButton variant={buttonVariant} />
			</RangeCalendar.Nav>
			{#each months as month, monthIndex (month)}
				<RangeCalendar.Month>
					<RangeCalendar.Header>
						<RangeCalendar.Caption
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
					</RangeCalendar.Header>

					<RangeCalendar.Grid>
						<RangeCalendar.GridHead>
							<RangeCalendar.GridRow class="select-none">
								{#each weekdays as weekday (weekday)}
									<RangeCalendar.HeadCell>
										{weekday.slice(0, 2)}
									</RangeCalendar.HeadCell>
								{/each}
							</RangeCalendar.GridRow>
						</RangeCalendar.GridHead>
						<RangeCalendar.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<RangeCalendar.GridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<RangeCalendar.Cell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value)
												})}
											{:else}
												<RangeCalendar.Day />
											{/if}
										</RangeCalendar.Cell>
									{/each}
								</RangeCalendar.GridRow>
							{/each}
						</RangeCalendar.GridBody>
					</RangeCalendar.Grid>
				</RangeCalendar.Month>
			{/each}
		</RangeCalendar.Months>
	{/snippet}
</RangeCalendarPrimitive.Root>
