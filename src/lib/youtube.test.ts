import { describe, expect, it } from 'vitest';
import {
	isUsableYouTubeUrl,
	parseYouTubeUrl,
	youtubeEmbedUrl,
	youtubeThumbnail,
	youtubeWatchUrl
} from './youtube';

const ID = 'E6s-kQUT2Oo';

describe('parseYouTubeUrl', () => {
	it.each([
		[`https://www.youtube.com/watch?v=${ID}`],
		[`https://youtube.com/watch?v=${ID}&list=PL123&index=2`],
		[`https://m.youtube.com/watch?v=${ID}`],
		[`https://youtu.be/${ID}?si=abc`],
		[`youtu.be/${ID}`],
		[`https://www.youtube.com/embed/${ID}`],
		[`https://www.youtube-nocookie.com/embed/${ID}`],
		[`https://www.youtube.com/live/${ID}`]
	])('reads the id out of %s', (link) => {
		expect(parseYouTubeUrl(link)).toEqual({ id: ID, start: 0, isShort: false });
	});

	it('knows a Short', () => {
		expect(parseYouTubeUrl(`https://www.youtube.com/shorts/${ID}`)).toEqual({
			id: ID,
			start: 0,
			isShort: true
		});
	});

	it.each([
		['t=90', 90],
		['t=1m30s', 90],
		['t=1h2m3s', 3723],
		['start=45', 45],
		['t=nonsense', 0]
	])('reads the start time from %s', (query, seconds) => {
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${ID}&${query}`)?.start).toBe(seconds);
	});

	it.each([
		[''],
		[null],
		['not a link'],
		[`https://youtube.com.evil.test/watch?v=${ID}`],
		[`https://vimeo.com/${ID}`],
		['https://www.youtube.com/watch?v=short'],
		['https://www.youtube.com/@JoelTalargie'],
		['<iframe src="https://www.youtube.com/embed/E6s-kQUT2Oo"></iframe>']
	])('refuses %s', (link) => {
		expect(parseYouTubeUrl(link)).toBeNull();
		expect(isUsableYouTubeUrl(link)).toBe(false);
	});
});

describe('the URLs built from a video', () => {
	const video = { id: ID, start: 0, isShort: false };

	it('embeds from the privacy-enhanced host, autoplaying only when asked', () => {
		expect(youtubeEmbedUrl(video)).toBe(
			`https://www.youtube-nocookie.com/embed/${ID}?rel=0&modestbranding=1&playsinline=1`
		);
		expect(youtubeEmbedUrl({ ...video, start: 30 }, true)).toContain('start=30&autoplay=1');
	});

	it('links Shorts to the Shorts player and keeps the start time on a watch link', () => {
		expect(youtubeWatchUrl({ ...video, isShort: true })).toBe(
			`https://www.youtube.com/shorts/${ID}`
		);
		expect(youtubeWatchUrl({ ...video, start: 90 })).toBe(
			`https://www.youtube.com/watch?v=${ID}&t=90`
		);
	});

	it('points at the thumbnail size asked for', () => {
		expect(youtubeThumbnail(video)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
		expect(youtubeThumbnail(video, 'maxres')).toBe(
			`https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`
		);
	});
});
