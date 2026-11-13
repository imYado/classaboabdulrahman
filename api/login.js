import { isAdmin, makeToken, samePassword, json } from './_lib.js';

const cookie = v => ({ 'set-cookie': `admin=${v}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${v ? 604800 : 0}` });

export const GET = req => json({ admin: isAdmin(req) });

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const key = process.env.ADMIN_PASSWORD;
  if (!samePassword(password, key)) {
    await new Promise(r => setTimeout(r, 800)); // ponytail: slows guessing; add real rate limiting if the site gets targeted
    return json({ admin: false }, { status: 401 });
  }
  return json({ admin: true }, { headers: cookie(makeToken(key)) });
}

export const DELETE = () => json({ admin: false }, { headers: cookie('') });
