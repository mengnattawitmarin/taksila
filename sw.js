// ตักศิลา service worker: lets the app open offline and install to the home screen.
// Strategy: network first for the app's own files (so updates arrive right away),
// falling back to the cached copy when offline. Fonts are cache first.
const CACHE = 'taksila-v15';
const CORE = ['/', '/index.html', '/css/styles.css', '/js/app.js', '/js/astro.js', '/js/data.js', '/js/starmap.js', '/js/thai.js', '/js/auspice.js', '/js/profile.js', '/js/tarot.js', '/js/luck.js', '/js/siamsi.js', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html'))));
});
