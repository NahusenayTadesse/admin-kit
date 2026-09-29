import { labelText, serverLabels, type Label } from './labels';
import { fail, type RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import type { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { db } from '$lib/server/db';
import { requireSuperAdmin } from '$lib/server/permissions';
import { softDeleteLookup, type SoftDeletable } from '$lib/server/softDelete';

type LookupTable = MySqlTable & SoftDeletable & { id: AnyMySqlColumn };

/**
 * Builds the `delete` action for an admin-panel lookup page.
 *
 * Every one of those pages is the same shape — one table of reference rows with
 * add and edit actions — so they share one action instead of twenty copies that
 * would drift apart. `table` is bound per page, never read from the request:
 * the client picks which button to press, never which table gets written to.
 *
 * `label` is what the user sees in the flash message, e.g. "department".
 */
export function lookupDeleteAction(table: LookupTable, labelOf: Label) {
	const name = () => labelText(labelOf);
	return async ({ request, locals, cookies }: RequestEvent) => {
		requireSuperAdmin(locals);

		const data = await request.formData();
		const rowId = Number(data.get('id'));

		if (!rowId) {
			setFlash({ type: 'error', message: serverLabels().lookupNoneSelected(name()) }, cookies);
			return fail(400);
		}

		try {
			const deleted = await db.transaction(async (tx) =>
				softDeleteLookup(tx, table, rowId, locals.user?.id)
			);

			if (!deleted) {
				setFlash({ type: 'error', message: serverLabels().lookupNotFound(name()) }, cookies);
				return fail(404);
			}
		} catch (err) {
			console.error(`Error deleting ${name()}:`, err);
			setFlash(
				{
					type: 'error',
					message: serverLabels().lookupCouldNotDelete(
						name(),
						err instanceof Error ? err.message : serverLabels().unknownError
					)
				},
				cookies
			);
			return fail(500);
		}

		setFlash({ type: 'success', message: serverLabels().lookupDeleted(name()) }, cookies);
		return { success: true };
	};
}
