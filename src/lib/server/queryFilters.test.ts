import { describe, expect, it } from 'vitest';
import { parseTableQuery } from './queryFilters';

const query = (search: string) => parseTableQuery(new URL(`http://localhost/list${search}`));

describe('parseTableQuery', () => {
	it('reads a date window off the URL', () => {
		const parsed = query('?dateStart=2026-09-01&dateEnd=2026-09-30');

		expect(parsed.dateStart).toBe('2026-09-01');
		expect(parsed.dateEnd).toBe('2026-09-30');
	});

	// A hand-typed date used to reach the date filter, which split it on `-` and threw: a 500.
	it('drops a date that is not a real YYYY-MM-DD, like any other stale param', () => {
		expect(query('?dateStart=abc&dateEnd=2026-09-30').dateStart).toBeNull();
		expect(query('?dateStart=2026-13-45&dateEnd=2026-09-30').dateStart).toBeNull();
		expect(query('?dateStart=2026-9-1&dateEnd=2026-09-30').dateStart).toBeNull();
	});

	it('clamps the page size and ignores a sort it was not told about', () => {
		const parsed = query('?pageSize=5000&sort=password&page=0');

		expect(parsed.pageSize).toBe(100);
		expect(parsed.sort).toBeNull();
		expect(parsed.page).toBe(1);
	});
});
