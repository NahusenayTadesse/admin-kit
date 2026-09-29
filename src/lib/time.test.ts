import { describe, expect, it } from 'vitest';
import {
	addLocalDays,
	localClock,
	localDate,
	localDayRange,
	localMinutes,
	ethiopianClock,
	fromLocal,
	isIsoDate
} from './time';

/*
 * These pass whatever timezone the test process runs in — run them with TZ=UTC and
 * TZ=America/New_York as well as locally. That independence is the whole point of the module.
 */
describe('local time', () => {
	it('builds and reads back 9:00 in Addis as 06:00 UTC', () => {
		const nine = fromLocal('2026-09-13', '09:00');
		expect(nine.toISOString()).toBe('2026-09-13T06:00:00.000Z');
		expect(localClock(nine)).toBe('09:00');
		expect(localDate(nine)).toBe('2026-09-13');
		expect(localMinutes(nine)).toBe(540);
	});

	it('keeps a time just after local midnight on its local day, not the UTC one', () => {
		const early = fromLocal('2026-09-13', '01:30');
		expect(early.toISOString()).toBe('2026-09-12T22:30:00.000Z');
		expect(localDate(early)).toBe('2026-09-13');
	});

	it('bounds a local day by local midnights', () => {
		const { start, end } = localDayRange('2026-09-13');
		expect(start.toISOString()).toBe('2026-09-12T21:00:00.000Z');
		expect(end.toISOString()).toBe('2026-09-13T21:00:00.000Z');
	});

	it('moves dates across month ends', () => {
		expect(addLocalDays('2026-09-30', 1)).toBe('2026-10-01');
		expect(addLocalDays('2026-03-01', -1)).toBe('2026-02-28');
	});

	it('rejects dates that are not real', () => {
		expect(isIsoDate('2026-02-30')).toBe(false);
		expect(isIsoDate('13-09-2026')).toBe(false);
		expect(isIsoDate('2026-09-13')).toBe(true);
	});

	it('says the Ethiopian hour six behind the international one', () => {
		expect(ethiopianClock(fromLocal('2026-09-13', '09:00'))).toBe('ጠዋት 3:00');
		expect(ethiopianClock(fromLocal('2026-09-13', '13:30'))).toBe('ከሰዓት 7:30');
		expect(ethiopianClock(fromLocal('2026-09-13', '07:00'))).toBe('ጠዋት 1:00');
	});
});
