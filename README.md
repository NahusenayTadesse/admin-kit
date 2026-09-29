# @nahu/admin-kit

The dashboard, table, form, filter, CRUD and file-storage pieces shared by my SvelteKit + Drizzle
projects. Extracted from `dentalClinic`, which had the most worked-over copy of each.

Personal, not general purpose: SvelteKit only, Tailwind v4 + shadcn-svelte, Drizzle on **MySQL**
for the server helpers, Ethiopian calendar and birr formatting, Addis Ababa time. The UI pieces
work with any database.

## What is in it

The layout mirrors an app's `src/lib`, so moving a project over is mostly
`$lib/…` → `@nahu/admin-kit/…`.

| Area               | Import from `@nahu/admin-kit/…`                                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tables             | `components/Table/data-table.svelte` and its cells: `-sort`, `-links`, `statuses`, `bigText`, `address`, `expiry-cell`, `FilterMenu`; `tableCells` (`userCell`, `ethiopianDate`)                                                                            |
| Forms              | `formComponents/InputComp.svelte` (and Select/Combobox/Checkbox/Date/FileUpload), `DialogComp`, `FormDialog`, `FormCard`, `Errors`, `Messages`, `LoadingBtn`, `StepButton`, `MonthYear`, `DateMonth`; `forms/createForm`                                    |
| Filters            | `QueryBuilder.svelte` + `queryFilters` (browser); `server/queryFilters` (the SQL side)                                                                                                                                                                      |
| Lookup screens     | `components/lookup/LookupPage.svelte`, `LookupSection.svelte`, `types` (`LookupConfig`)                                                                                                                                                                     |
| CRUD (server)      | `server/crud` (`contentCrud`), `server/childCrud` (`childCrud`, `childActions`, `WriteRefused`), `server/lookupDelete`                                                                                                                                      |
| Files              | `server/files` (`saveUploadedFile`, `resolveStoredFile`, `mimeFor`, `MAX_UPLOAD_BYTES`), `server/serveFile` (`GET`), `server/fileAudit` (`auditFiles`), `files` (`fileUrl`)                                                                                 |
| Dashboard shell    | `components/KitProvider.svelte`, `components/shell/AppSidebar`, `NavMain`, `LayoutMenu`, `Search`, `AdminCard`, `DarkMode`                                                                                                                                  |
| Access             | `access` (`createAccess`, `gateRefusal`, `effectivePermissions`), `navigation` (`NavItem`), `entityLinks`                                                                                                                                                   |
| Server basics      | `server/db` (`configureKit`), `server/hooks` (`kitHandle`), `server/schema` (`fieldMixins`), `server/softDelete`, `server/permissions`, `server/audit`, `server/dbErrors`, `server/db/insert`, `server/dates`, `server/password`, `server/testing/rollback` |
| Detail pages, misc | `components/SingleView`, `SingleTable`, `Section`, `DeleteEntity`, `PrintSheet`, `RowButton`, `Empty`, `Loading`, `Copy`, `PasswordGenerator`, `reports/StatCard`, `reports/ReportChart`                                                                    |
| Helpers            | `global` (Ethiopian dates, `formatETB`, `Item`), `time` (`localToday`, `localDayRange`, …), `expiry`, `utils` (`cn`)                                                                                                                                        |
| shadcn primitives  | `components/ui/<name>/index.js` — 34 of them                                                                                                                                                                                                                |
| Theme              | `styles/theme.css`                                                                                                                                                                                                                                          |

TypeScript modules import without an extension (`@nahu/admin-kit/server/crud`), components with
`.svelte`, and barrels with `/index.js`.

## Starting a new project

```sh
npx sv create my-app        # pick tailwindcss, drizzle (mysql + mysql2), better-auth, adapter-node, …
cd my-app
npm install ../admin-kit --install-links
npm run dev                 # open /dashboard
```

`npm install` brings everything the kit needs — bits-ui (shadcn), TanStack Table, superforms,
zod, svelte-sonner, mode-watcher, Lucide — and then sets the project up by itself:

| File                                  | What happens                                                             |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `src/routes/layout.css`               | `@import 'tailwindcss'` becomes the kit's theme (which imports Tailwind) |
| `src/hooks.server.ts`                 | `configureKit({ db, loginPath })` and `kitHandle` added after your hooks |
| `src/app.d.ts`                        | `permList` and `isSuperAdmin` added to `Locals`                          |
| `.gitignore`                          | ignores `.tempFiles` (uploads)                                           |
| `src/lib/access.ts`                   | route rules — add one per page                                           |
| `src/lib/navigation.ts`               | sidebar/search menu, and `ENTITIES` for record links                     |
| `src/routes/dashboard/+layout.*`      | sidebar, search, dark mode, toasts, `<KitProvider>`, sign-in redirect    |
| `src/routes/dashboard/files/[name]/…` | serves uploaded files                                                    |
| `components.json`, `src/lib/utils.ts` | so `npx shadcn-svelte@latest add <x>` works for components the kit lacks |

It only runs on a fresh project: if `src/routes/dashboard` or `src/lib/access.ts` exists it does
nothing, so reinstalling, `npm ci` on a server, or installing into an old project touches no file.
It never overwrites a file. Re-run it by hand with `npx admin-kit setup` (`--force` to add
missing files to a project that already has a dashboard); skip it with `ADMIN_KIT_SKIP_SETUP=1`.
npm hides install-script output — add `--foreground-scripts` to see the list of what it did.

**Until you add roles**, the generated hook treats every signed-in user as a super admin. The
comment above `kitHandle` in `hooks.server.ts` marks where real permissions go.

**One snag in sv's own starter:** its demo `task` table uses `serial()`, which MariaDB rejects on
`npm run db:push`. Delete the `task` table from `src/lib/server/db/schema.ts` before pushing.

### Your first page

```ts
// src/routes/dashboard/regions/+page.server.ts
import { z } from 'zod/v4';
import { contentCrud } from '@nahu/admin-kit/server/crud';
import { lookupDeleteAction } from '@nahu/admin-kit/server/lookupDelete';
import { region } from '$lib/server/db/schema';

const add = z.object({ name: z.string().min(2), status: z.boolean().default(true) });
const crud = contentCrud({
	table: region,
	label: 'Region',
	addSchema: add,
	editSchema: add.extend({ id: z.coerce.number() })
});

export const load = crud.load;
export const actions = { ...crud.actions, delete: lookupDeleteAction(region, 'region') };
```

```svelte
<!-- src/routes/dashboard/regions/+page.svelte -->
<script lang="ts">
	import LookupPage from '@nahu/admin-kit/components/lookup/LookupPage.svelte';
	let { data } = $props();
</script>

<LookupPage
	{data}
	config={{
		entity: 'Region',
		plural: 'Regions',
		fields: [
			{ name: 'name', label: 'Name', type: 'text' },
			{ name: 'status', label: 'Status', type: 'boolean' }
		]
	}}
/>
```

Then a rule in `access.ts` and an entry in `navigation.ts`. Tables use the kit's column mixins:

```ts
import { fieldMixins } from '@nahu/admin-kit/server/schema';
import { user } from './auth.schema';

export const { secureFields, lesserFields, approvalFields } = fieldMixins(() => user.id);
```

## Updating a project to a newer kit

npm keeps an installed copy while the version number is unchanged, so bump it after changing the
kit:

```sh
cd ../admin-kit && npm run release        # 0.1.1 → 0.1.2
cd ../my-app && npm install ../admin-kit --install-links
```

## Moving an existing project over

These projects already share this layout, so most of the move is a path rewrite. After replacing
`$lib/<path>` with `@nahu/admin-kit/<path>` for everything in the table above, the differences are:

| Was                                                     | Now                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `$lib/global.svelte`                                    | `@nahu/admin-kit/global` (no `.svelte`)                                                                 |
| `fileUrl`, `generateFileName` from `global.svelte`      | `fileUrl` from `@nahu/admin-kit/files`; `generateFileName` from `server/files`                          |
| `currentMonthFilter` from `global.svelte`               | `@nahu/admin-kit/server/dates`                                                                          |
| `generatePassword` from `global.svelte`                 | `@nahu/admin-kit/server/password`                                                                       |
| `$lib/server/upload`                                    | `@nahu/admin-kit/server/files`                                                                          |
| `$lib/clinicTime` — `clinicToday`, `clinicDayRange`, …  | `@nahu/admin-kit/time` — `localToday`, `localDayRange`, …                                               |
| `$lib/routeAccess` — `canVisit(path, permList)`         | `access.canVisit(path, permList)` from the app's `createAccess`                                         |
| `$lib/viewer.svelte` — `setViewer`                      | `<KitProvider permList={…}>`                                                                            |
| `$lib/entityLinks` — `EntityKind`                       | a plain `string`; routes passed to `<KitProvider entities>`                                             |
| `app-sidebar.svelte` with `permList`                    | `shell/AppSidebar.svelte` with a `logo` snippet, menu from the provider                                 |
| `Search.svelte permList={…}`                            | `shell/Search.svelte`, no props                                                                         |
| `auditFiles()`                                          | `auditFiles(FILENAME_COLUMNS)` — the app keeps its column list                                          |
| `AuditedTable` union                                    | `string`                                                                                                |
| `softDelete.ts` cascades                                | stay in the app; the kit has `notDeleted`, `deletionStamp`, `softDeleteLookup`, `softDeleteOwnedRecord` |
| `permissions.ts` `computeIsSuperAdmin`, `syncAdminRole` | stay in the app (they read its auth tables); the kit has the guards                                     |

What stays in each app: its schema, auth and hooks, its route rules and menu, and its
domain logic.

## Working on the kit

```sh
npm run check     # svelte-check — 0 errors
npm test          # server (node) + components (headless Chromium)
npm run package   # svelte-package + publint → dist/
```

To try a change in a project: `npm run release` here, then `npm install ../admin-kit --install-links`
there. `bin/setup.js` is the install-time setup.
# admin-kit
