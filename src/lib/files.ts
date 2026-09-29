/**
 * Where stored files are served from, as seen by the browser.
 *
 * `fileUrl` is **the one place the shape of that URL is written down**. It lives here rather than
 * in `server/files.ts` because most callers are components — an `img src` or an `href` evaluated
 * in the browser — and `server/files.ts` owns the bytes and cannot be imported from the client.
 *
 * The route itself is the app's: `src/routes/dashboard/files/[name]/+server.ts` re-exporting
 * `GET` from `@nahu/admin-kit/server/serveFile`. A move to Cloudinary or Supabase Storage changes
 * `server/files.ts` and that route, and touches this only if the URLs become public.
 */
export const FILE_ROUTE = '/dashboard/files';

/**
 * The URL that serves a stored file, or `''` for a missing name — callers guard with `{#if}`, and
 * an empty `src` is better than a request for `/dashboard/files/undefined`.
 */
export function fileUrl(name: string | null | undefined): string {
	return name ? `${FILE_ROUTE}/${encodeURIComponent(name)}` : '';
}

/** Where files an app has declared public are served from (`server/servePublicFile`). */
export const PUBLIC_FILE_ROUTE = '/media';

/**
 * The URL of a *public* stored file — a product photo — for guests who are not signed in. Only
 * names the app's `isPublic` accepts are actually served; anything else is a 404.
 */
export function publicFileUrl(name: string | null | undefined): string {
	return name ? `${PUBLIC_FILE_ROUTE}/${encodeURIComponent(name)}` : '';
}
