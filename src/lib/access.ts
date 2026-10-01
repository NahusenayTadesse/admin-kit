/**
 * Route prefixes mapped to the permission they need — who may open what.
 *
 * Each app writes its own rules and builds its checker once, in a module both the server hook and
 * the browser can import (e.g. `src/lib/access.ts`):
 *
 *     export const access = createAccess({
 *       root: '/dashboard',
 *       rules: [
 *         { prefix: '/dashboard', permission: null, exact: true },
 *         { prefix: '/dashboard/files/', permission: null },
 *         { prefix: '/dashboard/admin-panel', permission: 'settings.manage' },
 *         …
 *       ]
 *     });
 *
 * `hooks.server.ts` enforces it on every request with `access.ruleForPath`; the menus read the
 * same object (through `<KitProvider>`) to decide what to render, so a button never leads
 * somewhere the click would 403. Order matters: the first matching prefix wins, so specific paths
 * come before general ones. A prefix matches whole segments: `/dashboard/sales` is that page and
 * everything below it, and not `/dashboard/salesforce`.
 */

export type RouteRule = {
	prefix: string;
	/**
	 * The permission the prefix sits behind, or `null` for "any signed-in user is enough".
	 *
	 * `null` is a decision on the record, not an absence of one. Because unmatched paths are
	 * refused, the only way a page becomes reachable without a permission is for somebody to write
	 * `null` here and mean it.
	 */
	permission: string | null;
	/**
	 * Match the path exactly rather than as a prefix. The root itself needs this: as a prefix rule
	 * it would match every page and hand default-deny back to default-allow in one line.
	 */
	exact?: boolean;
};

export type Access = {
	/** The area closed by default. Paths outside it are not this module's business. */
	root: string;
	rules: readonly RouteRule[];
	/** Whether `pathname` is inside `root`, and so closed unless a rule opens it. */
	guards(pathname: string): boolean;
	/** The first rule matching `pathname`, or undefined when none claims it. */
	ruleForPath(pathname: string): RouteRule | undefined;
	/** The permission `pathname` sits behind, or undefined when it needs none (or has no rule). */
	permissionForPath(pathname: string): string | undefined;
	/**
	 * Whether a user holding `permList` may open `pathname`. **Closed by default**: a path under
	 * `root` that no rule claims returns `false`, so forgetting a rule is a 403 on the first click
	 * instead of a hole nobody sees.
	 */
	canVisit(pathname: string, permList: readonly string[] | undefined | null): boolean;
};

/**
 * The path as the router reads it, or null when it cannot be read at all.
 *
 * SvelteKit matches a route against the *decoded* path and leaves `event.url.pathname` as it was
 * sent, so `/dashboard/admin-panel/%72oles` opens the roles page while reading, to a plain string
 * comparison, like a path no specific rule names. Compared raw, it fell through to the general
 * `/dashboard/admin-panel` rule, and `/%64ashboard/…` was not under the root at all. Every check
 * here therefore decodes first, the same way the router does (`%25` stays, so a literal percent
 * sign is not decoded twice).
 *
 * A query or a fragment is dropped: the menus pass whole hrefs to `canVisit`, and
 * `/dashboard/reports?tab=sales` is the reports page.
 */
function routedPath(pathname: string): string | null {
	try {
		return pathname.split(/[?#]/)[0].split('%25').map(decodeURI).join('%25');
	} catch {
		return null;
	}
}

/**
 * Whether `pathname` is `prefix` or below it, on a segment boundary: `/dashboard/sales` claims
 * `/dashboard/sales/7` and not `/dashboard/salesforce`.
 */
function isWithin(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
}

export function createAccess({
	root = '/dashboard',
	rules
}: {
	root?: string;
	rules: readonly RouteRule[];
}): Access {
	const ruleFor = (path: string) =>
		rules.find((rule) =>
			rule.exact ? path === rule.prefix || path === rule.prefix + '/' : isWithin(path, rule.prefix)
		);

	const ruleForPath = (pathname: string) => {
		const path = routedPath(pathname);
		return path === null ? undefined : ruleFor(path);
	};

	const guards = (pathname: string) => {
		const path = routedPath(pathname);
		// A path that cannot be decoded is nobody's page; closed, like any other unclaimed one.
		return path === null || isWithin(path, root);
	};

	return {
		root,
		rules,
		guards,
		ruleForPath,
		permissionForPath: (pathname) => ruleForPath(pathname)?.permission ?? undefined,
		canVisit(pathname, permList) {
			if (!guards(pathname)) return true;

			const rule = ruleForPath(pathname);
			if (!rule) return false;
			if (rule.permission === null) return true;

			return (permList ?? []).includes(rule.permission);
		}
	};
}

/**
 * The permissions to check a viewer against. A super admin holds every permission by definition,
 * so they get every one the rules name — they open any page that has a rule, and a page with no
 * rule stays closed to them too, which is what surfaces a forgotten rule.
 */
export function effectivePermissions(
	access: Access,
	permList: readonly string[] | undefined | null,
	isSuperAdmin = false
): readonly string[] {
	if (!isSuperAdmin) return permList ?? [];
	const named = access.rules.flatMap((rule) => (rule.permission ? [rule.permission] : []));
	return [...new Set([...(permList ?? []), ...named])];
}

/**
 * The refusal `hooks.server.ts` should raise for `pathname`, or null to let it through.
 *
 *     const refusal = gateRefusal(access, event.url.pathname, event.locals.permList);
 *     if (refusal) error(403, refusal);
 *
 * The two refusals say different things on purpose. "You lack the permission" is for the user and
 * their admin; "no permission is defined" is for whoever built the page, and it is the only signal
 * that the rule was never written.
 */
export function gateRefusal(
	access: Access,
	pathname: string,
	permList: readonly string[] | undefined | null
): string | null {
	if (!access.guards(pathname)) return null;

	const match = access.ruleForPath(pathname);
	if (!match) {
		return 'No permission is defined for this page, so it is closed. An administrator must add a rule for it.';
	}
	if (match.permission !== null && !(permList ?? []).includes(match.permission)) {
		return 'You are not allowed to view this page. Talk to an admin to change your permissions.';
	}
	return null;
}
