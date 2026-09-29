<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setKit } from '$lib/context';
	import { effectivePermissions, type Access } from '$lib/access';
	import type { NavItem, SearchEntry } from '$lib/navigation';
	import type { EntityRoutes } from '$lib/entityLinks';
	import { setKitLabels, type KitLabels } from '$lib/labels';

	/**
	 * Wraps the dashboard layout once, so every kit component below it knows the viewer's
	 * permissions and the app's routes, menu and record pages:
	 *
	 *     <KitProvider {access} navigation={NAVIGATION} entities={ENTITIES} permList={data.permList}>
	 *       …
	 *     </KitProvider>
	 */
	let {
		permList = [],
		isSuperAdmin = false,
		access,
		navigation = [],
		searchExtra = [],
		entities = {},
		labels = undefined,
		children
	}: {
		permList?: string[];
		/** A super admin sees every page that has a rule, whatever `permList` says. */
		isSuperAdmin?: boolean;
		access?: Access;
		navigation?: NavItem[];
		/** Pages the search palette offers beyond the menu. */
		searchExtra?: SearchEntry[];
		entities?: EntityRoutes;
		/**
		 * The words the kit's components show, in the app's language. Usually set once in the root
		 * layout with `setKitLabels` instead, so pages outside the dashboard get them too.
		 */
		labels?: Partial<KitLabels> | (() => Partial<KitLabels>);
		children: Snippet;
	} = $props();

	// Only when given: a root layout may already have set them for the whole app.
	// svelte-ignore state_referenced_locally
	if (labels) setKitLabels(labels);

	// Getters, so every reader follows the layout's data as it changes.
	setKit({
		get permList() {
			return permList;
		},
		get access() {
			return access;
		},
		get navigation() {
			return navigation;
		},
		get searchExtra() {
			return searchExtra;
		},
		get entities() {
			return entities;
		},
		canOpen(path) {
			return access
				? access.canVisit(path, effectivePermissions(access, permList, isSuperAdmin))
				: true;
		}
	});
</script>

{@render children()}
