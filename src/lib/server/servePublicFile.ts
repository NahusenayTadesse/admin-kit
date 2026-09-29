import { serverLabels } from './labels';
import { error } from '@sveltejs/kit';
import { streamStoredFile } from './serveFile';

/**
 * Serves stored files to anyone — product photos, a portfolio — but only the ones the app says are
 * public. Mount it at the route `publicFileUrl` points to, `src/routes/media/[name]/+server.ts`:
 *
 *     import { servePublicFile } from '@nahu/admin-kit/server/servePublicFile';
 *     export const GET = servePublicFile({ isPublic: (name) => publicImageNames().has(name) });
 *
 * **Why the app decides.** Public and private files share one flat store, so a filename alone
 * says nothing about whether it is a catalogue photo or somebody's ID card. `isPublic` is the
 * app's answer — typically a cached set of the names in its image tables — and anything it does
 * not vouch for is a 404, the same response as a name that does not exist, so the route cannot be
 * used to probe for private files.
 *
 * Cached `public` for a year and `immutable`: a stored file never changes, since a replacement is
 * written under a new name.
 */
export function servePublicFile({
	isPublic
}: {
	isPublic: (name: string) => boolean | Promise<boolean>;
}) {
	return async ({
		params,
		request
	}: {
		params: { name: string };
		request: Request;
	}): Promise<Response> => {
		if (!(await isPublic(params.name))) error(404, serverLabels().notFound);

		return streamStoredFile(params.name, request, 'public');
	};
}
