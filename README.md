# Majlis al-Ilm

Static `index.html` + Vercel functions in `api/`. Everything is stored in Neon, audio included
(as 4 MB pieces in the `chunks` table, streamed back with HTTP Range so seeking works).

| Env var (Vercel → Settings → Environment Variables) | What |
|---|---|
| `DATABASE_URL` | Neon connection string (added automatically if you connect Neon under Vercel → Storage) |
| `ADMIN_PASSWORD` | Admin password, you choose it |

Tables are created on first request. Favourites and highlights are stored per device.

Transcripts: upload an `.srt` / `.vtt` (from any transcription site) together with the audio file of the
same name, or import / paste it later from the lesson page. `subs.js` converts it to timed lines.

Listeners can download the audio and transcript, or save a lesson for offline listening.
`sw.js` (service worker) keeps the app and library available offline and plays saved lessons from Cache Storage.
The site installs as an app (PWA) via `manifest.webmanifest`.

Check: `npm test`
