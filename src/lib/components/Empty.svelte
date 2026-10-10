<script lang="ts">
	import { useLabels } from '$lib/labels';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';
	import { Frown, SearchX } from '@lucide/svelte';

	let { title = '', kitStyle = undefined }: { title?: string; kitStyle?: KitStyleName } = $props();

	const L = useLabels();
	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);

	/* The other styles say "not found" quietly; the default keeps its large red notice. */
	const FRAMES: Record<
		Exclude<KitStyleName, 'default'>,
		{ box: string; icon: string; text: string }
	> = {
		compact: {
			box: 'gap-2 rounded-md border border-dashed p-6',
			icon: 'size-6 text-muted-foreground',
			text: 'text-sm font-medium text-muted-foreground'
		},
		soft: {
			box: 'gap-4 rounded-3xl bg-muted/70 p-12',
			icon: 'size-14 rounded-full bg-background p-3.5 text-primary',
			text: 'text-lg font-semibold'
		},
		sharp: {
			box: 'gap-3 border border-dashed p-10',
			icon: 'size-6 text-muted-foreground',
			text: 'font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase'
		},
		formal: {
			box: 'gap-3 border-y-4 border-double p-10',
			icon: 'size-6 text-muted-foreground',
			text: 'font-head text-xl text-muted-foreground italic'
		},
		bold: {
			box: 'gap-4 rounded-lg border-2 border-foreground bg-card p-10 shadow-[5px_5px_0_0_var(--foreground)]',
			icon: 'size-14 rounded-lg border-2 border-foreground bg-primary p-3 text-primary-foreground',
			text: 'text-2xl font-bold tracking-tight'
		}
	};
	const frame = $derived(style === 'default' ? undefined : FRAMES[style]);
</script>

{#if frame}
	<div
		data-layout={style}
		class="my-8 flex w-full flex-col items-center justify-center text-center {frame.box}"
	>
		<SearchX class={frame.icon} />
		<div aria-live="assertive" class={frame.text}>{L.notFound(title)}</div>
	</div>
{:else}
	<div class="my-8 flex h-64 w-full items-center justify-center rounded-md bg-card p-6 shadow-sm">
		<h1
			aria-live="assertive"
			class="text-center text-5xl font-extrabold text-destructive uppercase md:text-6xl"
		>
			<Frown class="h-32 w-32 animate-bounce justify-self-center text-center" />
			{L.notFound(title)}
		</h1>
	</div>
{/if}
