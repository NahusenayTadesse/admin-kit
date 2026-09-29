<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { BadgeCheck, Loader, OctagonMinus } from '@lucide/svelte';

	/* ---------- public prop ---------- */
	interface Props {
		/** Nullable: most status columns are, and an unknown value already falls back to grey. */
		status: string | null | undefined;
		/**
		 * What the badge says, when the stored value is not the words to show: a translated label,
		 * or `pending_payment` read as "Awaiting payment". The colour still comes from `status`.
		 */
		label?: string;
	}
	let { status, label }: Props = $props();

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
</script>

<Badge variant="secondary" class="{colour} text-white">
	<Icon />
	{label ?? status}
</Badge>
