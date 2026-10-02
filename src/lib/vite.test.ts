import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveScannedSvelteImport } from './vite';

const root = mkdtempSync(path.join(tmpdir(), 'admin-kit-vite-'));
const lookup = path.join(root, 'node_modules/@nahu/admin-kit/dist/components/lookup');
const table = path.join(root, 'node_modules/@nahu/admin-kit/dist/components/Table');
mkdirSync(lookup, { recursive: true });
mkdirSync(table, { recursive: true });
writeFileSync(path.join(lookup, 'LookupPage.svelte'), '');
writeFileSync(path.join(lookup, 'LookupFields.svelte'), '');
writeFileSync(path.join(table, 'data-table.svelte'), '');
writeFileSync(path.join(table, 'table-state.svelte.js'), '');

const importer = `virtual-module:${path.join(lookup, 'LookupPage.svelte')}?id=0`;

describe('resolveScannedSvelteImport', () => {
	it("resolves a library component's relative .svelte imports against the real file", () => {
		expect(resolveScannedSvelteImport('./LookupFields.svelte', importer)).toBe(
			path.join(lookup, 'LookupFields.svelte')
		);
		expect(resolveScannedSvelteImport('../Table/data-table.svelte', importer)).toBe(
			path.join(table, 'data-table.svelte')
		);
	});

	it('finds a rune module imported without its .js', () => {
		expect(resolveScannedSvelteImport('../Table/table-state.svelte', importer)).toBe(
			path.join(table, 'table-state.svelte.js')
		);
	});

	it('leaves a file that does not exist to the scanner', () => {
		expect(resolveScannedSvelteImport('./Missing.svelte', importer)).toBeUndefined();
	});

	it("leaves everything else alone: other imports, the app's own files, real importers", () => {
		expect(resolveScannedSvelteImport('./columns', importer)).toBeUndefined();
		expect(resolveScannedSvelteImport('bits-ui', importer)).toBeUndefined();
		expect(
			resolveScannedSvelteImport(
				'./Card.svelte',
				`virtual-module:${root}/src/routes/+page.svelte?id=0`
			)
		).toBeUndefined();
		expect(
			resolveScannedSvelteImport('./LookupFields.svelte', path.join(lookup, 'LookupPage.svelte'))
		).toBeUndefined();
		expect(resolveScannedSvelteImport('./LookupFields.svelte', undefined)).toBeUndefined();
	});
});
