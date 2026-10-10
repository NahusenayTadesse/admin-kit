<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLThAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn(
		'h-(--kit-table-head-h) bg-(--kit-table-head-bg) bg-clip-padding px-(--kit-cell-px) text-left align-middle font-(family-name:--kit-table-head-font) text-(length:--kit-table-head-size) font-(--kit-table-head-weight) tracking-(--kit-table-head-tracking) whitespace-nowrap text-(--kit-table-head-color) [text-transform:var(--kit-table-head-transform)] [&:has([role=checkbox])]:pr-0',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
