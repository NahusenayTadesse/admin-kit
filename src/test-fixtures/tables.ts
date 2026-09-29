import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { fieldMixins } from '$lib/server/schema';

/**
 * Small tables for the kit's own tests, shaped like the ones every app has: a `lesserFields`
 * lookup (`region`), a lookup that references another (`city`), a `secureFields` table
 * (`allergen`) and a bare one (`educationalLevel`). Never imported outside tests, and outside `src/lib` so it is not packaged.
 */
export const user = mysqlTable('user', {
	id: varchar('id', { length: 255 }).primaryKey(),
	name: varchar('name', { length: 255 }).notNull()
});

const { lesserFields, secureFields } = fieldMixins(() => user.id);

export const region = mysqlTable('region', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	...lesserFields
});

export const city = mysqlTable('city', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull(),
	regionId: int('region_id').references(() => region.id),
	...lesserFields
});

export const allergen = mysqlTable('allergen', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	...secureFields
});

export const educationalLevel = mysqlTable('educational_level', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull()
});
