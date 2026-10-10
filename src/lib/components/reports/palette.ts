/**
 * The kit's own chart palette, one validated set per theme — the fallback. Charts draw with the
 * app's `--chart-1` … `--chart-5` first (`chartTheme` below); these fill in series six to eight and
 * anything the page leaves undefined.
 *
 * The chart palette, one validated set per theme.
 *
 * The eight hues are assigned to series in this fixed order and never cycled —
 * a chart's fourth series is always the fourth colour, so a filter that removes
 * a series does not repaint the ones that remain. Both orderings clear the
 * colourblind-separation and lightness gates against their own surface; the
 * dark column is the same eight hues re-stepped for a dark background, not an
 * automatic inversion of the light one.
 */
export const SERIES_LIGHT = [
	'#2a78d6', // blue
	'#eb6834', // orange
	'#1baf7a', // aqua
	'#eda100', // yellow
	'#e87ba4', // magenta
	'#008300', // green
	'#4a3aa7', // violet
	'#e34948' // red
];

export const SERIES_DARK = [
	'#3987e5',
	'#d95926',
	'#199e70',
	'#c98500',
	'#d55181',
	'#008300',
	'#9085e9',
	'#e66767'
];

/** Ink and surface tokens, so marks sit on a known background in either theme. */
export const THEME = {
	light: {
		series: SERIES_LIGHT,
		surface: '#fcfcfb',
		text: '#0b0b0b',
		muted: '#52514e',
		grid: 'rgba(11, 11, 11, 0.08)'
	},
	dark: {
		series: SERIES_DARK,
		surface: '#1a1a19',
		text: '#f5f5f4',
		muted: '#c3c2b7',
		grid: 'rgba(245, 245, 244, 0.10)'
	}
} as const;

export type ThemeName = keyof typeof THEME;

export type ChartTheme = {
	series: readonly string[];
	surface: string;
	text: string;
	muted: string;
	grid: string;
};

/** A colour with a new alpha — for area fills under a line. Takes `#rrggbb` or `rgba(…)`. */
export function fade(colour: string, alpha: number): string {
	const a = Math.min(1, Math.max(0, alpha));
	const rgba = /^rgba?\(([^,]+),([^,]+),([^,)]+)/.exec(colour.replaceAll(' ', ''));
	if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${a})`;
	const byte = Math.round(a * 255)
		.toString(16)
		.padStart(2, '0');
	return `${colour}${byte}`;
}

let probe: CanvasRenderingContext2D | null | undefined;

/**
 * Any CSS colour the browser knows (`oklch(…)`, `#…`, a name) as `rgba(…)`, or `null` when it is
 * empty or not a colour. Chart.js mixes hover shades itself and only reads hex and rgb, so the
 * app's colours are put through a one-pixel canvas first.
 */
export function toRgba(value: string): string | null {
	const colour = value.trim();
	if (!colour || typeof document === 'undefined') return null;
	probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
	if (!probe) return null;
	const sentinel = '#010203';
	probe.fillStyle = sentinel;
	probe.fillStyle = colour;
	if (probe.fillStyle === sentinel && colour.toLowerCase() !== sentinel) return null;
	probe.clearRect(0, 0, 1, 1);
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
	return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
}

/**
 * The chart colours in effect at `element`: the app's `--chart-1` … `--chart-5` for the first five
 * series, `--card`, `--foreground`, `--muted-foreground` and `--border` for the surface, text and
 * grid — read where the chart is, so a subtree with its own palette gets its own. Anything the
 * page does not define (and series six to eight) comes from the kit's set above.
 */
export function chartTheme(element: Element | null, name?: ThemeName): ChartTheme {
	const dark =
		name === 'dark' ||
		(name === undefined &&
			typeof document !== 'undefined' &&
			document.documentElement.classList.contains('dark'));
	const base = THEME[dark ? 'dark' : 'light'];
	if (!element || typeof getComputedStyle === 'undefined') return base;

	const css = getComputedStyle(element);
	const read = (name: string) => toRgba(css.getPropertyValue(name));
	return {
		series: base.series.map((fallback, i) => (i < 5 ? read(`--chart-${i + 1}`) : null) ?? fallback),
		surface: read('--card') ?? base.surface,
		text: read('--foreground') ?? base.text,
		muted: read('--muted-foreground') ?? base.muted,
		grid: read('--border') ?? base.grid
	};
}
