import { serverLabels } from './labels';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { error, redirect } from '@sveltejs/kit';

import { mimeFor, resolveStoredFile } from '$lib/server/files';
import { loginPath } from '$lib/server/db';

/**
 * Serves one stored file. Mount it at the route `fileUrl` points to — by default
 * `src/routes/dashboard/files/[name]/+server.ts`:
 *
 *     export { GET } from '@nahu/admin-kit/server/serveFile';
 *
 * **What guards this, and what does not.** The only check is that the caller is signed in — the
 * store is flat and a filename carries no record of what it is attached to, so there is nothing
 * here to check a permission *against*. What stands in for that is the name: 122 bits of
 * randomness from `generateFileName`.
 *
 * That is adequate against guessing and inadequate against a leaked URL, and it cannot become a
 * real control until a file knows which record owns it. Until then, do not treat these URLs as
 * secrets that can be shared.
 *
 * An app whose signed-in users are not all staff (customer accounts) needs a narrower check than
 * "signed in": use `createFileHandler({ canRead })` instead.
 */
export async function GET({
	params,
	request,
	locals
}: {
	params: { name: string };
	request: Request;
	locals: { user?: unknown };
}): Promise<Response> {
	if (!locals.user) redirect(302, loginPath());

	return streamStoredFile(params.name, request, 'private');
}

/**
 * The private file route with an app-supplied guard, for apps where being signed in is not enough
 * — a shop whose customers can sign in must not read staff uploads (receipts, IDs).
 *
 *     // src/routes/dashboard/files/[name]/+server.ts
 *     export const GET = createFileHandler({ canRead: (locals) => locals.role === 'staff' });
 *
 * Signed out still goes to the login page; signed in without `canRead` is a 404, not a 403, so the
 * response does not confirm that the file exists.
 */
export function createFileHandler<L extends { user?: unknown }>({
	canRead
}: {
	canRead: (locals: L) => boolean | Promise<boolean>;
}) {
	return async ({
		params,
		request,
		locals
	}: {
		params: { name: string };
		request: Request;
		locals: L;
	}): Promise<Response> => {
		if (!locals.user) redirect(302, loginPath());
		if (!(await canRead(locals))) error(404, serverLabels().notFound);

		return streamStoredFile(params.name, request, 'private');
	};
}

/**
 * Streams one stored file with caching headers. Shared by the private route above and the public
 * one in `servePublicFile.ts`, which differ only in who may ask and in `Cache-Control`.
 *
 * `scope` is the load-bearing word of `Cache-Control`: `private` for identity documents and
 * attachments — without it a shared proxy is entitled to keep a copy and hand it to the next
 * person who asks — and `public` only for files an app has declared public.
 */
export function streamStoredFile(
	name: string,
	request: Request,
	scope: 'private' | 'public'
): Response {
	// Rejects a name that resolves outside the store rather than resolving it and hoping.
	const filePath = resolveStoredFile(name);
	if (!filePath) error(404, serverLabels().notFound);

	const stats = fs.statSync(filePath);
	const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;

	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304 });
	}

	const stream = Readable.toWeb(fs.createReadStream(filePath), {
		/*
		 * Bounded queuing, because the servers this runs on are small and shared.
		 *
		 * Without a strategy the web-stream wrapper will happily read ahead of a slow consumer,
		 * and a handful of concurrent downloads on a slow connection is exactly the shape that
		 * turns into resident memory. Node's own issue on this is nodejs/node#46347.
		 */
		strategy: new CountQueuingStrategy({ highWaterMark: 100 })
	});

	return new Response(stream as unknown as ReadableStream, {
		headers: {
			ETag: etag,
			'Content-Type': mimeFor(filePath),
			'Content-Length': String(stats.size),
			/*
			 * `immutable`, and a year, because a stored file genuinely cannot change: replacing an
			 * attachment writes a *new* name and points the row at that. There is nothing at this
			 * URL to revalidate.
			 */
			'Cache-Control': `${scope}, max-age=31536000, immutable`,
			'Last-Modified': stats.mtime.toUTCString(),
			// Nothing here is meant to be interpreted as markup by the browser.
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
