<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { fileUrl } from '$lib/files';
	import type { ImageItem } from '$lib/global';

	/**
	 * A choice made by picture — a package, a plan, a room type — where a dropdown would hide
	 * exactly what the choice is about.
	 *
	 * Each item is a card: its image, its name, and optionally a `meta` (a price) and a
	 * `description`. `multiple` off, it is a radio group and `value` is one item's value; on, a set
	 * of checkboxes and `value` is an array. The values keep the type the items gave them — a
	 * numeric id stays a number — so the schema reads them as it would from a select.
	 *
	 * The cards are real radios and checkboxes under the picture, named `name`, so the form posts
	 * the choice without a hidden input, and the arrow keys, Space and the screen reader all work
	 * as they do on any radio group or checklist.
	 */
	let {
		items = [],
		value = $bindable(),
		name,
		multiple = false,
		id = undefined,
		labelledBy = undefined,
		describedBy = undefined,
		invalid = false,
		required = false,
		disabled = false
	}: {
		items: ImageItem[];
		/** One item's value, or with `multiple` an array of them. */
		value?: ImageItem['value'] | ImageItem['value'][] | null;
		name: string;
		multiple?: boolean;
		/** Prefixes the inputs' ids, so two pickers on one page do not share them. Defaults to `name`. */
		id?: string;
		/** The id of the field's visible label: a group is named by it, not by `<label for>`. */
		labelledBy?: string;
		/** The ids of the hint and the error shown with the field. */
		describedBy?: string;
		invalid?: boolean;
		/** Single only: a radio group can say it needs an answer; a checklist cannot. */
		required?: boolean;
		disabled?: boolean;
	} = $props();

	const prefix = $derived(id ?? name);

	/* Compared as strings, as the select does: a form that loaded `"3"` still finds the item `3`. */
	const chosen = $derived(
		new Set(
			(multiple ? (Array.isArray(value) ? value : []) : value == null ? [] : [value]).map(String)
		)
	);

	function pick(item: ImageItem, on: boolean) {
		if (!multiple) {
			if (on) value = item.value;
			return;
		}
		const key = String(item.value);
		// Rebuilt from the items, so every value keeps its own type and the order stays the list's.
		value = items
			.filter((other) => (String(other.value) === key ? on : chosen.has(String(other.value))))
			.map((other) => other.value);
	}

	function src(image: string) {
		return /^(\/|https?:|data:|blob:)/.test(image) ? image : fileUrl(image);
	}
</script>

<div
	id={prefix}
	role={multiple ? 'group' : 'radiogroup'}
	aria-labelledby={labelledBy}
	aria-describedby={describedBy}
	aria-invalid={invalid ? 'true' : undefined}
	aria-required={!multiple && required ? 'true' : undefined}
	class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3"
>
	{#each items as item (item.value)}
		{@const off = disabled || item.disabled}
		<label
			for="{prefix}-{item.value}"
			class={[
				'group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground transition-all',
				'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
				'has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary',
				invalid && 'border-destructive',
				off
					? 'cursor-not-allowed opacity-50'
					: 'cursor-pointer hover:border-primary/50 hover:shadow-md'
			]}
		>
			<input
				id="{prefix}-{item.value}"
				type={multiple ? 'checkbox' : 'radio'}
				{name}
				value={String(item.value)}
				checked={chosen.has(String(item.value))}
				disabled={off}
				required={!multiple && required}
				onchange={(event) => pick(item, event.currentTarget.checked)}
				class="sr-only"
			/>

			<span class="relative block aspect-[4/3] w-full overflow-hidden bg-muted">
				{#if item.image}
					<img
						src={src(item.image)}
						alt=""
						loading="lazy"
						class="h-full w-full object-cover transition-transform group-hover:scale-105"
					/>
				{:else}
					<span
						class="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground uppercase"
						aria-hidden="true">{item.name.charAt(0)}</span
					>
				{/if}
				<span
					class={[
						'absolute top-2 right-2 flex size-6 items-center justify-center border-2 border-background bg-background/80 text-transparent shadow-sm transition-colors',
						'group-has-[:checked]:bg-primary group-has-[:checked]:text-primary-foreground',
						multiple ? 'rounded-md' : 'rounded-full'
					]}
					aria-hidden="true"
				>
					<Check class="size-4" />
				</span>
			</span>

			<span class="flex flex-1 flex-col gap-1 p-3">
				<span class="flex items-start justify-between gap-2">
					<span class="text-sm font-medium">{item.name}</span>
					{#if item.meta}
						<span class="shrink-0 text-sm font-semibold text-primary">{item.meta}</span>
					{/if}
				</span>
				{#if item.description}
					<span class="text-xs text-muted-foreground">{item.description}</span>
				{/if}
			</span>
		</label>
	{/each}
</div>
