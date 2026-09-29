<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import type { ComponentProps } from 'svelte';
	import { useSidebar } from './context.svelte.js';
	import { TextAlignJustify } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();

	const L = useLabels();
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon"
	class={cn('size-7', className)}
	type="button"
	title={L.toggleSidebar}
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<TextAlignJustify class="size-4" />
	<span class="sr-only">{L.toggleSidebar}</span>
</Button>
