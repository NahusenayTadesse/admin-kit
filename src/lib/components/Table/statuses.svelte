<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { BadgeCheck, Loader, OctagonMinus } from '@lucide/svelte';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

	/* ---------- public prop ---------- */
	interface Props {
		/** Nullable: most status columns are, and an unknown value already falls back to grey. */
		status: string | null | undefined;
		/**
		 * What the badge says, when the stored value is not the words to show: a translated label,
		 * or `pending_payment` read as "Awaiting payment". The colour still comes from `status`.
		 */
		label?: string;
		/** The badge's look, when it should differ from the app's style. */
		kitStyle?: KitStyleName;
	}
	let { status, label, kitStyle = undefined }: Props = $props();

	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);

	/* ---------- lookup tables ---------- */
	const statusMeta = $derived({
		/* confirmed / paid */
		confirmed: { icon: BadgeCheck, colour: 'bg-green-400' },
		paid: { icon: BadgeCheck, colour: 'bg-green-400' },

		complete: { icon: BadgeCheck, colour: 'bg-green-400' },
		incomplete: { icon: OctagonMinus, colour: 'bg-red-500' },

		/* cancelled / unpaid */
		cancelled: { icon: OctagonMinus, colour: 'bg-red-500' },
		unpaid: { icon: OctagonMinus, colour: 'bg-red-500' },
		dead: { icon: OctagonMinus, colour: 'bg-red-500' },

		/* pending */
		pending: { icon: Loader, colour: 'bg-yellow-500' },
		rejected: { icon: OctagonMinus, colour: 'bg-red-500' },
		terminated: { icon: OctagonMinus, colour: 'bg-red-500' },
		approved: { icon: BadgeCheck, colour: 'bg-green-400' },

		/* active */
		active: { icon: BadgeCheck, colour: 'bg-green-400' },
		contracted: { icon: BadgeCheck, colour: 'bg-green-400' },
		inactive: { icon: OctagonMinus, colour: 'bg-red-500' },

		yes: { icon: BadgeCheck, colour: 'bg-green-400' },
		no: { icon: OctagonMinus, colour: 'bg-red-500' },

		unremovable: { icon: BadgeCheck, colour: 'bg-green-400' },
		removable: { icon: OctagonMinus, colour: 'bg-red-500' },
		calculated: { icon: BadgeCheck, colour: 'bg-green-400' },
		'not calculated': { icon: OctagonMinus, colour: 'bg-red-500' },

		/* shop, bookings and payments (Amoria's §2.3 list) */
		pending_payment: { icon: Loader, colour: 'bg-yellow-500' },
		preparing: { icon: Loader, colour: 'bg-sky-500' },
		ready: { icon: BadgeCheck, colour: 'bg-sky-600' },
		completed: { icon: BadgeCheck, colour: 'bg-green-600' },
		expired: { icon: OctagonMinus, colour: 'bg-gray-500' },
		paid_unfulfillable: { icon: OctagonMinus, colour: 'bg-orange-500' },
		draft: { icon: Loader, colour: 'bg-gray-500' },
		sent: { icon: Loader, colour: 'bg-sky-500' },
		viewed: { icon: Loader, colour: 'bg-sky-600' },
		accepted: { icon: BadgeCheck, colour: 'bg-green-400' },
		deposit_paid: { icon: BadgeCheck, colour: 'bg-green-500' },
		declined: { icon: OctagonMinus, colour: 'bg-red-500' },
		superseded: { icon: OctagonMinus, colour: 'bg-gray-500' },
		out: { icon: Loader, colour: 'bg-sky-600' },
		returned: { icon: BadgeCheck, colour: 'bg-green-600' },
		overdue: { icon: OctagonMinus, colour: 'bg-red-500' },
		open: { icon: BadgeCheck, colour: 'bg-green-400' },
		closed: { icon: OctagonMinus, colour: 'bg-gray-500' },
		graduated: { icon: BadgeCheck, colour: 'bg-green-600' },
		not_graduated: { icon: OctagonMinus, colour: 'bg-red-500' },
		queued: { icon: Loader, colour: 'bg-yellow-500' },
		sending: { icon: Loader, colour: 'bg-sky-500' },
		failed: { icon: OctagonMinus, colour: 'bg-red-500' },
		initiated: { icon: Loader, colour: 'bg-yellow-500' },
		success: { icon: BadgeCheck, colour: 'bg-green-500' },
		new: { icon: Loader, colour: 'bg-sky-500' },
		contacted: { icon: Loader, colour: 'bg-sky-600' },
		quoted: { icon: Loader, colour: 'bg-violet-500' },
		won: { icon: BadgeCheck, colour: 'bg-green-600' },
		lost: { icon: OctagonMinus, colour: 'bg-gray-500' },

		/* fallback */
		unknown: { icon: Loader, colour: 'bg-gray-500' }
	});

	/* ---------- derived ---------- */
	const key = $derived(String(status).trim().toLowerCase() as keyof typeof statusMeta);
	const { icon: Icon, colour } = $derived(statusMeta[key] ?? statusMeta.unknown);

	/*
	 * The same colour as a tint and as text, for the styles that do not fill the badge. Written
	 * out whole so Tailwind finds every class.
	 */
	const TONE: Record<string, { tint: string; text: string; ring: string }> = {
		green: {
			tint: 'bg-green-500/15 text-green-800 dark:text-green-300',
			text: 'text-green-700 dark:text-green-400',
			ring: 'border-green-600/60 text-green-700 dark:text-green-400'
		},
		red: {
			tint: 'bg-red-500/15 text-red-800 dark:text-red-300',
			text: 'text-red-700 dark:text-red-400',
			ring: 'border-red-600/60 text-red-700 dark:text-red-400'
		},
		yellow: {
			tint: 'bg-yellow-500/20 text-yellow-900 dark:text-yellow-300',
			text: 'text-yellow-700 dark:text-yellow-400',
			ring: 'border-yellow-600/60 text-yellow-800 dark:text-yellow-400'
		},
		sky: {
			tint: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
			text: 'text-sky-700 dark:text-sky-400',
			ring: 'border-sky-600/60 text-sky-700 dark:text-sky-400'
		},
		gray: {
			tint: 'bg-gray-500/15 text-gray-700 dark:text-gray-300',
			text: 'text-gray-600 dark:text-gray-400',
			ring: 'border-gray-500/60 text-gray-600 dark:text-gray-400'
		},
		orange: {
			tint: 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
			text: 'text-orange-700 dark:text-orange-400',
			ring: 'border-orange-600/60 text-orange-700 dark:text-orange-400'
		},
		violet: {
			tint: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
			text: 'text-violet-700 dark:text-violet-400',
			ring: 'border-violet-600/60 text-violet-700 dark:text-violet-400'
		}
	};
	const tone = $derived(TONE[colour.split('-')[1]] ?? TONE.gray);
</script>

{#if style === 'compact'}
	<!-- A dot and the word: colour without a filled block in every row. -->
	<span
		data-status={key}
		class="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
	>
		<span class="size-2 shrink-0 rounded-full {colour}"></span>
		{label ?? status}
	</span>
{:else if style === 'soft'}
	<Badge variant="secondary" data-status={key} class="{tone.tint} border-transparent">
		<Icon />
		{label ?? status}
	</Badge>
{:else if style === 'sharp'}
	<Badge variant="outline" data-status={key} class="{tone.ring} bg-transparent">
		<span class="size-1.5 shrink-0 {colour}"></span>
		{label ?? status}
	</Badge>
{:else if style === 'formal'}
	<!-- Quiet: the word in its colour, after a small ring. -->
	<span
		data-status={key}
		class="inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap {tone.text}"
	>
		<span class="size-2 shrink-0 rounded-full border-2 border-current"></span>
		{label ?? status}
	</span>
{:else if style === 'bold'}
	<Badge variant="secondary" data-status={key} class="{colour} border-foreground text-white">
		<Icon />
		{label ?? status}
	</Badge>
{:else}
	<Badge variant="secondary" class="{colour} text-white">
		<Icon />
		{label ?? status}
	</Badge>
{/if}
