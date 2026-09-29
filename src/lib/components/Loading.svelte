<script>
	import { useLabels } from '$lib/labels';
	import { Loader } from '@lucide/svelte';

	let { name } = $props();

	const L = useLabels();
</script>

<div
	class="fixed top-0.5 right-0.5 bottom-0.5 left-0.5 z-1 flex w-auto flex-col items-center justify-center"
>
	<div class="flex flex-row items-center gap-2">
		<Loader class="h-8 w-8 animate-spin" />
		<h1 class="animate-pulse capitalize">{L.loadingNamed(name)}</h1>
	</div>
</div>
