import { describe, expect, it } from 'vitest';
import { CalendarDate, EthiopicCalendar } from '@internationalized/date';
import {
	daysInMonth,
	formatDateIn,
	fromParts,
	inCalendar,
	isoDate,
	monthNames,
	monthsInYear,
	parseIsoDate,
	partsOf
} from './calendars';

describe('Ethiopian ⇄ Gregorian', () => {
	it('converts both ways exactly, and only ever hands back Gregorian', () => {
		expect(partsOf('2026-09-29', 'ethiopian')).toEqual({ year: 2019, month: 1, day: 19 });
		expect(fromParts('ethiopian', 2019, 1, 19)).toBe('2026-09-29');
		// Enkutatash: Meskerem 1 is 11 September, or the 12th after a Gregorian leap year's Pagume 6.
		expect(fromParts('ethiopian', 2018, 1, 1)).toBe('2025-09-11');
		expect(fromParts('ethiopian', 2016, 1, 1)).toBe('2023-09-12');
		// Genna (Ethiopian Christmas): Tahsas 29 = 7 January.
		expect(fromParts('ethiopian', 2018, 4, 29)).toBe('2026-01-07');
		// Whatever calendar a date was picked on, what is stored is Gregorian.
		expect(isoDate(new CalendarDate(new EthiopicCalendar(), 2019, 1, 19))).toBe('2026-09-29');
		expect(inCalendar(new CalendarDate(2026, 9, 29), 'ethiopian').toString()).toBe('2026-09-29');
	});

	it('knows Pagume: 13 months, 5 days, 6 before a Gregorian leap year', () => {
		expect(monthsInYear('ethiopian', 2018)).toBe(13);
		expect(daysInMonth('ethiopian', 2018, 13)).toBe(5);
		expect(daysInMonth('ethiopian', 2015, 13)).toBe(6);
		expect(fromParts('ethiopian', 2015, 13, 6)).toBe('2023-09-11');
		expect(fromParts('ethiopian', 2018, 13, 5)).toBe('2026-09-10');
	});

	it('refuses days that do not exist rather than moving them', () => {
		expect(fromParts('ethiopian', 2018, 13, 6)).toBeNull();
		expect(fromParts('ethiopian', 2018, 14, 1)).toBeNull();
		expect(fromParts('ethiopian', 2018, 1, 31)).toBeNull();
		expect(fromParts('gregorian', 2026, 2, 29)).toBeNull();
		expect(fromParts('gregorian', 2024, 2, 29)).toBe('2024-02-29');
		expect(fromParts('gregorian', 2026, 0, 10)).toBeNull();
		expect(fromParts('gregorian', 2026, 1.5, 10)).toBeNull();
		expect(parseIsoDate('2026-02-31')).toBeNull();
		expect(parseIsoDate('')).toBeNull();
		expect(parseIsoDate('29/09/2026')).toBeNull();
	});

	it('names and writes dates on either calendar', () => {
		const names = monthNames('ethiopian', 2018).map((m) => m.name);
		expect(names).toHaveLength(13);
		expect(names[0]).toBe('መስከረም');
		expect(names[12]).toMatch(/^ጳጉሜ/);
		expect(monthNames('gregorian', 2026, 'en-GB')[8].name).toBe('September');
		expect(formatDateIn('2026-09-29', 'ethiopian')).toMatch(/19.*መስከረም.*2019/);
		expect(formatDateIn('2026-09-29', 'gregorian', 'en-GB')).toBe('29 September 2026');
		expect(formatDateIn(null, 'gregorian')).toBe('');
	});
});
