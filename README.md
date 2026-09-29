# @nahu/admin-kit

The dashboard, table, form, filter, CRUD and file-storage pieces shared by my SvelteKit + Drizzle
projects. Extracted from `dentalClinic`, which had the most worked-over copy of each.

Personal, not general purpose: SvelteKit only, Tailwind v4 + shadcn-svelte, Drizzle on **MySQL**
for the server helpers, Ethiopian calendar and birr formatting, Addis Ababa time. The UI pieces
work with any database.

## What is in it

The layout mirrors an app's `src/lib`, so moving a project over is mostly
`$lib/…` → `@nahu/admin-kit/…`.

| Area               | Import from `@nahu/admin-kit/…`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tables             | `components/Table/data-table.svelte` — `variant`: `list` (a page's list: search, export, pages), `compact` (inside a page: no toolbar, pages of 10), `sheet` (inputs in a form: every row, no pager); columns with a `footer` get a totals row, `meta: { align: 'right' }` aligns a column, `rowClass` tints a row — and its cells: `-sort`, `-links`, `statuses`, `bigText` (long free text: the first `max` characters, 15 by default, and a clickable “…” that opens the rest), `address`, `expiry-cell`, `FilterMenu`; `tableCells` (`userCell`, `ethiopianDate`) |
| Forms              | `formComponents/InputComp.svelte` (and Select/Combobox/Checkbox/Date/FileUpload), `DateInput` (plain forms), `CalendarSwitch`, `DateFields`, `DialogComp`, `FormDialog`, `FormCard`, `Errors`, `Messages`, `LoadingBtn`, `StepButton`, `MonthYear`, `DateMonth`; `forms/createForm`                                                                                                                                                                                                                                                                                   |
| Filters            | `QueryBuilder.svelte` + `queryFilters` (browser); `server/queryFilters` (the SQL side)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Lookup screens     | `components/lookup/LookupPage.svelte`, `LookupSection.svelte`, `types` (`LookupConfig`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CRUD (server)      | `server/crud` (`contentCrud`), `server/childCrud` (`childCrud`, `childActions`, `WriteRefused`), `server/lookupDelete`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Files              | `server/files` (`saveUploadedFile`, `resolveStoredFile`, `mimeFor`, `MAX_UPLOAD_BYTES`), `server/serveFile` (`GET`), `server/fileAudit` (`auditFiles`), `files` (`fileUrl`)                                                                                                                                                                                                                                                                                                                                                                                           |
| Dashboard shell    | `components/KitProvider.svelte`, `components/shell/AppSidebar`, `NavMain`, `LayoutMenu`, `Search`, `AdminCard`, `DarkMode`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Access             | `access` (`createAccess`, `gateRefusal`, `effectivePermissions`), `navigation` (`NavItem`), `entityLinks`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Server basics      | `server/db` (`configureKit`), `server/hooks` (`kitHandle`), `server/schema` (`fieldMixins`), `server/softDelete`, `server/permissions`, `server/audit`, `server/dbErrors`, `server/db/insert`, `server/dates`, `server/password`, `server/testing/rollback`                                                                                                                                                                                                                                                                                                           |
| Page parts         | `components/PageHeader` (title, tab title, line, badges, buttons), `PageSection` (a titled part of a page), `Notice` (info / warning / danger / success in-page messages), `ConfirmAction` (a button that asks, then posts to a form action; `cancelLabel`)                                                                                                                                                                                                                                                                                                           |
| Detail pages, misc | `components/SingleView`, `SingleTable` (rows may say `kind: 'phone' \| 'status'` and `long`), `Section`, `DeleteEntity`, `PrintSheet`, `RowButton`, `Empty`, `Loading`, `Copy`, `PasswordGenerator`, `reports/StatCard`, `reports/ReportChart`                                                                                                                                                                                                                                                                                                                        |
| Helpers            | `calendars` (Ethiopian ⇄ Gregorian), `calendarPreference.svelte`, `global` (Ethiopian dates, `formatETB`, `Item`), `time` (`localToday`, `localDayRange`, …), `expiry`, `utils` (`cn`)                                                                                                                                                                                                                                                                                                                                                                                |
| shadcn primitives  | `components/ui/<name>/index.js` — 34 of them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Theme              | `styles/theme.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

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

## Translating the kit

Every word the kit puts on screen is a label with an English default, so a project that does
nothing sees nothing change. To show the kit in another language:

- **Components:** call `setKitLabels` once in the app's root `src/routes/+layout.svelte`, so pages
  outside the dashboard (sign-in, print sheets) get the labels too. Pass a **function**: it is read
  each time a component renders, so it picks up the viewer's language. Labels that take values
  are functions themselves.

  ```svelte
  <script lang="ts">
  	import { setKitLabels } from '@nahu/admin-kit/labels';
  	import { m } from '$lib/paraglide/messages.js';

  	setKitLabels(() => ({
  		tableColumns: m.kit_table_columns(),
  		pagerPage: (page, pages) => m.kit_pager_page({ page, pages })
  		// …any the app leaves out stay English
  	}));
  </script>
  ```

  The full list, with the English defaults, is `KitLabels` / `englishLabels` in
  `src/lib/labels.ts`. `KitProvider` also takes a `labels` prop. Kit components read them with
  `useLabels()` — Svelte context, never module state, for the per-request reason in `context.ts`.

- **Server messages** (the flash after a save, permission refusals, upload errors): give
  `configureKit` a `labels` function returning `Partial<ServerLabels>` (`server/labels.ts`). It is
  called for each message, inside the request, so it can read the request's locale.
  `childCrud`, `contentCrud` and `lookupDeleteAction` take `label` as a string or a function
  (`label: () => m.line()`), so the name of the record is translated too.

- **Leaving a form with unsaved changes:** `confirmLeaveWith(message)` instead of `confirmLeave`.

Ethiopian dates and `formatETB` are the same in every language and have no labels.

## Dates: Ethiopian and Gregorian

Every date input in the kit — `InputComp type="date"` and `"dateMultiple"`, `DateInput` (for
plain GET forms), the table's date-range filter and the QueryBuilder's dates — can be switched
between the Ethiopian and the Gregorian calendar, clicked on a grid drawn in that calendar
(thirteen months, Pagume included) or typed as day / month / year, with the same day on the
other calendar shown as you go.

**What leaves an input is always a Gregorian `YYYY-MM-DD`.** The calendar only changes what is
shown; the form posts, and the database keeps, Gregorian dates, and the server never sees an
Ethiopian one. Conversion is exact (`src/lib/calendars.ts`, on `@internationalized/date`'s
`EthiopicCalendar`), and a day that does not exist (ጳጉሜ 7, 31 September) is refused, not moved.

- Inputs start on the Ethiopian calendar. An app can change that in its root layout with
  `setKitCalendar('gregorian')` from `@nahu/admin-kit/calendarPreference.svelte`.
- Switching one input switches them all on the page, and the browser remembers it
  (`localStorage`, `admin-kit.calendar`); the server always renders the app's default.
- `calendar="ethiopian"` (or `"gregorian"`) on `InputComp`, `DatePicker` or `DateInput` fixes one
  field to a calendar, with no switch.
- The kit's `Calendar` and `RangeCalendar` take `calendar={kind}` too: the grid is drawn on
  that calendar while `value` stays Gregorian in both directions.
- Ethiopian dates are written with the Amharic month names in either language; Gregorian ones in
  the interface's language, from the `dateLocale` label (`en-GB` by default; `am-ET` for an
  Amharic interface).
- For code: `formatDateIn(value, kind, locale)`, `partsOf`, `fromParts`, `monthNames`,
  `inCalendar`, `toGregorian` and `isoDate` in `@nahu/admin-kit/calendars`.

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
