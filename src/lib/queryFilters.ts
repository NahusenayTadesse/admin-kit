/**
 * The client half of server-side table filtering — see
 * `$lib/server/queryFilters.ts` for the half that runs the query.
 *
 * The URL is what the load function reads, so a table in server mode changes
 * page, sort, search and filters by navigating. This is that navigation.
 */
import { goto } from '$app/navigation';
import { page } from '$app/state';

/**
 * Writes `overrides` onto the current URL and navigates. An empty value drops
 * its param rather than writing `?x=`, so a cleared filter leaves a clean URL
 * and `parseTableQuery` sees it as unset.
 *
 * Params it is not given are left alone — that is what lets the reports layout
 * keep its open section across a filter change.
 */
export function navigateWithQuery(overrides: Record<string, string | number | null>) {
	const params = new URLSearchParams(page.url.searchParams);

	for (const [key, value] of Object.entries(overrides)) {
		if (value === null || value === '') params.delete(key);
		else params.set(key, String(value));
	}

	goto(`${page.url.pathname}?${params.toString()}`, { keepFocus: true, noScroll: true });
}
