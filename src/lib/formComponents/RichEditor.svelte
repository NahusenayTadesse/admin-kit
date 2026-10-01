<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any --
	   The editor instance is Tiptap's `Editor`, which Tipex does not re-export. Every use here is
	   a documented Tiptap command — `chain()`, `isActive()`, `getHTML()` — so naming the type
	   would restate the library's API without checking anything this file can get wrong. */
	import { untrack } from 'svelte';
	import { Tipex, defaultExtensions } from '@friendofsvelte/tipex';
	import Placeholder from '@tiptap/extension-placeholder';
	import { toast } from 'svelte-sonner';
	import {
		Bold,
		Italic,
		Underline,
		Strikethrough,
		Heading2,
		Heading3,
		List,
		ListOrdered,
		Quote,
		Code2,
		Minus,
		Link2,
		Link2Off,
		ImagePlus,
		Undo2,
		Redo2,
		RemoveFormatting,
		LoaderCircle
	} from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { useLabels } from '$lib/labels';

	/**
	 * A rich text field: an article body, a project write-up. Posts HTML as an ordinary form field.
	 *
	 * Ported from content-svelte's article editor. What makes it more than a Tipex wrapper:
	 *
	 * - **It posts.** The editor is a `contenteditable`, which no form submits, so the value is
	 *   mirrored into a hidden input named `name`. With superforms, bind `value` to `$form[name]`
	 *   as well so the client-side state agrees; without it the hidden input alone still posts.
	 * - **Empty is empty.** An emptied editor still holds `<p></p>`; that is saved as `''`, so a
	 *   required-field check downstream sees nothing rather than a blank paragraph.
	 * - **It previews.** The editable area carries `contentClass`, the class the app gives its
	 *   published article, so headings and lists look as they will on the page.
	 * - **Links are checked.** Only `https?:`, `mailto:` and site paths (`/…`) are inserted: a
	 *   `javascript:` link runs on click, and a sanitiser on the server would silently drop it.
	 * - **Images are uploaded, not pasted.** With `uploadUrl`, the image button POSTs the file
	 *   (as `file`) to that route, which answers `{ url }`; the image is inserted by that URL.
	 *   Without it the button is not shown. The route is the app's: it decides who may upload and
	 *   where the file is served from.
	 *
	 * The HTML that arrives is whatever the browser sent. **Sanitise it on the server** before it
	 * is stored or rendered — sanitize-html with a tag allowlist, say.
	 */
	let {
		value = $bindable(''),
		name,
		label = '',
		description = '',
		error = '',
		uploadUrl = '',
		placeholder = '',
		contentClass = 'rich-text',
		minHeight = '16rem'
	}: {
		value?: string;
		/** The form field the HTML posts as. */
		name: string;
		label?: string;
		/** A line under the label. */
		description?: string;
		/** A message under the field, which also draws it as invalid. */
		error?: string;
		/** Where an inserted image is POSTed. Omit to hide the image button. */
		uploadUrl?: string;
		placeholder?: string;
		/** The class of the editable area — the app's article class, for a true preview. */
		contentClass?: string;
		minHeight?: string;
	} = $props();

	const L = useLabels();

	let editor = $state<any>();
	let fileInput = $state<HTMLInputElement>();
	let uploading = $state(false);

	/*
	 * Tipex's own set, with the placeholder swapped for a configured one: the default carries no
	 * text, so an empty editor was a blank rectangle with no sign of what goes there.
	 */
	const extensions = untrack(() => [
		...defaultExtensions.filter((extension) => extension.name !== 'placeholder'),
		Placeholder.configure({ placeholder, showOnlyWhenEditable: false })
	]);

	/*
	 * The body as it stood when the field was created, read once: handing Tipex a value that
	 * changes would reset the editor mid-sentence. From mount on the editor owns the value.
	 */
	const initialBody = untrack(() => value);

	/** ProseMirror creates the editable element itself; the class can only be added once it has. */
	const onCreate = ({ editor: instance }: { editor: any }) => {
		if (contentClass) instance.view.dom.classList.add(...contentClass.split(/\s+/).filter(Boolean));
	};

	const sync = () => {
		if (!editor) return;
		value = editor.isEmpty ? '' : editor.getHTML();
	};

	const run = (fn: (chain: any) => any) => {
		if (!editor) return;
		fn(editor.chain().focus()).run();
		sync();
	};

	/** True when the cursor is inside `mark`, so its button shows pressed. */
	const active = (mark: string, attrs?: Record<string, unknown>) =>
		Boolean(editor?.isActive(mark, attrs));

	/*
	 * The link box: an inline field rather than `prompt()`, which is modal over the tab,
	 * unstyleable, and on a phone takes the keyboard away from the selection it acts on.
	 */
	let linkOpen = $state(false);
	let linkValue = $state('');
	let linkInput = $state<HTMLInputElement>();

	function openLink() {
		linkValue = editor?.getAttributes('link')?.href ?? '';
		linkOpen = true;
		queueMicrotask(() => linkInput?.focus());
	}

	function applyLink() {
		const href = linkValue.trim();
		linkOpen = false;
		if (!href) return;
		if (!/^(https?:\/\/|mailto:|\/)/i.test(href)) {
			toast.error(L.richLinkInvalid);
			return;
		}
		run((chain) => chain.extendMarkRange('link').setLink({ href }));
	}

	async function uploadImage(file: File) {
		uploading = true;
		try {
			const body = new FormData();
			body.append('file', file);
			const response = await fetch(uploadUrl, { method: 'POST', body });
			const result = await response.json().catch(() => ({}));
			if (!response.ok || !result?.url) {
				toast.error(result?.message ?? L.richUploadFailed);
				return;
			}
			run((chain) => chain.setImage({ src: result.url, alt: '' }));
		} catch (err) {
			console.error('Inline image upload failed:', err);
			toast.error(L.richUploadFailed);
		} finally {
			uploading = false;
		}
	}

	function onPickImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Cleared, so picking the same file twice in a row still fires.
		input.value = '';
		if (file) uploadImage(file);
	}

	const buttonClass = (on: boolean) =>
		[
			'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50',
			on
				? 'bg-primary text-primary-foreground'
				: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
		].join(' ');
</script>

<div class="flex flex-col gap-2">
	{#if label}
		<Label for="{name}-editor">{label}</Label>
	{/if}
	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}

	<div
		id="{name}-editor"
		class={[
			'kit-rich-editor overflow-hidden rounded-md border bg-background shadow-xs',
			error ? 'border-destructive' : 'border-input'
		]}
		style:--kit-rich-min-height={minHeight}
	>
		<Tipex
			body={initialBody}
			{extensions}
			controlComponent={null}
			floating={false}
			autofocus={false}
			bind:tipex={editor}
			oncreate={onCreate}
			onupdate={sync}
			class="flex flex-col"
		>
			{#snippet head(instance)}
				<!-- `instance` changes on every transaction, which keeps the pressed states current. -->
				{@const _ = instance}
				<div
					class="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-2 py-1.5"
					role="toolbar"
					aria-label={label || name}
				>
					{#snippet tool(
						Icon: typeof Bold,
						title: string,
						action: () => void,
						on = false,
						disabled = false
					)}
						<button
							type="button"
							class={buttonClass(on)}
							aria-pressed={on}
							{title}
							aria-label={title}
							{disabled}
							onclick={action}
						>
							<Icon class="h-4 w-4" />
						</button>
					{/snippet}
					{@render tool(Bold, L.richBold, () => run((c) => c.toggleBold()), active('bold'))}
					{@render tool(Italic, L.richItalic, () => run((c) => c.toggleItalic()), active('italic'))}
					{@render tool(
						Underline,
						L.richUnderline,
						() => run((c) => c.toggleUnderline()),
						active('underline')
					)}
					{@render tool(
						Strikethrough,
						L.richStrike,
						() => run((c) => c.toggleStrike()),
						active('strike')
					)}
					<span class="mx-1 h-5 w-px bg-border"></span>
					<!-- No H1: the page renders the title as its H1, and a second would compete. -->
					{@render tool(
						Heading2,
						L.richHeading2,
						() => run((c) => c.toggleHeading({ level: 2 })),
						active('heading', { level: 2 })
					)}
					{@render tool(
						Heading3,
						L.richHeading3,
						() => run((c) => c.toggleHeading({ level: 3 })),
						active('heading', { level: 3 })
					)}
					<span class="mx-1 h-5 w-px bg-border"></span>
					{@render tool(
						List,
						L.richBullets,
						() => run((c) => c.toggleBulletList()),
						active('bulletList')
					)}
					{@render tool(
						ListOrdered,
						L.richNumbers,
						() => run((c) => c.toggleOrderedList()),
						active('orderedList')
					)}
					{@render tool(
						Quote,
						L.richQuote,
						() => run((c) => c.toggleBlockquote()),
						active('blockquote')
					)}
					{@render tool(
						Code2,
						L.richCode,
						() => run((c) => c.toggleCodeBlock()),
						active('codeBlock')
					)}
					{@render tool(Minus, L.richDivider, () => run((c) => c.setHorizontalRule()))}
					<span class="mx-1 h-5 w-px bg-border"></span>
					{@render tool(Link2, L.richLink, openLink, active('link'))}
					{#if active('link')}
						{@render tool(Link2Off, L.richUnlink, () =>
							run((c) => c.extendMarkRange('link').unsetLink())
						)}
					{/if}
					{#if uploadUrl}
						{@render tool(
							uploading ? LoaderCircle : ImagePlus,
							L.richImage,
							() => fileInput?.click(),
							false,
							uploading
						)}
					{/if}
					<span class="mx-1 h-5 w-px bg-border"></span>
					{@render tool(RemoveFormatting, L.richClear, () =>
						run((c) => c.unsetAllMarks().clearNodes())
					)}
					<div class="ms-auto flex items-center gap-0.5">
						{@render tool(Undo2, L.richUndo, () => run((c) => c.undo()))}
						{@render tool(Redo2, L.richRedo, () => run((c) => c.redo()))}
					</div>
				</div>

				{#if linkOpen}
					<div class="flex items-center gap-2 border-b border-input bg-muted/40 px-3 py-2">
						<input
							bind:this={linkInput}
							bind:value={linkValue}
							type="url"
							inputmode="url"
							placeholder="https://"
							aria-label={L.richLink}
							class="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
							onkeydown={(event) => {
								// Enter must not reach the surrounding form and submit it.
								if (event.key === 'Enter') {
									event.preventDefault();
									applyLink();
								}
								if (event.key === 'Escape') linkOpen = false;
							}}
						/>
						<button
							type="button"
							onclick={applyLink}
							class="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
						>
							{L.richLinkApply}
						</button>
						<button
							type="button"
							onclick={() => (linkOpen = false)}
							class="h-8 rounded-md px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
						>
							{L.cancel}
						</button>
					</div>
				{/if}
			{/snippet}
		</Tipex>
	</div>

	<!-- What actually posts: a contenteditable is not a form field. -->
	<input type="hidden" {name} {value} />

	{#if uploadUrl}
		<input
			bind:this={fileInput}
			type="file"
			accept="image/png,image/jpeg,image/webp,image/avif"
			class="hidden"
			onchange={onPickImage}
		/>
	{/if}

	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>

<style>
	/* ProseMirror's element is not in this component's markup, so these must be global. */
	:global(.kit-rich-editor .tipex-editor-section) {
		max-height: 40rem;
		overflow-y: auto;
	}
	:global(.kit-rich-editor .ProseMirror) {
		min-height: var(--kit-rich-min-height, 16rem);
		padding: 1rem 1.25rem;
		outline: none;
	}
	:global(.kit-rich-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
		color: var(--muted-foreground);
	}
	/* A plain reading style, for apps that give the editor no article class of their own. */
	:global(.kit-rich-editor .ProseMirror.rich-text) {
		line-height: 1.7;
	}
	:global(.kit-rich-editor .rich-text > * + *) {
		margin-top: 0.85em;
	}
	:global(.kit-rich-editor .rich-text h2) {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.3;
		margin-top: 1.4em;
	}
	:global(.kit-rich-editor .rich-text h3) {
		font-size: 1.2rem;
		font-weight: 700;
		margin-top: 1.2em;
	}
	:global(.kit-rich-editor .rich-text ul) {
		list-style: disc;
		padding-left: 1.5rem;
	}
	:global(.kit-rich-editor .rich-text ol) {
		list-style: decimal;
		padding-left: 1.5rem;
	}
	:global(.kit-rich-editor .rich-text blockquote) {
		border-left: 3px solid var(--primary);
		padding-left: 1rem;
		color: var(--muted-foreground);
		font-style: italic;
	}
	:global(.kit-rich-editor .rich-text a) {
		color: var(--primary);
		text-decoration: underline;
	}
	:global(.kit-rich-editor .rich-text pre) {
		background: var(--muted);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		font-family: ui-monospace, monospace;
		font-size: 0.875rem;
		overflow-x: auto;
	}
	:global(.kit-rich-editor .rich-text img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
	}
	:global(.kit-rich-editor .rich-text hr) {
		border-color: var(--border);
	}
</style>
