<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fileUrl } from '$lib/files';
	import { useKitLook, type KitStyleName } from '$lib/kitStyle';

	let {
		title,
		children,
		class: className = '',
		photo = '',
		kitStyle = undefined
	}: {
		title: string;
		children: Snippet;
		class?: string;
		photo?: string;
		/** The layout, when it should differ from the app's style. */
		kitStyle?: KitStyleName;
	} = $props();

	const look = useKitLook();
	const style = $derived(kitStyle ?? look.style);
</script>

{#if style === 'compact'}
	<!-- One line: a small photo beside the title. -->
	<div
		data-layout="compact"
		class="flex w-full flex-col rounded-md border bg-card lg:w-md lg:min-w-3xl {className}"
	>
		<div class="flex w-full items-center gap-3 border-b px-4 py-3">
			{#if photo !== ''}
				<img
					src={fileUrl(photo)}
					loading="lazy"
					class="size-12 shrink-0 rounded-md object-cover"
					alt="{title} photo"
				/>
			{/if}
			<h1 class="min-w-0 truncate">{title}</h1>
		</div>
		{@render children()}
	</div>
{:else if style === 'soft'}
	<!-- A tinted banner with the photo sitting on its edge. -->
	<div
		data-layout="soft"
		class="flex w-full flex-col items-center overflow-hidden rounded-(--kit-card-radius) bg-card shadow-(--kit-card-shadow) lg:w-md lg:min-w-3xl {className}"
	>
		<div class="h-28 w-full bg-linear-to-br from-primary/25 via-primary/10 to-transparent"></div>
		<div class="-mt-14 flex flex-col items-center gap-3 px-8 pb-6">
			{#if photo !== ''}
				<img
					src={fileUrl(photo)}
					loading="lazy"
					class="size-28 rounded-full object-cover ring-4 ring-card"
					alt="{title} photo"
				/>
			{:else}
				<div class="size-14"></div>
			{/if}
			<h1 class="text-center">{title}</h1>
		</div>
		{@render children()}
	</div>
{:else if style === 'sharp'}
	<!-- A record header: square photo, the title in a shaded bar. -->
	<div
		data-layout="sharp"
		class="flex w-full flex-col border bg-card lg:w-md lg:min-w-3xl {className}"
	>
		<div class="flex w-full items-center gap-4 border-b bg-muted px-5 py-4">
			{#if photo !== ''}
				<img
					src={fileUrl(photo)}
					loading="lazy"
					class="size-16 shrink-0 border object-cover"
					alt="{title} photo"
				/>
			{/if}
			<h1 class="min-w-0 truncate">{title}</h1>
		</div>
		{@render children()}
	</div>
{:else if style === 'formal'}
	<!-- A document's title block: an ID photo, the name between rules. -->
	<div
		data-layout="formal"
		class="flex w-full flex-col items-center border bg-card lg:w-md lg:min-w-3xl {className}"
	>
		<div class="flex w-full flex-col items-center gap-4 px-8 pt-8 pb-6">
			{#if photo !== ''}
				<img
					src={fileUrl(photo)}
					loading="lazy"
					class="h-36 w-28 border bg-background object-cover p-1"
					alt="{title} photo"
				/>
			{/if}
			<div class="h-px w-16 bg-foreground/30"></div>
			<h1 class="text-center">{title}</h1>
			<div class="h-px w-16 bg-foreground/30"></div>
		</div>
		{@render children()}
	</div>
{:else if style === 'bold'}
	<!-- A poster block: accent header, inked photo, hard shadow. -->
	<div
		data-layout="bold"
		class="flex w-full flex-col overflow-hidden rounded-lg border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)] lg:w-md lg:min-w-3xl {className}"
	>
		<div
			class="flex w-full items-end gap-5 border-b-2 border-foreground bg-primary px-6 py-5 text-primary-foreground"
		>
			{#if photo !== ''}
				<img
					src={fileUrl(photo)}
					loading="lazy"
					class="size-24 shrink-0 rounded-lg border-2 border-foreground object-cover"
					alt="{title} photo"
				/>
			{/if}
			<h1 class="min-w-0">{title}</h1>
		</div>
		{@render children()}
	</div>
{:else}
	<div
		class="flex w-full flex-col items-center justify-center rounded-md
 bg-card text-card-foreground shadow-lg lg:w-md lg:min-w-3xl dark:shadow-md {className}"
	>
		<div
			class="flex w-full flex-col items-center justify-start rounded-t-lg border-b bg-muted px-8 py-6 text-foreground"
		>
			{#if photo !== ''}
				<img
					src={fileUrl(photo)}
					loading="lazy"
					class="h-48 w-48 rounded-full"
					alt="{title} photo"
				/>
			{/if}
			<h1 class="text-center">{title}</h1>
		</div>

		{@render children()}
	</div>
{/if}
