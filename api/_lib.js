import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

let _sql, ready;
export const sql = (...a) => (_sql ??= neon(process.env.DATABASE_URL))(...a);
export const db = () => ready ??= sql`create table if not exists items(
    id text primary key, type text not null, name text not null, parent text not null,
    mime text, size integer, transcript text not null default '', dur real, created bigint not null)`
  .then(() => sql`create table if not exists chunks(
    item_id text not null references items(id) on delete cascade,
    n integer not null, data bytea not null, primary key (item_id, n))`)
  .catch(e => { ready = null; throw e; });

// Audio lives in Neon as 4 MB pieces: Vercel caps request and response bodies at 4.5 MB.
// Keep in sync with CHUNK in index.html.
export const CHUNK = 4_000_000;
export const AUDIO_MIME = /^(audio|video)\/[\w.+-]+$|^application\/ogg$/;

// "bytes=a-b" -> [start, end] (inclusive), [null] if unsatisfiable. No header = whole file.
export function parseRange(h, size) {
  if (!h) return [0, size - 1];
  const m = /^bytes=(\d*)-(\d*)$/.exec(h.trim());
  if (!m || (!m[1] && !m[2])) return [null];
  const s = m[1] ? +m[1] : Math.max(0, size - +m[2]);
  const e = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  return s > e || s >= size ? [null] : [s, e];
}
// Which stored piece serves this range; never more than one piece per response.
export const piece = (start, end) => {
  const n = Math.floor(start / CHUNK), off = start - n * CHUNK;
  return { n, off, len: Math.min(end - start + 1, CHUNK - off) };
};

// Session = expiry + HMAC keyed by ADMIN_PASSWORD; changing the password logs everyone out.
const WEEK = 7 * 864e5;
const sign = (exp, key) => createHmac('sha256', key).update('admin:' + exp).digest('hex');
export const makeToken = (key, now = Date.now()) => { const exp = now + WEEK; return exp + '.' + sign(exp, key); };
export function checkToken(tok, key, now = Date.now()) {
  const [exp, mac] = String(tok || '').split('.');
  if (!key || !mac || !(+exp > now)) return false;
  const a = Buffer.from(mac), b = Buffer.from(sign(exp, key));
  return a.length === b.length && timingSafeEqual(a, b);
}
export function samePassword(input, key) {
  const h = s => createHmac('sha256', 'pw').update(String(s)).digest();
  return !!key && timingSafeEqual(h(input), h(key));
}
const cookie = req => /(?:^|;\s*)admin=([^;]+)/.exec(req.headers.get('cookie') || '')?.[1];
export const isAdmin = req => checkToken(cookie(req), process.env.ADMIN_PASSWORD);

export const json = (data, init) => Response.json(data, init);
export const deny = () => json({ error: 'unauthorized' }, { status: 401 });
