import { error, redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { effectivePermissions, gateRefusal, type Access } from '$lib/access';
import { loginPath } from '$lib/server/db';
import { serverLabels } from './labels';

/** What the viewer may do: their permission names, and whether they hold every one of them. */
export type Grant = { permList: string[]; isSuperAdmin: boolean };

/**
 * The kit's request hook: stamps the viewer's permissions onto `locals` and closes any page under
 * `access.root` the viewer may not open. Runs after the auth hook, so `locals.user` is known:
 *
 *     const handleKit = kitHandle({ access, permissions: async (event) => loadGrant(event) });
 *     export const handle = sequence(handleBetterAuth, handleKit);
 *
 * A super admin opens every page that has a rule (see `effectivePermissions`).
 *
 * **Signed out is refused here, not in the dashboard layout.** A layout's `load` runs after a
 * form action and never for a `+server.ts`, so a redirect written there sends a signed-out
 * visitor away from the *page* while their POST to `?/add` has already run. Under `access.root`
 * a request with no `locals.user` is sent to the login page (`configureKit({ loginPath })`, with
 * `?redirectTo=` naming where it was going) when it is a page view, and answered 401 otherwise.
 */
export function kitHandle({
	access,
	permissions,
	requireUser = true
}: {
	access: Access;
	/** The viewer's grant. Without it nobody holds anything, so only `permission: null` pages open. */
	permissions?: (event: RequestEvent) => Grant | Promise<Grant>;
	/**
	 * Refuse a request under `access.root` that has no `locals.user`. Off only for an app with no
	 * sign-in at all, where nobody ever has one.
	 */
	requireUser?: boolean;
}): Handle {
	return async ({ event, resolve }) => {
		const grant = permissions ? await permissions(event) : { permList: [], isSuperAdmin: false };

		event.locals.permList = grant.permList;
		event.locals.isSuperAdmin = grant.isSuperAdmin;

		if (event.locals.user) {
			const refusal = gateRefusal(
				access,
				event.url.pathname,
				effectivePermissions(access, grant.permList, grant.isSuperAdmin)
			);
			if (refusal) error(403, refusal);
		} else if (requireUser && access.guards(event.url.pathname)) {
			if (event.request.method === 'GET' || event.request.method === 'HEAD') {
				const target = encodeURIComponent(event.url.pathname + event.url.search);
				redirect(302, `${loginPath()}?redirectTo=${target}`);
			}
			error(401, serverLabels().signInRequired);
		}

		return resolve(event);
	};
}
