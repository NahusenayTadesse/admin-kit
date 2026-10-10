# Styles

The kit has six looks. A style is more than a colour theme: it sets the **fonts**, the **corner
radius**, the **shape and size of buttons and inputs**, how **dense tables** are, how **headings
and labels** are set — and in the components that have one, a **different layout** altogether.
The idea is shadcn's `create` styles (Vega, Nova, Maia, Lyra, Mira), done the kit's way: runtime
flags, no rebuild, no copied component code.

**A style never sets a colour.** Colours are always the app's — see
[Colours: the app's, always](#colours-the-apps-always). Pick any style and the app's palette,
light and dark, is what it is drawn in.

**See them all:** `npm run dev` in the kit and open **`/create`**. Pick a style, an accent, a
radius and fonts, flip dark mode, try it under a real app's palette (Amoria, Digital
Construct), and copy the lines for your app. The choice is kept in the
address, so a look can be shared as a link (`/create?style=formal&accent=teal`).

|     | Style                 | Looks like                                                             | Fonts                         | Radius   | Density |
| --- | --------------------- | ---------------------------------------------------------------------- | ----------------------------- | -------- | ------- |
| 1   | **default** (current) | Rounded rectangles, buttons that grow slightly on hover                | Inter                         | 0.5rem   | regular |
| 2   | **compact**           | 32px controls, tight striped tables, tabular figures, 14px text        | IBM Plex Sans                 | 0.375rem | dense   |
| 3   | **soft**              | Pill buttons, round borderless cards, generous spacing                 | Plus Jakarta Sans             | 0.875rem | roomy   |
| 4   | **sharp**             | Square corners, hairlines, uppercase mono labels, no shadows           | Geist + Geist Mono            | 0        | regular |
| 5   | **formal**            | Serif headings, ruled records, small-capital labels, flat controls     | Source Serif 4, Source Sans 3 | 0.25rem  | regular |
| 6   | **bold**              | 2px borders and hard offset shadows in the app's ink, press-in buttons | Space Grotesk                 | 0.5rem   | roomy   |

`default` is exactly how the kit looked before styles existed. An app that sets nothing sees no
change.

## Where each one fits

### Default

The kit as it always was.

- **Use it for:** general back-office and admin dashboards; apps with a mix of forms, tables and
  detail pages; anything already built on the kit.
- **Not for:** screens where every pixel of density counts (use Compact).

### Compact

Small controls, tight striped rows, tabular figures. Detail pages read as a two-column spec sheet,
statuses as a dot and a word.

- **Use it for:** inventory, stock and pharmacy screens with long lists; accounting, ledgers,
  payroll and reports with many columns; POS back offices and dispatch screens used all day by
  trained staff; wide desktop monitors.
- **Not for:** touch screens and tablets; occasional or non-technical users.

### Soft

Tall pill buttons, round borderless cards on soft shadows. Detail pages are tiles,
the record header is a banner with the photo on its edge, statuses are tinted pills.

- **Use it for:** portals for customers, patients, parents or members; reception and front-desk
  screens, booking and appointments; tablets and touch screens (larger targets); staff who use
  the app occasionally and should not feel lost.
- **Not for:** data-heavy tables with dozens of columns.

### Sharp

No radius, no shadows, monospaced uppercase labels, table headers and buttons.
Detail pages are a ruled ledger with a shaded key column; section titles run into a hairline.

- **Use it for:** internal technical tools — IT assets, devices, logs and audit trails;
  logistics, warehouse and fleet tracking (codes, serials, SKUs); developer-facing consoles and
  settings screens; teams that want a precise, engineered feel.
- **Not for:** customer-facing portals that should feel friendly.

### Formal

A document: serif headings, small-capital labels, flat controls. Detail pages
are a filled-in paper form between double rules, the record header is a title block with an ID
photo, statuses are a quiet coloured word.

- **Use it for:** law offices, notaries, courts, government and NGO offices; school records,
  transcripts, certificates and HR files; finance and insurance documents, invoices and
  statements; anything printed or read like a document.
- **Not for:** fast-paced operational screens; young, playful brands.

### Bold

Neo-brutalist: thick borders and hard offset shadows in the app's `--foreground`, which disappear
as a button is pressed, heavy headings, a table header inverted in the app's colours. Detail pages are inked blocks with a tag for each label.

- **Use it for:** brand-forward startups, studios and creative agencies; events, ticketing, youth
  and education products; demos, hackathons and internal tools that should have character.
- **Not for:** dense tables; conservative clients (banks, courts, hospitals).

## Using a style

**The dashboard only** — `KitProvider` takes a `look`:

```svelte
<KitProvider look={{ style: 'soft', accent: 'green' }} {access} navigation={NAVIGATION}>
	…
</KitProvider>
```

**The whole app**, sign-in and print pages included — `KitStyle` in the root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import KitStyle from '@nahu/admin-kit/components/KitStyle.svelte';
	let { children } = $props();
</script>

<KitStyle style="formal" accent="teal">{@render children()}</KitStyle>
```

What `KitStyle` does: it puts the look on `<html>` as `data-kit-*` attributes — with a small
script in `<head>` that runs while the server's HTML is parsed, so the very first paint already
has it (the way mode-watcher sets dark mode) — and keeps them in step after that. It adds no
element of its own. It also puts the look in context for the components that change their
markup. With one `KitStyle` inside another (a root layout's and the dashboard's `KitProvider`),
the inner one's look is on the page while it is mounted; leaving puts the outer one's back.

`kitLookHtml(look)` from `@nahu/admin-kit/kitStyle` writes the same attributes as a string, for an
`app.html` written by hand; with `KitStyle` it is not needed.

## The axes on top of a style

Each is optional; leave it out to keep what the style (or your app) sets.

| Prop      | Attribute          | Values                                                                                                               |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `style`   | `data-kit-style`   | `default` `compact` `soft` `sharp` `formal` `bold`                                                                   |
| `accent`  | `data-kit-accent`  | `blue` (the kit's) `teal` `green` `violet` `amber` `rose` `neutral` — only for an app with no `--primary` of its own |
| `radius`  | `data-kit-radius`  | `none` `sm` `md` `lg` `xl`                                                                                           |
| `font`    | `data-kit-font`    | `inter` `plex` `jakarta` `geist` `source` `grotesk` `serif` `mono`                                                   |
| `heading` | `data-kit-heading` | same as `font`                                                                                                       |

The radius scales every corner drawn from `--radius`. Shapes a style fixes on purpose — Soft's
pill buttons and badges, Sharp's square controls — stay: the style decides the shape, the radius
tunes the rest.

## Components that change their layout

These read the style from context, and each also takes a `kitStyle` prop to use another style's
layout in one place (`<SingleTable kitStyle="formal" … />` on an otherwise default page).

| Component                 | default              | compact               | soft                      | sharp                      | formal                          | bold                         |
| ------------------------- | -------------------- | --------------------- | ------------------------- | -------------------------- | ------------------------------- | ---------------------------- |
| `SingleTable`             | Detail / Value table | two-column spec sheet | tiles                     | ruled ledger, mono keys    | paper form between double rules | inked blocks with label tags |
| `SingleView`              | centred round photo  | one line, small photo | banner, photo on its edge | shaded bar, square photo   | title block, ID photo           | accent header, inked photo   |
| `PageHeader`              | as before            | ruled, smaller        | eyebrow as a pill         | mono eyebrow, hairline     | small caps, double rule, italic | eyebrow as a tilted tag      |
| `PageSection`             | as before            | ruled title           | roomier                   | mono label into a hairline | ruled title, italic hint        | underlined in the accent     |
| `Section` (detail card)   | as before            | tight, shaded header  | round icon in the accent  | mono header                | serif title, double rule        | inked card, shaded header    |
| `StatCard`                | left stripe          | dot, tight            | tinted, no border         | top stripe, mono figures   | serif figure, coloured rule     | colour block, offset shadow  |
| `statuses` (status badge) | solid with icon      | dot and word          | tinted pill               | outlined, square dot       | coloured word after a ring      | solid with ink border        |
| `Notice`                  | as before            | tighter               | rounded, borderless       | left bar, mono title       | rules above and below           | inked, offset shadow         |
| `Empty`                   | as before            | dashed box            | rounded tile              | dashed box, mono           | double rules, serif italic      | inked block                  |

Everything else changes through the primitives: `Button`, `Input`, `Textarea`, `Select`,
`Badge`, `Card`, `Label` and `Table` (so `DataTable`, forms, dialogs and lookups) read the tokens
below. The `default` values of those tokens are the exact classes they replaced.

## Tokens

Every style is a set of CSS variables in `styles/kit-styles.css`. Override any of them after the
theme import, like the colours:

```css
@import '@nahu/admin-kit/styles/theme.css';

:root {
	--kit-control-h: 2.75rem; /* taller buttons and inputs, whatever the style */
}
```

| Group    | Tokens                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fonts    | `--kit-font-sans` `--kit-font-head` `--kit-font-body` `--kit-font-mono` (app-facing, as before)                                                                                                                                                                                |
| Headings | `--kit-heading-weight` `--kit-h1-size` `--kit-h1-tracking` `--kit-h2-size` `--kit-h3-size` `--kit-heading-tracking`                                                                                                                                                            |
| Labels   | `--kit-label-size` `--kit-label-weight` `--kit-label-transform` `--kit-label-tracking` `--kit-field-label-transform`                                                                                                                                                           |
| Controls | `--kit-control-h` `--kit-control-h-sm` `--kit-control-h-lg` `--kit-control-px` `--kit-input-px` `--kit-control-radius` `--kit-control-border` `--kit-control-shadow` `--kit-control-shadow-active` `--kit-input-shadow` `--kit-press`                                          |
| Buttons  | `--kit-button-radius` `--kit-button-font` `--kit-button-text` `--kit-button-weight` `--kit-button-transform` `--kit-button-tracking` `--kit-button-border` `--kit-button-hover-scale`                                                                                          |
| Badges   | `--kit-badge-radius` `--kit-badge-font` `--kit-badge-weight` `--kit-badge-transform` `--kit-badge-tracking` `--kit-badge-border`                                                                                                                                               |
| Cards    | `--kit-card-radius` `--kit-card-pad` `--kit-card-gap` `--kit-card-border` `--kit-card-shadow` `--kit-card-title-font`                                                                                                                                                          |
| Tables   | `--kit-table-text` `--kit-table-head-h` `--kit-table-head-bg` `--kit-table-head-color` `--kit-table-head-font` `--kit-table-head-size` `--kit-table-head-weight` `--kit-table-head-transform` `--kit-table-head-tracking` `--kit-cell-px` `--kit-cell-py` `--kit-table-stripe` |

Precedence, from weakest: the kit's defaults → the style → the accent / radius / font flags →
your app's own CSS. Every kit rule is weightless (`:where()`) and sits on `<html>` alone, and each
primitive reads its token with the class it replaced as the fallback, at the element itself — so
an app's `:root { … }`, `.dark { … }`, or a subtree's own values (a public site's
`.site { --radius: 1rem }`) always win.

## Colours: the app's, always

The kit draws every colour from the shadcn variables (`--background`, `--foreground`, `--card`,
`--primary`, `--muted`, `--border`, `--sidebar-*`, `--chart-1` … `--chart-5`, …) plus three state
colours of its own:

| Variable                             | Used by                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `--success` / `--success-foreground` | paid / active / approved statuses, success notices, positive stat cards |
| `--warning` / `--warning-foreground` | pending statuses, warning notices, expiring dates, warning stat cards   |
| `--info` / `--info-foreground`       | sent / preparing statuses, info notices, neutral stat cards             |
| `--destructive`                      | overdue / cancelled statuses, errors, danger notices, negative cards    |

The kit's own values for all of them (`styles/colors.css`) are weightless defaults: set any of
them in your stylesheet after the theme import — `:root { … }` and `.dark { … }` — and every kit
component, in every style, uses yours. Nothing in the kit hard-codes a Tailwind palette colour
(`bg-gray-100`, `text-red-500`): tables, detail pages, status badges, notices, stat cards, form
errors, the password meter and the sidebar's scrollbar all follow the app. Charts (`ReportChart`,
the table's chart pane) read `--chart-1` … `--chart-5`, `--card`, `--foreground`,
`--muted-foreground` and `--border` where the chart is drawn; series six to eight use the kit's
own set.

Status values map to a role — success, danger, warning, info or neutral — and the role picks the
colour (`statusRole` from `components/Table/statuses.svelte`).

## Fonts

`styles/theme.css` loads every style's faces from Google Fonts in one stylesheet request; a
browser downloads a face only when text on the page uses it, so an app on the default style still
fetches only Inter. The new styles fall back to Noto Sans / Serif Ethiopic for Amharic, which
loads only for Ethiopic characters.

With `styles/theme.base.css` (no Google request) the app loads the faces of the style it uses, or
they fall back to the system's.

## Adding a style

1. Add the name to `KIT_STYLE_NAMES` and a `KIT_STYLES` entry (where it fits) in
   `src/lib/kitStyle.ts`.
2. Add a `:where(:root[data-kit-style='name'])` block to `styles/kit-styles.css` setting the
   tokens. Never a colour: if the style needs one, use the app's (`var(--foreground)`).
3. Add its fonts to `styles/fonts.css`.
4. Give each layout-changing component above its branch (TypeScript points at every `Record`
   keyed by style that is missing it).
5. Add it to this file and the README.
