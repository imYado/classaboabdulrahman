import { sql, db, isAdmin, json, deny, toLines } from './_lib.js';

export async function POST(req) {
  if (!isAdmin(req)) return deny();
  const key = process.env.GROQ_API_KEY;
  if (!key) return json({ error: 'GROQ_API_KEY is not set in Vercel' }, { status: 500 });
  const { id } = await req.json();
  await db();
  const [it] = await sql`select * from items where id = ${id} and type = 'lesson'`;
  if (!it?.url) return json({ error: 'lesson not found' }, { status: 404 });

  const audio = await fetch(it.url);
  if (!audio.ok) return json({ error: 'could not read audio' }, { status: 502 });
  const fd = new FormData();
  fd.append('file', await audio.blob(), it.url.split('/').pop()); // ponytail: Groq free tier caps files at 25 MB; switch to its `url` field for bigger ones
  fd.append('model', 'whisper-large-v3');
  fd.append('response_format', 'verbose_json');
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST', headers: { authorization: `Bearer ${key}` }, body: fd,
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: out.error?.message || 'transcription failed' }, { status: 502 });

  const transcript = toLines(out.segments || []) || out.text || '';
  const [row] = await sql`update items set transcript = ${transcript} where id = ${id} returning *`;
  return json(row);
}
