import { error, type Handle, type RequestEvent } from '@sveltejs/kit';
import { effectivePermissions, gateRefusal, type Access } from '$lib/access';

/** What the viewer may do: their permission names, and whether they hold every one of them. */
export type Grant = { permList: string[]; isSuperAdmin: boolean };

/**
 * The kit's request hook: stamps the viewer's permissions onto `locals` and closes any page under
 * `access.root` the viewer may not open. Runs after the auth hook, so `locals.user` is known:
 *
 *     const handleKit = kitHandle({ access, permissions: async (event) => loadGrant(event) });
 *     export const handle = sequence(handleBetterAuth, handleKit);
 *
 * A super admin opens every page that has a rule (see `effectivePermissions`). Only a signed-in
 * viewer is gated here. Sending a signed-out one to the login page is the
 * dashboard layout's job, which knows where that page is.
 */
export function kitHandle({
	access,
	permissions
}: {
	access: Access;
	/** The viewer's grant. Without it nobody holds anything, so only `permission: null` pages open. */
	permissions?: (event: RequestEvent) => Grant | Promise<Grant>;
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
		}

		return resolve(event);
	};
}
