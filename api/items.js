import { del } from '@vercel/blob';
import { sql, db, isAdmin, json, deny } from './_lib.js';

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const bad = msg => json({ error: msg }, { status: 400 });

export async function GET() {
  await db();
  return json(await sql`select * from items order by created`);
}

export async function POST(req) {
  if (!isAdmin(req)) return deny();
  const b = await req.json();
  const name = String(b.name || '').trim().slice(0, 200);
  if (!['folder', 'lesson'].includes(b.type) || !name) return bad('type and name required');
  if (b.type === 'lesson' && !/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(b.url || '')) return bad('lesson needs a blob url');
  await db();
  const [row] = await sql`insert into items(id, type, name, parent, url, created)
    values (${newId()}, ${b.type}, ${name}, ${b.parent || 'root'}, ${b.url || null}, ${Date.now()}) returning *`;
  return json(row);
}

export async function PATCH(req) {
  if (!isAdmin(req)) return deny();
  const b = await req.json();
  const [row] = await sql`update items set
    name = coalesce(${b.name?.trim() || null}, name),
    transcript = coalesce(${b.transcript ?? null}, transcript),
    dur = coalesce(${b.dur ?? null}, dur)
    where id = ${b.id} returning *`;
  return row ? json(row) : json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return deny();
  const { id } = await req.json();
  const rows = await sql`with recursive t as (
      select id, url from items where id = ${id}
      union all select i.id, i.url from items i join t on i.parent = t.id)
    delete from items where id in (select id from t) returning url`;
  const urls = rows.map(r => r.url).filter(Boolean);
  if (urls.length) await del(urls);
  return json({ deleted: rows.length });
}
