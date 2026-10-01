#!/usr/bin/env node
/**
 * Wires @nahu/admin-kit into a fresh `npx sv create` project, so installing the kit is enough to
 * start work: theme, database hand-off, permission hook, dashboard layout with sidebar and search,
 * file route, and the shadcn-svelte config for adding more components.
 *
 * Runs by itself after `npm install` (the package's `postinstall`), and by hand as
 * `npx admin-kit setup [--force]`.
 *
 * **Only ever once, and only on a fresh project.** It does nothing when the project already has a
 * `src/routes/dashboard` or a `src/lib/access.ts` — every existing portfolio project has the
 * former — so reinstalling, `npm ci` on a server, or installing into an old project never touches
 * a file. It creates files only where none exist, and edits three sv-generated files only where
 * it recognises what sv wrote; anything it does not recognise is printed as a step to do by hand.
 *
 * Never fails the install: every error is reported and swallowed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = '@nahu/admin-kit';
const kitDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fromPostinstall = args.includes('--postinstall');
const force = args.includes('--force');

const done = [];
const manual = [];

function projectRoot() {
	if (fromPostinstall) {
		// npm runs a dependency's postinstall inside node_modules; INIT_CWD is where `npm install`
		// was typed. Anything else — the kit's own install, CI, an opt-out — is not a setup.
		const root = process.env.INIT_CWD;
		if (!root || process.env.CI || process.env.ADMIN_KIT_SKIP_SETUP) return null;
		if (path.resolve(root) === kitDir) return null;
		return path.resolve(root);
	}
	return process.cwd();
}

const read = (root, file) => {
	const full = path.join(root, file);
	return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
};

function write(root, file, content) {
	const full = path.join(root, file);
	fs.mkdirSync(path.dirname(full), { recursive: true });
	fs.writeFileSync(full, content);
}

/** Creates `file` unless something is already there. */
function create(root, file, content) {
	if (fs.existsSync(path.join(root, file))) {
		manual.push(`${file} already exists, left alone`);
		return false;
	}
	write(root, file, content);
	done.push(`created ${file}`);
	return true;
}

// ── Detection ────────────────────────────────────────────────────────────────────────────────

function detect(root) {
	const pkg = JSON.parse(read(root, 'package.json') ?? '{}');
	const deps = { ...pkg.dependencies, ...pkg.devDependencies };
	const drizzleConfig = read(root, 'drizzle.config.ts') ?? read(root, 'drizzle.config.js') ?? '';
	const appTypes = read(root, 'src/app.d.ts') ?? '';

	return {
		isKit: Boolean(deps['@sveltejs/kit']) && fs.existsSync(path.join(root, 'src/routes')),
		mysql: /dialect:\s*['"]mysql['"]/.test(drizzleConfig),
		hasDb:
			fs.existsSync(path.join(root, 'src/lib/server/db/index.ts')) ||
			fs.existsSync(path.join(root, 'src/lib/server/db.ts')),
		// better-auth's sv add-on puts `user` on Locals; without it there is nobody to sign in.
		hasAuth: /\buser\??:/.test(appTypes),
		loginRoute: findLogin(root)
	};
}

/** The route of a login page, if the project has one — sv's better-auth demo puts it under /demo. */
function findLogin(root) {
	for (const candidate of ['src/routes/login', 'src/routes/demo/better-auth/login']) {
		if (fs.existsSync(path.join(root, candidate, '+page.svelte'))) {
			return '/' + candidate.replace(/^src\/routes\/?/, '');
		}
	}
	return null;
}

// ── Edits to sv-generated files ──────────────────────────────────────────────────────────────

/** The theme replaces the stylesheet's `@import 'tailwindcss'` — it imports Tailwind itself. */
function wireStyles(root) {
	const layout = read(root, 'src/routes/+layout.svelte') ?? '';
	const imported = layout.match(/import\s+['"]\.\/([^'"]+\.css)['"]/)?.[1];
	const candidates = [imported && `src/routes/${imported}`, 'src/app.css'].filter(Boolean);

	for (const file of candidates) {
		const css = read(root, file);
		if (css === null) continue;
		if (css.includes(`${KIT}/styles/theme.css`)) return file;

		const tailwind = /@import\s+['"]tailwindcss['"];?/;
		if (tailwind.test(css)) {
			write(root, file, css.replace(tailwind, `@import '${KIT}/styles/theme.css';`));
			done.push(`${file}: Tailwind now comes in through the kit's theme`);
			return file;
		}
	}

	manual.push(`add  @import '${KIT}/styles/theme.css';  to your main stylesheet`);
	return candidates[0] ?? 'src/app.css';
}

/** `permList` and `isSuperAdmin` on `App.Locals`, which the kit's hook sets and its guards read. */
function wireLocals(root) {
	const file = 'src/app.d.ts';
	const types = read(root, file);
	if (types === null || /\bpermList\s*:/.test(types)) return;

	const fields = 'permList: string[]; isSuperAdmin: boolean;';
	let next = null;
	if (/interface Locals\s*\{/.test(types)) {
		next = types.replace(/interface Locals\s*\{/, (open) => `${open} ${fields}`);
	} else if (/\/\/\s*interface Locals\s*\{\s*\}/.test(types)) {
		next = types.replace(/\/\/\s*interface Locals\s*\{\s*\}/, `interface Locals { ${fields} }`);
	}

	if (next) {
		write(root, file, next);
		done.push(`${file}: added permList and isSuperAdmin to Locals`);
	} else {
		manual.push(`${file}: add  ${fields}  to App.Locals`);
	}
}

/**
 * Hands the kit the database and adds its hook after the existing ones. Recognises the two shapes
 * sv writes — `handle = someHandle` and `handle = sequence(a, b)` — and nothing else.
 */
function wireHooks(root, { mysql, hasDb, hasAuth, loginRoute }) {
	const file = 'src/hooks.server.ts';
	let hooks = read(root, file);

	if (hooks?.includes('kitHandle')) return;

	const lines = [];
	if (mysql && hasDb) {
		lines.push(`import { configureKit } from '${KIT}/server/db';`);
		if (!/from ['"]\$lib\/server\/db['"]/.test(hooks ?? '')) {
			lines.push(`import { db } from '$lib/server/db';`);
		}
	}
	lines.push(`import { kitHandle } from '${KIT}/server/hooks';`);
	lines.push(`import { access } from '$lib/access';`);
	if (!/\bsequence\b/.test(hooks ?? '')) {
		lines.push(`import { sequence } from '@sveltejs/kit/hooks';`);
	}

	const setup = [
		'',
		...(mysql && hasDb
			? [
					loginRoute && loginRoute !== '/login'
						? `configureKit({ db, loginPath: '${loginRoute}' });`
						: 'configureKit({ db });',
					''
				]
			: []),
		'/**',
		" * The kit's permission hook. There are no roles yet, so every signed-in user is treated as a",
		' * super admin: they may open every page with a rule and delete through the CRUD helpers.',
		" * Replace this with the user's real permissions once roles exist.",
		' */',
		'const handleKit = kitHandle({',
		'\taccess,',
		hasAuth
			? '\tpermissions: (event) => ({ permList: [], isSuperAdmin: Boolean(event.locals.user) })'
			: '\tpermissions: () => ({ permList: [], isSuperAdmin: true }),',
		// No sign-in in this project, so there is never a `locals.user` to require.
		...(hasAuth ? [] : ['\trequireUser: false']),
		'});',
		''
	];

	if (hooks === null) {
		hooks = [...lines, ...setup, 'export const handle = sequence(handleKit);', ''].join('\n');
		write(root, file, hooks);
		done.push(`created ${file}`);
		return;
	}

	const handle = /export const handle(\s*:\s*Handle)?\s*=\s*([^;]+);/;
	const match = hooks.match(handle);
	if (!match) {
		manual.push(`${file}: add kitHandle({ access }) to your handle — see the kit's README`);
		return;
	}

	const current = match[2].trim();
	const composed = current.startsWith('sequence(')
		? current.replace(/\)\s*$/, ', handleKit)')
		: `sequence(${current}, handleKit)`;

	// New imports go after the last existing import; the setup block goes right before `handle`.
	// `[ \t]*$`, not `\s*$`: the match must end on the import's own line, so the kit's imports
	// join the block and the blank line after it stays where it was.
	const importEnd = [...hooks.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm)].at(-1);
	const at = importEnd ? importEnd.index + importEnd[0].length : 0;
	hooks =
		hooks.slice(0, at) + (at ? '\n' : '') + lines.join('\n') + (at ? '' : '\n') + hooks.slice(at);
	// `handle` already has a blank line above it, so the block drops its own leading one.
	hooks = hooks.replace(
		handle,
		`${setup.slice(1).join('\n')}\nexport const handle${match[1] ?? ''} = ${composed};`
	);

	write(root, file, hooks);
	done.push(`${file}: configureKit and kitHandle added (after your existing hooks)`);
}

/** Uploaded files are data, not source. */
function wireGitignore(root) {
	const ignore = read(root, '.gitignore');
	if (ignore === null || /^\/?\.tempFiles\/?$/m.test(ignore)) return;
	write(
		root,
		'.gitignore',
		ignore.replace(/\n*$/, '\n\n# Uploaded files (admin-kit)\n.tempFiles\n')
	);
	done.push('.gitignore: ignores .tempFiles (uploads)');
}

// ── New files ────────────────────────────────────────────────────────────────────────────────

function scaffold(root, { mysql, hasDb, hasAuth, loginRoute }, stylesheet) {
	create(
		root,
		'src/lib/access.ts',
		`import { createAccess } from '${KIT}/access';

/**
 * Who may open what: one rule per route prefix, first match wins, so specific prefixes go before
 * general ones. Pages under /dashboard with no rule are closed — add a rule with every new page.
 * \`permission: null\` means any signed-in user.
 */
export const access = createAccess({
	root: '/dashboard',
	rules: [
		{ prefix: '/dashboard', permission: null, exact: true },
		{ prefix: '/dashboard/files/', permission: null }
	]
});
`
	);

	create(
		root,
		'src/lib/navigation.ts',
		`import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import type { NavItem } from '${KIT}/navigation';

/** The sidebar and the search palette. Each entry is shown only if \`access\` lets the viewer in. */
export const NAVIGATION: NavItem[] = [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }];

/** Where each kind of record's page lives, so table cells can link to it: \`{ employee: '/dashboard/employees' }\`. */
export const ENTITIES: Record<string, string> = {};
`
	);

	create(
		root,
		'src/routes/dashboard/+layout.server.ts',
		hasAuth
			? `import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
	if (!locals.user) redirect(302, '${loginRoute ?? '/login'}');

	return { permList: locals.permList, isSuperAdmin: locals.isSuperAdmin, user: locals.user };
};
`
			: `export const load = ({ locals }) => ({
	permList: locals.permList,
	isSuperAdmin: locals.isSuperAdmin
});
`
	);

	create(
		root,
		'src/routes/dashboard/+layout.svelte',
		`<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';
	import * as Sidebar from '${KIT}/components/ui/sidebar/index.js';
	import KitProvider from '${KIT}/components/KitProvider.svelte';
	import AppSidebar from '${KIT}/components/shell/AppSidebar.svelte';
	import Search from '${KIT}/components/shell/Search.svelte';
	import DarkMode from '${KIT}/components/shell/DarkMode.svelte';
	import { access } from '$lib/access';
	import { ENTITIES, NAVIGATION } from '$lib/navigation';

	let { data, children } = $props();
</script>

<ModeWatcher />
<Toaster richColors />

<KitProvider
	{access}
	navigation={NAVIGATION}
	entities={ENTITIES}
	permList={data.permList}
	isSuperAdmin={data.isSuperAdmin}
>
	<Sidebar.Provider>
		<AppSidebar>
			{#snippet logo()}
				<span class="text-lg font-bold">Dashboard</span>
			{/snippet}
		</AppSidebar>
		<main class="min-w-0 flex-1 px-2">
			<div class="sticky top-2 z-50 flex items-center justify-between rounded-lg p-2 shadow-lg backdrop-blur-md">
				<Sidebar.Trigger />
				<div class="flex items-center gap-2">
					<Search />
					<DarkMode />
				</div>
			</div>
			<div class="p-2 pt-4">
				{@render children()}
			</div>
		</main>
	</Sidebar.Provider>
</KitProvider>
`
	);

	create(
		root,
		'src/routes/dashboard/+page.svelte',
		`<h1 class="text-2xl font-semibold">Dashboard</h1>
<p class="mt-2 text-muted-foreground">
	Add pages under <code>src/routes/dashboard</code>, a rule for each in
	<code>src/lib/access.ts</code>, and a menu entry in <code>src/lib/navigation.ts</code>.
</p>
`
	);

	if (mysql && hasDb) {
		create(
			root,
			'src/routes/dashboard/files/[name]/+server.ts',
			`/** Serves uploaded files to signed-in users. \`fileUrl(name)\` from ${KIT}/files points here. */
export { GET } from '${KIT}/server/serveFile';
`
		);
	}

	// shadcn-svelte's CLI, for adding components the kit does not ship: \`npx shadcn-svelte add x\`.
	create(
		root,
		'components.json',
		JSON.stringify(
			{
				$schema: 'https://shadcn-svelte.com/schema.json',
				tailwind: { css: stylesheet, baseColor: 'slate' },
				aliases: {
					components: '$lib/components',
					utils: '$lib/utils',
					ui: '$lib/components/ui',
					hooks: '$lib/hooks',
					lib: '$lib'
				},
				typescript: true,
				registry: 'https://shadcn-svelte.com/registry'
			},
			null,
			'\t'
		) + '\n'
	);
	create(root, 'src/lib/utils.ts', `export * from '${KIT}/utils';\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────

function run() {
	const root = projectRoot();
	if (!root) return;

	const project = detect(root);
	if (!project.isKit) {
		if (!fromPostinstall) console.log('admin-kit: not a SvelteKit project, nothing to set up.');
		return;
	}

	const alreadySetUp =
		fs.existsSync(path.join(root, 'src/routes/dashboard')) ||
		fs.existsSync(path.join(root, 'src/lib/access.ts'));
	if (alreadySetUp && !force) {
		if (!fromPostinstall) {
			console.log(
				'admin-kit: this project already has a dashboard; nothing changed. (--force to add missing files)'
			);
		}
		return;
	}

	const stylesheet = wireStyles(root);
	wireLocals(root);
	wireHooks(root, project);
	wireGitignore(root);
	scaffold(root, project, stylesheet);

	if (!project.mysql) {
		manual.push(
			'Drizzle is not on MySQL here: the UI works, but the server CRUD and file helpers need MySQL'
		);
	}

	console.log('\nadmin-kit is set up. Run `npm run dev` and open /dashboard.\n');
	for (const line of done) console.log(`  ✓ ${line}`);
	for (const line of manual) console.log(`  • ${line}`);
	console.log('');
}

try {
	run();
} catch (err) {
	console.error(`admin-kit setup skipped: ${err instanceof Error ? err.message : err}`);
}
