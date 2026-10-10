<script lang="ts">
	import '../styles/theme.base.css';
	import KitStyle from './KitStyle.svelte';
	import { Button } from './ui/button/index.js';
	import type { KitLook } from '$lib/kitStyle';

	/** `appCss` stands in for the app's own layout.css, loaded after the kit's theme. */
	let { look, appCss = '' }: { look: KitLook; appCss?: string } = $props();
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style data-app-css>${appCss}</style>`}
</svelte:head>

<KitStyle {...look}>
	<!-- No hover: a pointer left over a button by another test would tint it. -->
	<Button data-testid="plain" class="pointer-events-none">Plain</Button>
	<div class="site"><Button data-testid="scoped" class="pointer-events-none">Scoped</Button></div>
</KitStyle>
