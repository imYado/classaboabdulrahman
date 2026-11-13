import { sql, db, isAdmin, json, deny, AUDIO_MIME } from './_lib.js';

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const bad = msg => json({ error: msg }, { status: 400 });

export async function GET() {
  await db();
  return json(await sql`select * from items order by coalesce(pos, created), created`);
}

// Lessons are created first, then their audio is sent in pieces to /api/audio.
export async function POST(req) {
  if (!isAdmin(req)) return deny();
  const b = await req.json();
  const name = String(b.name || '').trim().slice(0, 200);
  if (!['folder', 'lesson'].includes(b.type) || !name) return bad('type and name required');
  const lesson = b.type === 'lesson';
  if (lesson && !(Number.isInteger(b.size) && b.size > 0)) return bad('lesson needs a file size');
  const mime = lesson ? (AUDIO_MIME.test(b.mime || '') ? b.mime : 'audio/ogg') : null;
  await db();
  const now = Date.now(); // new items go to the end
  const [row] = await sql`insert into items(id, type, name, parent, mime, size, created, pos)
    values (${newId()}, ${b.type}, ${name}, ${b.parent || 'root'}, ${mime}, ${lesson ? b.size : null}, ${now}, ${now}) returning *`;
  return json(row);
}

export async function PATCH(req) {
  if (!isAdmin(req)) return deny();
  const b = await req.json();
  const [row] = await sql`update items set
    name = coalesce(${b.name?.trim() || null}, name),
    transcript = coalesce(${b.transcript ?? null}, transcript),
    dur = coalesce(${b.dur ?? null}, dur),
    pos = coalesce(${Number.isFinite(b.pos) ? b.pos : null}, pos)
    where id = ${b.id} returning *`;
  return row ? json(row) : json({ error: 'not found' }, { status: 404 });
}

// Deletes the item and everything under it; audio pieces go with it (on delete cascade).
export async function DELETE(req) {
  if (!isAdmin(req)) return deny();
  const { id } = await req.json();
  const rows = await sql`with recursive t as (
      select id from items where id = ${id}
      union all select i.id from items i join t on i.parent = t.id)
    delete from items where id in (select id from t) returning id`;
  return json({ deleted: rows.length });
}
