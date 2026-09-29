import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { FILES_DIR } from '$lib/server/files';

/**
 * Reconciles the store against the database.
 *
 * Nothing in the app has ever deleted a stored file. Replacing an attachment overwrites the
 * filename in its column and abandons the old file (`contentCrud`'s `fileFields` does exactly
 * this), and deleting a record is a soft delete that keeps the reference. The store therefore
 * only grows, and nobody can say which of its files still matter.
 *
 * This does not delete anything. It answers the two questions that have to be answerable before
 * deleting is safe:
 *
 *   **orphans**   on disk, referenced by no row — wasted space, and patient documents living on
 *                 past the record that explains why they were kept
 *   **missing**   referenced by a row, absent from disk — a broken attachment somebody will
 *                 eventually report as a bug
 *
 * Deliberately reads *every* row, including soft-deleted ones: a deleted record's file is still
 * referenced, and a reconciliation that ignored that would report live documents as orphans.
 *
 * The real fix is a `files` table that records what each upload is attached to. Until that
 * exists, this is the only way to see the drift.
 */

/**
 * A column that stores a filename, as raw SQL identifiers: `['employee', 'photo']`. Each app keeps
 * its own list next to its schema and passes it in — they come from code, never from a request.
 */
export type FilenameColumn = readonly [table: string, column: string];

export type FileAudit = {
	/** On disk, referenced by nothing. */
	orphans: string[];
	/** Referenced by a row, not on disk. */
	missing: string[];
	onDisk: number;
	referenced: number;
};

/** Every filename any row still points at, soft-deleted rows included. */
async function referencedNames(columns: readonly FilenameColumn[]): Promise<Set<string>> {
	const names = new Set<string>();

	for (const [table, column] of columns) {
		// Identifiers, not values — they come from the list above, never from a request.
		const rows = await db.execute(
			sql.raw(
				`SELECT DISTINCT \`${column}\` AS name FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`
			)
		);

		// `db.execute` types a raw result as mysql2's union; a SELECT always yields rows.
		const selected = rows[0] as unknown as Array<{ name: string | null }>;

		for (const row of selected) {
			if (row.name) names.add(row.name);
		}
	}

	return names;
}

/**
 * Every stored file checked against the rows that name one.
 *
 *     const report = await auditFiles([['employee', 'photo'], ['leave', 'leave_letter']]);
 */
export async function auditFiles(columns: readonly FilenameColumn[]): Promise<FileAudit> {
	const onDisk = fs.existsSync(FILES_DIR)
		? fs.readdirSync(FILES_DIR).filter((name) => fs.statSync(path.join(FILES_DIR, name)).isFile())
		: [];

	const referenced = await referencedNames(columns);
	const present = new Set(onDisk);

	return {
		orphans: onDisk.filter((name) => !referenced.has(name)).sort(),
		missing: [...referenced].filter((name) => !present.has(name)).sort(),
		onDisk: onDisk.length,
		referenced: referenced.size
	};
}
