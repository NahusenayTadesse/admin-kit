<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot="input"
		class={cn(
			'flex h-(--kit-control-h,2.25rem) w-full min-w-0 rounded-(--kit-control-radius,calc(var(--radius)-2px)) border-(length:--kit-control-border,1px) border-(color:--kit-frame,var(--input)) bg-transparent px-(--kit-input-px,0.75rem) pt-1.5 text-sm font-medium shadow-(--kit-input-shadow,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
			'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
			'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot="input"
		class={cn(
			'flex h-(--kit-control-h,2.25rem) w-full min-w-0 rounded-(--kit-control-radius,calc(var(--radius)-2px)) border-(length:--kit-control-border,1px) border-(color:--kit-frame,var(--input)) bg-background px-(--kit-input-px,0.75rem) py-1 text-base shadow-(--kit-input-shadow,var(--kit-control-shadow,0_1px_2px_0_rgb(0_0_0/0.05))) ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
			'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
			'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
