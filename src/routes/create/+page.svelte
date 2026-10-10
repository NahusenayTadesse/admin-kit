<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { mode, setMode } from 'mode-watcher';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';

	import KitStyle from '$lib/components/KitStyle.svelte';
	import {
		KIT_ACCENTS,
		KIT_ACCENT_NAMES,
		KIT_FONTS,
		KIT_FONT_NAMES,
		KIT_RADII,
		KIT_RADIUS_NAMES,
		KIT_STYLES,
		KIT_STYLE_NAMES,
		type KitAccent,
		type KitFont,
		type KitLook,
		type KitRadius,
		type KitStyleName
	} from '$lib/kitStyle';
	import Preview from './Preview.svelte';
	import { APP_PALETTES, type AppPalette } from './palettes';

	/*
	 * The kit's answer to shadcn's /create: pick a style and tune it, see every kit component in it,
	 * copy the lines that give an app the same look. The choice lives in the URL, so a link to a
	 * look is just this page's address.
	 */

	function pick<T extends string>(list: readonly T[], value: string | null): T | undefined {
		return value && (list as readonly string[]).includes(value) ? (value as T) : undefined;
	}

	const params = page.url.searchParams;
	let style = $state<KitStyleName>(pick(KIT_STYLE_NAMES, params.get('style')) ?? 'default');
	let accent = $state<KitAccent | undefined>(pick(KIT_ACCENT_NAMES, params.get('accent')));
	let radius = $state<KitRadius | undefined>(pick(KIT_RADIUS_NAMES, params.get('radius')));
	let font = $state<KitFont | undefined>(pick(KIT_FONT_NAMES, params.get('font')));
	let heading = $state<KitFont | undefined>(pick(KIT_FONT_NAMES, params.get('heading')));
	/** Stands in for an app's own layout.css, loaded after the kit's theme. */
	let palette = $state<AppPalette | undefined>(
		pick(Object.keys(APP_PALETTES) as AppPalette[], params.get('palette'))
	);

	const look = $derived<KitLook>({ style, accent, radius, font, heading });

	// Keep the address in step, so the look can be shared or bookmarked.
	$effect(() => {
		const url = new URL(page.url);
		for (const [key, value] of Object.entries(look)) {
			if (value && !(key === 'style' && value === 'default')) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		if (palette) url.searchParams.set('palette', palette);
		else url.searchParams.delete('palette');
		if (url.search !== page.url.search) replaceState(url, {});
	});

	function shuffle() {
		const any = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
		style = any(KIT_STYLE_NAMES);
		accent = any(KIT_ACCENT_NAMES);
		radius = Math.random() < 0.5 ? undefined : any(KIT_RADIUS_NAMES);
		font = undefined;
		heading = Math.random() < 0.7 ? undefined : any(KIT_FONT_NAMES);
	}

	function reset() {
		style = 'default';
		accent = radius = font = heading = palette = undefined;
	}

	/** The look as a props object, without the axes left to the style. */
	const lookLiteral = $derived(
		'{ ' +
			Object.entries(look)
				.filter(([, value]) => value)
				.map(([key, value]) => `${key}: '${value}'`)
				.join(', ') +
			' }'
	);
	const kitStyleProps = $derived(
		Object.entries(look)
			.filter(([key, value]) => value && !(key === 'style' && value === 'default'))
			.map(([key, value]) => ` ${key}="${value}"`)
			.join('')
	);

	let tab = $state<'provider' | 'root'>('provider');
	const code = $derived(
		{
			provider: `<!-- src/routes/dashboard/+layout.svelte -->\n<KitProvider look={${lookLiteral}} {access} navigation={NAVIGATION} …>\n\t…\n</KitProvider>`,
			root:
				`<!-- src/routes/+layout.svelte: the whole app, sign-in included -->\n<script lang="ts">\n\timport KitStyle from '@nahu/admin-kit/components/KitStyle.svelte';\n\tlet { children } = $props();\n</` +
				`script>\n\n<KitStyle${kitStyleProps}>\n\t{@render children()}\n</KitStyle>`
		}[tab]
	);

	let copied = $state(false);
	async function copy() {
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	const FONT_OF: Record<KitStyleName, string> = {
		default: "'Inter'",
		compact: "'IBM Plex Sans'",
		soft: "'Plus Jakarta Sans'",
		sharp: "'Geist'",
		formal: "'Source Serif 4'",
		bold: "'Space Grotesk'"
	};
</script>

<svelte:head>
	<title>Create · admin-kit</title>
	{#if palette}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<style data-app-palette>${APP_PALETTES[palette].css}</style>`}
	{/if}
</svelte:head>

<KitStyle {...look}>
	<div class="min-h-screen bg-background text-foreground">
		<header
			class="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur lg:px-6"
		>
			<div class="flex min-w-0 items-baseline gap-2">
				<a href="/" class="font-semibold">admin-kit</a>
				<span class="text-muted-foreground">/</span>
				<span class="truncate text-muted-foreground">Create</span>
			</div>
			<div class="flex items-center gap-2">
				<button type="button" class="tool" onclick={shuffle}
					><Shuffle class="size-4" />Shuffle</button
				>
				<button type="button" class="tool" onclick={reset}><RotateCcw class="size-4" />Reset</button
				>
				<button
					type="button"
					class="tool"
					aria-label="Toggle dark mode"
					onclick={() => setMode(mode.current === 'dark' ? 'light' : 'dark')}
				>
					{#if mode.current === 'dark'}<Sun class="size-4" />{:else}<Moon class="size-4" />{/if}
				</button>
			</div>
		</header>

		<div class="grid lg:grid-cols-[21rem_minmax(0,1fr)]">
			<aside
				class="flex flex-col gap-7 border-b p-5 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-r lg:border-b-0"
			>
				<fieldset class="flex flex-col gap-2">
					<legend class="panel-label">Style</legend>
					{#each KIT_STYLE_NAMES as name (name)}
						{@const info = KIT_STYLES[name]}
						<label class="style-option" data-checked={style === name}>
							<input type="radio" class="sr-only" bind:group={style} value={name} />
							<span
								class="flex size-10 shrink-0 items-center justify-center rounded-md border bg-card text-lg"
								style:font-family={FONT_OF[name]}>Aa</span
							>
							<span class="flex min-w-0 flex-col">
								<span class="text-sm font-semibold">
									{info.label}{#if name === 'default'}<span
											class="ml-1.5 text-xs font-normal text-muted-foreground">current</span
										>{/if}
								</span>
								<span class="text-xs leading-snug text-muted-foreground">{info.tagline}</span>
							</span>
						</label>
					{/each}
				</fieldset>

				<fieldset class="flex flex-col gap-2">
					<legend class="panel-label">Accent</legend>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							class="swatch text-[10px] font-medium"
							data-checked={!accent}
							title="Keep the app's or the style's"
							onclick={() => (accent = undefined)}>Auto</button
						>
						{#each KIT_ACCENT_NAMES as name (name)}
							<button
								type="button"
								class="swatch"
								data-checked={accent === name}
								title={KIT_ACCENTS[name].label}
								aria-label={KIT_ACCENTS[name].label}
								onclick={() => (accent = name)}
							>
								<span class="size-5 rounded-full" style:background={KIT_ACCENTS[name].swatch}
								></span>
							</button>
						{/each}
					</div>
				</fieldset>

				<fieldset class="flex flex-col gap-2">
					<legend class="panel-label">Radius</legend>
					<div class="segmented">
						<button type="button" data-checked={!radius} onclick={() => (radius = undefined)}
							>Style</button
						>
						{#each KIT_RADIUS_NAMES as name (name)}
							<button
								type="button"
								data-checked={radius === name}
								title={KIT_RADII[name].value}
								onclick={() => (radius = name)}>{name}</button
							>
						{/each}
					</div>
					<p class="text-xs text-muted-foreground">
						Scales corners. The style still decides shapes: Soft keeps pill buttons.
					</p>
				</fieldset>

				<label class="flex flex-col gap-1.5">
					<span class="panel-label">Test with an app's palette</span>
					<select class="panel-select" bind:value={palette}>
						<option value={undefined}>None — the kit's colours</option>
						{#each Object.entries(APP_PALETTES) as [name, { label }] (name)}
							<option value={name}>{label}</option>
						{/each}
					</select>
					<span class="text-xs text-muted-foreground">
						The app's colours always win: styles never set one, and the accent only fills in for an
						app with no <code>--primary</code>.
					</span>
				</label>

				<div class="grid grid-cols-2 gap-3">
					<label class="flex flex-col gap-1.5">
						<span class="panel-label">Body font</span>
						<select class="panel-select" bind:value={font}>
							<option value={undefined}>Style's</option>
							{#each KIT_FONT_NAMES as name (name)}
								<option value={name}>{KIT_FONTS[name].label}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="panel-label">Heading font</span>
						<select class="panel-select" bind:value={heading}>
							<option value={undefined}>Style's</option>
							{#each KIT_FONT_NAMES as name (name)}
								<option value={name}>{KIT_FONTS[name].label}</option>
							{/each}
						</select>
					</label>
				</div>

				<section class="flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="panel-label">Use it</span>
						<button type="button" class="tool h-7 px-2 text-xs" onclick={copy}>
							{#if copied}<Check class="size-3.5" />Copied{:else}<Copy class="size-3.5" />Copy{/if}
						</button>
					</div>
					<div class="segmented">
						<button
							type="button"
							data-checked={tab === 'provider'}
							onclick={() => (tab = 'provider')}>Dashboard</button
						>
						<button type="button" data-checked={tab === 'root'} onclick={() => (tab = 'root')}
							>Whole app</button
						>
					</div>
					<pre
						class="overflow-x-auto rounded-md border bg-muted/60 p-3 font-mono text-[11.5px] leading-relaxed"><code
							>{code}</code
						></pre>
				</section>
			</aside>

			<main class="min-w-0 p-5 lg:p-8">
				<Preview />
			</main>
		</div>
	</div>
</KitStyle>

<style>
	/*
	 * The panel's own controls: plain elements, so the panel reads the same whichever look is
	 * picked — only the colours and faces follow it.
	 */
	.panel-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.25rem;
	}
	.tool {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		height: 2rem;
		padding: 0 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		background: var(--background);
		font-size: 0.8125rem;
		font-weight: 500;
	}
	.tool:hover {
		background: var(--accent);
	}
	.style-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
	}
	.style-option:hover {
		background: var(--accent);
	}
	.style-option[data-checked='true'] {
		border-color: var(--primary);
		background: color-mix(in oklch, var(--primary) 8%, transparent);
	}
	.style-option:has(:focus-visible) {
		outline: 2px solid var(--ring);
	}
	.swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--border);
		border-radius: 9999px;
		background: var(--background);
	}
	.swatch[data-checked='true'] {
		outline: 2px solid var(--foreground);
		outline-offset: 2px;
	}
	.segmented {
		display: flex;
		padding: 0.1875rem;
		gap: 0.125rem;
		border-radius: 0.5rem;
		background: var(--muted);
	}
	.segmented button {
		flex: 1;
		height: 1.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--muted-foreground);
	}
	.segmented button[data-checked='true'] {
		background: var(--background);
		color: var(--foreground);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
	}
	.panel-select {
		height: 2rem;
		padding: 0 0.5rem;
		border: 1px solid var(--input);
		border-radius: 0.375rem;
		background: var(--background);
		font-size: 0.8125rem;
	}
</style>
