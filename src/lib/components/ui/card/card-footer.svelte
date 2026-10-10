<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-footer"
	class={cn(
		'flex items-center px-(--kit-card-pad,1.5rem) [.border-t]:pt-(--kit-card-pad,1.5rem)',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
