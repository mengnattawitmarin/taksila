// ห้องฟังธรรม: รายการธรรมเทศนาจาก DoT app (ผู้พัฒนาเดียวกัน) ซึ่งรวบรวมไฟล์เสียงธรรมทานที่เปิดให้ฟังฟรี
// จาก archive.org, tumma.info และพอดแคสต์สาธารณะ อัปเดตทุกวัน · เสียงเล่นจากแหล่งต้นทางโดยตรง ไม่ได้เก็บไฟล์ไว้เอง
export const DH_URL = 'https://mengnattawitmarin.github.io/dot-app/dharma.json';
export const DH_APP = 'https://mengnattawitmarin.github.io/dot-app/?tab=dharma';
export const DH_SRC = { archive: 'archive.org', podcast: 'พอดแคสต์', tumma: 'tumma.info', web: 'เว็บไซต์ต้นทาง', theme: 'รวมจากหลายชุด' };

export const dh = { status: 'idle', topics: [], teachers: [], albums: new Map(), updatedAt: '' };
const DH_KEY = 'taksila.dharma';

export const dhEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const dhSafeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : '');

function dhApply(data) {
  dh.albums.clear();
  const teachers = [];
  for (const t of data.teachers || []) {
    const urlOf = (a, tr) => (a.base ? a.base + String(tr.u).split('/').map(encodeURIComponent).join('/') : String(tr.u));
    const albums = [];
    for (const a of t.albums || []) {
      const items = a.refs
        ? a.refs.flatMap(([ai, ti]) => { const from = t.albums[ai], tr = from && from.tracks[ti]; return tr ? [{ tr, from }] : []; })
        : (a.tracks || []).map((tr) => ({ tr, from: a }));
      // หน้าเว็บ https เล่นเสียงจากลิงก์ http ไม่ได้ จึงเก็บเฉพาะ https
      const tracks = items.map(({ tr, from }) => ({ t: String(tr.t || ''), u: urlOf(from, tr), d: +tr.d || 0 })).filter((x) => x.u.startsWith('https://'));
      if (!tracks.length) continue;
      const al = { id: String(a.id), title: String(a.title || ''), group: a.group ? String(a.group) : '', topic: String(a.topic || 'talk'), src: String(a.src || ''), link: dhSafeUrl(a.link), year: a.year || 0, desc: a.desc ? String(a.desc) : '', dur: tracks.reduce((s, x) => s + x.d, 0), tracks, teacherId: String(t.id) };
      albums.push(al); dh.albums.set(al.id, al);
    }
    if (!albums.length) continue;
    teachers.push({ id: String(t.id), name: String(t.name || ''), full: String(t.full || ''), place: String(t.place || ''), blurb: String(t.blurb || ''), albums, tracks: albums.reduce((s, a) => s + a.tracks.length, 0), hours: Math.round(albums.reduce((s, a) => s + a.dur, 0) / 3600) });
  }
  if (!teachers.length) throw new Error('empty');
  dh.topics = (data.topics || []).map((x) => ({ id: String(x.id), label: String(x.label) }));
  dh.teachers = teachers; dh.updatedAt = data.updatedAt || ''; dh.status = 'ready';
}

export async function dhLoad(done) {
  if (dh.status === 'loading' || dh.status === 'ready') return;
  dh.status = 'loading';
  try {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 30000);
    const res = await fetch(DH_URL, ctl ? { signal: ctl.signal } : {});
    clearTimeout(timer);
    if (!res.ok) throw new Error('http ' + res.status);
    dhApply(await res.json());
  } catch (e) { dh.status = 'error'; }
  if (done) done();
}
export function dhReload(done) { dh.status = 'idle'; return dhLoad(done); }

export const dhTeacher = (id) => dh.teachers.find((t) => t.id === id);
export const dhTopicLabel = (id) => (dh.topics.find((t) => t.id === id) || {}).label || 'ธรรมเทศนา';
export function dhMark(name) {
  const bare = name.replace(/^(หลวงพ่อ|หลวงตา|หลวงปู่|พระอาจารย์|พระมหา|ท่านพ่อ|ท่าน|พระ)\s*/u, '').replace(/^ว\.\s*/, '');
  const m = bare.match(/^[เแโใไ]?[ก-ฮ][ัิ-ฺ็-๎]*/u);
  return m ? m[0] : 'ธ';
}
export function dhDur(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h} ชม.${m ? ` ${m} น.` : ''}` : `${Math.max(1, m)} นาที`;
}
export const dhClock = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

// ---------------- สถิติในเครื่อง: ตำแหน่งที่ฟังค้าง ตอนล่าสุด เวลาฟังต่อวัน ----------------
export function dhStore() { try { return JSON.parse(localStorage.getItem(DH_KEY)) || {}; } catch (e) { return {}; } }
function dhSave(s) { try { localStorage.setItem(DH_KEY, JSON.stringify(s)); } catch (e) {} }
const dhDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dhListenedToday() { const s = dhStore(); return (s.day && s.day[dhDay()]) || 0; }
export function dhPosOf(albumId, i) { const s = dhStore(); return (s.pos && s.pos[albumId + '|' + i]) || 0; }

// ---------------- เครื่องเล่น (ใช้ต่อเนื่องข้ามหน้า และเล่นต่อเมื่อปิดจอ) ----------------
export const dhP = { audio: null, album: null, i: 0, rate: 1, sleepAt: 0, sleepEnd: false, onChange: null, onTick: null, onMinute: null };
let dhLastSave = 0, dhAcc = 0, dhLastT = 0, dhErrRun = 0;

function dhAudio() {
  if (dhP.audio) return dhP.audio;
  const a = new Audio();
  a.preload = 'auto';
  a.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (!a.paused && dhLastT) { const dt = (now - dhLastT) / 1000; if (dt > 0 && dt < 3) dhAcc += dt; }
    dhLastT = a.paused ? 0 : now;
    if (now - dhLastSave > 5000) dhPersist();
    if (dhP.sleepAt && now >= dhP.sleepAt) { dhP.sleepAt = 0; dhP.sleepMin = 0; a.pause(); dhChanged(); }
    if (dhP.onTick) dhP.onTick();
  });
  a.addEventListener('play', () => { dhLastT = Date.now(); dhErrRun = 0; dhChanged(); });
  a.addEventListener('pause', () => { dhLastT = 0; dhPersist(); dhChanged(); });
  a.addEventListener('ended', () => {
    dhPersist(true);
    if (dhP.sleepEnd) { dhP.sleepEnd = false; dhP.sleepMin = 0; dhChanged(); return; }
    if (dhP.album && dhP.i + 1 < dhP.album.tracks.length) dhPlay(dhP.album.id, dhP.i + 1, true); else dhChanged();
  });
  a.addEventListener('error', () => {
    // ไฟล์ต้นทางบางไฟล์ถูกย้ายหรือปิด: ข้ามไปตอนถัดไป (ไม่เกิน 3 ไฟล์ติดกัน)
    if (!dhP.album || !a.src) return;
    dhErrRun++;
    if (dhP.onChange) dhP.onChange('error');
    if (dhErrRun < 3 && dhP.i + 1 < dhP.album.tracks.length) dhPlay(dhP.album.id, dhP.i + 1, true); else dhChanged();
  });
  dhP.audio = a;
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession, h = (k, f) => { try { ms.setActionHandler(k, f); } catch (e) {} };
    h('play', () => a.play()); h('pause', () => a.pause());
    h('seekbackward', () => dhSeek(-15)); h('seekforward', () => dhSeek(30));
    h('previoustrack', () => dhStep(-1)); h('nexttrack', () => dhStep(1));
    h('seekto', (d) => { if (d && d.seekTime != null) a.currentTime = d.seekTime; });
  }
  return a;
}
function dhChanged() {
  if ('mediaSession' in navigator && dhP.audio) navigator.mediaSession.playbackState = dhP.audio.paused ? 'paused' : 'playing';
  if (dhP.onChange) dhP.onChange();
}
function dhPersist(finished) {
  const a = dhP.audio; if (!a || !dhP.album) return;
  dhLastSave = Date.now();
  const s = dhStore(); s.pos = s.pos || {}; s.day = s.day || {};
  const k = dhP.album.id + '|' + dhP.i, t = a.currentTime || 0, d = a.duration || dhP.album.tracks[dhP.i].d || 0;
  if (finished || (d && d - t < 20)) s.pos[k] = -1; else if (t > 10) s.pos[k] = Math.floor(t);
  const keys = Object.keys(s.pos); if (keys.length > 300) for (const x of keys.slice(0, keys.length - 300)) delete s.pos[x];
  s.last = { a: dhP.album.id, i: dhP.i, t: finished ? 0 : Math.floor(t), title: dhP.album.tracks[dhP.i].t, album: dhP.album.title, teacher: dhP.album.teacherId };
  if (dhAcc >= 1) {
    const day = dhDay(), before = s.day[day] || 0;
    s.day[day] = Math.round(before + dhAcc); dhAcc = 0;
    const dk = Object.keys(s.day).sort(); while (dk.length > 30) delete s.day[dk.shift()];
    if (dhP.onMinute) dhP.onMinute(s.day[day], before);
  }
  dhSave(s);
}

export function dhPlay(albumId, i, auto) {
  const al = dh.albums.get(albumId); if (!al || !al.tracks[i]) return;
  const a = dhAudio();
  if (dhP.album && dhP.album.id === albumId && dhP.i === i && a.src) { if (a.paused) a.play().catch(() => {}); return; }
  if (dhP.album) dhPersist();
  dhP.album = al; dhP.i = i;
  const tr = al.tracks[i], resume = dhPosOf(albumId, i);
  a.src = tr.u; a.playbackRate = dhP.rate;
  if (resume > 0) { const seek = () => { a.currentTime = resume; a.removeEventListener('loadedmetadata', seek); }; a.addEventListener('loadedmetadata', seek); }
  a.play().catch(() => { dhChanged(); });
  if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
    const t = dhTeacher(al.teacherId);
    navigator.mediaSession.metadata = new MediaMetadata({ title: tr.t, artist: t ? t.name : '', album: al.group ? al.group + ' · ' + al.title : al.title });
  }
  dhChanged();
  return auto;
}
export function dhToggle() { const a = dhP.audio; if (!a || !a.src) return; if (a.paused) a.play().catch(() => {}); else a.pause(); }
export function dhSeek(d) { const a = dhP.audio; if (!a || !a.src) return; a.currentTime = Math.max(0, Math.min((a.duration || 1e9) - 1, a.currentTime + d)); if (dhP.onTick) dhP.onTick(); }
export function dhSeekTo(frac) { const a = dhP.audio; if (!a || !a.duration) return; a.currentTime = a.duration * Math.max(0, Math.min(1, frac)); }
export function dhStep(d) { if (!dhP.album) return; const j = dhP.i + d; if (j >= 0 && j < dhP.album.tracks.length) dhPlay(dhP.album.id, j); }
export function dhCycleRate() { const r = [1, 1.25, 1.5, 0.8], n = r[(r.indexOf(dhP.rate) + 1) % r.length]; dhP.rate = n; if (dhP.audio) dhP.audio.playbackRate = n; dhChanged(); return n; }
// ตั้งเวลาปิด: 0 = ยกเลิก, -1 = จบตอนนี้แล้วหยุด, นาทีอื่น = นับถอยหลัง
export function dhSleep(min) { dhP.sleepMin = min; dhP.sleepAt = min > 0 ? Date.now() + min * 60000 : 0; dhP.sleepEnd = min === -1; dhChanged(); }
export function dhStop() { const a = dhP.audio; if (a) { dhPersist(); a.pause(); a.removeAttribute('src'); a.load(); } dhP.album = null; dhP.sleepAt = 0; dhP.sleepEnd = false; if ('mediaSession' in navigator) navigator.mediaSession.metadata = null; dhChanged(); }
export const dhPlaying = () => !!(dhP.audio && dhP.album && !dhP.audio.paused);
