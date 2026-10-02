/**
 * The kit's Vite plugin: `adminKit()` in the app's `vite.config.ts`, next to `sveltekit()`.
 *
 * It works around Vite 8's dependency scan, which fails on the kit as soon as a page imports one
 * of its components by path (`@nahu/admin-kit/components/…/X.svelte`). The scan reads that file's
 * `<script>` as a virtual module named `virtual-module:/…/X.svelte?id=0`, and for a `.svelte`
 * import inside `node_modules` its own resolver gives up and leaves it to Rolldown, which resolves
 * the component's `./Y.svelte` against that virtual name and finds nothing. The scan stops
 * ("Failed to run dependency scan. Skipping dependency pre-bundling"), so nothing is pre-bundled
 * up front and dependencies are discovered one page at a time, each one reloading the browser.
 *
 * The fix resolves those imports against the real file, so the scan carries on through the kit
 * and finds the libraries it uses. It touches nothing else: on Vite 7, whose scan uses esbuild,
 * the option it sets is not read at all.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { EnvironmentOptions, Plugin } from 'vite';

const VIRTUAL_PREFIX = 'virtual-module:';
const RELATIVE_SVELTE = /^\.\.?\/.*\.svelte$/;
const IN_NODE_MODULES = /[\\/]node_modules[\\/]/;

/**
 * Where a relative `.svelte` import from a library component's `<script>` points, while Vite
 * scans for dependencies; `undefined` for any other import, which the scan resolves as usual.
 * `./table-state.svelte` may also be a rune module, `table-state.svelte.js`.
 */
export function resolveScannedSvelteImport(
	id: string,
	importer: string | undefined
): string | undefined {
	if (!importer?.startsWith(VIRTUAL_PREFIX) || !RELATIVE_SVELTE.test(id)) return;
	const file = importer.slice(VIRTUAL_PREFIX.length).replace(/\?.*$/, '');
	if (!IN_NODE_MODULES.test(file)) return;
	const resolved = path.resolve(path.dirname(file), id);
	return [resolved, `${resolved}.js`, `${resolved}.ts`].find((candidate) => existsSync(candidate));
}

export function adminKit(): Plugin {
	return {
		name: 'admin-kit',
		configEnvironment() {
			// Read by Vite 8's scanner and optimizer (Rolldown), where plugins listed here run before
			// the scanner's own resolver. Cast because the kit is typed against Vite 7, which has no
			// `rolldownOptions`.
			const optimizeDeps = {
				rolldownOptions: {
					plugins: [
						{ name: 'admin-kit:scan-svelte-imports', resolveId: resolveScannedSvelteImport }
					]
				}
			};
			return { optimizeDeps } as unknown as EnvironmentOptions;
		}
	};
}
