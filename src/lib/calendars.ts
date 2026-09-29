/**
 * Ethiopian and Gregorian dates, side by side.
 *
 * The kit's date inputs let a person pick or type a date on either calendar and see it on the
 * other as they go. **What leaves an input is always a Gregorian `YYYY-MM-DD`**: the database
 * stores Gregorian dates and the server never has to know an Ethiopian one exists. Everything
 * here is pure — no Svelte, no DOM — so it is the same in the browser and on the server.
 *
 * The Ethiopian calendar is `@internationalized/date`'s `EthiopicCalendar` (Amete Mihret): twelve
 * months of 30 days and Pagume, the thirteenth, of 5 days (6 in the year before a Gregorian leap
 * year). Conversion goes through the Julian day, so it is exact in both directions.
 */
import {
	CalendarDate,
	EthiopicCalendar,
	GregorianCalendar,
	parseDate,
	toCalendar,
	toCalendarDate,
	type DateValue
} from '@internationalized/date';

export type CalendarKind = 'ethiopian' | 'gregorian';
export const CALENDAR_KINDS: readonly CalendarKind[] = ['ethiopian', 'gregorian'];

const ethiopic = new EthiopicCalendar();
const gregorian = new GregorianCalendar();

/** The other one. */
export const otherCalendar = (kind: CalendarKind): CalendarKind =>
	kind === 'ethiopian' ? 'gregorian' : 'ethiopian';

export function calendarSystem(kind: CalendarKind) {
	return kind === 'ethiopian' ? ethiopic : gregorian;
}

/** A date as it reads on `kind`: the same day, counted on that calendar. */
export function inCalendar(date: DateValue, kind: CalendarKind): CalendarDate {
	return toCalendarDate(toCalendar(date, calendarSystem(kind)));
}

/** A date as the database keeps it: Gregorian. */
export function toGregorian(date: DateValue): CalendarDate {
	return inCalendar(date, 'gregorian');
}

/** `YYYY-MM-DD`, Gregorian, whatever calendar the date was picked on. */
export function isoDate(date: DateValue): string {
	return toGregorian(date).toString();
}

/** A stored `YYYY-MM-DD` as a date, or null when it is empty or not a real day. */
export function parseIsoDate(value: string | null | undefined): CalendarDate | null {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	try {
		const date = parseDate(value);
		// parseDate accepts 2026-02-31 by constraining it to the 28th; a stored date that does not
		// round-trip is not a date.
		return date.toString() === value ? date : null;
	} catch {
		return null;
	}
}

/** Day, month and year of a stored date, on `kind`. */
export function partsOf(value: string | DateValue | null | undefined, kind: CalendarKind) {
	const date = typeof value === 'string' || value == null ? parseIsoDate(value) : value;
	if (!date) return null;
	const d = inCalendar(date, kind);
	return { year: d.year, month: d.month, day: d.day };
}

export function monthsInYear(kind: CalendarKind, year: number) {
	return calendarSystem(kind).getMonthsInYear(new CalendarDate(calendarSystem(kind), year, 1, 1));
}

export function daysInMonth(kind: CalendarKind, year: number, month: number) {
	return calendarSystem(kind).getDaysInMonth(
		new CalendarDate(calendarSystem(kind), year, month, 1)
	);
}

/**
 * A day typed as parts on `kind`, as the Gregorian `YYYY-MM-DD` to store — or null when there is
 * no such day (ጳጉሜ 7, 31 September). Nothing is rounded: a wrong day is refused, not moved.
 */
export function fromParts(kind: CalendarKind, year: number, month: number, day: number) {
	if (![year, month, day].every(Number.isInteger)) return null;
	if (year < 1 || year > 9999 || month < 1 || day < 1) return null;
	if (month > monthsInYear(kind, year) || day > daysInMonth(kind, year, month)) return null;
	return isoDate(new CalendarDate(calendarSystem(kind), year, month, day));
}

/**
 * The locale a calendar grid is drawn in. Ethiopian dates are always written with the Amharic
 * month names — as every date elsewhere in the kit is — whatever the interface language;
 * Gregorian ones in the interface's own language.
 */
export function calendarLocale(kind: CalendarKind, uiLocale = 'en-GB') {
	return kind === 'ethiopian' ? 'am-ET-u-ca-ethiopic' : `${uiLocale}-u-ca-gregory`;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(kind: CalendarKind, uiLocale: string, month: 'long' | 'short') {
	const key = `${kind}|${uiLocale}|${month}`;
	let f = formatters.get(key);
	if (!f) {
		f = new Intl.DateTimeFormat(kind === 'ethiopian' ? 'am-ET' : uiLocale, {
			year: 'numeric',
			month,
			day: 'numeric',
			calendar: kind === 'ethiopian' ? 'ethiopic' : 'gregory',
			timeZone: 'UTC'
		});
		formatters.set(key, f);
	}
	return f;
}

/** A date written out on `kind`: "19 መስከረም 2019" or "29 Sept 2026". Empty for no date. */
export function formatDateIn(
	value: string | DateValue | null | undefined,
	kind: CalendarKind,
	uiLocale = 'en-GB',
	month: 'long' | 'short' = 'long'
) {
	const date = typeof value === 'string' || value == null ? parseIsoDate(value) : value;
	if (!date) return '';
	return formatter(kind, uiLocale, month).format(toGregorian(date).toDate('UTC'));
}

/** The months of `year` on `kind`, named, for a picker: 13 on the Ethiopian calendar. */
export function monthNames(kind: CalendarKind, year: number, uiLocale = 'en-GB') {
	const names = new Intl.DateTimeFormat(kind === 'ethiopian' ? 'am-ET' : uiLocale, {
		month: 'long',
		calendar: kind === 'ethiopian' ? 'ethiopic' : 'gregory',
		timeZone: 'UTC'
	});
	const system = calendarSystem(kind);
	return Array.from({ length: monthsInYear(kind, year) }, (_, i) => ({
		value: i + 1,
		name: names.format(toGregorian(new CalendarDate(system, year, i + 1, 1)).toDate('UTC'))
	}));
}
