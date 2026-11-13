import { sql, db, isAdmin, json, deny, toLines } from './_lib.js';

const EXT = { mpeg: 'mp3', mp4: 'm4a', 'x-m4a': 'm4a', 'x-wav': 'wav', opus: 'ogg' };

export async function POST(req) {
  if (!isAdmin(req)) return deny();
  const key = process.env.GROQ_API_KEY;
  if (!key) return json({ error: 'GROQ_API_KEY is not set in Vercel' }, { status: 500 });
  const { id } = await req.json();
  await db();
  const [it] = await sql`select * from items where id = ${id} and type = 'lesson'`;
  if (!it) return json({ error: 'lesson not found' }, { status: 404 });

  // one piece per query keeps each Neon response small
  const parts = [];
  for (let n = 0; ; n++) {
    const [r] = await sql`select encode(data, 'base64') as b from chunks where item_id = ${id} and n = ${n}`;
    if (!r) break;
    parts.push(Buffer.from(r.b, 'base64'));
  }
  if (!parts.length) return json({ error: 'audio not uploaded' }, { status: 409 });

  const sub = (it.mime || 'audio/ogg').split('/')[1];
  const fd = new FormData();
  fd.append('file', new Blob(parts, { type: it.mime }), 'lesson.' + (EXT[sub] || sub)); // ponytail: Groq free tier caps files at 25 MB
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
