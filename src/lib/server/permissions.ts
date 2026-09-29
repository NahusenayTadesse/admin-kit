import { serverLabels } from './labels';
import { error } from '@sveltejs/kit';

/**
 * The part of `event.locals` the permission guards read. Structural, so any app whose `Locals`
 * carries these two fields can pass its own `locals` straight in.
 */
export type PermissionLocals = {
	isSuperAdmin?: boolean;
	permList?: string[];
};

/**
 * Whether the caller holds `permission`.
 *
 * A super admin holds everything by definition, so they pass without the name appearing in their
 * list.
 *
 * Use this to *decide* something (show a button, pick a branch). Use `requirePermission` to
 * *refuse* — a boolean that nobody checks is not a control.
 */
export function hasPermission(locals: PermissionLocals, permission: string): boolean {
	return Boolean(locals.isSuperAdmin) || (locals.permList ?? []).includes(permission);
}

/**
 * Refuses the caller unless they hold `permission`.
 *
 * For form actions and endpoints, which a path-based route gate alone does not fully cover: an
 * action that does more than the page it sits on has to say so itself, here, on the server. The
 * button that triggers it being hidden is not this check — the action is reachable by anyone who
 * can POST to the path.
 */
export function requirePermission(locals: PermissionLocals, permission: string) {
	if (!hasPermission(locals, permission)) {
		error(403, serverLabels().noPermission);
	}
}

/**
 * Guard for actions only a super admin may run. Every delete action calls this before touching a
 * row — hiding the button in the UI is a convenience, not a control.
 */
export function requireSuperAdmin(locals: PermissionLocals) {
	if (!locals.isSuperAdmin) {
		error(403, serverLabels().superAdminOnly);
	}
}
