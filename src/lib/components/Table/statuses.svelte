<script lang="ts" module>
	/**
	 * What a status means, which is all that decides its colour: the colour itself is the app's
	 * (`--success`, `--destructive`, `--warning`, `--info`, `--muted-foreground`).
	 */
	export type StatusRole = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

	const SUCCESS = [
		'confirmed',
		'paid',
		'complete',
		'approved',
		'active',
		'contracted',
		'yes',
		'unremovable',
		'calculated',
		'completed',
		'accepted',
		'deposit_paid',
		'returned',
		'open',
		'graduated',
		'success',
		'won'
	];
	const DANGER = [
		'incomplete',
		'cancelled',
		'unpaid',
		'dead',
		'rejected',
		'terminated',
		'inactive',
		'no',
		'removable',
		'not calculated',
		'declined',
		'overdue',
		'not_graduated',
		'failed'
	];
	const WARNING = ['pending', 'pending_payment', 'queued', 'initiated', 'paid_unfulfillable'];
	const INFO = [
		'preparing',
		'ready',
		'sent',
		'viewed',
		'out',
		'sending',
		'new',
		'contacted',
		'quoted'
	];

	/** The role of a stored status value; anything unknown is neutral. */
	export function statusRole(status: string | null | undefined): StatusRole {
		const key = String(status).trim().toLowerCase();
		if (SUCCESS.includes(key)) return 'success';
		if (DANGER.includes(key)) return 'danger';
		if (WARNING.includes(key)) return 'warning';
		if (INFO.includes(key)) return 'info';
		return 'neutral';
	}
</script>

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { BadgeCheck, Loader, OctagonMinus } from '@lucide/svelte';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

	/* ---------- public prop ---------- */
	interface Props {
		/** Nullable: most status columns are, and an unknown value is drawn neutral. */
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

	const role = $derived(statusRole(status));
	const Icon = $derived(
		role === 'success' ? BadgeCheck : role === 'danger' ? OctagonMinus : Loader
	);

	/*
	 * Each role in each treatment, all from the app's colour tokens. Written out whole so Tailwind
	 * finds every class.
	 */
	const ROLE = {
		success: {
			solid: 'bg-success text-success-foreground',
			dot: 'bg-success',
			tint: 'bg-success/15 text-success',
			text: 'text-success',
			ring: 'border-success/60 text-success'
		},
		danger: {
			solid: 'bg-destructive text-white',
			dot: 'bg-destructive',
			tint: 'bg-destructive/12 text-destructive',
			text: 'text-destructive',
			ring: 'border-destructive/60 text-destructive'
		},
		warning: {
			solid: 'bg-warning text-warning-foreground',
			dot: 'bg-warning',
			tint: 'bg-warning/20 text-foreground',
			text: 'text-foreground',
			ring: 'border-warning text-foreground'
		},
		info: {
			solid: 'bg-info text-info-foreground',
			dot: 'bg-info',
			tint: 'bg-info/15 text-info',
			text: 'text-info',
			ring: 'border-info/60 text-info'
		},
		neutral: {
			solid: 'bg-muted-foreground text-background',
			dot: 'bg-muted-foreground',
			tint: 'bg-muted text-muted-foreground',
			text: 'text-muted-foreground',
			ring: 'border-border text-muted-foreground'
		}
	} as const;
	const tone = $derived(ROLE[role]);
	const key = $derived(String(status).trim().toLowerCase());
</script>

{#if style === 'compact'}
	<!-- A dot and the word: colour without a filled block in every row. -->
	<span
		data-status={key}
		data-role={role}
		class="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
	>
		<span class="size-2 shrink-0 rounded-full {tone.dot}"></span>
		{label ?? status}
	</span>
{:else if style === 'soft'}
	<Badge
		variant="secondary"
		data-status={key}
		data-role={role}
		class="{tone.tint} border-transparent"
	>
		<Icon />
		{label ?? status}
	</Badge>
{:else if style === 'sharp'}
	<Badge variant="outline" data-status={key} data-role={role} class="{tone.ring} bg-transparent">
		<span class="size-1.5 shrink-0 {tone.dot}"></span>
		{label ?? status}
	</Badge>
{:else if style === 'formal'}
	<!-- Quiet: the word in its colour, after a small ring. -->
	<span
		data-status={key}
		data-role={role}
		class="inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap {tone.text}"
	>
		<span class="size-2 shrink-0 rounded-full border-2 border-current"></span>
		{label ?? status}
	</span>
{:else if style === 'bold'}
	<Badge
		variant="secondary"
		data-status={key}
		data-role={role}
		class="{tone.solid} border-(--kit-frame,var(--foreground))"
	>
		<Icon />
		{label ?? status}
	</Badge>
{:else}
	<Badge
		variant="secondary"
		data-status={key}
		data-role={role}
		class="{tone.solid} border-transparent"
	>
		<Icon />
		{label ?? status}
	</Badge>
{/if}
