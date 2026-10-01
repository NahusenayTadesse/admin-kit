<script lang="ts">
	import { useLabels } from '$lib/labels';
	import * as Select from '$lib/components/ui/select/index.js';
	import { selectItem, type Item } from '$lib/global';

	// `onValueChange` is optional and simply forwarded to `Select.Root`. It lets a
	// caller react to a change without binding.
	let {
		value = $bindable(),
		items,
		name,
		/**
		 * What the empty trigger says to pick — the field's own label, when the caller has one.
		 *
		 * Without it the placeholder is built from the column name, so a foreign key read "Select
		 * Provider Id" and "Select Operatory Id" on the booking form. Defaulting to the old
		 * behaviour keeps every existing caller unchanged.
		 */
		label = undefined,
		/** The whole empty-trigger text, for a form in another language ("Select" is English). */
		placeholder = undefined,
		onValueChange = undefined,
		/** For a `<label for>`: goes on the button that opens the list. */
		id = undefined,
		/** The ids of the hint and the error shown with the field. */
		describedBy = undefined,
		invalid = false
	} = $props();
	const L = useLabels();
	const triggerContent = $derived(
		// Use String coercion to ensure "1" matches 1
		items.find((f: Item) => String(f.value) === String(value))?.name ??
			placeholder ??
			L.select(label ?? name.replace(/([a-z])([A-Z])/g, '$1 $2'))
	);
</script>

<Select.Root type="single" {name} bind:value {onValueChange}>
	<Select.Trigger
		{id}
		class="w-full capitalize"
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
	>
		{triggerContent}
	</Select.Trigger>
	<Select.Content>
		{#each items as item (item.value)}
			<Select.Item value={item.value} class={selectItem}>{item.name}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
