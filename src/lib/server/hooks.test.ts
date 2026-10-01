import { describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { createAccess } from '$lib/access';
import { kitHandle } from './hooks';

const access = createAccess({
	root: '/dashboard',
	rules: [
		{ prefix: '/dashboard', permission: null, exact: true },
		{ prefix: '/dashboard/products', permission: 'catalog.manage' }
	]
});

/** One request through the hook: what it answered, or what it refused with. */
async function through(
	url: string,
	{
		method = 'GET',
		user = null as { id: string } | null,
		permList = [] as string[],
		requireUser = undefined as boolean | undefined
	} = {}
): Promise<{ passed: boolean; status?: number; location?: string }> {
	const event = {
		url: new URL(`http://localhost${url}`),
		request: new Request(`http://localhost${url}`, { method }),
		locals: { user } as unknown as App.Locals
	} as RequestEvent;

	const handle = kitHandle({
		access,
		permissions: () => ({ permList, isSuperAdmin: false }),
		requireUser
	});

	try {
		await handle({ event, resolve: async () => new Response('ok') });
		return { passed: true };
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location?: string };
		return { passed: false, status, location };
	}
}

describe('kitHandle', () => {
	/*
	 * The hole this closes: a layout `load` redirects a signed-out visitor away from the page, but
	 * it runs after the form action, so a POST to `?/add` had already written its row.
	 */
	it('refuses a signed-out form post before any action can run', async () => {
		const result = await through('/dashboard/products?/add', { method: 'POST' });

		expect(result.passed).toBe(false);
		expect(result.status).toBe(401);
	});

	it('sends a signed-out page view to the login page, saying where it was going', async () => {
		const result = await through('/dashboard/products?page=2');

		expect(result.status).toBe(302);
		expect(result.location).toBe('/login?redirectTo=%2Fdashboard%2Fproducts%3Fpage%3D2');
	});

	it('leaves a signed-out request outside the root alone', async () => {
		expect((await through('/shop', { method: 'POST' })).passed).toBe(true);
	});

	it('gates a signed-in viewer by the rules', async () => {
		const user = { id: 'u1' };

		expect((await through('/dashboard/products', { user })).status).toBe(403);
		expect(
			(await through('/dashboard/products', { user, permList: ['catalog.manage'] })).passed
		).toBe(true);
	});

	it('does not ask for a user in an app that has no sign-in', async () => {
		const result = await through('/dashboard/products', { method: 'POST', requireUser: false });

		expect(result.passed).toBe(true);
	});
});
