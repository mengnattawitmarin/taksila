// ตักศิลา service worker: lets the app open offline and install to the home screen.
// Strategy: network first for the app's own files (so updates arrive right away),
// falling back to the cached copy when offline. Fonts are cache first.
const CACHE = 'taksila-v47';
const NOTIFY = 'taksila-notify'; // รายการวันพระล่วงหน้าที่แอปเขียนไว้ ใช้แจ้งเตือนเบื้องหลัง
const VENDOR = 'taksila-vendor-1'; // MediaPipe models (~30 MB) are cached separately so app updates do not re-download them
// Paths are relative to wherever the app is hosted (site root on Netlify, /taksila/ on GitHub Pages).
const BASE = self.registration.scope;
const CORE = ['', 'index.html', 'css/styles.css', 'js/app.js', 'js/astro.js', 'js/data.js', 'js/starmap.js', 'js/thai.js', 'js/auspice.js', 'js/profile.js', 'js/tarot.js', 'js/luck.js', 'js/siamsi.js', 'js/numerology.js', 'js/prayer.js', 'js/remedy.js', 'js/insight.js', 'js/lunar.js', 'js/forecast.js', 'js/places.js', 'js/prayer-tr.js', 'js/fengshui.js', 'js/physio.js', 'js/qr.js', 'manifest.webmanifest', 'icons/icon-192.png'].map((p) => BASE + p);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== VENDOR && k !== NOTIFY).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
  if (url.pathname.includes('/vendor/')) {
    e.respondWith(caches.open(VENDOR).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  const fresh = url.pathname.includes('/cards/') ? req : new Request(req, { cache: 'no-cache' });
  e.respondWith(fetch(fresh).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match(BASE + 'index.html'))));
});

// ---- แจ้งเตือนวันพระ (Android ที่ติดตั้งแอปไว้: Chrome ปลุก service worker เป็นระยะ) ----
const pad2 = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
async function checkWanPhra() {
  const c = await caches.open(NOTIFY), res = await c.match(BASE + '__notify.json');
  if (!res) return;
  const data = await res.json(), now = new Date();
  // แจ้งตอนเย็นสำหรับพรุ่งนี้ (หลัง 17:00) และตอนเช้าสำหรับวันนี้ (หลัง 05:00)
  const targets = [];
  if (now.getHours() >= 17) { const t = new Date(now); t.setDate(t.getDate() + 1); targets.push(['พรุ่งนี้', isoDay(t)]); }
  if (now.getHours() >= 5) targets.push(['วันนี้', isoDay(now)]);
  const sent = data.sent || {};
  for (const [when, day] of targets) {
    const ev = (data.days || []).find((x) => x.d === day);
    if (!ev || sent[when + day]) continue;
    await self.registration.showNotification(`${when}${ev.t}`, { body: ev.b, icon: BASE + 'icons/icon-192.png', badge: BASE + 'icons/icon-192.png', tag: 'wanphra-' + day, data: { url: BASE + '#/calendar' } });
    sent[when + day] = 1;
  }
  data.sent = sent;
  await c.put(BASE + '__notify.json', new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'wanphra') e.waitUntil(checkWanPhra()); });
self.addEventListener('message', (e) => { if (e.data === 'check-wanphra') e.waitUntil ? e.waitUntil(checkWanPhra()) : checkWanPhra(); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || BASE;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const w of list) if ('focus' in w) { w.navigate && w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
