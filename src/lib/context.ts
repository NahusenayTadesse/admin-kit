import { getContext, setContext } from 'svelte';
import type { Access } from './access';
import type { NavItem, SearchEntry } from './navigation';
import type { EntityRoutes } from './entityLinks';

/**
 * What the kit's components need to know about the app they are in, set once by `<KitProvider>`
 * in the dashboard layout: the viewer's permissions, the app's route rules, its menu and where
 * its records live.
 *
 * **Svelte context, deliberately, and not a module-level `$state`.** A module is shared by every
 * request the server handles, so a viewer-scoped value stored there is one concurrent request away
 * from being rendered for the wrong person. Context is per component tree, which is per request.
 *
 * Reading this decides *rendering* only. It is not a control and must never be used as one: the
 * control is the route gate in `hooks.server.ts`, and a form action's own `requirePermission`.
 */
export type Kit = {
	readonly permList: string[];
	readonly access: Access | undefined;
	readonly navigation: NavItem[];
	readonly searchExtra: SearchEntry[];
	readonly entities: EntityRoutes;
	/** Whether the viewer may open `path`. True everywhere when no `access` was given. */
	canOpen(path: string): boolean;
};

const KEY = Symbol.for('admin-kit');

export function setKit(kit: Kit) {
	setContext<Kit>(KEY, kit);
}

/**
 * The kit context, or an empty one outside a `<KitProvider>` tree.
 *
 * Empty is the safe default: no permissions, so an entity mention renders as plain text and the
 * menus render nothing — a component used outside the layout degrades rather than throwing.
 */
export function useKit(): Kit {
	return (
		getContext<Kit | undefined>(KEY) ?? {
			permList: [],
			access: undefined,
			navigation: [],
			searchExtra: [],
			entities: {},
			canOpen: () => false
		}
	);
}
