import type { Component } from 'svelte';
import type { IconProps } from '@lucide/svelte';

/**
 * The shape of an app's menu. Each app keeps its own `NAVIGATION: NavItem[]` and hands it to
 * `<KitProvider>`; the sidebar and the search palette both read that one list, so they cannot
 * drift apart.
 *
 * **No permissions here.** Each reader filters with the app's `access.canVisit`, the same rule the
 * server gate applies to that URL, so a menu entry cannot disagree with the gate in front of it.
 */

/** One menu entry. A group is an entry with `items`; its own `url` is where the group lives. */
export type NavItem = {
	title: string;
	url: string;
	icon: Component<IconProps>;
	items?: NavItem[];
	/** An app-defined grouping, e.g. which card of an admin index the screen belongs on. */
	section?: string;
};

/** A page the search palette offers that the sidebar leaves out to stay short. */
export type SearchEntry = { label: string; url: string };

function isUnder(pathname: string, url: string): boolean {
	return pathname === url || pathname.startsWith(url + '/');
}

/**
 * The group the current page belongs to, for highlighting: the one holding the longest link that
 * `pathname` falls under.
 *
 * A prefix test on the group's own URL cannot do this — several groups can hold pages under the
 * same prefix. The longest matching child is the most specific claim, so it decides. `home` (the
 * dashboard index) is matched exactly, or every page would fall under it.
 */
export function activeGroup(
	items: NavItem[],
	pathname: string,
	home = '/dashboard'
): string | undefined {
	let best: { title: string; length: number } | undefined;

	for (const item of items) {
		for (const link of item.items ?? [item]) {
			const matches = link.url === home ? pathname === link.url : isUnder(pathname, link.url);
			if (matches && link.url.length > (best?.length ?? -1)) {
				best = { title: item.title, length: link.url.length };
			}
		}
	}

	return best?.title;
}

/** The menu with everything the viewer cannot open removed, and groups left empty dropped. */
export function visibleNavigation(items: NavItem[], canOpen: (url: string) => boolean): NavItem[] {
	return items.flatMap((item) => {
		if (!canOpen(item.url)) return [];
		if (!item.items) return [item];

		const children = item.items.filter((child) => canOpen(child.url));
		return children.length ? [{ ...item, items: children }] : [];
	});
}

/**
 * The menu as a flat list for the search palette, one entry per address, filtered to what the
 * viewer can open.
 *
 * A child is labelled with its group — "Approvals › Refunds", not "Refunds" — because the palette
 * has no tree to give it context. Where two entries share an address, the first wins.
 */
export function searchEntries(
	items: NavItem[],
	canOpen: (url: string) => boolean,
	extra: SearchEntry[] = []
): SearchEntry[] {
	const entries: SearchEntry[] = [];

	for (const item of items) {
		if (!item.items) entries.push({ label: item.title, url: item.url });
		for (const child of item.items ?? []) {
			entries.push({ label: `${item.title} › ${child.title}`, url: child.url });
		}
	}
	entries.push(...extra);

	const seen = new Set<string>();
	return entries.filter((entry) => {
		if (seen.has(entry.url) || !canOpen(entry.url)) return false;
		seen.add(entry.url);
		return true;
	});
}
