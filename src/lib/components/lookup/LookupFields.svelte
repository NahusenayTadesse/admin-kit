<script lang="ts">
	import { useLabels } from '$lib/labels';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { LookupField, LookupOptions, LookupRow } from './types';

	/**
	 * The field list of a lookup form, rendered from its descriptor.
	 *
	 * Shared by the add dialog and the edit dialog so the two can never drift — which they had,
	 * with edit dialogs still carrying placeholder text naming a different entity.
	 */
	let {
		fields,
		form,
		errors,
		entity,
		options,
		stored
	}: {
		fields: LookupField[];
		/** The superForm stores, passed straight through to `InputComp`. */
		form: SuperForm<Record<string, unknown>>['form'];
		errors: SuperForm<Record<string, unknown>>['errors'];
		/** Used to build a default placeholder, e.g. "Enter Educational Level Description". */
		entity: string;
		/** Options for every `reference` field, keyed by field name. See `LookupPage`. */
		options?: LookupOptions;
		/**
		 * The row being edited, for the stored file an `image`/`file` field previews. Absent in the
		 * add dialog, where there is nothing stored yet.
		 */
		stored?: LookupRow;
	} = $props();

	const visible = $derived(fields.filter((f) => f.inForm !== false));

	/**
	 * A reference with no options loaded yet renders an empty picker rather than throwing. That
	 * happens when a route declares the field but not the matching `references` entry on the
	 * server — worth failing softly, because the rest of the form is still usable.
	 */
	const optionsFor = (field: LookupField) => options?.[field.name] ?? [];

	/** Dropdown options for a `boolean` field, in the field's own wording. */
	function booleanOptions(field: LookupField) {
		return [
			{ value: true, name: field.trueLabel ?? L.lookupActive },
			{ value: false, name: field.falseLabel ?? L.lookupInactive }
		];
	}

	const L = useLabels();
</script>

{#each visible as field (field.name)}
	{#if field.type === 'reference'}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type={field.picker ?? 'combo'}
			items={optionsFor(field)}
			required={field.required ?? true}
		/>
	{:else if field.type === 'select'}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type="select"
			items={field.choices ?? []}
			required={field.required ?? true}
		/>
	{:else if field.type === 'boolean'}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type="select"
			items={booleanOptions(field)}
		/>
	{:else if field.type === 'checkbox'}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type="checkboxSingle"
			placeholder={field.placeholder ?? field.label}
			required={field.required ?? true}
		/>
	{:else if field.type === 'image' || field.type === 'file'}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type="file"
			image={String(stored?.[field.name] ?? '')}
			removable={!(field.required ?? true)}
			accept={field.type === 'image' ? 'image/*' : undefined}
			placeholder={field.placeholder}
			required={(field.required ?? true) && !stored?.[field.name]}
		/>
	{:else if field.type === 'textarea'}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type="textarea"
			placeholder={field.placeholder ?? `Enter ${entity} ${field.label}`}
			required={field.required ?? true}
			rows={field.rows ?? 10}
		/>
	{:else}
		<InputComp
			{form}
			{errors}
			label={field.label}
			name={field.name}
			type={field.type === 'money' ? 'number' : field.type}
			placeholder={field.placeholder ?? ''}
			required={field.required ?? true}
			year={field.type === 'date'}
		/>
	{/if}
{/each}
