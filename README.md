# Majlis al-Ilm

Static `index.html` + Vercel functions in `api/`. Everything is stored in Neon, audio included
(as 4 MB pieces in the `chunks` table, streamed back with HTTP Range so seeking works).

| Env var (Vercel → Settings → Environment Variables) | What |
|---|---|
| `DATABASE_URL` | Neon connection string (added automatically if you connect Neon under Vercel → Storage) |
| `ADMIN_PASSWORD` | Admin password, you choose it |
| `GROQ_API_KEY` | Speech-to-text (Whisper), from console.groq.com → API Keys |

Tables are created on first request. Favourites and highlights are stored per device.

Check: `npm test`
