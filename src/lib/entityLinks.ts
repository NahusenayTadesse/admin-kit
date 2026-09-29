/**
 * Where each kind of record lives, so a mention of one can link to it.
 *
 * Each app passes its own map to `<KitProvider entities={…}>`:
 *
 *     { employee: '/dashboard/employees/single', user: '/dashboard/admin-panel/users' }
 *
 * and a table column says `entity: 'employee'` rather than knowing the URL. A link the viewer
 * cannot open is worse than no link — it advertises a page and lands on a 403 — so the name is a
 * link only when `canVisit` says the viewer may open the target, and plain text otherwise.
 */
export type EntityRoutes = Record<string, string>;

/** The path to one record's page, or null when there is no id or no route for the kind. */
export function entityPath(
	routes: EntityRoutes,
	kind: string,
	id: string | number | null | undefined
): string | null {
	if (id === null || id === undefined || id === '') return null;
	const base = routes[kind];
	return base ? `${base}/${id}` : null;
}

/**
 * The href to render for this mention, or `null` to render the name as plain text — because there
 * is no record to point at, or because the viewer may not open it.
 */
export function entityHref(
	routes: EntityRoutes,
	kind: string,
	id: string | number | null | undefined,
	canOpen: (path: string) => boolean
): string | null {
	const path = entityPath(routes, kind, id);
	if (!path) return null;

	return canOpen(path) ? path : null;
}
