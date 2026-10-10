<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot="textarea"
	class={cn(
		'flex field-sizing-content min-h-16 w-full rounded-(--kit-control-radius,calc(var(--radius)-2px)) border-(length:--kit-control-border,1px) border-(color:--kit-frame,var(--input)) bg-transparent px-(--kit-input-px,0.75rem) py-2 text-base shadow-(--kit-input-shadow,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
		className
	)}
	bind:value
	{...restProps}
></textarea>
