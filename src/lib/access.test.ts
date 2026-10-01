import { describe, expect, it } from 'vitest';
import { createAccess, effectivePermissions, gateRefusal } from './access';
import { activeGroup, searchEntries, visibleNavigation, type NavItem } from './navigation';
import { entityHref, entityPath } from './entityLinks';

const access = createAccess({
	root: '/dashboard',
	rules: [
		{ prefix: '/dashboard', permission: null, exact: true },
		{ prefix: '/dashboard/files/', permission: null },
		{ prefix: '/dashboard/admin-panel/users', permission: 'users.manage' },
		{ prefix: '/dashboard/admin-panel', permission: 'settings.manage' },
		{ prefix: '/dashboard/employees', permission: 'employees.view' }
	]
});

describe('createAccess', () => {
	it('is closed by default under the root', () => {
		// No rule claims it, so nobody may open it — forgetting a rule is a 403, not a hole.
		expect(access.canVisit('/dashboard/unclaimed', ['users.manage'])).toBe(false);
	});

	it('leaves paths outside the root alone', () => {
		expect(access.canVisit('/login', [])).toBe(true);
	});

	it('matches the root exactly, never as a prefix', () => {
		expect(access.canVisit('/dashboard', [])).toBe(true);
		expect(access.canVisit('/dashboard/', [])).toBe(true);
		expect(access.canVisit('/dashboard/employees', [])).toBe(false);
	});

	it('lets the first, most specific rule win', () => {
		expect(access.permissionForPath('/dashboard/admin-panel/users/7')).toBe('users.manage');
		expect(access.permissionForPath('/dashboard/admin-panel/branches')).toBe('settings.manage');
		expect(access.canVisit('/dashboard/admin-panel/users', ['settings.manage'])).toBe(false);
	});

	/*
	 * SvelteKit routes on the decoded path and hands the hook the raw one. Compared raw, an
	 * escaped letter walked past the specific rule to the general one below it — settings.manage
	 * opened the users page — and an escaped letter in the root left the gate altogether.
	 */
	it('reads a percent-escaped path as the router does', () => {
		expect(access.permissionForPath('/dashboard/admin-panel/%75sers')).toBe('users.manage');
		expect(access.canVisit('/dashboard/admin-panel/%75sers', ['settings.manage'])).toBe(false);
		expect(gateRefusal(access, '/dashboard/admin-panel/%75sers/7', ['settings.manage'])).toMatch(
			/not allowed/
		);

		expect(access.guards('/%64ashboard/employees')).toBe(true);
		expect(gateRefusal(access, '/%64ashboard/employees', [])).toMatch(/not allowed/);
	});

	it('closes a path that cannot be decoded', () => {
		expect(access.canVisit('/dashboard/%E0%A4%A', ['employees.view'])).toBe(false);
		expect(gateRefusal(access, '/dashboard/%E0%A4%A', [])).toMatch(/No permission is defined/);
	});

	it('matches a prefix on whole segments', () => {
		expect(access.permissionForPath('/dashboard/employees/7')).toBe('employees.view');
		// A different page that merely starts with the same letters has no rule, so it is closed.
		expect(access.ruleForPath('/dashboard/employees-archive')).toBeUndefined();
		expect(access.canVisit('/dashboard/employees-archive', ['employees.view'])).toBe(false);
		// And a page that starts with the root's letters is not under the root.
		expect(access.guards('/dashboardx')).toBe(false);
	});

	it('reads an href with a query or a fragment as its page', () => {
		expect(access.canVisit('/dashboard/employees?tab=leave', ['employees.view'])).toBe(true);
		expect(access.canVisit('/dashboard/employees#top', ['employees.view'])).toBe(true);
	});

	it('lets a super admin open every ruled page, but not an unruled one', () => {
		const all = effectivePermissions(access, [], true);
		expect(access.canVisit('/dashboard/admin-panel/users', all)).toBe(true);
		expect(access.canVisit('/dashboard/unclaimed', all)).toBe(false);
		expect(effectivePermissions(access, ['x'], false)).toEqual(['x']);
	});

	it('says why a request is refused, and nothing when it is not', () => {
		expect(gateRefusal(access, '/dashboard/unclaimed', [])).toMatch(/No permission is defined/);
		expect(gateRefusal(access, '/dashboard/employees', [])).toMatch(/not allowed/);
		expect(gateRefusal(access, '/dashboard/employees', ['employees.view'])).toBeNull();
		expect(gateRefusal(access, '/login', [])).toBeNull();
	});
});

// Icons are irrelevant to the menu logic; a stand-in keeps the fixtures readable.
const icon = (() => null) as unknown as NavItem['icon'];

const NAVIGATION: NavItem[] = [
	{ title: 'Dashboard', url: '/dashboard', icon },
	{
		title: 'Employees',
		url: '/dashboard/employees',
		icon,
		items: [{ title: 'All', url: '/dashboard/employees', icon }]
	},
	{
		title: 'Admin',
		url: '/dashboard/admin-panel',
		icon,
		items: [
			{ title: 'Users', url: '/dashboard/admin-panel/users', icon },
			{ title: 'Branches', url: '/dashboard/admin-panel/branches', icon }
		]
	}
];

describe('navigation', () => {
	const canOpen = (url: string) => access.canVisit(url, ['employees.view']);

	it('drops what the viewer cannot open, and groups left empty', () => {
		expect(visibleNavigation(NAVIGATION, canOpen).map((i) => i.title)).toEqual([
			'Dashboard',
			'Employees'
		]);
	});

	it('lights the group holding the longest matching link', () => {
		expect(activeGroup(NAVIGATION, '/dashboard/admin-panel/users/3')).toBe('Admin');
		expect(activeGroup(NAVIGATION, '/dashboard')).toBe('Dashboard');
		// The index is matched exactly, or every page would fall under it.
		expect(activeGroup(NAVIGATION, '/dashboard/employees/9')).toBe('Employees');
	});

	it('flattens the menu for search, labelled by group, filtered and de-duplicated', () => {
		const entries = searchEntries(NAVIGATION, canOpen, [
			{ label: 'Inactive', url: '/dashboard/employees/inactive' },
			{ label: 'Duplicate', url: '/dashboard' }
		]);
		expect(entries).toEqual([
			{ label: 'Dashboard', url: '/dashboard' },
			{ label: 'Employees › All', url: '/dashboard/employees' },
			{ label: 'Inactive', url: '/dashboard/employees/inactive' }
		]);
	});
});

describe('entity links', () => {
	const routes = { employee: '/dashboard/employees', user: '/dashboard/admin-panel/users' };

	it('builds a record path, or null with nothing to point at', () => {
		expect(entityPath(routes, 'employee', 4)).toBe('/dashboard/employees/4');
		expect(entityPath(routes, 'employee', null)).toBeNull();
		expect(entityPath(routes, 'unknown', 4)).toBeNull();
	});

	it('links only where the viewer may follow', () => {
		const canOpen = (path: string) => access.canVisit(path, ['employees.view']);
		expect(entityHref(routes, 'employee', 4, canOpen)).toBe('/dashboard/employees/4');
		expect(entityHref(routes, 'user', 'u1', canOpen)).toBeNull();
	});
});
