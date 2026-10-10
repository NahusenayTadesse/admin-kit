<script lang="ts">
	import KitStyle from './KitStyle.svelte';
	import SingleTable from './SingleTable.svelte';
	import type { KitLook } from '$lib/kitStyle';

	let { look, inner = undefined }: { look: KitLook; inner?: KitLook } = $props();
</script>

<KitStyle {...look}>
	{#if inner}
		<KitStyle {...inner}>
			<SingleTable singleTable={[{ name: 'Name', value: 'Jane Doe' }]} />
		</KitStyle>
	{:else}
		<SingleTable singleTable={[{ name: 'Name', value: 'Jane Doe' }]} />
	{/if}
</KitStyle>
