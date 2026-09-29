<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { useLabels } from '$lib/labels';

	/**
	 * Free text of any length — a note, a reason, an address, a message — in a table cell or a
	 * list: the first `max` characters and a "…" that plainly asks to be clicked, opening the whole
	 * text. Text that fits is shown as it is, with nothing to click.
	 */
	const {
		text,
		max = 15
	}: {
		text: string | number | null | undefined;
		/** Characters shown before the "…". */
		max?: number;
	} = $props();

	const L = useLabels();

	const full = $derived(String(text ?? '').trim());
	// Characters as a person counts them: a Ge'ez letter or an emoji is one, not two code units,
	// so a cut never lands in the middle of one.
	const chars = $derived(Array.from(full));
	const shortened = $derived(chars.length > max);
	const head = $derived(shortened ? chars.slice(0, max).join('').trimEnd() : full);
</script>

{#if !shortened}
	<span class="whitespace-pre-line">{full}</span>
{:else}
	<Popover>
		<PopoverTrigger
			class="group inline-flex max-w-full cursor-pointer items-center gap-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
			title={L.bigTextShowAll}
		>
			<span>{head}</span>
			<span
				aria-hidden="true"
				class="rounded-sm bg-muted px-1 text-xs leading-4 font-bold text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground"
				>…</span
			>
			<span class="sr-only">{L.bigTextShowAll}</span>
		</PopoverTrigger>
		<PopoverContent class="max-w-sm p-3 text-sm wrap-break-word whitespace-pre-line">
			{full}
		</PopoverContent>
	</Popover>
{/if}
