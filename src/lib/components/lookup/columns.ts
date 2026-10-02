import { englishLabels, type KitLabels } from '$lib/labels';
import type { ColumnDef, HeaderContext } from '@tanstack/table-core';
import type { SuperValidated } from 'sveltekit-superforms';
import { renderComponent } from '$lib/components/ui/data-table/index.js';

import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import DeleteEntity from '$lib/components/DeleteEntity.svelte';
import LookupEdit from './LookupEdit.svelte';
import LookupFileCell from './LookupFileCell.svelte';
import { formatETB, formatEthiopianDate } from '$lib/global';
import type { createForm } from '$lib/forms/createForm';
import type { LookupConfig, LookupField, LookupOptions, LookupRow } from './types';

/** The validated form a lookup route hands to its dialogs. */
export type LookupForm = SuperValidated<Record<string, unknown>>;

/** A form's zod schema, as `createForm` accepts it. */
export type LookupSchema = Parameters<typeof createForm>[1];

/** A boolean cell reads as a status badge, in the field's own wording. */
function badgeText(field: LookupField, value: unknown, labels: KitLabels): string {
	return value
		? (field.trueLabel ?? labels.lookupActive)
		: (field.falseLabel ?? labels.lookupInactive);
}

function sortableHeader(label: string) {
	return ({ column }: HeaderContext<LookupRow, unknown>) =>
		renderComponent(DataTableSort, { name: label, onclick: column.getToggleSortingHandler() });
}

/**
 * The table for a lookup screen, built from its descriptor.
 *
 * Column order follows `config.fields`, framed by the row number, the edit button and the
 * delete button — the layout every one of these pages already had. The first field is the
 * label column and doubles as the edit trigger.
 *
 * `editForm` and `canDelete` come from the page rather than the descriptor: one is a validated
 * form object and the other is the viewer's own privilege, and neither is a property of the
 * table being edited.
 */
export function lookupColumns(
	config: LookupConfig,
	{
		editForm,
		canDelete = false,
		options,
		actions = { edit: '?/edit', delete: '?/delete' },
		editSchema,
		readonly = false,
		labels = englishLabels
	}: {
		editForm: LookupForm;
		canDelete?: boolean;
		options?: LookupOptions;
		/**
		 * Where the row's edit and delete forms post.
		 *
		 * A page has one table and can use `?/edit`; a detail page hosts several and needs
		 * `?/editFamily`, `?/editQualification` and so on.
		 */
		actions?: { edit: string; delete: string };
		/** Passed to each edit dialog so it validates before posting. */
		editSchema?: LookupSchema;
		/** No edit or delete controls, and the label column is plain text. */
		readonly?: boolean;
		/** The words for the Edit column and yes/no badges; the component passes `useLabels()`. */
		labels?: KitLabels;
	}
): ColumnDef<LookupRow>[] {
	const [labelField, ...rest] = config.fields;

	/**
	 * What a cell shows for this field on this row.
	 *
	 * A `reference` reads the joined name from `display` when the load joined one. `childCrud` does
	 * not join — it selects the child table as it is — so the name is found in the picker's own
	 * options instead. They are the same list the form offers, so the cell and the picker cannot
	 * disagree about what an id is called.
	 */
	const shown = (field: LookupField, row: LookupRow): unknown => {
		const value = row[field.name];
		if (field.type === 'reference') {
			if (field.display && row[field.display] !== undefined) return row[field.display];
			return options?.[field.name]?.find((o) => String(o.value) === String(value))?.name ?? value;
		}
		if (field.type === 'select') {
			return field.choices?.find((c) => c.value === value)?.name ?? value;
		}
		return value;
	};

	const editDialog = (row: LookupRow, icon: boolean) =>
		renderComponent(LookupEdit, {
			row,
			fields: config.fields,
			entity: config.entity,
			data: editForm,
			options,
			action: actions.edit,
			icon,
			schema: editSchema,
			label: String(shown(labelField, row) ?? '')
		});

	return [
		{
			id: 'index',
			header: '#',
			enableSorting: false,
			cell: (info) => info.table.getRowModel().rows.findIndex((row) => row.id === info.row.id) + 1
		},

		{
			id: labelField.name,
			accessorFn: (row) => shown(labelField, row),
			header: sortableHeader(labelField.label),
			// The name is the link that opens the editor, so there is no separate "view" action.
			cell: ({ row, getValue }) =>
				readonly ? String(getValue() ?? '') : editDialog(row.original, false)
		},

		...rest
			.filter((field) => field.inTable !== false)
			.map((field): ColumnDef<LookupRow> => {
				const isFlag = field.type === 'boolean' || field.type === 'checkbox';

				// Show the label, not the stored value: the column holds `username`, the reader
				// wants "Username". Falls back to the raw value so an unknown one is visible
				// rather than blank — that state means the choices and the data have drifted.
				if (field.type === 'select') {
					return {
						id: field.name,
						accessorFn: (row) => shown(field, row),
						header: sortableHeader(field.label),
						cell: ({ getValue }) => String(getValue() ?? '')
					};
				}

				// The stored file itself, not its generated name: a thumbnail, or a link to open it.
				if (field.type === 'image' || field.type === 'file') {
					return {
						id: field.name,
						header: field.label,
						enableSorting: false,
						cell: ({ row }) =>
							renderComponent(LookupFileCell, {
								name: String(row.original[field.name] ?? ''),
								image: field.type === 'image',
								alt: String(shown(labelField, row.original) ?? '')
							})
					};
				}

				// Every other date on this app renders on the Ethiopian calendar, so these do too.
				// An empty cell rather than "Invalid Date" when the column is null.
				if (field.type === 'date') {
					return {
						accessorKey: field.name,
						header: sortableHeader(field.label),
						cell: ({ row }) => {
							const value = row.original[field.name];
							return value ? formatEthiopianDate(new Date(value as string | Date)) : '';
						}
					};
				}

				// Blank rather than "ETB 0.00" for no value — see the `money` field type.
				if (field.type === 'money') {
					return {
						accessorKey: field.name,
						header: sortableHeader(field.label),
						cell: ({ row }) => {
							const value = row.original[field.name];
							return value === null || value === undefined || value === ''
								? ''
								: formatETB(Number(value));
						}
					};
				}

				// Free text of any length: the start of it, and a "…" that opens the rest, so one long
				// note cannot stretch the table.
				if (field.type === 'textarea' || field.long) {
					return {
						accessorKey: field.name,
						header: field.label,
						cell: ({ row }) =>
							renderComponent(BigText, {
								text: row.original[field.name] as string | null,
								max: typeof field.long === 'number' ? field.long : undefined
							})
					};
				}

				// A reference sorts and reads on the *name*, never the raw id.
				if (field.type === 'reference') {
					return {
						// The display key when there is one, as before: lookup screens name the column by it.
						id: field.display ?? field.name,
						accessorFn: (row) => shown(field, row),
						header: sortableHeader(field.label),
						cell: ({ getValue }) => String(getValue() ?? '')
					};
				}

				return {
					accessorKey: field.name,
					header: isFlag ? sortableHeader(field.label) : field.label,
					...(isFlag
						? {
								cell: ({ row }) =>
									renderComponent(Statuses, {
										status: badgeText(field, row.original[field.name], labels)
									})
							}
						: {})
				};
			}),

		...(config.extraColumns ?? []),

		...(readonly ? [] : actionColumns())
	];

	function actionColumns(): ColumnDef<LookupRow>[] {
		const edit: ColumnDef<LookupRow> = {
			id: 'edit',
			header: labels.lookupEdit,
			enableSorting: false,
			cell: ({ row }) => editDialog(row.original, true)
		};
		if (config.fixedRows) return [edit];

		return [
			edit,

			{
				id: 'delete',
				header: '',
				enableSorting: false,
				// Renders nothing unless the viewer is a super admin; the action re-checks server-side.
				cell: ({ row }) =>
					renderComponent(DeleteEntity, {
						entity: config.entity,
						name: String(shown(labelField, row.original) ?? ''),
						id: row.original.id,
						icon: true,
						canDelete,
						action: actions.delete
					})
			}
		];
	}
}
