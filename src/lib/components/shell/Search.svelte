<script lang="ts">
	import { useLabels } from '$lib/labels';
	import * as Command from '$lib/components/ui/command/index.js';
	import Disc from '@lucide/svelte/icons/disc';
	import SearchIcon from '@lucide/svelte/icons/search';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { searchEntries } from '$lib/navigation';
	import { useKit } from '$lib/context';

	const kit = useKit();

	let isOpen = $state(false);

	// The sidebar's own list, flattened, so the palette cannot offer a page the menu does not
	// know about — or one this viewer would be refused.
	let list = $derived(searchEntries(kit.navigation, kit.canOpen, kit.searchExtra));

	const L = useLabels();
</script>

<DialogComp title={L.searchTitle} variant="ghost" bind:open={isOpen}>
	{#snippet trigger(props)}
		<Button size="sm" variant="ghost" class="w-auto px-4" title={L.searchButton} {...props}>
			<SearchIcon />
		</Button>
	{/snippet}
	<Command.Root class="rounded-lg shadow-md md:min-w-112.5">
		<Command.Input placeholder={L.searchPlaceholder} type="search" />
		<Command.List>
			<Command.Empty>{L.searchEmpty}</Command.Empty>
			<Command.Group heading={L.searchSuggestions}>
				{#each list as item (item.url)}
					<!-- The item is the link itself: Enter clicks the highlighted item, and a link
					     nested inside one was never reached by it, nor by a click beside the text. -->
					<Command.LinkItem href={item.url} onSelect={() => (isOpen = false)}>
						<Disc />
						{item.label}
					</Command.LinkItem>
				{/each}
			</Command.Group>
		</Command.List>
	</Command.Root>
</DialogComp>
