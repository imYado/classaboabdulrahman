import { sql, db, isAdmin, json, deny, CHUNK, parseRange, piece } from './_lib.js';

// POST /api/audio?id=&n=  (admin) raw bytes of piece n
export async function POST(req) {
  if (!isAdmin(req)) return deny();
  const u = new URL(req.url), id = u.searchParams.get('id'), n = Number(u.searchParams.get('n'));
  const buf = Buffer.from(await req.arrayBuffer());
  if (!id || !Number.isInteger(n) || n < 0 || !buf.length || buf.length > CHUNK) return json({ error: 'bad chunk' }, { status: 400 });
  await db();
  await sql`insert into chunks(item_id, n, data) values (${id}, ${n}, decode(${buf.toString('base64')}, 'base64'))
    on conflict (item_id, n) do update set data = excluded.data`;
  return json({ ok: true });
}

// GET /api/audio?id=  streams via HTTP Range, one piece per response (the audio element asks for the rest)
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  await db();
  const [it] = await sql`select size, mime from items where id = ${id} and type = 'lesson'`;
  if (!it?.size) return new Response('not found', { status: 404 });
  const size = Number(it.size), [start, end] = parseRange(req.headers.get('range'), size);
  if (start == null) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
  const { n, off, len } = piece(start, end);
  const [row] = await sql`select encode(substring(data from ${off + 1} for ${len}), 'base64') as b
    from chunks where item_id = ${id} and n = ${n}`;
  if (!row) return new Response('not found', { status: 404 });
  const body = Buffer.from(row.b, 'base64');
  return new Response(body, {
    status: 206,
    headers: {
      'content-type': it.mime || 'audio/ogg',
      'x-content-type-options': 'nosniff',
      'accept-ranges': 'bytes',
      'content-range': `bytes ${start}-${start + body.length - 1}/${size}`,
      'content-length': String(body.length),
      'cache-control': 'private, max-age=86400',
    },
  });
}
