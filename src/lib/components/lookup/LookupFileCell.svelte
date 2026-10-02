<script lang="ts">
	import { FileText } from '@lucide/svelte';
	import { fileUrl } from '$lib/files';
	import { useLabels } from '$lib/labels';

	/**
	 * An `image` or `file` field's table cell: a thumbnail, or a link to the file. Either opens the
	 * stored file in a new tab. Empty for a row with nothing stored.
	 *
	 * Served from the signed-in file route (`fileUrl`), as every stored file is in the dashboard.
	 * The tile is neutral grey so a white logo and a dark one both stay visible on it.
	 */
	let { name, image, alt = '' }: { name: string; image: boolean; alt?: string } = $props();

	const L = useLabels();
</script>

{#if name}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- a stored file, not a page -->
	<a
		href={fileUrl(name)}
		target="_blank"
		rel="noopener"
		class={image
			? 'inline-flex h-12 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted p-1 hover:ring-2 hover:ring-ring/50'
			: 'inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline'}
	>
		{#if image}
			<img src={fileUrl(name)} {alt} loading="lazy" class="max-h-10 w-auto object-contain" />
		{:else}
			<FileText class="h-4 w-4" />
			{L.lookupFileView}
		{/if}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/if}
