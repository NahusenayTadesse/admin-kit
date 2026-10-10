<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		'flex flex-col gap-(--kit-card-gap,1.5rem) rounded-(--kit-card-radius,calc(var(--radius)+4px)) border-(length:--kit-card-border,1px) border-(color:--kit-frame,var(--border)) bg-card py-(--kit-card-pad,1.5rem) text-card-foreground shadow-(--kit-card-shadow,0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1))',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
