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
		'flex flex-col gap-(--kit-card-gap) rounded-(--kit-card-radius) border-(length:--kit-card-border) bg-card py-(--kit-card-pad) text-card-foreground shadow-(--kit-card-shadow)',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
