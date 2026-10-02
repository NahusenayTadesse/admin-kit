import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A component that does `import * as Calendar from './index.js'` inside `calendar.svelte` packages
 * to a `.d.ts` declaring two `Calendar`s, and every app importing it gets "Cannot access ambient
 * const enums". The kit's own check reads the source and never sees it, so this does.
 */
const root = path.resolve(import.meta.dirname);

function components(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return components(full);
		return entry.name.endsWith('.svelte') ? [full] : [];
	});
}

const pascal = (file: string) =>
	path
		.basename(file, '.svelte')
		.split(/[-_]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');

describe('component namespace imports', () => {
	it('never share the name of the component importing them', () => {
		const clashes = components(root).filter((file) => {
			const own = pascal(file);
			return [...readFileSync(file, 'utf8').matchAll(/import \* as (\w+) from/g)].some(
				(match) => match[1] === own
			);
		});
		expect(clashes.map((file) => path.relative(root, file))).toEqual([]);
	});
});
