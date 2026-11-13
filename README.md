# Majlis al-Ilm

Static `index.html` + Vercel functions in `api/`. Everything is stored in Neon, audio included
(as 4 MB pieces in the `chunks` table, streamed back with HTTP Range so seeking works).

| Env var (Vercel → Settings → Environment Variables) | What |
|---|---|
| `DATABASE_URL` | Neon connection string (added automatically if you connect Neon under Vercel → Storage) |
| `ADMIN_PASSWORD` | Admin password, you choose it |

Tables are created on first request. Favourites and highlights are stored per device.

Speech-to-text runs in the admin's browser (Whisper via transformers.js) right after upload; no API key.
With a GPU (Chrome/Edge on a laptop) it uses whisper-large-v3-turbo, otherwise whisper-small.
The model downloads once from Hugging Face and is cached by the browser.

Check: `npm test`
