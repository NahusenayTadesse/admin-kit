<script lang="ts">
	import KitStyle from './KitStyle.svelte';
	import SingleTable from './SingleTable.svelte';
	import type { KitLook } from '$lib/kitStyle';

	let { look, global = true }: { look: KitLook; global?: boolean } = $props();
</script>

<KitStyle {...look} {global}>
	<SingleTable singleTable={[{ name: 'Name', value: 'Jane Doe' }]} />
</KitStyle>
