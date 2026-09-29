<script lang="ts">
	import { setKitLabels, type KitLabels } from '$lib/labels';
	import TablePagination from '$lib/components/Table/table-pagination.svelte';

	/** Test harness: sets labels the way an app's root layout does, then renders a kit component. */
	let { labels }: { labels: Partial<KitLabels> } = $props();

	// svelte-ignore state_referenced_locally
	setKitLabels(() => labels);
</script>

<TablePagination page={2} pageSize={10} total={45} onPage={() => {}} onPageSize={() => {}} />
