<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps, Snippet } from 'svelte';
	import { appSurface } from '$lib/global';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { useKit } from '$lib/context';
	import { visibleNavigation } from '$lib/navigation';

	import NavMain from './NavMain.svelte';

	/**
	 * The app's menu, from `<KitProvider navigation>`, filtered by the same rule the server gate
	 * applies to each link's URL — a menu entry and the gate in front of it cannot drift apart.
	 */
	let {
		logo,
		footer = 'Powered by amno ERP Solutions',
		...restProps
	}: {
		/** The app's logo, drawn at the top of the menu. */
		logo?: Snippet;
		footer?: string;
	} & ComponentProps<typeof Sidebar.Root> = $props();

	const kit = useKit();
	const sidebar = useSidebar();

	function closeSidebar() {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	const filteredNavigation = $derived(visibleNavigation(kit.navigation, kit.canOpen));
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Content
		class="z-9999! h-full
  [scrollbar-width:thin] [scrollbar-color:#a3a3a3_transparent]
  overflow-y-scroll
  pt-4
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-thumb]:bg-gray-400
  [&::-webkit-scrollbar-thumb:hover]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-transparent
  {appSurface}
"
	>
		<Sidebar.Group>
			<Sidebar.GroupLabel>
				<div class="flex w-full flex-row items-center justify-start px-1">
					{@render logo?.()}
				</div></Sidebar.GroupLabel
			>
			<Sidebar.GroupContent class="my-4">
				<NavMain {closeSidebar} items={filteredNavigation} />
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="flex flex-row border-t bg-sidebar">
		<Sidebar.GroupLabel>{footer}</Sidebar.GroupLabel>
	</Sidebar.Footer>
</Sidebar.Root>
