import { beforeEach, describe, expect, it } from 'vitest';
import { int, mysqlTable, varchar, json } from 'drizzle-orm/mysql-core';
import { z } from 'zod/v4';
import type { RequestEvent } from '@sveltejs/kit';

import { city, region } from '../../test-fixtures/tables';
import { removeFileField } from '$lib/files';
import { configureKit, type KitDb } from './db';
import { contentCrud } from './crud';
import { childCrud } from './childCrud';

/**
 * What the write actions do with a request, against a stand-in for the database.
 *
 * `crud.test.ts` pins the SQL of the list; nothing covered add, edit and delete, which is where
 * the rules that matter live — a row that is gone, a file that is refused, a delete that must
 * leave an audit row. The stand-in answers each `select` from a queue and records every write, so
 * a test says what the database holds and reads back what the action did to it.
 */
type Write = {
	op: 'insert' | 'update' | 'delete';
	table: unknown;
	values?: Record<string, unknown>;
};

let writes: Write[];
let selects: unknown[][];
let failUpdateWith: unknown;

/** A query that can be chained any way the factories chain it, and awaited for `result`. */
function query(result: () => unknown) {
	const chain: Record<string, unknown> = {
		then: (resolve: (value: unknown) => void, reject: (reason: unknown) => void) => {
			try {
				resolve(result());
			} catch (err) {
				reject(err);
			}
		}
	};
	for (const step of ['from', 'where', 'limit', 'orderBy', 'leftJoin', '$dynamic']) {
		chain[step] = () => chain;
	}
	return chain;
}

const fakeDb = {
	select: () => query(() => selects.shift() ?? []),
	insert: (table: unknown) => ({
		values: (values: Record<string, unknown>) => {
			writes.push({ op: 'insert', table, values });
			return Object.assign(
				query(() => undefined),
				{ $returningId: () => query(() => [{ id: 41 }]) }
			);
		}
	}),
	update: (table: unknown) => ({
		set: (values: Record<string, unknown>) => ({
			where: () =>
				query(() => {
					if (failUpdateWith) throw failUpdateWith;
					writes.push({ op: 'update', table, values });
				})
		})
	}),
	delete: (table: unknown) => ({
		where: () => query(() => void writes.push({ op: 'delete', table }))
	}),
	transaction: (body: (tx: unknown) => unknown) => body(fakeDb)
};

const auditLog = mysqlTable('audit_log', {
	id: int('id').primaryKey().autoincrement(),
	userId: varchar('user_id', { length: 255 }),
	action: varchar('action', { length: 20 }),
	tableName: varchar('table_name', { length: 64 }),
	recordId: varchar('record_id', { length: 64 }),
	changes: json('changes'),
	ipAddress: varchar('ip_address', { length: 45 }),
	branchId: int('branch_id')
});

beforeEach(() => {
	writes = [];
	selects = [];
	failUpdateWith = undefined;
	configureKit({ db: fakeDb as unknown as KitDb, auditLog });
});

/** A form post, as the action receives it. */
function post(fields: Record<string, string | File>) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);

	return {
		request: new Request('http://localhost/dashboard/regions', { method: 'POST', body }),
		locals: { user: { id: 'u1' }, isSuperAdmin: true, permList: [] },
		getClientAddress: () => '10.0.0.1'
	} as unknown as RequestEvent;
}

/** What an action answered: its status (200 for a plain return) and the form it sent back. */
function answer(result: unknown) {
	const failed = result as { status?: number; data?: { form: Answered } };
	const form = failed.data?.form ?? (result as { form: Answered }).form;
	return { status: failed.status ?? 200, message: form.message?.text, errors: form.errors };
}
type Answered = { message?: { text: string }; errors: Record<string, string[] | undefined> };

const regions = contentCrud({
	table: region,
	label: 'Region',
	addSchema: z.object({ name: z.string().min(2) }),
	editSchema: z.object({ id: z.coerce.number(), name: z.string().min(2) }),
	audit: 'region'
});

describe('contentCrud edit', () => {
	it('says a row is gone rather than reporting a save that matched nothing', async () => {
		selects = [[]]; // deleted, or never there

		const result = answer(await regions.actions.edit(post({ id: '7', name: 'Oromia' })));

		expect(result.status).toBe(404);
		expect(result.message).toBe('That region no longer exists.');
		expect(writes).toEqual([]);
	});

	it('updates the row and records what changed', async () => {
		selects = [[{ id: 7, name: 'Oromiya', status: true }]];

		const result = answer(await regions.actions.edit(post({ id: '7', name: 'Oromia' })));

		expect(result.status).toBe(200);
		expect(writes[0]).toMatchObject({ op: 'update', table: region, values: { name: 'Oromia' } });
		expect(writes[1]).toMatchObject({
			op: 'insert',
			table: auditLog,
			values: { action: 'update', recordId: '7', changes: { name: ['Oromiya', 'Oromia'] } }
		});
	});
});

describe('contentCrud delete', () => {
	it('stamps the row and leaves an audit row in the same transaction', async () => {
		selects = [[{ id: 7 }]];

		const result = answer(await regions.actions.delete(post({ id: '7' })));

		expect(result.status).toBe(200);
		expect(writes[0]).toMatchObject({ op: 'update', table: region, values: { deletedBy: 'u1' } });
		expect(writes[1]).toMatchObject({
			op: 'insert',
			table: auditLog,
			values: { action: 'delete', tableName: 'region', recordId: '7', userId: 'u1' }
		});
	});

	it('reports a row that is not there, and audits nothing', async () => {
		selects = [[]];

		const result = answer(await regions.actions.delete(post({ id: '7' })));

		expect(result.status).toBe(404);
		expect(writes).toEqual([]);
	});
});

describe('file fields', () => {
	const photoSchema = z.object({
		id: z.coerce.number(),
		name: z.string().min(2),
		photo: z.instanceof(File).optional()
	});

	const withPhoto = contentCrud({
		table: region,
		label: 'Region',
		addSchema: photoSchema.omit({ id: true }),
		editSchema: photoSchema,
		fileFields: ['photo']
	});

	it('puts a refused upload under its own field, as a 400', async () => {
		const script = new File(['alert(1)'], 'x.html', { type: 'text/html' });

		const result = answer(await withPhoto.actions.add(post({ name: 'Oromia', photo: script })));

		expect(result.status).toBe(400);
		expect(result.message).toBe('That file type is not accepted.');
		expect(result.errors.photo).toEqual(['That file type is not accepted.']);
		expect(writes).toEqual([]);
	});

	it('keeps the stored file when the field is left alone', async () => {
		selects = [[{ id: 7, name: 'Oromia', photo: 'stored.png' }]];

		await withPhoto.actions.edit(post({ id: '7', name: 'Oromia' }));

		expect(writes[0].values).not.toHaveProperty('photo');
	});

	it('takes the stored file off when the form says so', async () => {
		selects = [[{ id: 7, name: 'Oromia', photo: 'stored.png' }]];

		await withPhoto.actions.edit(
			post({ id: '7', name: 'Oromia', [removeFileField('photo')]: '1' })
		);

		expect(writes[0].values).toMatchObject({ photo: null });
	});
});

describe('childCrud edit', () => {
	const cities = childCrud({
		table: city,
		ownerColumn: 'regionId',
		label: 'City',
		addSchema: z.object({ name: z.string().min(2) }),
		editSchema: z.object({ id: z.coerce.number(), name: z.string().min(2) })
	});

	it('names a duplicate under its field instead of answering 500', async () => {
		selects = [[{ id: 3, name: 'Adama', regionId: 7 }]];
		// As Drizzle throws it: the driver's error sits underneath, as `cause`.
		failUpdateWith = new Error('Failed query', { cause: { code: 'ER_DUP_ENTRY' } });

		const result = answer(await cities.actions.edit(post({ id: '3', name: 'Bishoftu' }), 7));

		expect(result.status).toBe(400);
		expect(result.errors.name).toEqual(['That city already exists.']);
	});
});
