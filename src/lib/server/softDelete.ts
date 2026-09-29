import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import type { Writer } from '$lib/server/db';

/**
 * Soft delete: a row with a non-null `deletedAt` has been deleted and must never reach the
 * frontend. Nothing here changes a schema — these are query helpers only.
 *
 * This is deliberately separate from `isActive`/`status`, which are *business* state: an expired
 * contract or a terminated employee is inactive but not deleted, and pages that list inactive
 * rows are supposed to show those.
 *
 * The app-specific cascades (an employee and everything hanging off them, a supplier and its
 * address) stay in each app, built from `deletionStamp` and `notDeleted` below.
 */
export type SoftDeletable = { deletedAt: AnyMySqlColumn };

/** A soft-deletable table keyed by `id`. */
export type SimpleDeletable = MySqlTable & SoftDeletable & { id: AnyMySqlColumn };

/**
 * Builds the "not deleted" condition for one or more soft-deletable tables.
 *
 * In a `where`, pass the table(s) the query reads from:
 *
 * ```ts
 * .where(and(eq(branch.isActive, true), notDeleted(branch)))
 * ```
 *
 * In a join, put it in the `on` clause rather than the `where` — a left join whose filter lives
 * in the `where` silently behaves like an inner join and drops the parent row too:
 *
 * ```ts
 * .leftJoin(branch, and(eq(employee.branchId, branch.id), notDeleted(branch)))
 * ```
 *
 * One deliberate exception: **attribution joins are not filtered.** A join on
 * `createdBy`/`updatedBy`/`approvedBy` exists to print who did something, and a deleted user
 * still did it.
 */
export function notDeleted(...tables: [SoftDeletable, ...SoftDeletable[]]): SQL {
	const conditions = tables.map((table) => isNull(table.deletedAt));
	return conditions.length === 1 ? conditions[0] : (and(...conditions) as SQL);
}

/**
 * The columns a delete stamps. `isActive` is deliberately left alone: it is a business state, and
 * overwriting it here would destroy the real status of the row if the deletion is ever reversed
 * by clearing `deletedAt`.
 */
export const deletionStamp = (userId?: string) => ({
	deletedAt: sql`NOW()`,
	deletedBy: userId ?? null
});

/**
 * Soft-deletes one row of a lookup/reference table by id.
 *
 * These tables are referenced by `restrict`/`set null` foreign keys, which is exactly why they get
 * a soft delete: a hard delete would either be refused or would quietly blank out a column on
 * historical records.
 *
 * Returns whether a row was actually stamped, so the caller can report a miss rather than a false
 * success.
 */
export async function softDeleteLookup(
	tx: Writer,
	table: SimpleDeletable,
	rowId: number,
	userId?: string
): Promise<boolean> {
	const [existing] = await tx
		.select({ id: table.id })
		.from(table)
		.where(and(eq(table.id, rowId), notDeleted(table)))
		.limit(1);

	if (!existing) return false;

	await tx
		.update(table)
		.set(deletionStamp(userId) as never)
		.where(eq(table.id, rowId));
	return true;
}

/**
 * Soft-deletes a row that hangs off exactly one parent, matching the owner column as well as the
 * id. The row id comes from the client, so without the owner match one parent's page could be
 * made to delete another's child.
 */
export async function softDeleteOwnedRecord(
	tx: Writer,
	table: SoftDeletable & { id: AnyMySqlColumn },
	ownerColumn: AnyMySqlColumn,
	recordId: number,
	ownerId: number,
	userId?: string
): Promise<boolean> {
	const target = table as SimpleDeletable;

	const [existing] = await tx
		.select({ id: target.id })
		.from(target)
		.where(and(eq(target.id, recordId), eq(ownerColumn, ownerId), notDeleted(target)))
		.limit(1);

	if (!existing) return false;

	await tx
		.update(target)
		.set(deletionStamp(userId) as never)
		.where(eq(target.id, recordId));
	return true;
}
