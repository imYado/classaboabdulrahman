// Offline support: app shell + library list (network first), saved lessons' audio, fonts.
const SHELL = 'shell-v2';
const SHELL_FILES = ['/', '/subs.js', '/zip.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const local = u.origin === location.origin;
  if (local && u.pathname === '/api/audio') return e.respondWith(audio(r, u.searchParams.get('id')));
  if (local && (r.mode === 'navigate' || SHELL_FILES.includes(u.pathname) || u.pathname === '/api/items')) return e.respondWith(networkFirst(r));
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return e.respondWith(cacheFirst(r));
});

async function networkFirst(r) {
  const key = r.mode === 'navigate' ? '/' : r, c = await caches.open(SHELL);
  try {
    const res = await fetch(r);
    if (res.ok) c.put(key, res.clone());
    return res;
  } catch (err) {
    return (await c.match(key)) || Response.error();
  }
}

async function cacheFirst(r) {
  const c = await caches.open('fonts');
  return (await c.match(r)) || fetch(r).then(res => (c.put(r, res.clone()), res));
}

// Lessons saved for offline are whole files under /offline/<id>; answer the player's Range requests from them.
async function audio(r, id) {
  const hit = await (await caches.open('offline')).match('/offline/' + id);
  if (!hit) return fetch(r);
  const blob = await hit.blob(), size = blob.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(r.headers.get('range') || '');
  let s = 0, e = size - 1;
  if (m && m[1]) { s = +m[1]; if (m[2]) e = Math.min(+m[2], size - 1); }
  else if (m && m[2]) s = Math.max(0, size - +m[2]);
  if (s >= size) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
  return new Response(blob.slice(s, e + 1), {
    status: 206,
    headers: {
      'content-type': hit.headers.get('content-type') || 'audio/ogg',
      'content-range': `bytes ${s}-${e}/${size}`,
      'content-length': String(e - s + 1),
      'accept-ranges': 'bytes',
      'x-offline': '1',
    },
  });
}
