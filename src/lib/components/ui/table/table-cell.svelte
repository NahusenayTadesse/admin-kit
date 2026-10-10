<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLTdAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn(
		'bg-clip-padding px-(--kit-cell-px,0.5rem) py-(--kit-cell-py,0.5rem) align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</td>
