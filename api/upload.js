import { handleUpload } from '@vercel/blob/client';
import { isAdmin, json, deny } from './_lib.js';

// Browser uploads straight to Vercel Blob (no 4.5 MB function limit); this only hands out a token to admins.
export async function POST(req) {
  if (!isAdmin(req)) return deny();
  try {
    return json(await handleUpload({
      body: await req.json(),
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['audio/*', 'video/*', 'application/ogg', 'application/octet-stream'],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    }));
  } catch (e) {
    return json({ error: e.message }, { status: 400 });
  }
}
