<script lang="ts">
	import { Label as LabelPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: LabelPrimitive.RootProps = $props();
</script>

<LabelPrimitive.Root
	bind:ref
	data-slot="label"
	class={cn(
		'flex items-center gap-2 font-(family-name:--kit-label-font) text-(length:--kit-label-size,0.875rem) leading-none font-(--kit-label-weight,500) tracking-(--kit-label-tracking) [text-transform:var(--kit-label-transform)] select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
		className
	)}
	{...restProps}
/>
