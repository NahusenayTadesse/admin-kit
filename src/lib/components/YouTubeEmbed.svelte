<script lang="ts">
	import { Play } from '@lucide/svelte';
	import type { ClassValue } from 'svelte/elements';
	import { useLabels } from '$lib/labels';
	import {
		parseYouTubeUrl,
		youtubeEmbedUrl,
		youtubeThumbnail,
		youtubeWatchUrl,
		type YouTubeVideo
	} from '$lib/youtube';

	/**
	 * A YouTube link, drawn as a player — the converter from a pasted link to a video.
	 *
	 * **Nothing is loaded from YouTube until someone presses play.** An iframe in the page from the
	 * start costs about 900KB of player script per video, most of it for videos nobody watches;
	 * until the click this is a button over the poster. After it, the iframe autoplays, which only
	 * continues the click.
	 *
	 * Give it `url` (as pasted in a form) or `video` (from `parseYouTubeUrl`/`youtubeVideo`). A
	 * link that is not a video renders nothing: a broken player is worse than no player.
	 *
	 * `poster="thumbnail"` shows YouTube's own image, fetched from `i.ytimg.com` — which tells
	 * Google the page was viewed. `poster="plain"` draws a local panel instead, for a site that
	 * would rather not.
	 */
	let {
		url = undefined,
		video: given = undefined,
		title,
		poster = 'thumbnail',
		showWatchLink = false,
		class: className = undefined
	}: {
		url?: string | null;
		video?: YouTubeVideo | null;
		/** The video's name: the play button's and the iframe's accessible name. */
		title: string;
		poster?: 'thumbnail' | 'plain';
		/** A "Watch on YouTube" link under the player. */
		showWatchLink?: boolean;
		/** On the frame; the aspect ratio is set from the video (16:9, or 9:16 for a Short). */
		class?: ClassValue;
	} = $props();

	const L = useLabels();
	const video = $derived(given ?? parseYouTubeUrl(url));
	/** The video whose play was pressed. Another video in the same place starts at its poster. */
	let started = $state<string | null>(null);
	const playing = $derived(video !== null && started === video.id);
</script>

{#if video}
	<div class="flex flex-col gap-2">
		<div
			class={[
				'relative w-full overflow-hidden rounded-xl bg-black',
				video.isShort ? 'mx-auto aspect-[9/16] max-w-sm' : 'aspect-video',
				className
			]}
		>
			{#if playing}
				<iframe
					src={youtubeEmbedUrl(video, true)}
					{title}
					class="absolute inset-0 h-full w-full"
					referrerpolicy="strict-origin-when-cross-origin"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowfullscreen
				></iframe>
			{:else}
				<button
					type="button"
					onclick={() => (started = video?.id ?? null)}
					aria-label={L.youtubePlay(title)}
					class="group absolute inset-0 flex items-center justify-center"
				>
					{#if poster === 'thumbnail'}
						<img
							src={youtubeThumbnail(video, 'hq')}
							alt=""
							loading="lazy"
							decoding="async"
							class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<span class="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10"
						></span>
					{:else}
						<span class="absolute inset-0 bg-linear-to-br from-muted to-muted-foreground/40"></span>
					{/if}
					<span
						class="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110"
					>
						<Play class="ml-1 h-7 w-7 fill-current" />
					</span>
				</button>
			{/if}
		</div>
		{#if showWatchLink}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- an external YouTube link -->
			<a
				href={youtubeWatchUrl(video)}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
			>
				{L.youtubeWatch}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</div>
{/if}
