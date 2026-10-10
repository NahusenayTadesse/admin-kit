<script lang="ts" module>
	import { KIT_LOOK_ATTRIBUTES } from '$lib/kitStyle';

	/*
	 * The KitStyles on the page, in the browser only (effects never run on the server). The deepest
	 * one's look is the one on <html>: a dashboard's KitProvider inside a root layout's KitStyle
	 * wins while it is there, and the root's look comes back when it leaves.
	 */
	const mounted: { depth: number; attributes: Record<string, string> }[] = [];
	const DEPTH = Symbol.for('admin-kit.look-depth');

	function applyInnermost() {
		const innermost = mounted.reduce<(typeof mounted)[number] | undefined>(
			(deepest, entry) => (!deepest || entry.depth >= deepest.depth ? entry : deepest),
			undefined
		);
		const root = document.documentElement;
		for (const name of KIT_LOOK_ATTRIBUTES) {
			const value = innermost?.attributes[name];
			if (value) root.setAttribute(name, value);
			else root.removeAttribute(name);
		}
	}
</script>

<script lang="ts">
	import { getContext, setContext, type Snippet } from 'svelte';
	import {
		kitLookAttributes,
		setKitLook,
		type KitAccent,
		type KitFont,
		type KitRadius,
		type KitStyleName
	} from '$lib/kitStyle';

	/**
	 * Gives the app one of the kit's looks: a style, and optionally an accent, a radius, a body face
	 * and a heading face (`src/lib/kitStyle.ts`, `STYLES.md`).
	 *
	 *     <KitStyle style="soft">{@render children()}</KitStyle>
	 *
	 * Put it in the root `+layout.svelte` for the whole app, or use `<KitProvider look={…}>` for the
	 * dashboard alone.
	 *
	 * The look lives on `<html>` as `data-kit-*` attributes, and only there: the style's rules are
	 * weightless and never set a colour, so the app's own colours and tokens — on `:root`, `.dark`,
	 * or a subtree like a public site's `.site` — always win. A small script in `<head>` sets the
	 * attributes while the server's HTML is parsed, before anything is painted (as mode-watcher
	 * does for dark mode); after that an effect keeps them in step, and on leaving puts back the
	 * look of the `KitStyle` around this one, or none. With one inside another, the inner one's
	 * look is on the page while it is mounted.
	 *
	 * It also sets the look in context, for the components that draw a different layout per style.
	 */
	let {
		style = 'default',
		accent = undefined,
		radius = undefined,
		font = undefined,
		heading = undefined,
		children
	}: {
		style?: KitStyleName;
		/** A stand-in action colour, for an app that sets no `--primary` of its own. */
		accent?: KitAccent;
		radius?: KitRadius;
		font?: KitFont;
		heading?: KitFont;
		children: Snippet;
	} = $props();

	// How deep this one sits: the innermost KitStyle on the page decides <html>.
	const depth = (getContext<number | undefined>(DEPTH) ?? -1) + 1;
	setContext(DEPTH, depth);

	setKitLook({
		get style() {
			return style;
		},
		get accent() {
			return accent;
		},
		get radius() {
			return radius;
		},
		get font() {
			return font;
		},
		get heading() {
			return heading;
		}
	});

	const attributes = $derived(kitLookAttributes({ style, accent, radius, font, heading }));

	/*
	 * The first paint. The values are the closed lists in kitStyle.ts (checked there), so the JSON
	 * cannot close the script; `<` is escaped regardless.
	 */
	const script = $derived(
		`<script>(function(a,n){var r=document.documentElement;n.forEach(function(k){a[k]?r.setAttribute(k,a[k]):r.removeAttribute(k)})})(${JSON.stringify(
			attributes
		).replaceAll('<', '\\u003c')},${JSON.stringify(KIT_LOOK_ATTRIBUTES)})</` + `script>`
	);

	$effect(() => {
		const entry = { depth, attributes };
		mounted.push(entry);
		applyInnermost();
		return () => {
			mounted.splice(mounted.indexOf(entry), 1);
			applyInnermost();
		};
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html script}
</svelte:head>

{@render children()}
