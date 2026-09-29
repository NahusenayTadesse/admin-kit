import { sql } from 'drizzle-orm';
import {
	boolean,
	datetime,
	mysqlEnum,
	timestamp,
	varchar,
	type AnyMySqlColumn
} from 'drizzle-orm/mysql-core';

/**
 * The column sets every table in these apps is built from, bound to the app's own `user` table:
 *
 *     // src/lib/server/db/schema/fields.ts
 *     export const { deletionFields, secureFields, lesserFields, approvalFields } =
 *       fieldMixins(() => user.id);
 *
 * A thunk, like Drizzle's own `references`, so the user table can itself spread `deletionFields`
 * without an import cycle deciding the order.
 *
 * The kit's CRUD helpers read these by name: `contentCrud` treats `isActive`/`status` as the active
 * flag, stamps `createdBy`/`updatedBy` when `isActive` is present, and soft-deletes through
 * `deletedAt`/`deletedBy`.
 */
export function fieldMixins(userId: () => AnyMySqlColumn) {
	/**
	 * The soft-delete marker. A row with a non-null `deletedAt` is deleted and must never reach the
	 * frontend — see `notDeleted()` in `server/softDelete`.
	 *
	 * Kept separate from `isActive`/`status` on purpose: those are *business* state that pages
	 * listing inactive rows deliberately show, so they cannot double as a delete marker.
	 */
	const deletionFields = {
		deletedAt: datetime('deleted_at'),
		deletedBy: varchar('deleted_by', { length: 255 }).references(userId, { onDelete: 'set null' })
	};

	/** Main records: active flag, who created and last changed the row and when, soft delete. */
	const secureFields = {
		isActive: boolean('is_active').default(true).notNull(),
		createdBy: varchar('created_by', { length: 255 }).references(userId, { onDelete: 'set null' }),
		updatedBy: varchar('updated_by', { length: 255 }).references(userId, { onDelete: 'set null' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.default(sql`CURRENT_TIMESTAMP(3) on update CURRENT_TIMESTAMP(3)`)
			.notNull(),
		...deletionFields
	};

	/** Lookup tables: an active flag called `status`, and soft delete. */
	const lesserFields = {
		status: boolean('status').default(true).notNull(),
		...deletionFields
	};

	/**
	 * Maker-checker approval, for records one person enters and another releases.
	 *
	 * `approvalStatus` is the single source of truth; the `*By` columns are evidence of who did
	 * what, not state. `approvalOverridden` records a release a super admin pushed through despite
	 * being the requester — stored rather than derived, because both user columns are `set null`
	 * on user deletion, which would erase the evidence precisely when it matters.
	 */
	const approvalFields = {
		approvalStatus: mysqlEnum('approval_status', ['pending', 'approved', 'rejected'])
			.notNull()
			.default('pending'),
		requestedBy: varchar('requested_by', { length: 255 }).references(userId, {
			onDelete: 'set null'
		}),
		approvedBy: varchar('approved_by', { length: 255 }).references(userId, {
			onDelete: 'set null'
		}),
		approvedAt: datetime('approved_at'),
		rejectedBy: varchar('rejected_by', { length: 255 }).references(userId, {
			onDelete: 'set null'
		}),
		rejectedAt: datetime('rejected_at'),
		rejectionReason: varchar('rejection_reason', { length: 255 }),
		approvalOverridden: boolean('approval_overridden').notNull().default(false)
	};

	return { deletionFields, secureFields, lesserFields, approvalFields };
}
