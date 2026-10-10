import { getContext, setContext } from 'svelte';

/**
 * The kit's looks. A *style* is more than a colour theme: it sets the fonts, the corner radius,
 * the shape and size of buttons and inputs, how dense tables are, how headings and labels are
 * set, and — in the components that have one — a different layout altogether (`SingleTable`,
 * `SingleView`, `PageHeader`, `PageSection`, `Section`, `StatCard`, `Notice`, `Empty`, status
 * badges). Inspired by shadcn's `create` styles (Vega, Nova, Maia, Lyra, Mira).
 *
 * Four more axes sit on top of a style, each optional: `accent` (the action colour), `radius`
 * (corner rounding), `font` (body face) and `heading` (heading face). The style picks the shape
 * of things; the axes tune it.
 *
 * Everything is driven by `data-kit-*` attributes and CSS variables (`styles/kit-styles.css`),
 * so it works with SSR, needs no rebuild, and an app's own `--primary`, `--radius` or
 * `--kit-font-sans` still win over a style's. Components that change *markup* read the style
 * from context (`useKitLook`), which `<KitStyle>` or `<KitProvider look={…}>` sets.
 */

export const KIT_STYLE_NAMES = ['default', 'compact', 'soft', 'sharp', 'formal', 'bold'] as const;
export type KitStyleName = (typeof KIT_STYLE_NAMES)[number];

export const KIT_ACCENT_NAMES = [
	'blue',
	'teal',
	'green',
	'violet',
	'amber',
	'rose',
	'neutral'
] as const;
export type KitAccent = (typeof KIT_ACCENT_NAMES)[number];

export const KIT_RADIUS_NAMES = ['none', 'sm', 'md', 'lg', 'xl'] as const;
export type KitRadius = (typeof KIT_RADIUS_NAMES)[number];

export const KIT_FONT_NAMES = [
	'inter',
	'plex',
	'jakarta',
	'geist',
	'source',
	'grotesk',
	'serif',
	'mono'
] as const;
export type KitFont = (typeof KIT_FONT_NAMES)[number];

/** A style and any of the axes on top of it. Leave an axis out to keep the style's own. */
export type KitLook = {
	style?: KitStyleName;
	accent?: KitAccent;
	radius?: KitRadius;
	font?: KitFont;
	heading?: KitFont;
};

export type KitStyleInfo = {
	name: KitStyleName;
	label: string;
	/** One line: what it looks like. */
	tagline: string;
	/** Heading face / body face, as the style sets them. */
	fonts: string;
	radius: string;
	buttons: string;
	density: 'dense' | 'regular' | 'roomy';
	/** Where it fits. */
	bestFor: string[];
	/** Where it does not. */
	avoidFor: string[];
};

/** What each style is and where it belongs. The same text is in `STYLES.md`. */
export const KIT_STYLES: Record<KitStyleName, KitStyleInfo> = {
	default: {
		name: 'default',
		label: 'Default',
		tagline: 'The kit as it has always looked: neutral greys, one blue, Inter.',
		fonts: 'Inter / Inter',
		radius: '0.5rem',
		buttons: 'Rounded rectangles that grow slightly on hover',
		density: 'regular',
		bestFor: [
			'General back-office and admin dashboards',
			'Apps with a mix of forms, tables and detail pages',
			'Anything already built on the kit (it is what they look like now)'
		],
		avoidFor: ['Screens where every pixel of density counts — use Compact']
	},
	compact: {
		name: 'compact',
		label: 'Compact',
		tagline: 'Small controls, tight rows, striped tables, tabular figures.',
		fonts: 'IBM Plex Sans / IBM Plex Sans',
		radius: '0.375rem',
		buttons: 'Short (32px) rectangles, no hover growth',
		density: 'dense',
		bestFor: [
			'Inventory, stock and pharmacy screens with long lists',
			'Accounting, ledgers, payroll and reports with many columns',
			'POS back offices and dispatch screens used all day by trained staff',
			'Wide desktop monitors'
		],
		avoidFor: ['Touch screens and tablets', 'Occasional or non-technical users']
	},
	soft: {
		name: 'soft',
		label: 'Soft',
		tagline: 'Pill buttons, round cards, generous spacing, borderless surfaces.',
		fonts: 'Plus Jakarta Sans / Plus Jakarta Sans',
		radius: '0.875rem (buttons and badges are pills)',
		buttons: 'Tall (40px) pills',
		density: 'roomy',
		bestFor: [
			'Portals for customers, patients, parents or members',
			'Reception and front-desk screens, booking and appointments',
			'Tablets and touch screens (larger targets)',
			'Staff who use the app occasionally and should not feel lost'
		],
		avoidFor: ['Data-heavy tables with dozens of columns']
	},
	sharp: {
		name: 'sharp',
		label: 'Sharp',
		tagline: 'Square corners, hairlines, mono labels, no shadows.',
		fonts: 'Geist / Geist, labels in Geist Mono',
		radius: '0',
		buttons: 'Square, uppercase, monospaced',
		density: 'regular',
		bestFor: [
			'Internal technical tools: IT assets, devices, logs and audit trails',
			'Logistics, warehouse and fleet tracking (codes, serials, SKUs)',
			'Developer-facing consoles and settings screens',
			'Teams that want a precise, engineered feel'
		],
		avoidFor: ['Customer-facing portals that should feel friendly']
	},
	formal: {
		name: 'formal',
		label: 'Formal',
		tagline: 'Serif headings, warm paper tones, ruled records, quiet controls.',
		fonts: 'Source Serif 4 / Source Sans 3',
		radius: '0.25rem',
		buttons: 'Flat rectangles with barely-rounded corners',
		density: 'regular',
		bestFor: [
			'Law offices, notaries, courts and government or NGO offices',
			'School records, transcripts, certificates and HR files',
			'Finance and insurance documents, invoices and statements',
			'Anything that is printed or read like a document'
		],
		avoidFor: ['Fast-paced operational screens', 'Young, playful brands']
	},
	bold: {
		name: 'bold',
		label: 'Bold',
		tagline: 'Thick ink borders, hard offset shadows, buttons that press in.',
		fonts: 'Space Grotesk / Space Grotesk',
		radius: '0.5rem',
		buttons: 'Bordered blocks with an offset shadow that press down when clicked',
		density: 'roomy',
		bestFor: [
			'Brand-forward startups, studios and creative agencies',
			'Events, ticketing, youth and education products',
			'Demos, hackathons and internal tools that should have character'
		],
		avoidFor: ['Dense tables', 'Conservative clients (banks, courts, hospitals)']
	}
};

export const KIT_ACCENTS: Record<KitAccent, { label: string; swatch: string }> = {
	blue: { label: 'Blue', swatch: 'oklch(0.48 0.14 258)' },
	teal: { label: 'Teal', swatch: 'oklch(0.52 0.1 190)' },
	green: { label: 'Green', swatch: 'oklch(0.5 0.13 150)' },
	violet: { label: 'Violet', swatch: 'oklch(0.5 0.18 295)' },
	amber: { label: 'Amber', swatch: 'oklch(0.62 0.15 60)' },
	rose: { label: 'Rose', swatch: 'oklch(0.55 0.19 15)' },
	neutral: { label: 'Neutral', swatch: 'oklch(0.25 0.01 255)' }
};

export const KIT_RADII: Record<KitRadius, { label: string; value: string }> = {
	none: { label: 'None', value: '0' },
	sm: { label: 'Small', value: '0.25rem' },
	md: { label: 'Medium', value: '0.5rem' },
	lg: { label: 'Large', value: '0.75rem' },
	xl: { label: 'Extra large', value: '1rem' }
};

export const KIT_FONTS: Record<KitFont, { label: string; family: string }> = {
	inter: { label: 'Inter', family: "'Inter'" },
	plex: { label: 'IBM Plex Sans', family: "'IBM Plex Sans'" },
	jakarta: { label: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans'" },
	geist: { label: 'Geist', family: "'Geist'" },
	source: { label: 'Source Sans 3', family: "'Source Sans 3'" },
	grotesk: { label: 'Space Grotesk', family: "'Space Grotesk'" },
	serif: { label: 'Source Serif 4', family: "'Source Serif 4'" },
	mono: { label: 'Geist Mono', family: "'Geist Mono'" }
};

export function isKitStyle(value: unknown): value is KitStyleName {
	return typeof value === 'string' && (KIT_STYLE_NAMES as readonly string[]).includes(value);
}

/**
 * The `data-kit-*` attributes for a look, to spread on an element: `<div {...kitLookAttributes(look)}>`.
 * `data-kit-style` is always present (`default` when none is given), so the CSS can recompute
 * its derived values on that element; the axes are present only when set.
 */
export function kitLookAttributes(look: KitLook = {}): Record<string, string> {
	const attributes: Record<string, string> = { 'data-kit-style': look.style ?? 'default' };
	if (look.accent) attributes['data-kit-accent'] = look.accent;
	if (look.radius) attributes['data-kit-radius'] = look.radius;
	if (look.font) attributes['data-kit-font'] = look.font;
	if (look.heading) attributes['data-kit-heading'] = look.heading;
	return attributes;
}

/** The look as `data-kit-*="…"` for an `<html>` tag (`app.html`), so the first paint matches. */
export function kitLookHtml(look: KitLook = {}): string {
	return Object.entries(kitLookAttributes(look))
		.map(([name, value]) => `${name}="${value}"`)
		.join(' ');
}

/** A resolved look: `style` is always set. */
export type KitLookContext = Readonly<KitLook & { style: KitStyleName }>;

const KEY = Symbol.for('admin-kit.look');

/**
 * Sets the look for every kit component below. Pass a getter object (as `<KitStyle>` does) to
 * keep it reactive. Usually you want `<KitStyle>` or `<KitProvider look={…}>` instead, which
 * also put the attributes on the page.
 */
export function setKitLook(look: KitLookContext) {
	setContext<KitLookContext>(KEY, look);
}

/** The look in effect: the nearest `<KitStyle>`'s, or `default` outside one. */
export function useKitLook(): KitLookContext {
	return getContext<KitLookContext | undefined>(KEY) ?? { style: 'default' };
}
