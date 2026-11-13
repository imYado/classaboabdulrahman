# Majlis al-Ilm

Static `index.html` + Vercel functions in `api/`.

| Piece | Service | Env var |
|---|---|---|
| Folders, lessons, transcripts | Neon Postgres (Vercel → Storage → Neon) | `DATABASE_URL` (added automatically) |
| Audio files | Vercel Blob (Vercel → Storage → Blob) | `BLOB_READ_WRITE_TOKEN` (added automatically) |
| Admin login | — | `ADMIN_PASSWORD` (you choose) |
| Speech-to-text | Groq Whisper (console.groq.com → API Keys) | `GROQ_API_KEY` |

The `items` table is created on first request. Favourites and highlights are stored per device.

Check: `npm test`
