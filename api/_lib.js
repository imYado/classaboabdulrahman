import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

let _sql, ready;
export const sql = (...a) => (_sql ??= neon(process.env.DATABASE_URL))(...a);
export const db = () => ready ??= sql`create table if not exists items(
  id text primary key, type text not null, name text not null, parent text not null,
  url text, transcript text not null default '', dur real, created bigint not null)`;

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

// Whisper segments -> "[m:ss.s] text" lines the player already understands.
export const toLines = segs => segs
  .filter(s => s.text?.trim())
  .map(s => `[${Math.floor(s.start / 60)}:${(s.start % 60).toFixed(1).padStart(4, '0')}] ${s.text.trim()}`)
  .join('\n');
