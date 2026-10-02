import { beforeEach, describe, expect, it, vi } from 'vitest';

const goto = vi.fn();
const url = { current: new URL('http://localhost/dashboard/staff') };

vi.mock('$app/navigation', () => ({ goto: (...args: unknown[]) => goto(...args) }));
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return url.current;
		}
	}
}));

const { applyQueryToUrl } = await import('./queryFilters');

const target = () => new URL(goto.mock.calls.at(-1)![0], 'http://localhost').searchParams;

describe('applyQueryToUrl', () => {
	beforeEach(() => {
		goto.mockClear();
		url.current = new URL('http://localhost/dashboard/staff?page=4&section=pay');
	});

	it('writes the query and goes back to the first page, keeping params it was not given', () => {
		applyQueryToUrl({
			search: 'abebe',
			pageSize: 50,
			dateRange: { start: '2026-09-01', end: '2026-09-30' },
			customFilters: { status: 'active' }
		});

		const params = target();
		expect(params.get('search')).toBe('abebe');
		expect(params.get('pageSize')).toBe('50');
		expect(params.get('page')).toBe('1');
		expect(params.get('dateStart')).toBe('2026-09-01');
		expect(params.get('dateEnd')).toBe('2026-09-30');
		expect(params.get('status')).toBe('active');
		expect(params.get('section')).toBe('pay');
	});

	it('takes a cleared search, range and filter out of the URL', () => {
		url.current = new URL(
			'http://localhost/dashboard/staff?search=x&dateStart=2026-09-01&dateEnd=2026-09-30&status=active'
		);

		applyQueryToUrl({ search: '', pageSize: 20, dateRange: null, customFilters: { status: null } });

		const params = target();
		for (const key of ['search', 'dateStart', 'dateEnd', 'status'])
			expect(params.has(key)).toBe(false);
	});
});
