import { sql } from 'drizzle-orm';
import type { MySqlColumn } from 'drizzle-orm/mysql-core';
import { localDayRange, localToday } from '$lib/time';

/** `YYYY-M-D` or `YYYY-MM-DD` as `YYYY-MM-DD` — some callers build the unpadded form. */
function paddedDay(day: string): string {
	const [y, m, d] = day.split('-');
	return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * A column within a period of whole local days, `start` to `end` inclusive — or, with neither,
 * the current local month.
 *
 * Compared as instants: from the local midnight that opens `start` to the one that closes `end`.
 * That is right for all three kinds of column this is used on — a `date`, a `timestamp` and a
 * `datetime` — when sessions run in UTC. A `BETWEEN` a bare date and a local end-of-day `Date`
 * would drop the first three hours of the period's first day from every `created_at` filter.
 */
export const currentMonthFilter = (dateField: MySqlColumn, start?: string, end?: string) => {
	if (start && end) {
		const from = localDayRange(paddedDay(start)).start;
		const until = localDayRange(paddedDay(end)).end;
		return sql`${dateField} >= ${from} AND ${dateField} < ${until}`;
	}

	const today = localToday();
	const [year, month] = today.split('-').map(Number);
	const first = `${year}-${String(month).padStart(2, '0')}-01`;
	const next =
		month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
	return sql`${dateField} >= ${localDayRange(first).start} AND ${dateField} < ${localDayRange(next).start}`;
};
