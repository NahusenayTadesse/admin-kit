#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Edit this list when another sibling app starts using the kit.
// Paths are relative to admin-kit, regardless of where you run this script.
const PROJECTS = [
	{ name: 'visitethiopia', directory: '../visitethiopia', vendor: 'vendor/admin-kit' },
	{ name: 'joel', directory: '../joel' },
	{ name: 'dentalClinic', directory: '../dentalClinic' },
	{ name: 'amoria', directory: '../amoria' },
	{ name: 'stock management', directory: '../stock management' },
	{ name: 'spotlessSystem', directory: '../spotlessSystem' },
	{ name: 'joel-academy', directory: '../joel-academy' }
];

const kit = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageName = '@nahu/admin-kit';
const args = process.argv.slice(2);
const flags = new Set(['--list', '--check', '--help']);
const unknown = args.filter((arg) => arg.startsWith('--') && !flags.has(arg));
if (unknown.length) throw new Error(`Unknown option: ${unknown.join(', ')}`);
if (args.includes('--help')) {
	console.log('Usage: npm run update:projects -- [--list] [--check] [project names...]');
	console.log('No project names: update every project in PROJECTS. Quote names containing spaces.');
	process.exit(0);
}
if (args.includes('--list')) {
	for (const project of PROJECTS) {
		console.log(
			`${project.name}: ${project.directory}${project.vendor ? ` (${project.vendor})` : ''}`
		);
	}
	process.exit(0);
}
const names = args.filter((arg) => !arg.startsWith('--'));
for (const name of names) {
	if (!PROJECTS.some((project) => project.name === name))
		throw new Error(`Unknown project: ${name}`);
}
const selected = PROJECTS.filter((project) => !names.length || names.includes(project.name));
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
function run(command, commandArgs, cwd) {
	const result = spawnSync(command, commandArgs, {
		cwd,
		stdio: 'inherit',
		env: { ...process.env, ADMIN_KIT_SKIP_SETUP: '1' }
	});
	if (result.error) throw result.error;
	if (result.status !== 0)
		throw new Error(`${command} ${commandArgs.join(' ')} failed (${result.status})`);
}

// Validate the complete selection before building or changing any app.
for (const project of selected) {
	project.root = path.resolve(kit, project.directory);
	const manifest = readJson(path.join(project.root, 'package.json'));
	project.spec = { ...manifest.devDependencies, ...manifest.dependencies }[packageName];
	const expected = project.vendor ? path.join(project.root, project.vendor) : kit;
	if (
		!project.spec?.startsWith('file:') ||
		path.resolve(project.root, project.spec.slice(5)) !== expected
	) {
		throw new Error(
			`${project.name}: expected a local admin-kit dependency pointing to ${expected}`
		);
	}
	if (args.includes('--check') && !manifest.scripts?.check) {
		throw new Error(`${project.name}: missing npm run check`);
	}
}

run('npm', ['run', 'package'], kit);
const version = readJson(path.join(kit, 'package.json')).version;
const results = [];
for (const project of selected) {
	console.log(`\nUpdating ${project.name} to admin-kit ${version}`);
	try {
		if (project.vendor) {
			const vendor = path.join(project.root, project.vendor);
			// Refresh the existing source snapshot too, keeping it consistent with its build.
			for (const entry of ['dist', 'bin', 'src']) {
				fs.rmSync(path.join(vendor, entry), { recursive: true, force: true });
				fs.cpSync(path.join(kit, entry), path.join(vendor, entry), { recursive: true });
			}
			for (const entry of [
				'package.json',
				'package-lock.json',
				'README.md',
				'tsconfig.json',
				'vite.config.ts'
			]) {
				fs.copyFileSync(path.join(kit, entry), path.join(vendor, entry));
			}
			// This is a library snapshot, not a deployable SvelteKit app.
			fs.writeFileSync(path.join(vendor, 'svelte.config.js'), 'export default {};\n');
			// A vendor snapshot ships the build; it has no kit development dependencies.
			const manifestPath = path.join(vendor, 'package.json');
			const manifest = readJson(manifestPath);
			manifest.scripts['prepare:source'] = manifest.scripts.prepare;
			delete manifest.scripts.prepare;
			fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
		}
		const installed = path.join(project.root, 'node_modules', packageName);
		const backup = path.join(project.root, '.admin-kit-update-backup');
		if (fs.existsSync(backup))
			throw new Error(`Backup already exists; inspect it before retrying: ${backup}`);
		const hadInstalled = fs.existsSync(installed);
		if (hadInstalled) fs.renameSync(installed, backup);
		try {
			// Removing the installed copy makes same-version edits refresh as well.
			run(
				'npm',
				['install', project.spec, '--install-links', '--prefer-offline', '--no-audit', '--no-fund'],
				project.root
			);
			if (readJson(path.join(installed, 'package.json')).version !== version) {
				throw new Error('Installed version does not match the kit');
			}
			for (const relative of fs.readdirSync(path.join(kit, 'dist'), { recursive: true })) {
				const source = path.join(kit, 'dist', relative);
				if (!fs.statSync(source).isFile() || /\.(test|spec)\./.test(relative)) continue;
				if (
					!fs.readFileSync(source).equals(fs.readFileSync(path.join(installed, 'dist', relative)))
				) {
					throw new Error(`Installed file does not match the kit: ${relative}`);
				}
			}
		} catch (error) {
			fs.rmSync(installed, { recursive: true, force: true });
			if (hadInstalled) fs.renameSync(backup, installed);
			throw error;
		}
		fs.rmSync(backup, { recursive: true, force: true });
		if (args.includes('--check')) {
			try {
				run('npm', ['run', 'check'], project.root);
			} catch {
				results.push({ project: project.name, result: 'Updated; check failed' });
				continue;
			}
		}
		results.push({
			project: project.name,
			result: args.includes('--check') ? 'Updated; check passed' : 'Updated'
		});
	} catch (error) {
		console.error(error.message);
		results.push({ project: project.name, result: `Update failed: ${error.message}` });
	}
}
console.table(results);
if (results.some(({ result }) => result.includes('failed'))) process.exitCode = 1;
