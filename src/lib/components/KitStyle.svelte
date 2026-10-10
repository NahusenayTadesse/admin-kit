<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		kitLookAttributes,
		setKitLook,
		type KitAccent,
		type KitFont,
		type KitRadius,
		type KitStyleName
	} from '$lib/kitStyle';

	/**
	 * Gives everything inside it one of the kit's looks: a style, and optionally an accent, a
	 * radius, a body face and a heading face (`src/lib/kitStyle.ts`, `STYLES.md`).
	 *
	 *     <KitStyle style="soft" accent="green">{@render children()}</KitStyle>
	 *
	 * Put it in the root `+layout.svelte` for the whole app, or use `<KitProvider look={…}>` for the
	 * dashboard alone. It does two things:
	 *
	 * - wraps its content in a `display: contents` element carrying `data-kit-*`, so the server's
	 *   HTML already has the look (no flash), and sets the look in context for the components that
	 *   change their markup;
	 * - in the browser, copies the same attributes onto `<html>` (unless `global={false}`), so
	 *   dialogs, menus and toasts — portalled to `<body>`, outside the wrapper — and the page
	 *   background match. Put them in `app.html` too (`kitLookHtml(look)`) for the very first paint
	 *   of `<body>`.
	 */
	let {
		style = 'default',
		accent = undefined,
		radius = undefined,
		font = undefined,
		heading = undefined,
		global = true,
		class: className = '',
		children
	}: {
		style?: KitStyleName;
		accent?: KitAccent;
		radius?: KitRadius;
		font?: KitFont;
		heading?: KitFont;
		/**
		 * Copy the look onto `<html>`. Off for a preview beside other looks (portalled menus then
		 * take the page's look).
		 */
		global?: boolean;
		/** On the wrapper; it is `display: contents` unless a class says otherwise. */
		class?: string;
		children: Snippet;
	} = $props();

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

	const NAMES = [
		'data-kit-style',
		'data-kit-accent',
		'data-kit-radius',
		'data-kit-font',
		'data-kit-heading'
	];

	$effect(() => {
		if (!global) return;
		const root = document.documentElement;
		const before = NAMES.map((name) => [name, root.getAttribute(name)] as const);
		for (const name of NAMES) {
			const value = attributes[name];
			if (value) root.setAttribute(name, value);
			else root.removeAttribute(name);
		}
		// Leaving (or changing look): put back what `app.html` or an outer KitStyle had.
		return () => {
			for (const [name, value] of before) {
				if (value === null) root.removeAttribute(name);
				else root.setAttribute(name, value);
			}
		};
	});
</script>

<div class={className || 'contents'} {...attributes}>
	{@render children()}
</div>
