import { afterEach, describe, expect, it } from 'vitest';
import { configureKit } from './db';
import { englishServerLabels, labelText, serverLabels } from './labels';
import type { KitDb } from './db';

const db = {} as KitDb;

describe('server labels', () => {
	afterEach(() => configureKit({ db }));

	it('are English by default', () => {
		configureKit({ db });
		expect(serverLabels().crudAdded('Line')).toBe('Line added');
		expect(serverLabels().crudExists('Unit')).toBe('That unit already exists.');
	});

	it("are read from the app's function each time, so they follow the request's language", () => {
		let locale = 'en';
		configureKit({
			db,
			labels: () => (locale === 'am' ? { crudAdded: (x: string) => `${x} ተጨምሯል` } : {})
		});
		expect(serverLabels().crudAdded('ዕቃ')).toBe('ዕቃ added');
		locale = 'am';
		expect(serverLabels().crudAdded('ዕቃ')).toBe('ዕቃ ተጨምሯል');
		// Not given: English.
		expect(serverLabels().crudDeleted('ዕቃ')).toBe(englishServerLabels.crudDeleted('ዕቃ'));
	});

	it('take a record name as a string or a function', () => {
		expect(labelText('Line')).toBe('Line');
		expect(labelText(() => 'መስመር')).toBe('መስመር');
	});
});
