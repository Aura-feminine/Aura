/* Service worker de l'admin Aura Féminine : met en cache uniquement l'interface, jamais les données Supabase. */
const VERSION = 'af-admin-v1';
const SHELL = ['./admin.html', './admin.webmanifest', './icons/admin-192.png', './icons/admin-512.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/dompurify@3.4.16/dist/purify.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('af-admin-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = CDN.includes(url.href);
  if (!sameOrigin && !isCdn) return; // Supabase et autres : réseau direct, jamais de cache
  if (sameOrigin && !SHELL.some(p => url.pathname.endsWith(p.slice(1)))) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok && (res.type === 'basic' || res.type === 'cors')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
