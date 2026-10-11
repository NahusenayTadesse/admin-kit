# Updating apps with admin-kit

Run these commands from the `admin-kit` folder. Node.js 22+, npm, and the kit's development dependencies must be installed (`npm install` if needed). The apps should be sibling folders in the portfolio directory.

## Update all projects

```sh
npm run update:projects
```

The script builds and validates the kit once, then installs the current local kit into every project listed in `scripts/update-projects.mjs`. It refreshes installed files even if the kit version has not changed. It updates npm lockfiles and verifies that the installed production files match the kit.

To also run each app's type/Svelte checks:

```sh
npm run update:projects -- --check
```

## Project list

```sh
npm run update:projects -- --list
```

| Project name       | Folder relative to admin-kit | Kit source                  |
| ------------------ | ---------------------------- | --------------------------- |
| `visitethiopia`    | `../visitethiopia`           | `vendor/admin-kit` snapshot |
| `joel`             | `../joel`                    | `../admin-kit`              |
| `dentalClinic`     | `../dentalClinic`            | `../admin-kit`              |
| `amoria`           | `../amoria`                  | `../admin-kit`              |
| `stock management` | `../stock management`        | `../admin-kit`              |
| `spotlessSystem`   | `../spotlessSystem`          | `../admin-kit`              |
| `joel-academy`     | `../joel-academy`            | `../admin-kit`              |
| `hotel`            | `../hotel`                   | `../admin-kit`              |
| `dentalPulse`      | `../dentalPulse`             | `../admin-kit`              |
| `steel-factory`    | `../steel-factory`           | `../admin-kit`              |

Update only selected projects by supplying their names. Quote names containing spaces:

```sh
npm run update:projects -- joel amoria
npm run update:projects -- --check "stock management"
```

Edit the `PROJECTS` array at the top of `scripts/update-projects.mjs` to add or remove projects. Each entry has a `name` and a `directory` relative to the kit. Add `vendor: 'vendor/admin-kit'` only for an app using that local snapshot as its dependency. The script validates dependency paths before making updates. Paths are resolved from the script, not the terminal's current folder.

## Releasing kit changes

For a new version, bump it once before updating the apps:

```sh
npm run release
npm run update:projects -- --check
```

`release` bumps the patch version in the kit's package files without creating a Git tag. The updater itself never bumps the version, commits, or deploys anything.

## What changes and what failures mean

- Each app's installed kit and npm lockfile are refreshed. npm may install dependencies required by the new kit.
- Visit Ethiopia's vendor snapshot is refreshed from this kit, including `src`, `dist`, `bin`, package files, README, and build configuration. It uses an adapter-free Svelte configuration because the snapshot is a library. Its `prepare` hook is renamed to `prepare:source` so npm uses the already-built files without requiring the kit’s development dependencies. Keep shared kit edits in the main kit; local changes in those vendor files are overwritten.
- The kit's automatic app-scaffolding hook is disabled during updates. Normal npm lifecycle scripts still run.
- A build or initial validation failure stops the run before updating apps. An individual app failure is reported, and the remaining apps still run.
- A failed installation restores the previous installed kit when one existed. This is not a full rollback of npm lockfiles, other dependencies, or the vendor snapshot; inspect the error and rerun after fixing it.
- With `--check`, a failed app check leaves the update installed. The final summary distinguishes update failures from check failures, and either produces exit code 1.
- If an interrupted run leaves `.admin-kit-update-backup` in an app folder, inspect and restore or remove that backup before retrying.

DentalClinic currently reports existing type-check errors. Its update can succeed while `--check` reports a failure.
