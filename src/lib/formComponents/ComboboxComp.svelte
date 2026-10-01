<script lang="ts">
	import { useLabels } from '$lib/labels';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { selectItem, type Item } from '$lib/global';

	let {
		items,
		name,
		value = $bindable(),
		required = false,
		label = undefined,
		id = undefined,
		describedBy = undefined,
		invalid = false
	}: {
		items: Item[];
		name: string;
		value: string | number | boolean | undefined;
		required: boolean;
		/**
		 * What the trigger and the search box call this field. Without it both are built from the
		 * column name, so a foreign key read "Select Employee Id" and "Search Employee Id…".
		 */
		label?: string;
		/** For a `<label for>`: goes on the button that opens the list. */
		id?: string;
		/** The ids of the hint and the error shown with the field. */
		describedBy?: string;
		invalid?: boolean;
	} = $props();
	const L = useLabels();
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	/** The field's own words, or the column name de-camel-cased as a fallback. */
	const fieldName = $derived(label ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2'));

	/** Title case for the search box only, which is how it has always been spelled there. */
	const searchName = $derived(
		label ?? fieldName.replace(/\b\w/g, (char: string) => char.toUpperCase())
	);

	const triggerContent = $derived(
		// Use String coercion to ensure "1" matches 1
		items.find((f: Item) => String(f.value) === String(value))?.name ?? L.select(fieldName)
	);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} {id}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="w-full justify-between capitalize"
				role="combobox"
				aria-expanded={open}
				aria-invalid={invalid ? 'true' : undefined}
				aria-describedby={describedBy}
			>
				{triggerContent}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<input type="hidden" bind:value {name} {required} />

	<Popover.Content class="w-full p-0">
		<Command.Root>
			<Command.Input placeholder={L.searchFor(searchName)} />
			<Command.List>
				<Command.Empty
					>{L.noneFound(label ?? name.replace(/([a-z])([A-Z])/g, '$1 $2'))}</Command.Empty
				>
				<Command.Group>
					{#each items as item (item.value)}
						<Command.Item
							value={item.name}
							keywords={[item.name]}
							onSelect={() => {
								value = item.value;
								closeAndFocusTrigger();
							}}
							class={selectItem}
						>
							<CheckIcon class={cn(value !== item.value && 'text-transparent')} />
							{item.name}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
