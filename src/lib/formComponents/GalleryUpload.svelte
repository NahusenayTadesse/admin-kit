<script lang="ts">
	import { onDestroy } from 'svelte';
	import { CloudUpload, Loader, X } from '@lucide/svelte';
	import { filesProxy } from 'sveltekit-superforms';
	import type { Writable } from 'svelte/store';
	import imageCompression from 'browser-image-compression';
	import { Label } from '$lib/components/ui/label/index.js';
	import { useLabels } from '$lib/labels';

	/* eslint-disable @typescript-eslint/no-explicit-any */
	/** Loosely typed for the reason `InputComp` gives: this component indexes the store by `name`. */
	type FormStore = Writable<Record<string, any>>;
	/* eslint-enable @typescript-eslint/no-explicit-any */

	/**
	 * Picks several images at once for one form field — a project's gallery, a post's photos.
	 *
	 * The single-file `FileUpload` covers one attachment per column; this is for the rows of a
	 * child table, where each picked image becomes a row. It holds the files in the superforms
	 * field `name` (`filesProxy`), so the schema declares it as an array of files —
	 * `z.array(z.file()).default([])` — and the form must be `multipart`.
	 *
	 * Like `FileUpload`, every image is compressed in the browser first (about 1MB, 1920px at
	 * most): a phone photo is 4–8MB, and a gallery of ten of them would otherwise be a minute's
	 * upload on a mobile connection and blow past the server's per-file limit.
	 *
	 * It shows what is about to be uploaded, not what is stored: the app draws its own stored
	 * images, with whatever ordering and delete controls that table has.
	 */
	let {
		form,
		name,
		label = '',
		hint = undefined
	}: {
		/** The superforms `$form` store; `filesProxy` reads the field by `name`. */
		form: FormStore;
		name: string;
		label?: string;
		/** The line under the prompt. The kit's own wording by default. */
		hint?: string;
	} = $props();

	const L = useLabels();

	// svelte-ignore state_referenced_locally
	const files = filesProxy(form, name);
	let dragging = $state(false);
	let processing = $state(false);
	let input = $state<HTMLInputElement>();

	/*
	 * The input is what the browser posts, so it must hold exactly the chosen files. The store
	 * alone is not enough: a form posted the ordinary way (or by superforms from the form element)
	 * reads the input, and an input with no files posted nothing however full the store was.
	 * Every change — picked, dropped, compressed, removed — lands in the store first and is
	 * copied here.
	 */
	$effect(() => {
		if (input) input.files = $files ?? toFileList([]);
	});

	/* Object URLs for the previews, made once per file and revoked when it leaves. */
	const previews = new Map<File, string>();
	function preview(file: File) {
		let url = previews.get(file);
		if (!url) {
			url = URL.createObjectURL(file);
			previews.set(file, url);
		}
		return url;
	}
	function forget(file: File) {
		const url = previews.get(file);
		if (url) URL.revokeObjectURL(url);
		previews.delete(file);
	}
	onDestroy(() => {
		for (const url of previews.values()) URL.revokeObjectURL(url);
	});

	/** `filesProxy` holds a `FileList`, which only a `DataTransfer` can build. */
	function toFileList(list: File[]): FileList {
		const transfer = new DataTransfer();
		for (const file of list) transfer.items.add(file);
		return transfer.files;
	}

	async function add(picked: FileList | File[] | null | undefined) {
		if (!picked?.length) return;
		processing = true;
		try {
			const images = Array.from(picked).filter((file) => file.type.startsWith('image/'));
			const compressed = await Promise.all(
				images.map(async (file) => {
					try {
						const out = await imageCompression(file, {
							maxSizeMB: 1,
							maxWidthOrHeight: 1920,
							useWebWorker: true,
							initialQuality: 0.8
						});
						return new File([out], file.name, { type: out.type });
					} catch {
						// An image the library cannot read goes up as it is; the server still checks it.
						return file;
					}
				})
			);
			$files = toFileList([...Array.from($files ?? []), ...compressed]);
		} finally {
			processing = false;
		}
	}

	function remove(index: number) {
		const list = Array.from($files ?? []);
		const [gone] = list.splice(index, 1);
		if (gone) forget(gone);
		$files = toFileList(list);
	}

	function clear() {
		for (const file of Array.from($files ?? [])) forget(file);
		$files = toFileList([]);
	}

	const chosen = $derived(Array.from($files ?? []));
</script>

<div class="flex w-full flex-col gap-3">
	{#if label}
		<Label for={name}>{label}</Label>
	{/if}

	<label
		for={name}
		class={[
			'group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
			dragging
				? 'border-primary bg-primary/5'
				: 'border-muted-foreground/25 bg-muted/40 hover:border-primary/50 hover:bg-muted'
		]}
		ondragover={(event) => {
			event.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={(event) => {
			event.preventDefault();
			dragging = false;
			add(event.dataTransfer?.files);
		}}
	>
		<span
			class="rounded-full bg-background p-3 shadow-sm transition-transform group-hover:scale-110"
		>
			{#if processing}
				<Loader class="h-6 w-6 animate-spin text-primary" />
			{:else}
				<CloudUpload class={['h-6 w-6', dragging ? 'text-primary' : 'text-muted-foreground']} />
			{/if}
		</span>
		<span>
			<span class="block text-sm font-medium">
				{processing ? L.galleryOptimizing : dragging ? L.galleryDropHere : L.galleryPrompt}
			</span>
			<span class="block text-xs text-muted-foreground">{hint ?? L.galleryHint}</span>
		</span>
		<input
			bind:this={input}
			id={name}
			{name}
			type="file"
			accept="image/*"
			multiple
			class="sr-only"
			onchange={(event) => {
				// Copied before `add` replaces the input's files with the compressed set.
				add(Array.from(event.currentTarget.files ?? []));
			}}
		/>
	</label>

	{#if chosen.length}
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm text-muted-foreground" aria-live="polite">
				{L.galleryCount(chosen.length)}
			</p>
			<button
				type="button"
				onclick={clear}
				class="text-xs font-medium text-muted-foreground hover:text-destructive"
			>
				{L.galleryClear}
			</button>
		</div>
		<ul class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
			{#each chosen as file, i (file)}
				<li class="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
					<img src={preview(file)} alt="" class="h-full w-full object-cover" />
					<button
						type="button"
						onclick={() => remove(i)}
						aria-label={L.galleryRemove(file.name)}
						class="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-destructive hover:text-white"
					>
						<X class="h-4 w-4" />
					</button>
					<span
						class="absolute inset-x-0 bottom-0 bg-background/85 px-1 py-0.5 text-center text-[10px] text-muted-foreground"
					>
						{(file.size / 1024).toFixed(0)} KB
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
