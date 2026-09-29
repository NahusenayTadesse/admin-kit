<script lang="ts">
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button/index.js';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { useLabels } from '$lib/labels';

	/**
	 * A button that asks first, then posts to a form action: post a document, cancel an order,
	 * close a shift. The question, the "not yet" and the busy state are the same everywhere.
	 *
	 *     <ConfirmAction action="?/post" label="Post" title="Post this receipt?"
	 *       description="Stock changes now." icon={Check} />
	 */
	let {
		action,
		label,
		title,
		description = undefined,
		confirmLabel = undefined,
		busyLabel = undefined,
		cancelLabel = undefined,
		icon: Icon = undefined,
		variant = 'default',
		disabled = false,
		fields = {}
	}: {
		/** The form action it posts to, e.g. `?/post`. */
		action: string;
		/** On the button that opens the question. */
		label: string;
		/** The question. */
		title: string;
		/** What will happen, under the question. */
		description?: string;
		/** On the button that does it. Defaults to `label`. */
		confirmLabel?: string;
		/** While it runs. Defaults to the confirm label. */
		busyLabel?: string;
		/** On the button that backs out ("Not yet"). Defaults to the kit's "Cancel". */
		cancelLabel?: string;
		icon?: Component<IconProps>;
		variant?: ButtonVariant;
		disabled?: boolean;
		/** Hidden fields posted with it. */
		fields?: Record<string, string | number>;
	} = $props();

	const L = useLabels();
	let open = $state(false);
	let busy = $state(false);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger class={buttonVariants({ variant })} {disabled}>
		{#if Icon}<Icon />{/if}
		{label}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			{#if description}<AlertDialog.Description>{description}</AlertDialog.Description>{/if}
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{cancelLabel ?? L.cancel}</AlertDialog.Cancel>
			<form
				method="POST"
				{action}
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update();
						busy = false;
						open = false;
					};
				}}
			>
				{#each Object.entries(fields) as [name, value] (name)}
					<input type="hidden" {name} {value} />
				{/each}
				<AlertDialog.Action type="submit" disabled={busy}>
					{#if busy}<LoadingBtn name={busyLabel ?? confirmLabel ?? label} />{:else}{confirmLabel ??
							label}{/if}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
