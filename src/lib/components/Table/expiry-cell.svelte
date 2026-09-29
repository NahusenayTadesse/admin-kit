<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatEthiopianDate } from '$lib/global';
	import { expiryState } from '$lib/expiry';

	/**
	 * An expiry date as the one thing a reader wants from it: whether it is still good. A date that
	 * has passed is destructive-coloured, one inside the warning window is amber, and no date says
	 * so rather than looking fine. Used for provider licences and stock lots.
	 */
	let {
		expiresOn,
		warningDays,
		noneText = undefined
	}: {
		expiresOn: string | Date | null | undefined;
		/** How many days ahead counts as expiring soon. */
		warningDays: number;
		/** What to say when there is no date. */
		noneText?: string;
	} = $props();

	const state = $derived(expiryState(expiresOn, warningDays));

	const L = useLabels();
</script>

{#if state.kind === 'none'}
	<span class="text-muted-foreground">{noneText ?? L.noExpiry}</span>
{:else if state.kind === 'expired'}
	<Badge variant="destructive">{L.expired(formatEthiopianDate(new Date(state.on)))}</Badge>
{:else if state.kind === 'expiring'}
	<Badge class="bg-amber-500 text-white">
		{L.daysLeft(state.days, formatEthiopianDate(new Date(state.on)))}
	</Badge>
{:else}
	<span>{formatEthiopianDate(new Date(state.on))}</span>
{/if}
