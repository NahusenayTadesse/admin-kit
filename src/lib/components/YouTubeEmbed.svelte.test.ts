import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import YouTubeEmbed from './YouTubeEmbed.svelte';

describe('YouTubeEmbed.svelte', () => {
	it('loads nothing from YouTube until play is pressed, then plays the pasted video', async () => {
		const screen = render(YouTubeEmbed, {
			url: 'https://youtu.be/E6s-kQUT2Oo?t=30',
			title: 'Launch film'
		});
		expect(screen.container.querySelector('iframe')).toBeNull();

		await userEvent.click(page.getByRole('button', { name: 'Play: Launch film' }));

		const frame = screen.container.querySelector('iframe');
		expect(frame?.src).toBe(
			'https://www.youtube-nocookie.com/embed/E6s-kQUT2Oo?rel=0&modestbranding=1&playsinline=1&start=30&autoplay=1'
		);
		expect(frame?.title).toBe('Launch film');
	});

	it('draws a Short upright', async () => {
		const screen = render(YouTubeEmbed, {
			url: 'https://www.youtube.com/shorts/E6s-kQUT2Oo',
			title: 'Clip'
		});
		await expect.element(page.getByRole('button', { name: 'Play: Clip' })).toBeInTheDocument();
		expect(screen.container.querySelector('.aspect-\\[9\\/16\\]')).not.toBeNull();
	});

	it('renders nothing for a link that is not a video', async () => {
		const screen = render(YouTubeEmbed, { url: 'https://vimeo.com/123', title: 'Nope' });
		expect(screen.container.querySelector('button')).toBeNull();
	});
});
