/**
 * YouTube links, parsed rather than pasted.
 *
 * Forms ask for the link from the browser bar or the Share button — never the `<iframe>` snippet
 * YouTube offers. Markup pasted into a database field is how a stray `<script>` reaches a page,
 * and an embed copied years ago keeps whatever attributes YouTube suggested that year. So the
 * link is what is stored, and the player is the app's: `YouTubeEmbed.svelte`, or the URLs below.
 *
 * Ported from shimeles' `$lib/youtube`, with Shorts recognised and a thumbnail helper added.
 */

/** A video id is eleven characters of URL-safe base64. */
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * The hosts a video is accepted from. An allowlist, not a "contains youtube" check:
 * `youtube.com.evil.test` contains it too.
 */
const HOSTS = new Set([
	'youtube.com',
	'www.youtube.com',
	'm.youtube.com',
	'music.youtube.com',
	'youtube-nocookie.com',
	'www.youtube-nocookie.com',
	'youtu.be',
	'www.youtu.be'
]);

/** Path prefixes that carry the id as the next segment. */
const PATH_PREFIXES = ['embed', 'shorts', 'live', 'v'];

export interface YouTubeVideo {
	id: string;
	/** Seconds to start at, from a `t=`/`start=` parameter. 0 when absent. */
	start: number;
	/** The link was a `/shorts/` one: a vertical video. */
	isShort: boolean;
}

/**
 * The video in any of the shapes a YouTube link comes in — watch, youtu.be, embed, shorts, live,
 * with or without the scheme — or `null` when there is none. A form uses the `null` to say "that
 * is not a YouTube link" before it is saved; a page uses it to draw nothing rather than a broken
 * player.
 */
export function parseYouTubeUrl(input: string | null | undefined): YouTubeVideo | null {
	const raw = input?.trim();
	if (!raw) return null;

	let url: URL;
	try {
		// A link copied without its scheme is still a link someone meant to paste.
		url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
	} catch {
		return null;
	}

	const host = url.hostname.toLowerCase();
	if (!HOSTS.has(host)) return null;

	const segments = url.pathname.split('/').filter(Boolean);
	const candidate = host.endsWith('youtu.be')
		? segments[0]
		: url.pathname === '/watch'
			? (url.searchParams.get('v') ?? '')
			: PATH_PREFIXES.includes(segments[0] ?? '')
				? segments[1]
				: '';

	if (!candidate || !ID_PATTERN.test(candidate)) return null;
	return { id: candidate, start: parseStart(url), isShort: segments[0] === 'shorts' };
}

/** "Share at current time" adds `t=90` or `t=1m30s`: whoever pasted that meant the moment. */
function parseStart(url: URL): number {
	const raw = (url.searchParams.get('t') ?? url.searchParams.get('start') ?? '').trim();
	if (!raw) return 0;
	if (/^\d+$/.test(raw)) return clampStart(Number(raw));
	const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
	if (!match) return 0;
	const [, h, m, s] = match;
	return clampStart(Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0));
}

/** A day of seconds is past any sane video; anything beyond is a typo. */
const clampStart = (seconds: number) =>
	Number.isFinite(seconds) && seconds > 0 ? Math.min(Math.floor(seconds), 86_400) : 0;

/** A video by id alone — a row synced from a channel feed, say. */
export const youtubeVideo = (id: string, isShort = false): YouTubeVideo => ({
	id,
	start: 0,
	isShort
});

/**
 * The player URL. `youtube-nocookie.com` is YouTube's privacy-enhanced host: no tracking cookies
 * until someone presses play. `autoplay` is for the click that just asked for the video — it
 * continues that gesture rather than starting a video at anyone unasked.
 */
export function youtubeEmbedUrl(video: YouTubeVideo, autoplay = false): string {
	const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
	if (video.start) params.set('start', String(video.start));
	if (autoplay) params.set('autoplay', '1');
	return `https://www.youtube-nocookie.com/embed/${video.id}?${params}`;
}

/** The watch link, for a "Watch on YouTube" fallback. Shorts open in the Shorts player. */
export const youtubeWatchUrl = (video: YouTubeVideo): string =>
	video.isShort
		? `https://www.youtube.com/shorts/${video.id}`
		: `https://www.youtube.com/watch?v=${video.id}${video.start ? `&t=${video.start}` : ''}`;

/**
 * The video's poster from YouTube's image CDN. `hq` (480×360) exists for every video; `maxres`
 * (1280×720) only for HD uploads, so use it with a fallback.
 */
export const youtubeThumbnail = (
	video: Pick<YouTubeVideo, 'id'>,
	quality: 'mq' | 'hq' | 'sd' | 'maxres' = 'hq'
): string => `https://i.ytimg.com/vi/${video.id}/${quality}default.jpg`;

/** Whether a pasted link can drive a player — the check for a form's `refine`. */
export const isUsableYouTubeUrl = (url: string | null | undefined): boolean =>
	parseYouTubeUrl(url) !== null;
