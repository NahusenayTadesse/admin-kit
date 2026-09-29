import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { MySqlTable } from 'drizzle-orm/mysql-core';

/**
 * The app's database, handed to the kit once at startup.
 *
 * The kit cannot import an app's `$lib/server/db`, so every app calls `configureKit` from the top
 * of its `hooks.server.ts`, before any request is served:
 *
 *     import { configureKit } from '@nahu/admin-kit/server/db';
 *     import { db } from '$lib/server/db';
 *     import { auditLog } from '$lib/server/db/schema';
 *
 *     configureKit({ db, auditLog });
 *
 * `db` below is a stand-in that forwards to the configured instance, so the kit's own modules
 * write `db.select()` exactly as an app does — they were copied from one — and a call made before
 * `configureKit` fails with a sentence saying so, not with `undefined is not a function`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Any app's Drizzle MySQL database. The schema parameter is `any` because the kit is generic over
 * every app's schema and only ever uses the query builder, never `db.query.<table>`.
 */
export type KitDb = MySql2Database<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The database or a transaction on it — both can read and write. */
export type Writer = KitDb | Parameters<Parameters<KitDb['transaction']>[0]>[0];

export type KitConfig = {
	db: KitDb;
	/**
	 * The app's `audit_log` table, for `recordAudit` and `childCrud`'s `audit` option. Optional:
	 * an app with no audit trail leaves it out, and auditing then throws when first asked for.
	 * Columns read: userId, action, tableName, recordId, changes, ipAddress, branchId.
	 */
	auditLog?: MySqlTable;
	/** Where a signed-out visitor is sent — the file route uses it. Defaults to `/login`. */
	loginPath?: string;
	/**
	 * The words of the kit's server messages in the app's language — see `server/labels`.
	 * Called per message, so it can read the current request's locale. Optional: English.
	 */
	labels?: () => Partial<import('./labels').ServerLabels>;
};

let config: KitConfig | undefined;

export function configureKit(next: KitConfig) {
	config = next;
}

/** The configuration, or a clear failure when `configureKit` has not run yet. */
export function kitConfig(): KitConfig {
	if (!config) {
		throw new Error(
			'@nahu/admin-kit: configureKit({ db }) has not been called. Call it at the top of hooks.server.ts.'
		);
	}
	return config;
}

/** The app's server labels, if it gave any. Readable before `configureKit` has run. */
export function kitLabelsSource() {
	return config?.labels;
}

/** The login page, readable before `configureKit` has run (it then falls back to `/login`). */
export function loginPath(): string {
	return config?.loginPath ?? '/login';
}

/**
 * Forwards every property to the configured database. Methods are bound to the real instance so
 * `db.transaction(...)` runs with the right `this`.
 */
export const db = new Proxy({} as KitDb, {
	get(_target, property) {
		const real = kitConfig().db;
		const value = Reflect.get(real, property, real);
		return typeof value === 'function' ? value.bind(real) : value;
	}
});
