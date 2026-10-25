// Taksila app — screens, state and routing (hash routes, no framework).
import {
  SIGNS, ELEMENTS, PLANETS, HOUSES, planetById, computeChart, transits, daily, compatibility,
  planetPositions, signOf, fmtDeg, localToUtc, liveAspects, upcomingIngresses, ASPECT_GLYPH, lonOf, weekAhead, lunarPhase
} from './astro.js';
import { PLACES, MONTHS_TH, MONTHS_SHORT, TOPICS, LIFE_PATH, DIGITS, SUM_MEANING } from './data.js';
import { starMap, logoRing } from './starmap.js';
import { EVENTS, findAuspicious } from './auspice.js';
import { natalProfile, sixthSense } from './profile.js';
import { CARDS, drawCards, SPREADS, HOUSE_READ } from './tarot.js';
import { mountGlobe, burnIncense, mountSiamsi, askMotion, randomDigit, thaiNum } from './luck.js';
import { SIAMSI } from './siamsi.js';
import { NUM_TOOLS, analyzeNumber, gradeOf, birthHexColor, reduceTo9, analyzeName, LEVEL_TH, NUM_PLANET, taksaOf } from './numerology.js';
import { TH_PLANETS, thaksa, luckOf, birthPlanet, thaiLagna, dayColors, yams, yamUse, posOf } from './thai.js';

// ---------------- storage ----------------
const KEY = 'taksila.v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ profile: state.profile })); } catch (e) { /* storage unavailable */ } }

// ---------------- state ----------------
const saved = load();
let installEvt = null; // saved install prompt (Android/desktop Chrome)
const state = {
  profile: saved.profile || null,
  chart: null,
  draft: null,
  placeQuery: '',
  chartTab: 0,
  liveOpen: false,
  aspOpen: new Set(),
  weekSel: null,
  ausp: { tab: 0, event: 'wedding', days: 60, partner: 0, open: 0 },
  match: { sign: null, useDate: false, day: 1, month: 1, yearBE: 2540 },
  tarot: { topic: 0, spread: 2, cards: null, deck: null, picks: [], flipped: [], sel: 0, q: '', who: 'me', other: { name: '', known: false, day: 1, month: 1, yearBE: 2540 } },
  num: { mode: 'name', values: {}, first: '', last: '', gender: '', day: 0 },
  luck: { mode: 'ball', balls: [], inc: 'idle', incDigits: [], incShown: [], ss: null },
  ask: { topic: 0, messages: [] }
};
if (state.profile) state.chart = safeChart(state.profile);

function safeChart(p) { try { return computeChart(p); } catch (e) { console.error(e); return null; } }

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const G = (glyph) => `<span class="sym" aria-hidden="true">${glyph}&#xFE0E;</span>`;
const thaiDate = (d) => `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
const monthYear = (d) => `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
const pad = (n) => String(n).padStart(2, '0');

// ---------------- icons ----------------
const IC = {
  home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/><circle cx="12" cy="14" r="2.5"/>',
  chart: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  match: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
  tarot: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2z"/>',
  numbers: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
  luck: '<circle cx="12" cy="12" r="8"/><rect x="10" y="10" width="4" height="4"/>',
  ask: '<path d="M4 5h16v11H10l-5 4v-4H4z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  auspice: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
};
const icon = (name, size = 20, sw = 1.4) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[name]}</svg>`;

function pageHead(n, code, title, color, iconName, extra = '') {
  return `<header class="page-head"><span class="sigil" style="color:${color}">${icon(iconName, 22, 1.3)}</span>
<div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1"><span class="eyebrow" style="color:${color}">${n} · ${code}</span><h1 class="h1" style="font-size:24px">${title}</h1></div>${extra}</header>`;
}

const NAV = [
  ['home', 'หน้าหลัก', 'home'], ['chart', 'ผังดาว', 'chart'], ['match', 'คู่ดวง', 'match'],
  ['tarot', 'ไพ่', 'tarot'], ['numbers', 'ตัวเลข', 'numbers'], ['luck', 'โชคลาภ', 'luck']
];
function nav(route) {
  return `<nav class="nav" aria-label="เมนูหลัก">${NAV.map(([r, label, ic]) =>
    `<a href="#/${r}"${r === route ? ' aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('')}</nav>`;
}

// ---------------- screens ----------------
function viewWelcome() {
  return `<main class="screen no-nav" style="align-items:center;text-align:center;gap:26px;padding-top:60px">
${logoRing()}
<header style="display:flex;flex-direction:column;gap:8px">
<span class="eyebrow" style="letter-spacing:.32em">TAKSILA · ASTRAL READING</span>
<h1 class="h1" style="font-size:40px;line-height:1.2">ตักศิลา</h1>
<p class="body" style="font-size:15px">อ่านดวงจากตำแหน่งดาวจริง<br>ณ เวลาและพิกัดที่คุณเกิด</p>
</header>
<ol class="row-list" style="list-style:none;margin:0;padding:0;width:100%;text-align:left">
${['ผูกดวงจากวัน เวลาตกฟาก และพิกัดสถานที่เกิด', 'ทุกคำทำนายบอกที่มา ว่ามาจากดาวดวงใดในภพใด', 'ข้อมูลเกิดเก็บไว้ในเครื่องของคุณเท่านั้น']
    .map((t, i) => `<li style="display:grid;grid-template-columns:34px 1fr;gap:10px;padding:12px 0"><span class="mono" style="font-size:11px;color:var(--gold);padding-top:2px">0${i + 1}</span><span style="font-size:14px;line-height:1.55">${t}</span></li>`).join('')}
</ol>
<div style="width:100%;display:flex;flex-direction:column;gap:8px;margin-top:auto">
${state.profile
    ? `<a class="btn" href="#/home">เข้าสู่หน้าหลัก</a><a class="link-btn" style="justify-content:center" href="#/setup">แก้ไขข้อมูลเกิด</a>`
    : `<a class="btn" href="#/setup">เริ่มผูกดวง</a>`}
<p class="small" style="text-align:center">คำทำนายเพื่อเป็นแนวทางและความบันเทิง</p>
</div></main>`;
}

function blankDraft() {
  const p = state.profile;
  if (p) return JSON.parse(JSON.stringify({ ...p, placeIdx: p.placeIdx ?? -1, custom: p.custom || { lat: p.place.lat, lon: p.place.lon, offset: 7 } }));
  return { name: '', day: 1, month: 1, yearBE: 2540, hour: 12, minute: 0, timeKnown: true, placeIdx: 0, place: PLACES[0], custom: { lat: 13.75, lon: 100.5, offset: 7 } };
}
const daysIn = (m, yBE) => new Date(yBE - 543, m, 0).getDate();
const opts = (arr, sel) => arr.map(([v, t]) => `<option value="${v}"${String(v) === String(sel) ? ' selected' : ''}>${t}</option>`).join('');
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function placeOptions() {
  const d = state.draft, q = state.placeQuery.trim();
  const list = PLACES.map((p, i) => ({ p, i })).filter(({ p }) => !q || (p.name + p.country).includes(q));
  const rows = list.map(({ p, i }) => `<button type="button" class="option" role="radio" aria-checked="${d.placeIdx === i}" data-act="place" data-i="${i}">
<span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:500">${p.name}, ${p.country}</span><span class="mono small" style="font-size:11px">${Math.abs(p.lat).toFixed(2)}°${p.lat >= 0 ? 'N' : 'S'} · ${Math.abs(p.lon).toFixed(2)}°${p.lon >= 0 ? 'E' : 'W'}</span></span><span class="radio-dot"></span></button>`);
  rows.push(`<button type="button" class="option" role="radio" aria-checked="${d.placeIdx === -1}" data-act="place" data-i="-1"><span style="font-size:14px;font-weight:500">กำหนดพิกัดเอง</span><span class="radio-dot"></span></button>`);
  return rows.join('');
}

function viewSetup() {
  if (!state.draft) state.draft = blankDraft();
  const d = state.draft;
  const maxDay = daysIn(d.month, d.yearBE);
  if (d.day > maxDay) d.day = maxDay;
  return `<main class="screen no-nav">
<header class="page-head">
<button class="back" data-act="go" data-to="${state.profile ? 'home' : 'welcome'}" aria-label="ย้อนกลับ">${icon('back', 20, 1.5)}</button>
<div style="display:flex;flex-direction:column;gap:2px"><span class="eyebrow">BIRTH DATA</span><h1 class="h1" style="font-size:23px">ข้อมูลกำเนิด</h1></div>
</header>
<label class="field">ชื่อที่ให้เรียก<input class="input" data-in="name" value="${esc(d.name)}" placeholder="เช่น มีนา" autocomplete="nickname"></label>

<section style="display:flex;flex-direction:column;gap:8px">
<h2 class="step-title"><span class="mono">01</span>วันเดือนปีเกิด</h2>
<div class="date-row">
<label class="field">วัน<select class="select mono" data-in="day">${opts(range(1, maxDay).map((n) => [n, n]), d.day)}</select></label>
<label class="field">เดือน<select class="select" data-in="month">${opts(MONTHS_TH.map((m, i) => [i + 1, m]), d.month)}</select></label>
<label class="field">ปี พ.ศ.<select class="select mono" data-in="yearBE">${opts(range(2443, 2643).reverse().map((n) => [n, n]), d.yearBE)}</select></label>
</div></section>

<section style="display:flex;flex-direction:column;gap:8px">
<h2 class="step-title"><span class="mono">02</span>เวลาตกฟาก</h2>
<div style="display:flex;align-items:flex-end;gap:8px">
<label class="field" style="width:84px">ชั่วโมง<select class="select mono" data-in="hour"${d.timeKnown ? '' : ' disabled'}>${opts(range(0, 23).map((n) => [n, pad(n)]), d.hour)}</select></label>
<span class="mono" style="font-size:20px;padding-bottom:12px;color:var(--muted)">:</span>
<label class="field" style="width:84px">นาที<select class="select mono" data-in="minute"${d.timeKnown ? '' : ' disabled'}>${opts(range(0, 59).map((n) => [n, pad(n)]), d.minute)}</select></label>
<span class="mono small" style="padding-bottom:16px">เวลาท้องถิ่น</span>
</div>
<button type="button" class="check" aria-pressed="${!d.timeKnown}" data-act="unknownTime"><span class="box">${d.timeKnown ? '' : '✓'}</span>ไม่ทราบเวลาเกิดแน่ชัด</button>
<p class="small" style="font-size:13px;${d.timeKnown ? '' : 'color:var(--tension)'}">${d.timeKnown
    ? 'ลัคนาเคลื่อนราว 1 องศาทุก 4 นาที แนะนำให้ใช้เวลาจากสูติบัตร'
    : 'ระบบจะใช้เวลาเที่ยงวัน ตำแหน่งดาวยังใช้ได้ แต่คำนวณลัคนาไม่ได้ ภพจะนับจากราศีของดวงอาทิตย์แทน'}</p>
</section>

<section style="display:flex;flex-direction:column;gap:8px">
<h2 class="step-title"><span class="mono">03</span>สถานที่เกิด</h2>
<label class="sr-only" for="placeQ">ค้นหาสถานที่เกิด</label>
<div style="display:flex;align-items:center;gap:10px;min-height:48px;border-radius:6px;border:1px solid var(--line-2);background:var(--surface);padding:0 14px;color:var(--muted)">${icon('search', 18, 1.5)}
<input id="placeQ" data-in="placeQuery" value="${esc(state.placeQuery)}" placeholder="ค้นหาจังหวัดหรือเมือง" style="flex:1;min-width:0;border:none;background:transparent;color:var(--text);font-size:15px;outline-offset:4px"></div>
<div class="option-list" role="radiogroup" aria-label="สถานที่เกิด" id="place-list">${placeOptions()}</div>
${d.placeIdx === -1 ? `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
<label class="field">ละติจูด<input class="input mono" inputmode="decimal" data-in="c.lat" value="${d.custom.lat}"></label>
<label class="field">ลองจิจูด<input class="input mono" inputmode="decimal" data-in="c.lon" value="${d.custom.lon}"></label>
<label class="field">UTC +ชม.<input class="input mono" inputmode="decimal" data-in="c.offset" value="${d.custom.offset}"></label></div>
<p class="small">ละติจูดใต้และลองจิจูดตะวันตกใส่เป็นค่าลบ</p>` : `<p class="small mono" style="font-size:11px">เขตเวลา ${esc(PLACES[d.placeIdx].tz)} · ปรับเวลาท้องถิ่นอัตโนมัติ</p>`}
</section>
<button class="btn" data-act="saveProfile">${icon('chart', 18, 1.6)}คำนวณผังดาว</button>
</main>`;
}

function bigThree(ch) {
  const sun = ch.planets[0], moon = ch.planets[1];
  return `<div class="big3">
<div><span class="label" style="font-size:9px">SUN</span><span class="v">${G(sun.glyph)} ${SIGNS[sun.sign].th}</span></div>
<div><span class="label" style="font-size:9px">MOON</span><span class="v">${G(moon.glyph)} ${SIGNS[moon.sign].th}</span></div>
<div><span class="label" style="font-size:9px">RISING</span><span class="v">${ch.asc != null ? SIGNS[signOf(ch.asc)].th : '<span class="small">ไม่ทราบเวลา</span>'}</span></div></div>`;
}

function hudFor(p) {
  const place = p.place;
  return {
    tl: `NATAL ${pad(p.day)}.${pad(p.month)}.${p.yearBE - 543}`,
    tr: p.timeKnown ? `${pad(p.hour)}:${pad(p.minute)} LOCAL` : 'TIME UNKNOWN',
    bl: `LAT ${Math.abs(place.lat).toFixed(2)}${place.lat >= 0 ? 'N' : 'S'}`,
    br: `LON ${Math.abs(place.lon).toFixed(2)}${place.lon >= 0 ? 'E' : 'W'}`
  };
}

function greeting(now) {
  const h = now.getHours();
  return h < 5 ? 'สวัสดียามดึก' : h < 10 ? 'สวัสดีตอนเช้า' : h < 12 ? 'สวัสดีตอนสาย' : h < 16 ? 'สวัสดีตอนบ่าย' : h < 19 ? 'สวัสดีตอนเย็น' : 'สวัสดียามค่ำ';
}

function viewHome() {
  const ch = state.chart, p = state.profile, now = new Date();
  const dl = daily(ch, now);
  const tr = transits(ch, now).slice(0, 4);
  const trColor = (t) => t.level === 'HIGH' ? 'var(--tension)' : t.level === 'SUPPORT' ? 'var(--gold)' : 'var(--harmony)';
  const tools = [
    ['chart', 'ผังดาว', 'ดวงกำเนิด', 'var(--gold)'],
    ['match', 'คู่ดวง', 'เทียบสองคน', 'var(--rose)'],
    ['tarot', 'ไพ่ทาโรต์', '78 ใบ เลือกเอง', 'var(--violet)'],
    ['numbers', 'ตัวเลข', 'เบอร์ ทะเบียน', 'var(--teal)'],
    ['luck', 'โชคลาภ', 'ปิงปอง ธูป', 'var(--amber)'],
    ['auspice', 'ฤกษ์ยาม', 'แต่ง บวช ขึ้นบ้าน', 'var(--amber)']
  ];
  return `<main class="screen home">
<header class="home-head">
<div class="hh-text"><span class="eyebrow" style="letter-spacing:.24em">TAKSILA · ${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear() + 543}</span>
<h1 class="hh-title">${greeting(now)}${p.name ? ' คุณ' + esc(p.name.split(' ')[0]) : ''}</h1>
<p class="hh-big3"><span>${SIGNS[ch.planets[0].sign].glyph}&#xFE0E; ${SIGNS[ch.planets[0].sign].th}</span><span>${SIGNS[ch.planets[1].sign].glyph}&#xFE0E; ${SIGNS[ch.planets[1].sign].th}</span>${ch.timeKnown ? `<span>ลัคนา ${SIGNS[signOf(ch.asc)].th}</span>` : ''}</p></div>
<a class="hh-map" href="#/chart" aria-label="เปิดผังดาวกำเนิด">${starMap(ch, { id: 'home', label: 'ผังดาวกำเนิดของคุณ', size: 92 })}</a>
</header>
<section id="live-daily" aria-label="ดวงรายวันแบบสด">${liveDailyHTML()}</section>
<section id="auspice-mini" aria-label="มงคลวันนี้">${auspiceMiniHTML()}</section>
<nav class="oracle-grid" aria-label="ศาสตร์การทำนาย">${tools.map(([r, t, s, c]) => `<a class="oracle" href="#/${r}" style="--c:${c}"><span class="sigil">${icon(r, 20)}</span><span class="n">${t}</span><span class="small">${s}</span></a>`).join('')}</nav>
<div id="install-slot">${installHTML()}</div>
<section id="week" style="display:flex;flex-direction:column;gap:10px" aria-label="ดวง 7 วันข้างหน้า">${weekHTML()}</section>
<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">TRANSITS · ดาวจรระยะยาว</h2>
<div class="hscroll edge">${tr.map((t) => `<a class="mini" href="#/chart" data-act="chartTab" data-i="2">
<span style="display:flex;justify-content:space-between;align-items:center"><span class="sym" style="font-size:20px;color:${trColor(t)}">${t.glyph}&#xFE0E;</span><span class="mono small" style="font-size:10px">H${t.house}</span></span>
<span class="t">${t.isReturn ? (t.id === 'saturn' ? 'เสาร์คืนเรือน' : 'พฤหัสคืนเรือน') : planetById(t.id).th + 'จร' + SIGNS[t.sign].th}</span>
<span class="small">${HOUSES[t.house - 1]}</span></a>`).join('')}</div>
</section>
<a class="ask-link" href="#/ask"><span class="sigil" style="color:var(--bg);background:var(--gold);border:none;width:40px;height:40px">${icon('ask', 20, 1.6)}</span>
<span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="h2" style="font-size:16px">ปรึกษาผู้เชี่ยวชาญ</span><span class="small">ถามเรื่องเฉพาะ คำตอบอ้างอิงผังดาวของคุณ</span></span>${icon('next', 16, 1.5)}</a>
</main>`;
}

// Install prompt: one-tap on Android/desktop Chrome, step-by-step help on iPhone and other browsers.
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installHelp = false;
function installHTML() {
  if (isStandalone() || location.protocol === 'file:' || !document.querySelector('link[rel="manifest"]')) return '';
  try { if (localStorage.getItem('taksila.installDismissed') === '1') return ''; } catch {}
  const steps = isIOS()
    ? ['เปิดหน้านี้ด้วย <b>Safari</b>', 'แตะปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรชี้ขึ้น) ด้านล่าง', 'เลื่อนหา <b>เพิ่มไปยังหน้าจอโฮม</b> แล้วแตะ <b>เพิ่ม</b>']
    : ['แตะ <b>⋮</b> มุมขวาบนของ Chrome', 'เลือก <b>ติดตั้งแอป</b> หรือ <b>เพิ่มลงในหน้าจอหลัก</b>', 'แตะ <b>ติดตั้ง</b> ไอคอนตักศิลาจะขึ้นบนหน้าจอ'];
  return `<div class="install-card">
<span class="ic-logo"><img src="icons/icon-192.png" alt="" width="44" height="44"></span>
<span class="ic-text"><b>ติดตั้งตักศิลาเป็นแอป</b><span>เปิดจากหน้าจอได้ทันที เต็มจอ ใช้ได้แม้ไม่มีเน็ต</span></span>
<span class="ic-actions">${installEvt ? '<button class="btn ic-btn" data-act="install">ติดตั้ง</button>' : `<button class="btn ic-btn" data-act="installHelp">${installHelp ? 'ซ่อน' : 'วิธีติดตั้ง'}</button>`}<button class="ic-x" data-act="installDismiss" aria-label="ไม่ตอนนี้">ไม่ตอนนี้</button></span>
${!installEvt && installHelp ? `<ol class="ic-steps">${steps.map((x) => `<li>${x}</li>`).join('')}</ol>` : ''}
</div>`;
}

// ---------------- live daily reading ----------------
const pname = (id, th) => id === 'sun' ? 'ดวงอาทิตย์' : id === 'moon' ? 'ดวงจันทร์' : id === 'asc' ? 'ลัคนา' : 'ดาว' + th;
function when(d, now = new Date()) {
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(now)) / 86400000);
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
  return diff === 0 ? 'วันนี้ ' + hm : diff === 1 ? 'พรุ่งนี้ ' + hm : `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${hm}`;
}
const natureColor = (n) => n > 0 ? 'var(--harmony)' : n < 0 ? 'var(--tension)' : 'var(--gold-2)';

const aspKey = (x) => `${x.mover.id}-${x.asp.id}-${x.target.id}`;
const targetGlyph = (t) => t.id === 'asc' ? '<span class="mono" style="font-size:10px;letter-spacing:.05em">ASC</span>' : `<span class="sym">${t.glyph}&#xFE0E;</span>`;

function liveDailyHTML() {
  const ch = state.chart, now = new Date();
  const dl = daily(ch, now);
  const la = liveAspects(ch, now);
  const up = upcomingIngresses(ch, now);
  const top = la[0];
  const open = state.liveOpen;
  const headline = top ? top.reason : dl.headline;
  const basis = top ? `${pname(top.mover.id, top.mover.th)}จร${top.asp.th}${pname(top.target.id, top.target.th)}ในดวงกำเนิด` : dl.basis;
  const timing = (x) => x.applying ? (x.exactAt ? `แม่นยำสุด ${when(x.exactAt, now)}` : 'ส่งผลหลายสัปดาห์') : 'กำลังคลายตัว';
  const trio = (x) => `<span class="sym">${x.mover.glyph}&#xFE0E;</span><span class="sym" style="color:${natureColor(x.asp.nature)}">${ASPECT_GLYPH[x.asp.id]}&#xFE0E;</span>${targetGlyph(x.target)}`;
  const items = la.map((x) => {
    const m = x.mover, t = x.target, col = natureColor(x.asp.nature), k = aspKey(x);
    const pct = Math.round(Math.min(1, x.strength / 1.6) * 100);
    const isOpen = state.aspOpen.has(k);
    return `<li class="asp${isOpen ? ' open' : ''}" style="--c:${col}">
<button class="asp-head" data-act="aspToggle" data-k="${k}" aria-expanded="${isOpen}">
<span class="asp-glyphs" aria-hidden="true">${trio(x)}</span>
<span class="asp-title"><span>${pname(m.id, m.th)}${x.asp.th}${pname(t.id, t.th)}</span><span class="mono">${timing(x)}</span></span>
<span class="chev">${icon('down', 16, 1.6)}</span>
</button>
<div class="fold"><div class="fold-in"><div class="asp-body">
<p class="body" style="font-size:14px">${x.reason}</p>
<p class="small" style="color:${col}">${x.advice}</p>
<dl class="asp-facts">
<div><dt>ดาวจร</dt><dd>${SIGNS[m.sign].th} ${fmtDeg(m.lon)}${m.retro ? ' (ถอยหลัง)' : ''} · ภพ ${m.house}</dd></div>
<div><dt>ดาวกำเนิด</dt><dd>${SIGNS[t.sign].th} ${fmtDeg(t.lon)}</dd></div>
<div><dt>ระยะห่าง</dt><dd>${x.off.toFixed(1)}° · ${x.applying ? 'กำลังเข้าใกล้' : 'ผ่านจุดแม่นยำแล้ว'}</dd></div>
<div><dt>น้ำหนัก</dt><dd><span class="tr-bar" role="img" aria-label="${pct}%"><span style="width:${pct}%;background:${col}"></span></span></dd></div>
</dl></div></div></div></li>`;
  }).join('');
  const nextEvents = up.slice(0, 4).map((e) => `<li><span class="sym" style="color:var(--gold-2)">${PLANETS.find((p) => p.id === e.id).glyph}&#xFE0E;</span>
<span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span style="font-size:14px">${pname(e.id, PLANETS.find((p) => p.id === e.id).th)}เข้าราศี${SIGNS[e.sign].th}</span><span class="small">ภพ ${e.house} · ${HOUSES[e.house - 1]}</span></span>
<span class="mono" style="font-size:10px;color:var(--gold);white-space:nowrap">${when(e.at, now)}</span></li>`).join('');
  const RING_COL = ['#E58FA8', '#D4AF63', '#6FC3B2', '#A99BD9'];
  const total = Math.round(dl.scores.reduce((x, y) => x + y.score, 0) / dl.scores.length * 20);
  const ring = (k, sc) => {
    const r = 57 - k * 10, C = 2 * Math.PI * r, len = (sc / 5) * C;
    return `<circle cx="64" cy="64" r="${r}" fill="none" stroke="${RING_COL[k]}" stroke-opacity=".16" stroke-width="7"/>
<circle class="ring-arc" cx="64" cy="64" r="${r}" fill="none" stroke="${RING_COL[k]}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 64 64)" style="--len:${len.toFixed(1)};--c:${C.toFixed(1)}"/>`;
  };
  const mood = total >= 75 ? 'วันพลังดี' : total >= 55 ? 'วันกลาง ๆ ค่อนดี' : total >= 40 ? 'วันต้องใจเย็น' : 'วันพักเก็บแรง';
  return `<div class="card daily day-hero${open ? ' open' : ''}">
<span class="dh-top"><span class="eyebrow" style="letter-spacing:.2em;display:flex;align-items:center;gap:8px"><span class="live-dot" aria-hidden="true"></span>ดวงวันนี้ · LIVE</span><span class="mono small" style="font-size:10px">อัปเดต ${pad(now.getHours())}:${pad(now.getMinutes())}</span></span>
<div class="dh-main">
<svg class="dh-rings" viewBox="0 0 128 128" role="img" aria-label="คะแนนดวงวันนี้ ${total} จาก 100">${dl.scores.map((x, k) => ring(k, x.score)).join('')}
<text x="64" y="69" text-anchor="middle" font-family="IBM Plex Mono" font-size="17" font-weight="500" fill="#F1E6CF">${total}</text></svg>
<div class="dh-side"><span class="dh-mood">${mood}</span>
<ul class="dh-legend">${dl.scores.map((x, k) => `<li><i style="background:${RING_COL[k]}"></i><span>${x.name}</span><b>${x.score}/5</b></li>`).join('')}</ul></div>
</div>
<p class="dh-head">${headline}</p>
<button class="drawer-toggle" data-act="liveToggle" data-closed="ดูเหตุผล ${la.length} มุมดาว" aria-expanded="${open}">
<span class="peek" aria-hidden="true">${la.slice(0, 3).map((x) => `<span class="peek-chip">${trio(x)}</span>`).join('')}</span>
<span class="lbl">${open ? 'พับเก็บ' : `ดูเหตุผล ${la.length} มุมดาว`}</span>
<span class="chev">${icon('down', 16, 1.6)}</span>
</button>
<div class="fold"><div class="fold-in"><div class="drawer-body">
<p class="small">ที่มาของคำทำนายหลัก · <span style="color:var(--text)">${basis}</span></p>
${la.length ? `<ul class="asp-list">${items}</ul>` : '<p class="small">วันนี้ไม่มีดาวจรทำมุมใกล้ดาวในดวงกำเนิด เป็นวันที่ค่อนข้างสงบ</p>'}
<p class="small legend">${G(ASPECT_GLYPH.conj)} ร่วม ${G(ASPECT_GLYPH.sext)} หกสิบ ${G(ASPECT_GLYPH.square)} ตั้งฉาก ${G(ASPECT_GLYPH.trine)} ตรีโกณ ${G(ASPECT_GLYPH.opp)} เล็ง</p>
<h3 class="label">ถัดไป · ดาวย้ายราศี</h3>
<ul class="next-list">${nextEvents}</ul>
</div></div></div>
</div>`;
}

// ---------------- Thai auspice: colours, numbers, ยามอัฏฐกาล ----------------
const sw = (n, label) => `<span class="swatch"><i style="background:${TH_PLANETS[n].hex}"></i><span><b>${label}</b>${TH_PLANETS[n].color}</span></span>`;
const hm = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
function personalLuck() {
  const p = state.profile, bp = birthPlanet(p);
  return { bp, me: luckOf(bp), lagna: thaiLagna(state.chart) };
}
function currentYams(now = new Date()) {
  const { bp } = personalLuck();
  const all = yams(now, bp);
  const cur = all.find((y) => now >= y.start && now < y.end);
  const nextGood = all.find((y) => y.end > now && y !== cur && y.pos.tone === 2) || all.find((y) => y.end > now && y.pos.tone === 2);
  return { all, cur, nextGood };
}
function auspiceMiniHTML() {
  if (!state.chart) return '';
  const now = new Date(), today = dayColors(now), { me } = personalLuck(), { cur, nextGood } = currentYams(now);
  const best = today.money !== me.avoid ? today.money : today.work;
  return `<a class="ausp-strip" href="#/auspice" aria-label="มงคลวันนี้ ${TH_PLANETS[today.owner].day}">
<span class="as-cell"><span class="as-l">สีเสริมดวง</span><span class="as-v"><i style="background:${TH_PLANETS[best].hex}"></i>${TH_PLANETS[best].color.split(' ')[0]}</span></span>
<span class="as-cell"><span class="as-l">สีที่ควรเลี่ยง</span><span class="as-v"><i style="background:${TH_PLANETS[me.avoid].hex}"></i>${TH_PLANETS[me.avoid].color.split(' ')[0]}</span></span>
<span class="as-cell"><span class="as-l">เลขมงคล</span><span class="as-v mono" style="color:var(--gold-2)">${me.numbers.slice(0, 3).join(' ')}</span></span>
<span class="as-cell"><span class="as-l">${cur && cur.pos.tone === 2 ? 'ตอนนี้ยามดี' : 'ยามดีถัดไป'}</span><span class="as-v mono" style="color:var(--gold-2)">${cur && cur.pos.tone === 2 ? hm(cur.end).replace(/^/, 'ถึง ') : nextGood ? hm(nextGood.start) : '–'}</span></span>
</a>`;
}

function thaksaWheel(owner) {
  const t = thaksa(owner), R = 112, c = 150;
  const nodes = t.map((x, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, x0 = c + R * Math.cos(a), y0 = c + R * Math.sin(a);
    const bad = x.id === 'kalakini', good = x.tone === 2;
    return `<g><line x1="${c}" y1="${c}" x2="${x0.toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#2C261B"/>
<circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="25" fill="#15120D" stroke="${bad ? '#E07A62' : good ? '#D4AF63' : '#3A3224'}" stroke-width="${good || bad ? 1.4 : 1}"/>
<circle cx="${x0.toFixed(1)}" cy="${(y0 - 7).toFixed(1)}" r="5" fill="${TH_PLANETS[x.planet].hex}"/>
<text x="${x0.toFixed(1)}" y="${(y0 + 6).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="${bad ? '#E07A62' : good ? '#F0D89A' : '#C9BCA2'}" font-weight="600">${x.th}</text>
<text x="${x0.toFixed(1)}" y="${(y0 + 17).toFixed(1)}" text-anchor="middle" font-size="8" fill="#A3967D">${TH_PLANETS[x.planet].th} ${x.planet}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 300 300" width="100%" style="max-width:320px;display:block;margin:0 auto" role="img" aria-label="ทักษาประจำตัว">
<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#2C261B" stroke-dasharray="2 4"/>${nodes}
<circle cx="${c}" cy="${c}" r="34" fill="#1B1711" stroke="#D4AF63"/><circle cx="${c}" cy="${c - 10}" r="6" fill="${TH_PLANETS[owner].hex}"/>
<text x="${c}" y="${c + 8}" text-anchor="middle" font-size="11" fill="#F1E6CF" font-weight="600">${TH_PLANETS[owner].th}</text>
<text x="${c}" y="${c + 20}" text-anchor="middle" font-size="8" fill="#A3967D">ดาวประจำตัว</text></svg>`;
}

function luckBlock(title, sub, L) {
  return `<div class="card" style="gap:12px"><span style="display:flex;flex-direction:column;gap:2px"><span class="h2" style="font-size:17px">${title}</span><span class="small">${sub}</span></span>
<div class="swatch-grid">${sw(L.money, 'การเงิน โชคลาภ')}${sw(L.work, 'การงาน')}${sw(L.patron, 'ผู้ใหญ่ อุปถัมภ์')}${sw(L.health, 'สุขภาพ')}</div>
<div class="swatch-avoid">${sw(L.avoid, 'ควรเลี่ยง (กาลกิณี)')}</div>
<p class="small">เลขถูกโฉลก <b class="mono" style="color:var(--gold-2);font-size:15px;letter-spacing:.1em">${L.numbers.join(' · ')}</b> · เลี่ยงเลข <b class="mono" style="color:var(--tension)">${L.avoid}</b></p></div>`;
}

const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const fullDate = (d) => `${TH_DOW[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;

function auspToday(now, bp, me) {
  const today = dayColors(now), rel = posOf(bp, today.owner);
  const { all, cur } = currentYams(now);
  const yamRow = (y) => {
    const tone = y.pos.tone === 2 ? 'good' : y.pos.tone < 0 ? 'bad' : '';
    const isCur = y === cur, past = y.end <= now;
    return `<li class="yam ${tone}${isCur ? ' cur' : ''}${past ? ' past' : ''}"><span class="mono t">${hm(y.start)}</span>
<span class="ydot" style="background:${TH_PLANETS[y.planet].hex}"></span>
<span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="n">ยาม${y.pos.th} <span class="small">· ${TH_PLANETS[y.planet].th}</span>${isCur ? ' <span class="now">ตอนนี้</span>' : ''}</span><span class="small">${yamUse(y.pos)}</span></span></li>`;
  };
  return `<section class="card" style="gap:6px">
<span class="eyebrow" style="letter-spacing:.16em;color:var(--amber)">วันนี้ · ${TH_PLANETS[today.owner].day.toUpperCase()}</span>
<p class="h2" style="font-size:19px">วันนี้เป็น "วัน${rel.th}" ของคุณ</p>
<p class="small">${rel.tone === 2 ? 'วันส่งเสริม ' : rel.tone < 0 ? 'วันที่ควรระวัง ' : ''}เด่นเรื่อง${rel.use}${rel.tone < 0 ? ' เลี่ยงเริ่มเรื่องสำคัญ' : ''}</p>
<h3 class="label" style="margin-top:8px">สีเสื้อมงคลวันนี้</h3>
<div class="swatch-grid">${sw(today.money, 'การเงิน')}${sw(today.work, 'การงาน')}${sw(today.patron, 'ผู้ใหญ่')}${sw(today.people, 'เสน่ห์ คนรอบตัว')}</div>
<div class="swatch-avoid">${sw(today.avoid, 'กาลกิณีของวัน')}${me.avoid !== today.avoid ? sw(me.avoid, 'กาลกิณีของคุณ') : ''}</div>
</section>
<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">ยามอัฏฐกาลวันนี้ · คำนวณกับดาวประจำตัวคุณ</h2>
<div class="yam-tabs"><span>กลางวัน 06:00–18:00</span></div>
<ul class="yam-list">${all.filter((y) => !y.night).map(yamRow).join('')}</ul>
<div class="yam-tabs"><span>กลางคืน 18:00–06:00</span></div>
<ul class="yam-list">${all.filter((y) => y.night).map(yamRow).join('')}</ul>
<p class="small" style="font-size:11px">ยามละ 1 ชั่วโมงครึ่ง กลางวันเดินดาวทีละ 5 กลางคืนทีละ 4 · ยามศรี เดช มนตรี ของคุณ = ยามดี ยามกาลกิณี = ควรเลี่ยง</p>
</section>`;
}

function auspFinder(bp) {
  const a = state.ausp, ev = EVENTS.find((e) => e.id === a.event);
  const partner = ev.partner && a.partner ? a.partner : null;
  const { results } = findAuspicious(state.chart, bp, a.event, { days: a.days, partner });
  const top = results.slice(0, 5);
  const dayOpts = [[0, 'ไม่ระบุ'], ...[1, 2, 3, 4, 8, 5, 6, 7].map((n) => [n, TH_PLANETS[n].day])];
  const card = (r, i) => {
    const open = a.open === i, b = r.best;
    return `<li class="rk${open ? ' open' : ''}">
<button class="rk-head" data-act="auspOpen" data-i="${i}" aria-expanded="${open}">
<span class="rk-n mono">${i + 1}</span>
<span style="flex:1;display:flex;flex-direction:column;gap:2px;min-width:0"><span class="rk-date">${fullDate(r.date)}</span>
<span class="small">${b ? `<b style="color:var(--gold-2)">${hm(b.start)}–${hm(b.end)}</b> ยาม${b.pos.th} · ` : ''}${r.phase.th}</span></span>
<span class="rk-score"><b class="mono">${r.score}</b><span class="tr-bar" style="width:44px;margin:0"><span style="width:${r.score}%;background:var(--gold)"></span></span></span>
<span class="chev">${icon('down', 16, 1.6)}</span></button>
<div class="fold"><div class="fold-in"><div class="rk-body">
<ul class="why">${r.good.map((g) => `<li class="ok">${g}</li>`).join('')}${r.warn.map((w) => `<li class="no">${w}</li>`).join('')}</ul>
${r.alt.length ? `<p class="small">เวลาสำรอง ${r.alt.map((y) => `${hm(y.start)}–${hm(y.end)} (ยาม${y.pos.th})`).join(' · ')}</p>` : ''}
</div></div></div></li>`;
  };
  return `<section style="display:flex;flex-direction:column;gap:12px">
<h2 class="label">เลือกงานที่จะหาฤกษ์</h2>
<div class="ev-grid">${EVENTS.map((e) => `<button class="ev" data-act="auspEvent" data-v="${e.id}" aria-pressed="${e.id === a.event}">${e.th}</button>`).join('')}</div>
<p class="small">${ev.note}</p>
<div class="seg" role="group" aria-label="ช่วงเวลา">${[30, 60, 90, 180].map((n) => `<button aria-pressed="${a.days === n}" data-act="auspDays" data-i="${n}">${n === 180 ? '6 เดือน' : n + ' วัน'}</button>`).join('')}</div>
${ev.partner ? `<label class="field">วันเกิดของคู่ (เพื่อเลี่ยงกาลกิณีของทั้งสองคน)<select class="select" data-in="a.partner">${dayOpts.map(([v, t]) => `<option value="${v}"${v === a.partner ? ' selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
</section>
<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">ฤกษ์${ev.th} ${top.length} อันดับแรก · ${a.days === 180 ? '6 เดือน' : a.days + ' วัน'}ข้างหน้า</h2>
${top.length ? `<ol class="rk-list">${top.map(card).join('')}</ol>` : '<p class="small">ไม่พบวันที่เหมาะในช่วงนี้ ลองขยายช่วงเวลา</p>'}
<p class="small" style="font-size:11px">คิดจากทักษาของ${partner ? 'ทั้งสองคน' : 'คุณ'} ข้างขึ้นข้างแรม วันพระ วันที่ธรรมเนียมไม่นิยม ดาวถอยหลัง และดวงจันทร์จรกับผังดาวของคุณ · ตัดวันกาลกิณีออกแล้ว · งานใหญ่อย่างแต่งงานและบวช ควรให้พระหรือโหรตรวจทานฤกษ์อีกครั้ง</p>
</section>`;
}

function auspLucky(p, bp, me, lagna) {
  const lg = lagna ? luckOf(lagna.lord) : null;
  return `<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">ทักษาประจำตัว · เกิด${TH_PLANETS[bp].day}${p.timeKnown ? '' : ' (ไม่ทราบเวลาเกิด ใช้เวลากลางวัน)'}</h2>
${thaksaWheel(bp)}
</section>
${luckBlock('สีและเลขถูกโฉลกกับวันเกิด', `ตามทักษา ดาวประจำตัวคือ${TH_PLANETS[bp].th} (${bp})`, me)}
${lg ? luckBlock('สีและเลขถูกโฉลกกับลัคนา', `ลัคนาแบบไทยราศี${SIGNS[lagna.sign].th} ${Math.floor(lagna.deg)}° เจ้าเรือนลัคนาคือดาว${TH_PLANETS[lagna.lord].th} (${lagna.lord})`, lg)
    : '<div class="card"><p class="small">ใส่เวลาเกิดเพื่อดูสีและเลขถูกโฉลกกับลัคนา</p></div>'}
${lagna && lagna.sign !== state.chart.firstSign ? `<p class="small" style="font-size:11px">หมายเหตุ: โหราศาสตร์ไทยใช้จักรราศีแบบนิรายนะ (ถอยราว 24°) ลัคนาแบบไทยจึงเป็นราศี${SIGNS[lagna.sign].th} ขณะที่ผังดาวสากลเป็นราศี${SIGNS[state.chart.firstSign].th}</p>` : ''}`;
}

function viewAuspice() {
  const now = new Date(), p = state.profile, { bp, me, lagna } = personalLuck(), tab = state.ausp.tab;
  const tabs = ['วันนี้', 'หาฤกษ์', 'ดวงมงคล'];
  const body = tab === 0 ? auspToday(now, bp, me) : tab === 1 ? auspFinder(bp) : auspLucky(p, bp, me, lagna);
  return `<main class="screen" style="--accent:var(--amber)">
${pageHead('06', 'AUSPICE', 'ฤกษ์ยาม', 'var(--amber)', 'auspice', `<button class="back" data-act="go" data-to="home" aria-label="กลับหน้าหลัก" style="margin:0">${icon('back', 20, 1.5)}</button>`)}
<div class="seg" role="tablist" aria-label="ฤกษ์ยาม">${tabs.map((t, i) => `<button role="tab" aria-selected="${i === tab}" data-act="auspTab" data-i="${i}">${t}</button>`).join('')}</div>
${body}
<p class="small" style="text-align:center;font-size:11px">ตามตำราทักษา ยามอัฏฐกาล และตำแหน่งดาวจริง เพื่อเป็นแนวทางเสริมความมั่นใจ</p>
</main>`;
}

// ---------------- seven-day outlook ----------------
const WEEKDAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const WEEKDAY = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const RATING_TH = ['', 'ระวังตัว', 'ค่อย ๆ ไป', 'กลาง ๆ', 'ดี', 'ดีมาก'];
const ratingColor = (r) => r >= 4 ? 'var(--gold-2)' : r <= 2 ? 'var(--tension)' : 'var(--muted)';
function moonIcon(ph, r = 7) {
  const k = Math.cos(ph.elongation * Math.PI / 180), rx = Math.abs(k) * r;
  const s1 = ph.waxing ? 1 : 0, s2 = ph.waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  return `<svg width="${2 * r + 2}" height="${2 * r + 2}" viewBox="${-r - 1} ${-r - 1} ${2 * r + 2} ${2 * r + 2}" aria-hidden="true"><circle r="${r}" fill="#2C261B" stroke="#5A4C33" stroke-width="0.6"/><path d="M0 ${-r}A${r} ${r} 0 0 ${s1} 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${s2} 0 ${-r}Z" fill="#F0D89A"/></svg>`;
}
let weekCache = null;
function weekData() {
  const now = new Date(), key = now.toDateString();
  if (!weekCache || weekCache.key !== key || weekCache.chart !== state.chart) weekCache = { key, chart: state.chart, days: weekAhead(state.chart, now) };
  return weekCache.days;
}
function weekHTML() {
  const days = weekData(), sel = state.weekSel;
  const strip = days.map((d, i) => `<button class="day${sel === i ? ' sel' : ''}" data-act="weekDay" data-i="${i}" aria-pressed="${sel === i}" aria-label="${WEEKDAY[d.date.getDay()]} ${d.date.getDate()} ${RATING_TH[d.rating]}">
<span class="wd">${i === 0 ? 'วันนี้' : WEEKDAY_SHORT[d.date.getDay()]}</span><span class="dn">${d.date.getDate()}</span>${moonIcon(d.phase)}
<span class="dots" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i style="background:${n <= d.rating ? ratingColor(d.rating) : 'var(--line)'}"></i>`).join('')}</span></button>`).join('');
  let detail = '';
  if (sel != null) {
    const d = days[sel];
    detail = `<div class="card day-detail">
<span class="eyebrow" style="letter-spacing:.14em">${WEEKDAY[d.date.getDay()].toUpperCase()} ${d.date.getDate()} ${MONTHS_SHORT[d.date.getMonth()]} · ${d.phase.th}</span>
<p class="h2" style="font-size:18px;color:${ratingColor(d.rating)}">${RATING_TH[d.rating]}</p>
<p class="small">ดวงจันทร์อยู่ราศี${SIGNS[d.moonSign].th} ผ่านภพ ${d.moonHouse} ของคุณ เรื่อง${HOUSES[d.moonHouse - 1]}จะเด่นขึ้นมาในวันนี้ · ${d.phase.name}</p>
${d.top.length ? `<ul class="day-asp">${d.top.map((x) => `<li style="--c:${natureColor(x.asp.nature)}"><span class="asp-glyphs" aria-hidden="true"><span class="sym">${x.mover.glyph}&#xFE0E;</span><span class="sym" style="color:var(--c)">${ASPECT_GLYPH[x.asp.id]}&#xFE0E;</span>${targetGlyph(x.target)}</span>
<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:14px;font-weight:600">${pname(x.mover.id, x.mover.th)}${x.asp.th}${pname(x.target.id, x.target.th)}</span><span class="small">${x.reason}</span></span></li>`).join('')}</ul>` : '<p class="small">ดาวเคลื่อนเร็วไม่ทำมุมสำคัญ เป็นวันเรียบ ๆ เหมาะกับงานประจำ</p>'}
</div>`;
  }
  return `<h2 class="label" style="display:flex;justify-content:space-between"><span>7 วันข้างหน้า</span><span class="mono" style="font-size:10px;letter-spacing:.1em">กดดูรายวัน</span></h2>
<div class="week-strip">${strip}</div>${detail}`;
}

// Real-time refresh: recompute the live section every 30 seconds and announce sign changes.
let liveTimer = null;
let lastSigns = null;
function signSnapshot() {
  const now = new Date();
  return Object.fromEntries(['moon', 'sun', 'mercury', 'venus', 'mars'].map((id) => [id, signOf(lonOf(id, now))]));
}
function tickLive() {
  const box = document.getElementById('live-daily');
  if (!box || !state.chart) return;
  const snap = signSnapshot();
  if (lastSigns) {
    for (const id of Object.keys(snap)) {
      if (snap[id] !== lastSigns[id]) toast(`${pname(id, PLANETS.find((p) => p.id === id).th)}ย้ายเข้าราศี${SIGNS[snap[id]].th}แล้ว ดวงของคุณอัปเดตแล้ว`);
    }
  }
  lastSigns = snap;
  box.innerHTML = liveDailyHTML();
  const am = document.getElementById('auspice-mini');
  if (am) am.innerHTML = auspiceMiniHTML();
  const wk = document.getElementById('week');
  if (wk && weekCache && weekCache.key !== new Date().toDateString()) { state.weekSel = null; wk.innerHTML = weekHTML(); }
}
function startLive() {
  clearInterval(liveTimer);
  lastSigns = state.chart ? signSnapshot() : null;
  liveTimer = setInterval(tickLive, 30000);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) tickLive(); });

function keyPattern(ch) {
  const max = Math.max(...ch.signCount);
  if (max >= 3) {
    const s = ch.signCount.indexOf(max);
    const inSign = ch.planets.filter((p) => p.sign === s);
    const h = inSign[0].house;
    return {
      title: `ดาว ${max} ดวงรวมกันในราศี${SIGNS[s].th} ภพ ${h}`,
      body: `พลังชีวิตรวมอยู่ที่เรื่อง${HOUSES[h - 1]} และแสดงออกแบบชาว${SIGNS[s].th}: ${SIGNS[s].trait}`,
      code: inSign.map((p) => p.glyph).join(' ') + ' · ' + SIGNS[s].en.toUpperCase() + ' · H' + h
    };
  }
  const e = ch.elementCount.indexOf(Math.max(...ch.elementCount));
  return { title: `ธาตุ${ELEMENTS[e].th}เด่นที่สุดในดวง`, body: 'ดาวส่วนใหญ่อยู่ในราศีธาตุ' + ELEMENTS[e].th + ' เป็นพลังหลักที่ขับเคลื่อนชีวิต', code: ELEMENTS[e].id.toUpperCase() + ' DOMINANT' };
}

function planetText(p) {
  return `${p.kw} แสดงออกแบบราศี${SIGNS[p.sign].th} (${SIGNS[p.sign].trait}) และเกี่ยวกับเรื่อง${HOUSES[p.house - 1]}${p.retro ? ' · ดาวถอยหลังตอนเกิด พลังของดาวนี้หันเข้าด้านใน' : ''}`;
}
const ASPECT_TEXT = {
  1: 'สองพลังส่งเสริมกัน ใช้ได้อย่างเป็นธรรมชาติ',
  [-1]: 'สองพลังดึงกันคนละทาง เป็นแรงผลักให้เติบโตถ้าหาสมดุลได้',
  0: 'สองพลังหลอมรวมกัน ส่งผลชัดเจน'
};

function senseHTML(ch) {
  const x = sixthSense(ch);
  const R = 34, C = 2 * Math.PI * R, dash = (x.overall / 100) * C;
  const levelColor = (l) => l === 'เด่นมาก' ? 'var(--gold-2)' : l === 'เด่น' ? 'var(--gold)' : l === 'มีบ้าง' ? 'var(--violet)' : 'var(--muted)';
  const summary = x.top.score >= 22 ? `เซนส์ที่เด่นที่สุดของคุณคือ "${x.top.th}"` : 'ดวงของคุณเน้นเหตุผลมากกว่าสัมผัสพิเศษ เชื่อสิ่งที่พิสูจน์ได้';
  return `<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">สัมผัสพิเศษ · เซนส์จากดวงดาว</h2>
<div class="card sense-hero">
<svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" fill="none" stroke="#2C261B" stroke-width="5"/>
<circle cx="42" cy="42" r="${R}" fill="none" stroke="url(#sg)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/>
<defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#9C7CE0"/><stop offset="1" stop-color="#F0D89A"/></linearGradient></defs>
<text x="42" y="47" text-anchor="middle" font-family="IBM Plex Mono" font-size="17" fill="#F1E6CF">${x.overall}</text></svg>
<span style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="eyebrow" style="letter-spacing:.14em;color:var(--violet)">SIXTH SENSE · ระดับเซนส์</span>
<span class="h2" style="font-size:16px">${summary}</span>
<span class="small" style="font-size:11px">ดาวเกตุ (ดาวแห่งญาณ) อยู่ราศี${SIGNS[x.ketu.sign].th}${x.ketu.house ? ' ภพ ' + x.ketu.house : ''}</span></span>
</div>
<ul class="sense-list">${x.list.map((r) => `<li class="sense">
<button class="sense-head" data-act="senseToggle" aria-expanded="false">
<span class="sense-ic sym" aria-hidden="true">${r.icon}&#xFE0E;</span>
<span style="flex:1;display:flex;flex-direction:column;gap:5px;min-width:0"><span style="display:flex;justify-content:space-between;gap:8px"><span class="n">${r.th}</span><span class="lv" style="color:${levelColor(r.level)}">${r.level}</span></span>
<span class="tr-bar" style="width:100%;margin:0"><span style="width:${Math.max(3, r.score)}%;background:${levelColor(r.level)}"></span></span></span>
<span class="chev">${icon('down', 16, 1.6)}</span></button>
<div class="fold"><div class="fold-in"><div class="sense-body"><p class="small" style="color:var(--text-2)">${r.desc}</p>
${r.why.length ? `<ul class="why">${r.why.map((w) => `<li class="ok">${w}</li>`).join('')}</ul>` : '<p class="small">ไม่พบตำแหน่งดาวที่บ่งชี้เรื่องนี้ชัดเจน</p>'}</div></div></div></li>`).join('')}</ul>
<p class="small" style="font-size:11px">ประเมินจากตำแหน่งดาวที่ตำราโหราศาสตร์ถือว่าเกี่ยวกับสัมผัสพิเศษ: ดาวเนปจูน ดวงจันทร์ ดาวพลูโต ดาวมฤตยู ดาวเกตุ ภพ 8 ภพ 12 และธาตุน้ำ · เป็นความเชื่อทางโหราศาสตร์ ไม่ใช่การพิสูจน์ทางวิทยาศาสตร์</p>
</section>`;
}

function identityHTML(ch, p) {
  const r = natalProfile(ch, p);
  const symCard = (x) => {
    let visual = '';
    if (x.k === 'color') visual = `<span class="sym-sw"><i style="background:${x.hex}"></i>${x.hex2 ? `<i style="background:${x.hex2}"></i>` : ''}</span>`;
    else if (x.k === 'number') visual = `<span class="sym-num mono">${x.value}</span>`;
    else if (x.k === 'planet') visual = `<span class="sym-num sym">${x.glyph}&#xFE0E;</span>`;
    return `<div class="sym-card">${visual}<span class="eyebrow" style="letter-spacing:.1em;font-size:10px">${x.label}</span>
<span class="v">${x.k === 'number' ? 'เลข ' : ''}${x.value}${x.en ? ` <span class="small" style="font-size:11px">${x.en}</span>` : ''}</span>
<span class="small" style="font-size:11px">${x.basis}</span>${x.extra ? `<span class="small" style="font-size:11px;color:var(--text-2)">${x.extra}</span>` : ''}</div>`;
  };
  const item = (x, tone) => `<li class="trait ${tone}"><span class="tg" aria-hidden="true">${(x.glyphs || []).map((g) => `<span class="sym">${g}&#xFE0E;</span>`).join('') || '·'}</span>
<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="n">${x.title}</span><span class="small" style="color:var(--text-2)">${x.body}</span><span class="mono" style="font-size:10px;color:var(--muted)">${x.src}</span></span></li>`;
  return `<p class="small" style="font-size:13px">ทุกข้อคำนวณจากดวงกำเนิดของคุณ และบอกที่มาไว้ใต้แต่ละข้อ${ch.timeKnown ? '' : ' · ไม่ทราบเวลาเกิด จึงไม่มีข้อมูลจากลัคนาและภพ'}</p>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">สัญลักษณ์ประจำดวง</h2>
<div class="sym-grid">${r.symbols.map(symCard).join('')}</div></section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">จุดเด่นของดวง</h2>
${r.highlights.map((h, i) => `<div class="card hl"><span class="mono" style="font-size:10px;color:var(--gold)">0${i + 1}</span><p class="h2" style="font-size:16px">${h.title}</p><p class="body" style="font-size:13px">${h.body}</p></div>`).join('')}</section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">ลักษณะนิสัย</h2>
<div class="row-list">${r.personality.map((x) => `<div class="planet-row"><span class="g" aria-hidden="true">${SIGNS[x.sign].glyph}&#xFE0E;</span><span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:13px;color:var(--gold-2)">${x.label}</span><span class="small" style="color:var(--text)">${x.text}</span></span><span></span></div>`).join('')}</div></section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">ความสามารถพิเศษจากมุมดาว</h2>
<div class="badges">${r.talents.map((t) => `<span class="badge">${t.title}</span>`).join('')}</div>
<ul class="trait-list">${r.talents.map((t) => item(t, 'good')).join('')}</ul></section>
${senseHTML(ch)}
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">อาชีพที่เหมาะ</h2>
<div class="card" style="gap:10px"><p class="body" style="font-size:14px">${r.career.style}</p>
<div class="tags">${r.career.list.map((c) => `<span class="tag">${c}</span>`).join('')}</div>
<p class="mono" style="font-size:10px;color:var(--muted)">${r.career.basis}</p></div></section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">เรื่องที่ต้องระวัง</h2>
<ul class="trait-list">${r.cautions.map((t) => item(t, 'bad')).join('')}</ul></section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">โชคลาภและสุขภาพ</h2>
<div class="card" style="gap:8px"><p class="small" style="color:var(--text)"><span style="color:var(--gold-2)">โชคลาภ ·</span> ${r.luck}</p>
${r.health.map((h) => `<p class="small" style="color:var(--text)"><span style="color:var(--gold-2)">จุดที่ควรดูแล ·</span> ${h}</p>`).join('')}
<p class="small" style="font-size:11px">ข้อมูลสุขภาพตามตำราโหราศาสตร์ ไม่ใช่คำวินิจฉัยทางการแพทย์</p></div></section>`;
}

function viewChart() {
  const ch = state.chart, p = state.profile, tab = state.chartTab, now = new Date();
  const kp = keyPattern(ch);
  const elOrder = [0, 1, 2, 3].sort((a, b) => ch.elementCount[b] - ch.elementCount[a]);
  const top = elOrder[0], low = elOrder[3];
  let body = '';
  if (tab === 0) {
    body = `<div style="display:flex;justify-content:center">${starMap(ch, { id: 'chart', houses: true, label: 'ผังดาวกำเนิดฉบับเต็ม' })}</div>
<div class="legend"><span><i style="background:var(--harmony)"></i>HARMONY</span><span><i style="background:var(--tension)"></i>TENSION</span><span>WHOLE SIGN</span></div>
${bigThree(ch)}
<section class="card"><span class="eyebrow" style="letter-spacing:.2em">KEY PATTERN</span><p class="h2" style="font-size:17px">${kp.title}</p><p class="body">${kp.body}</p><p class="mono small" style="font-size:10px">${kp.code}</p></section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">ELEMENTS · สมดุลธาตุ</h2>
${[0, 1, 2, 3].map((e) => `<div class="el-row"><span>ธาตุ${ELEMENTS[e].th}</span><span class="el-bar" role="img" aria-label="ธาตุ${ELEMENTS[e].th} ${ch.elementCount[e]} ดวง"><span class="${e === top ? 'top' : ''}" style="width:${ch.elementCount[e] * 10}%"></span></span><span class="mono" style="text-align:right">${ch.elementCount[e]}</span></div>`).join('')}
<p class="small" style="font-size:13px">ธาตุ${ELEMENTS[top].th}เด่น ส่วนธาตุ${ELEMENTS[low].th}น้อยที่สุด ลองเติมพลังด้านนี้ในชีวิตประจำวัน</p></section>
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">ASPECTS · มุมสำคัญ</h2>
<div class="row-list">${ch.aspects.slice(0, 6).map((a) => `<div style="padding:10px 0;display:flex;flex-direction:column;gap:3px">
<span style="font-size:14px;font-weight:500">${G(a.a.glyph)} ${a.a.th} ${a.th} ${G(a.b.glyph)} ${a.b.th} <span class="mono small" style="font-size:10px">${a.off.toFixed(1)}°</span></span>
<span class="small" style="color:${a.nature > 0 ? 'var(--harmony)' : a.nature < 0 ? 'var(--tension)' : 'var(--text-2)'}">${ASPECT_TEXT[a.nature]}</span></div>`).join('')}</div></section>`;
  } else if (tab === 1) {
    body = `<p class="small" style="font-size:13px">ตำแหน่งดาวทั้ง 10 ดวง ณ เวลาเกิด${ch.timeKnown ? '' : ' (ไม่ทราบเวลา: ภพนับจากราศีดวงอาทิตย์ และดวงจันทร์อาจคลาดได้ถึง ±6°)'}</p>
<div class="row-list">${ch.planets.map((pl) => `<div class="planet-row"><span class="g" aria-hidden="true">${pl.glyph}&#xFE0E;</span>
<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span style="font-size:14px;font-weight:500">${pl.th} <span style="color:var(--text-2);font-weight:400">ใน${SIGNS[pl.sign].th}</span>${pl.retro ? ' <span class="mono small" style="font-size:10px;color:var(--tension)">R</span>' : ''}</span><span class="small">${planetText(pl)}</span></span>
<span class="deg"><span>${fmtDeg(pl.lon)}</span><span class="small" style="font-size:10px">H${pl.house}</span></span></div>`).join('')}
${ch.asc != null ? `<div class="planet-row"><span class="g mono" style="font-size:11px;padding-top:4px">ASC</span><span style="display:flex;flex-direction:column;gap:3px"><span style="font-size:14px;font-weight:500">ลัคนา <span style="color:var(--text-2);font-weight:400">ใน${SIGNS[signOf(ch.asc)].th}</span></span><span class="small">ภาพลักษณ์ที่คนอื่นเห็น: ${SIGNS[signOf(ch.asc)].trait}</span></span><span class="deg"><span>${fmtDeg(ch.asc)}</span></span></div>` : ''}</div>`;
  } else if (tab === 3) {
    body = identityHTML(ch, p);
  } else {
    const tr = transits(ch, now);
    const col = (t) => t.level === 'HIGH' ? 'var(--tension)' : t.level === 'SUPPORT' ? 'var(--gold)' : 'var(--harmony)';
    body = `<p class="small" style="font-size:13px">ดาวเคลื่อนช้าที่โคจรอยู่ตอนนี้ เทียบกับดวงกำเนิดของคุณ เรียงตามน้ำหนัก</p>
<div class="timeline">${tr.map((t) => `<div class="item"><span class="dot" style="background:${col(t)};box-shadow:0 0 10px ${col(t)}"></span>
<span class="mono small" style="font-size:11px">ตอนนี้ ${t.exit ? '→ ถึง ' + monthYear(t.exit) : ''}${t.retro ? ' · ถอยหลัง' : ''}</span>
<span class="h2" style="font-size:17px">${G(t.glyph)} ${t.title}</span>
<span class="body" style="font-size:13px">${t.body}</span>
${t.hits.length ? `<span class="tags">${t.hits.map((h) => `<span class="tag">${h.th} ${h.target.th}</span>`).join('')}</span>` : ''}
<span class="level" style="color:${col(t)}">${t.level}</span></div>`).join('')}</div>`;
  }
  const tabBtn = (i, t) => `<button role="tab" aria-selected="${tab === i}" data-act="chartTab" data-i="${i}">${t}</button>`;
  return `<main class="screen">
<div style="display:flex;flex-direction:column;gap:10px;border-bottom:1px solid var(--line)">
<div style="display:flex;align-items:center;gap:14px"><span class="sigil" style="color:var(--gold)">${icon('chart', 22, 1.3)}</span>
<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span class="eyebrow">01 · NATAL CHART</span><h1 class="h1" style="font-size:24px">ผังดาวกำเนิด</h1></div>
<a class="link-btn" href="#/setup" style="font-weight:500;font-size:13px">แก้ไข</a></div>
<p class="mono small" style="font-size:11px">${esc(p.name || 'ฉัน')} · ${pad(p.day)}.${pad(p.month)}.${p.yearBE - 543} ${p.timeKnown ? pad(p.hour) + ':' + pad(p.minute) : '--:--'} · ${esc(p.place.name || 'พิกัดกำหนดเอง')}</p>
<div class="tabs" role="tablist" aria-label="มุมมองดวง">${tabBtn(0, 'ผังดาว')}${tabBtn(3, 'ตัวตน')}${tabBtn(1, 'ดาวในภพ')}${tabBtn(2, 'ดวงจร')}</div></div>
${body}
<a class="btn" href="#/ask">ถามผู้เชี่ยวชาญเรื่องดวงนี้</a>
</main>`;
}

function viewMatch() {
  const ch = state.chart, m = state.match;
  const me = ch.planets[0].sign;
  let theirPos = null;
  if (m.useDate) {
    const utc = localToUtc(m.yearBE - 543, m.month, m.day, 12, 0, { tz: 'Asia/Bangkok' });
    theirPos = planetPositions(utc);
    m.sign = signOf(theirPos.sun.lon);
  }
  if (m.sign == null) m.sign = (me + 4) % 12;
  const res = compatibility(me, m.sign, ch, theirPos);
  const dash = Math.round((res.score / 100) * 326.7);
  const maxDay = daysIn(m.month, m.yearBE);
  return `<main class="screen" style="--accent:var(--rose)">
${pageHead('02', 'COMPATIBILITY', 'คู่ดวง', 'var(--rose)', 'match')}
<section class="pair" aria-label="ผลเทียบดวง">
<div class="s"><span class="gl glow-text" style="color:var(--gold)">${SIGNS[me].glyph}&#xFE0E;</span><span class="label" style="font-size:9px">YOU</span><span class="h2" style="font-size:16px">${SIGNS[me].th}</span></div>
<div class="gauge"><svg role="img" aria-label="ความเข้ากัน ${res.score} เปอร์เซ็นต์" width="130" height="130" viewBox="0 0 130 130" fill="none">
<circle cx="65" cy="65" r="52" stroke="#2C261B" stroke-width="5"/><circle cx="65" cy="65" r="52" stroke="#D98C86" stroke-width="5" stroke-linecap="round" stroke-dasharray="${dash} 327" transform="rotate(-90 65 65)"/>
<circle cx="65" cy="65" r="60" stroke="#3D3424" stroke-width="0.6" stroke-dasharray="1 4"/></svg>
<div class="num"><span class="mono" style="font-size:30px;font-weight:500;line-height:1">${res.score}</span><span class="label" style="font-size:9px">MATCH %</span></div></div>
<div class="s"><span class="gl" style="color:var(--rose);text-shadow:0 0 14px rgba(217,140,134,.5)">${SIGNS[m.sign].glyph}&#xFE0E;</span><span class="label" style="font-size:9px">PARTNER</span><span class="h2" style="font-size:16px">${SIGNS[m.sign].th}</span></div>
</section>
<section class="card"><span class="eyebrow" style="color:var(--rose);letter-spacing:.2em">WHY</span>
<p class="h2" style="font-size:17px">${res.reading}</p>
<div class="tags">${res.tags.concat(res.links).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
${m.useDate ? '<p class="small">เทียบดาวอาทิตย์ จันทร์ ศุกร์ และอังคารของทั้งสองคน</p>' : ''}</section>
<section style="display:flex;flex-direction:column;gap:10px">
<button type="button" class="check" aria-pressed="${m.useDate}" data-act="matchDate"><span class="box">${m.useDate ? '✓' : ''}</span>ใส่วันเกิดของอีกฝ่าย (แม่นกว่า)</button>
${m.useDate ? `<div class="date-row">
<label class="field">วัน<select class="select mono" data-in="m.day">${opts(range(1, maxDay).map((n) => [n, n]), Math.min(m.day, maxDay))}</select></label>
<label class="field">เดือน<select class="select" data-in="m.month">${opts(MONTHS_TH.map((x, i) => [i + 1, x]), m.month)}</select></label>
<label class="field">ปี พ.ศ.<select class="select mono" data-in="m.yearBE">${opts(range(2443, 2643).reverse().map((n) => [n, n]), m.yearBE)}</select></label></div>`
    : `<h2 class="label">เลือกราศีของอีกฝ่าย</h2>
<div class="sign-grid" role="radiogroup" aria-label="ราศีของอีกฝ่าย">${SIGNS.map((s, i) => `<button class="sign-btn${i === me ? ' me' : ''}" role="radio" aria-checked="${i === m.sign}" data-act="matchSign" data-i="${i}"><span class="gl" aria-hidden="true">${s.glyph}&#xFE0E;</span>${s.th}</button>`).join('')}</div>`}
</section></main>`;
}

// ---------------- tarot (Rider–Waite–Smith, 78 cards) ----------------
const TAROT_TOPICS = [{ th: 'ภาพรวม', f: 'up' }, { th: 'ความรัก', f: 'love' }, { th: 'การงาน', f: 'work' }, { th: 'การเงิน', f: 'work' }];
const CARD_BACK = `<svg aria-hidden="true" viewBox="0 0 120 208" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
<defs><radialGradient id="cbg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#2A2140"/><stop offset="1" stop-color="#110E18"/></radialGradient>
<pattern id="cbp" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M6 0L12 6L6 12L0 6Z" fill="none" stroke="#3A3058" stroke-width=".6"/></pattern></defs>
<rect width="120" height="208" fill="url(#cbg)"/><rect width="120" height="208" fill="url(#cbp)"/>
<rect x="6" y="6" width="108" height="196" rx="4" fill="none" stroke="#D4AF63" stroke-width=".8"/><rect x="10" y="10" width="100" height="188" rx="3" fill="none" stroke="#D4AF63" stroke-width=".4" opacity=".6"/>
<g fill="none" stroke="#D4AF63" stroke-width=".7"><circle cx="60" cy="104" r="30"/><circle cx="60" cy="104" r="22" stroke-dasharray="1 2.4"/><path d="M60 64v80M20 104h80" opacity=".4"/></g>
<path d="M60 86l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="#F0D89A"/><circle cx="60" cy="40" r="1.6" fill="#F0D89A"/><circle cx="60" cy="168" r="1.6" fill="#F0D89A"/></svg>`;
const cardAstro = (c) => {
  if (c.major) return c.sign != null ? `ไพ่ประจำราศี${SIGNS[c.sign].th} ${SIGNS[c.sign].glyph}&#xFE0E;` : `ไพ่ประจำดาว${planetById(c.planet).th} ${planetById(c.planet).glyph}&#xFE0E;`;
  if (c.sign != null) return `ดาว${planetById(c.planet).th}ในราศี${SIGNS[c.sign].th} · ธาตุ${ELEMENTS[c.element].th}`;
  return `ธาตุ${ELEMENTS[c.element].th} · ชุด${c.suitInfo.th}`;
};
// How the card touches the person's own chart.
// Who the reading is for: the user (their chart) or someone else (optional birth date, no time).
let otherChartCache = null;
function tChart() {
  const t = state.tarot;
  if (t.who === 'me') return state.chart;
  if (!t.other.known) return null;
  const o = t.other, key = `${o.day}-${o.month}-${o.yearBE}`;
  if (!otherChartCache || otherChartCache.key !== key) {
    otherChartCache = { key, chart: safeChart({ name: o.name, day: o.day, month: o.month, yearBE: o.yearBE, hour: 12, minute: 0, timeKnown: false, place: PLACES[0], placeIdx: 0 }) };
  }
  return otherChartCache.chart;
}
const tFirst = () => { const ch = tChart(); return ch ? ch.firstSign : null; };
const tSubj = () => state.tarot.who === 'me' ? 'คุณ' : (state.tarot.other.name.trim() ? esc(state.tarot.other.name.trim()) : 'เขา');
function cardLink(c, houseSign) {
  const ch = tChart(), out = [], who = tSubj();
  if (!ch) return out;
  const sun = ch.planets[0], moon = ch.planets[1], asc = ch.timeKnown ? signOf(ch.asc) : null;
  if (houseSign != null && c.sign === houseSign) out.push(`ไพ่ใบนี้เป็นราศีเดียวกับภพนี้ของ${who} พลังส่งตรงเต็มที่`);
  else if (houseSign != null && c.element != null && c.element === houseSign % 4) out.push(`ธาตุ${ELEMENTS[c.element].th}ของไพ่ตรงกับราศีของภพนี้ เสริมกันดี`);
  if (c.sign != null && c.sign === sun.sign) out.push(`ตรงกับราศีเกิดของ${who} (${SIGNS[sun.sign].th}) เรื่องนี้เกี่ยวกับตัว${who}โดยตรง`);
  else if (c.sign != null && c.sign === moon.sign) out.push(`ตรงกับราศีดวงจันทร์ของ${who} เรื่องนี้กระทบใจมาก`);
  else if (c.sign != null && c.sign === asc) out.push(`ตรงกับราศีลัคนาของ${who} คนรอบตัวจะเห็นผลชัด`);
  if (c.planet && ch.timeKnown && ch.planets.find((p) => p.id === c.planet)) {
    const pl = ch.planets.find((p) => p.id === c.planet);
    out.push(houseSign != null ? `ดาว${pl.th}ในดวงกำเนิดของ${who}อยู่ภพ${HOUSE_READ[pl.house - 1].th} เรื่อง${HOUSE_READ[pl.house - 1].short}จะได้รับผลของไพ่ใบนี้ด้วย` : `ดาว${pl.th}ในดวงกำเนิดของ${who}อยู่ภพ ${pl.house} เรื่อง${HOUSES[pl.house - 1].split(' ')[0]}จะได้รับผลของไพ่ใบนี้ด้วย`);
  }
  return out.slice(0, 2);
}
const lean = (c, rev) => rev ? (c.yes === 1 ? 0 : -1) : c.yes;
const LEAN_TH = { 1: 'ใช่ ไปได้', 0: 'ยังไม่ชัด รอดูอีกนิด', '-1': 'ยังไม่ใช่ตอนนี้' };

function tarotCardHTML(d, i, opts = {}) {
  const c = CARDS[d.i], open = state.tarot.flipped.includes(i);
  return `<button class="tc${open ? ' flipped' : ''}${opts.sel ? ' sel' : ''}${d.rev ? ' rev' : ''}" data-act="tarotFlip" data-i="${i}" aria-label="${open ? c.th + (d.rev ? ' กลับหัว' : '') : 'เปิดไพ่ใบที่ ' + (i + 1)}">
<span class="tc-in"><span class="tc-back">${CARD_BACK}</span><span class="tc-front"><img src="${c.img}" alt="${c.en}" loading="lazy" decoding="async"></span></span></button>`;
}

function tarotReading(d, i, spread) {
  const c = CARDS[d.i], t = state.tarot, topic = TAROT_TOPICS[t.topic];
  const pos = spread.pos[i];
  let field = topic.f, head = pos.th, houseSign = null, q = '';
  if (spread.house) {
    const h = HOUSE_READ[i];
    field = h.use; houseSign = tFirst() == null ? null : (tFirst() + i) % 12; q = h.q;
    head = `ภพ${h.th} · เรื่อง${h.q}`;
  }
  const main = d.rev ? c.rev : (field === 'up' ? c.up : c[field]);
  const extra = d.rev ? `ถ้าแก้จุดนี้ได้ พลังของไพ่จะกลับมา: ${field === 'up' ? c.up : c[field]}` : (field !== 'up' ? c.up : '');
  const links = cardLink(c, houseSign);
  return `<article class="reading">
<img class="r-img${d.rev ? ' rev' : ''}" src="${c.img}" alt="" loading="lazy">
<div class="r-body">
<span class="eyebrow" style="color:var(--violet);letter-spacing:.14em">${spread.house ? `ภพที่ ${i + 1} · ${HOUSE_READ[i].th}${houseSign != null ? ' · ราศี' + SIGNS[houseSign].th : ''}` : pos.en}${d.rev ? ' · กลับหัว' : ''}</span>
<h3 class="h2" style="font-size:18px">${spread.house ? `พบ${HOUSE_READ[i].short}: ` : head + ': '}${c.th}</h3>
<span class="mono" style="font-size:10px;color:var(--muted)">${c.en}${spread.house ? ' · ' + head : ''}</span>
<span class="r-kw">${c.kw}</span>
<p class="body" style="font-size:14px">${main}</p>
${extra ? `<p class="small" style="color:var(--text-2)">${extra}</p>` : ''}
<p class="r-pic">ในภาพ: ${c.pic}</p>
<p class="r-astro">${cardAstro(c)}</p>
${links.map((l) => `<p class="r-link">✦ ${l}</p>`).join('')}
</div></article>`;
}

function tarotSummary(spread, cards) {
  const t = state.tarot;
  if (t.flipped.length < cards.length) return '';
  const C = cards.map((d) => ({ c: CARDS[d.i], rev: d.rev }));
  if (spread.id === 'one') {
    const l = lean(C[0].c, C[0].rev);
    return `<div class="card t-sum"><span class="eyebrow" style="color:var(--violet);letter-spacing:.16em">คำตอบจากไพ่</span><p class="h2" style="font-size:22px;color:${l > 0 ? 'var(--gold-2)' : l < 0 ? 'var(--tension)' : 'var(--text)'}">${LEAN_TH[l]}</p>${t.q ? `<p class="small">คำถาม: ${esc(t.q)}</p>` : ''}</div>`;
  }
  if (spread.id === 'two') {
    const sc = C.map((x) => lean(x.c, x.rev) * (x.c.major ? 1.5 : 1) + (x.rev ? -0.3 : 0));
    const pick = sc[0] === sc[1] ? 'ทั้งสองทางพลังพอ ๆ กัน เลือกทางที่ใจสบายกว่า' : `ไพ่เอียงไปทาง${sc[0] > sc[1] ? ' A' : ' B'} มากกว่า`;
    return `<div class="card t-sum"><span class="eyebrow" style="color:var(--violet);letter-spacing:.16em">สรุปสองทางเลือก</span><p class="h2" style="font-size:19px">${pick}</p>${t.q ? `<p class="small">คำถาม: ${esc(t.q)}</p>` : ''}</div>`;
  }
  if (spread.id === 'three') {
    const k = C.map((x) => x.c.kw.split(' · ')[0]);
    const end = lean(C[2].c, C[2].rev);
    return `<div class="card t-sum"><span class="eyebrow" style="color:var(--violet);letter-spacing:.16em">เส้นเรื่องของ${tSubj()}</span><p class="h2" style="font-size:17px">${k[0]} → ${k[1]} → ${k[2]}</p><p class="small">${end > 0 ? 'ปลายทางออกมาดี เดินต่อได้เลย' : end < 0 ? 'ปลายทางยังมีบทเรียน ใช้คำแนะนำในไพ่ใบสุดท้ายเพื่อเปลี่ยนผล' : 'อนาคตยังเปิดกว้าง ขึ้นอยู่กับการตัดสินใจตอนนี้'}</p></div>`;
  }
  const majors = C.map((x, i) => ({ ...x, h: i + 1 })).filter((x) => x.c.major);
  const suits = { w: 0, c: 0, s: 0, p: 0 }; C.forEach((x) => { if (x.c.suit) suits[x.c.suit] += 1; });
  const domSuit = Object.entries(suits).sort((a, b) => b[1] - a[1])[0];
  const revN = C.filter((x) => x.rev).length;
  const best = C.map((x, i) => ({ l: lean(x.c, x.rev) + (x.c.major ? 0.5 : 0), h: i + 1 })).sort((a, b) => b.l - a.l)[0];
  return `<div class="card t-sum"><span class="eyebrow" style="color:var(--violet);letter-spacing:.16em">ภาพรวม 12 ภพ</span>
<p class="h2" style="font-size:17px">ช่วงนี้ชีวิต${tSubj()}หมุนรอบเรื่อง${CARDS[0] && domSuit[1] >= 4 ? domSuit[0] === 'w' ? 'แรงบันดาลใจและการลงมือ' : domSuit[0] === 'c' ? 'ความรู้สึกและความรัก' : domSuit[0] === 's' ? 'ความคิดและการตัดสินใจ' : 'เงินและงาน' : 'หลายด้านพร้อมกัน'}</p>
<p class="small" style="color:var(--text)">ไพ่ชุดใหญ่ ${majors.length} ใบ${majors.length ? ` อยู่ภพ${majors.map((x) => HOUSE_READ[x.h - 1].th + ' (' + HOUSE_READ[x.h - 1].short + ')').join(' ')} ซึ่งเป็นเรื่องที่ชะตากำลังขยับแรง` : ' ชีวิตช่วงนี้อยู่ในมือคุณเองมากกว่าโชคชะตา'} · ไพ่กลับหัว ${revN} ใบ${revN >= 5 ? ' มีหลายเรื่องที่ต้องแก้' : ''} · ภพที่ดีที่สุดคือภพ${HOUSE_READ[best.h - 1].th} เรื่อง${HOUSE_READ[best.h - 1].q}</p>
<p class="small">กดไพ่แต่ละภพเพื่ออ่านละเอียด</p></div>`;
}

// Zodiac wheel for the 12-house spread. House 1 sits at the left (the ascendant) and the
// houses run counter-clockwise, the same way as the star map.
const WHEEL_R = 43.5, WHEEL_H = 106; // card ring radius and box height, in % of the width
const houseAngle = (i) => (195 + i * 30) * Math.PI / 180;
function wheelPos(i, r = WHEEL_R) {
  const a = houseAngle(i);
  return { x: 50 + r * Math.cos(a), y: WHEEL_H / 2 - r * Math.sin(a) };
}
// Picture icons for the twelve Thai houses (24-unit line drawings).
const HOUSE_ICONS = [
  '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 4.5-6.5 8-6.5s6.5 2 8 6.5"/>',
  '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/>',
  '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8" r="3"/><path d="M2.5 20c.8-3.5 3-5.5 5.5-5.5s4.7 2 5.5 5.5M11 20c.8-3.5 3-5.5 5.5-5.5s4.7 2 5.5 5.5"/>',
  '<path d="M3 11L12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  '<circle cx="12" cy="7" r="3.5"/><path d="M8 20v-4.5a4 4 0 0 1 8 0V20M5.5 12.5l3 2M18.5 12.5l-3 2"/>',
  '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M12 8.5v6M9 11.5h6"/>',
  '<circle cx="9" cy="14.5" r="5.5"/><circle cx="15" cy="14.5" r="5.5"/><path d="M13 6.5l2-2.5 2 2.5-2 1.6z"/>',
  '<path d="M6 3h12M6 21h12"/><path d="M7.5 3c0 5 9 5 9 9s-9 4-9 9M16.5 3c0 5-9 5-9 9s9 4 9 9"/>',
  '<path d="M12 20c-4 0-8-3-9-7 3 0 6 1.5 9 5 3-3.5 6-5 9-5-1 4-5 7-9 7z"/><path d="M12 18c-2.5-2.5-3-6.5 0-11 3 4.5 2.5 8.5 0 11z"/>',
  '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5v-2A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3 12.5h18"/>',
  '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 5 3-5M12 9v11"/>',
  '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/><circle cx="17" cy="6" r="1"/>'
];
function wheelRing(sel) {
  const first = tFirst() ?? 0, cy = WHEEL_H / 2;
  const pt = (deg, r) => [50 + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];
  let sectors = '';
  for (let i = 0; i < 12; i++) {
    const a0 = 180 + i * 30, a1 = a0 + 30, [x0, y0] = pt(a0, 34), [x1, y1] = pt(a1, 34), [x2, y2] = pt(a1, 19), [x3, y3] = pt(a0, 19);
    const sg = (first + i) % 12, [gx, gy] = pt(a0 + 15, 28.6), [nx, ny] = pt(a0 + 15, 23);
    sectors += `<g class="w-sec${sel === i ? ' on' : ''}" data-h="${i}"><path d="M${x0.toFixed(2)} ${y0.toFixed(2)}A34 34 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A19 19 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)}Z"/>
<g class="w-ic" transform="translate(${(gx - 2.7).toFixed(2)} ${(gy - 2.7).toFixed(2)}) scale(.225)">${HOUSE_ICONS[i]}</g>
<text x="${nx.toFixed(2)}" y="${(ny + 0.8).toFixed(2)}" text-anchor="middle" font-size="2.7" font-weight="500" fill="#D9CCB0" font-family="IBM Plex Sans Thai">${HOUSE_READ[i].th}</text></g>`;
  }
  const [ax, ay] = pt(180, 38), [ax2] = pt(180, 15);
  return `<svg class="w-ring" viewBox="0 0 100 ${WHEEL_H}" aria-hidden="true">
<circle cx="50" cy="${cy}" r="38.5" fill="none" stroke="#2C261B" stroke-width=".25" stroke-dasharray=".6 1.2"/>
${sectors}
<circle cx="50" cy="${cy}" r="19" fill="#0D0B08" stroke="#D4AF63" stroke-width=".3"/>
<line x1="${ax.toFixed(2)}" y1="${ay}" x2="${ax2.toFixed(2)}" y2="${ay}" stroke="#D4AF63" stroke-width=".35" stroke-dasharray="1 .8"/>
<text x="${(ax + 0.6).toFixed(2)}" y="${(ay - 1.2).toFixed(2)}" font-size="2.2" fill="#D4AF63" font-family="IBM Plex Mono">ASC</text></svg>`;
}
function wheelHTML(slotFn, center, sel) {
  return `<div class="t-wheel">${wheelRing(sel)}
${Array.from({ length: 12 }, (_, i) => { const p = wheelPos(i); return `<div class="w-slot" style="left:${p.x.toFixed(2)}%;top:${(p.y / WHEEL_H * 100).toFixed(2)}%">${slotFn(i)}</div>`; }).join('')}
<div class="w-center" id="wheel-center">${center}</div></div>`;
}
function wheelCenter() {
  const t = state.tarot, all = t.cards && t.flipped.length === t.cards.length;
  if (!t.cards) return `<span class="eyebrow" style="color:var(--violet)">12 HOUSES</span><b>เลือกไพ่ ${t.picks.length}/12</b><span>วางตามภพของ${tSubj()}</span>`;
  if (!all) return `<span class="eyebrow" style="color:var(--violet)">12 HOUSES</span><b>${t.flipped.length}/12</b><span>แตะไพ่เพื่อเปิด</span>`;
  const i = t.sel, c = CARDS[t.cards[i].i], f = tFirst();
  return `<span class="eyebrow" style="color:var(--violet)">ภพ${HOUSE_READ[i].th}${f != null ? ' · ' + SIGNS[(f + i) % 12].th : ''}</span><b>${c.th}</b><span>เรื่อง${HOUSE_READ[i].short}${t.cards[i].rev ? ' · กลับหัว' : ''}</span>`;
}

function pickSlotsHTML() {
  const t = state.tarot, spread = SPREADS[t.spread], need = spread.pos.length;
  const slot = (k) => {
    const filled = k < t.picks.length;
    return `<span class="p-slot${filled ? ' on' : ''}${k === t.picks.length ? ' next' : ''}">${filled ? CARD_BACK : `<b>${k + 1}</b>`}</span>`;
  };
  if (spread.house) return wheelHTML((k) => slot(k), wheelCenter(), -1) + `<p class="p-hint">${t.picks.length < need ? `เลือกไพ่ใบที่ <b>${t.picks.length + 1}</b> สำหรับภพ${HOUSE_READ[t.picks.length].th} · ${HOUSE_READ[t.picks.length].short} ${tFirst() != null ? `(ราศี${SIGNS[(tFirst() + t.picks.length) % 12].th})` : ''}` : 'ครบแล้ว กำลังวางไพ่...'}</p>`;
  return `<div class="p-slots n${need}">${Array.from({ length: need }, (_, k) => `<span class="p-wrap">${slot(k)}<span class="t-lbl">${spread.house ? 'ภพ ' + (k + 1) : spread.pos[k].th}</span></span>`).join('')}</div>
<p class="p-hint">${t.picks.length < need ? `ตั้งจิต แล้วเลือกไพ่ใบที่ <b>${t.picks.length + 1}</b> จาก ${need} ใบ${spread.house ? '' : ` · ${spread.pos[t.picks.length].th}`}` : 'ครบแล้ว กำลังวางไพ่...'}</p>`;
}

const forChip = () => `<p class="for-chip"><span>ดูให้</span> ${state.tarot.who === 'me' ? 'ตัวเอง' : tSubj()}${state.tarot.who === 'other' && tChart() ? ` · ราศี${SIGNS[tChart().planets[0].sign].th}` : ''}</p>`;
function viewTarot() {
  const t = state.tarot, spread = SPREADS[t.spread];
  let body = '';
  if (t.deck && !t.cards) {
    const n = t.deck.length, mid = (n - 1) / 2;
    body = `${forChip()}<div id="pick-slots">${pickSlotsHTML()}</div>
<div class="fan-wrap" id="fan"><div class="fan" style="--n:${n}">${t.deck.map((_, k) => {
      const x = (k - mid) / mid;
      return `<button class="fan-card${t.picks.includes(k) ? ' taken' : ''}" data-act="tarotPick" data-i="${k}" aria-label="ไพ่คว่ำใบที่ ${k + 1}" style="--r:${(Math.sin(k * 1.7) * 5 + x * 6).toFixed(2)}deg;--y:${(Math.sin(k / 5) * 12 + 14).toFixed(1)}px;--d:${Math.abs(k - mid) * 9 | 0}">${CARD_BACK}</button>`;
    }).join('')}</div></div>
<p class="small" style="text-align:center">เลื่อนซ้ายขวาเพื่อดูไพ่ทั้ง 78 ใบ แล้วแตะใบที่ใจเรียก</p>
<div style="display:flex;gap:8px"><button class="btn btn-line" data-act="tarotDraw" style="flex:1">สับใหม่</button><button class="btn btn-line" data-act="tarotReset" style="flex:1">เปลี่ยนแบบเปิดไพ่</button></div>`;
  } else if (!t.cards) {
    const o = t.other;
    const step = (n, title, inner) => `<section class="t-step"><h2 class="t-step-h"><span>${n}</span>${title}</h2>${inner}</section>`;
    const who = `<div class="who-pick">
<button class="who-opt" data-act="tarotWho" data-v="me" aria-pressed="${t.who === 'me'}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 4.5-6.5 8-6.5s6.5 2 8 6.5"/></svg><b>ตัวเอง</b><span>${state.profile.name ? esc(state.profile.name) + ' · ' : ''}ราศี${SIGNS[state.chart.planets[0].sign].th}</span></button>
<button class="who-opt" data-act="tarotWho" data-v="other" aria-pressed="${t.who === 'other'}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8" r="3"/><path d="M2.5 20c.8-3.5 3-5.5 5.5-5.5s4.7 2 5.5 5.5M11 20c.8-3.5 3-5.5 5.5-5.5s4.7 2 5.5 5.5"/></svg><b>คนอื่น</b><span>เพื่อน คนรัก ครอบครัว</span></button></div>
${t.who === 'other' ? `<div class="who-card">
<label class="field">ชื่อหรือชื่อเล่น (ไม่บังคับ)<input class="input" data-in="tarotOtherName" value="${esc(o.name)}" placeholder="เช่น น้องมิ้น" maxlength="40"></label>
<button type="button" class="check" data-act="tarotOtherKnown" aria-pressed="${o.known}"><span class="box">${o.known ? '✓' : ''}</span>รู้วันเกิดของเขา (ไพ่จะโยงกับราศีของเขา)</button>
${o.known ? `<div class="dob-row"><label class="field">วัน<select class="select mono" data-in="t.day">${opts(range(1, 31).map((n) => [n, n]), o.day)}</select></label>
<label class="field">เดือน<select class="select" data-in="t.month">${opts(MONTHS_TH.map((m, i) => [i + 1, m]), o.month)}</select></label>
<label class="field">ปี พ.ศ.<select class="select mono" data-in="t.yearBE">${opts(range(2443, 2643).reverse().map((n) => [n, n]), o.yearBE)}</select></label></div>` : '<p class="small">ไม่ใส่วันเกิดก็เปิดไพ่ได้ แต่จะไม่มีส่วนที่โยงกับดวง</p>'}
</div>` : ''}`;
    const MINI = [
      '<rect x="15" y="6" width="14" height="24" rx="2"/>',
      '<rect x="6" y="6" width="14" height="24" rx="2"/><rect x="24" y="6" width="14" height="24" rx="2"/>',
      '<rect x="1.5" y="8" width="12" height="20" rx="2"/><rect x="16" y="6" width="12" height="20" rx="2" transform="translate(0 2)"/><rect x="30.5" y="8" width="12" height="20" rx="2"/>',
      `<circle cx="22" cy="18" r="9" opacity=".5"/>${Array.from({ length: 12 }, (_, k) => { const a = (195 + k * 30) * Math.PI / 180; return `<rect x="${(22 + 14.5 * Math.cos(a) - 1.6).toFixed(1)}" y="${(18 - 14.5 * Math.sin(a) - 2.6).toFixed(1)}" width="3.2" height="5.2" rx=".6"/>`; }).join('')}`
    ];
    const spreads = `<div class="t-pick">${SPREADS.map((x, i) => `<button class="t-sp" data-act="tarotSpread" data-i="${i}" aria-pressed="${i === t.spread}">
<svg class="sp-mini" viewBox="0 0 44 36" aria-hidden="true">${MINI[i]}</svg><b>${x.th}</b><span>${x.sub}</span></button>`).join('')}</div>`;
    const TOPIC_IC = [
      '<path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4l-5.6 4.1 2.1-6.7L3 9.8h6.8z"/>',
      '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
      '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5v-2A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3 12.5h18"/>',
      '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-1.9-.4-2.5-1.2M12 6.5V8M12 16v1.5"/>'
    ];
    const topics = `<div class="topic-pick">${TAROT_TOPICS.map((x, i) => `<button class="topic-opt" data-act="tarotTopic" data-i="${i}" aria-pressed="${i === t.topic}"><svg viewBox="0 0 24 24" aria-hidden="true">${TOPIC_IC[i]}</svg>${x.th}</button>`).join('')}</div>`;
    const question = `<label class="q-box"><span class="q-mark" aria-hidden="true">“</span><textarea class="q-input" data-in="tarotQ" rows="2" maxlength="120" placeholder="${spread.id === 'two' ? 'เช่น ควรเลือกงานที่ A หรือ B' : 'เช่น เดือนนี้งานจะเป็นยังไง'}" aria-label="คำถามในใจ">${esc(t.q)}</textarea></label>`;
    const n = 7;
    body = `<div class="t-hero">
<div class="t-stars" aria-hidden="true">${Array.from({ length: 26 }, (_, k) => `<i style="left:${(k * 37) % 100}%;top:${(k * 53) % 100}%;animation-delay:${(k % 7) * 0.4}s"></i>`).join('')}</div>
<div class="deck-stack" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<span style="--k:${k};--m:${(n - 1) / 2}">${CARD_BACK}</span>`).join('')}</div>
<p class="t-hero-cap">ตั้งจิตให้นิ่ง แล้วเลือกวิธีเปิดไพ่</p></div>
${step(1, 'ดูให้ใคร', who)}
${step(2, 'วิธีเปิดไพ่', spreads)}
${spread.house ? `<p class="small t-note">เปิดไพ่ 12 ใบลงบนภพทั้ง 12 ตามหลักโหราศาสตร์ไทย เริ่มจากภพตนุ (ตัวเรา)${tFirst() != null ? ` ที่ราศี${SIGNS[tFirst()].th}${t.who === 'me' ? ' ซึ่งเป็นลัคนาของคุณ' : ` (ราศีเกิดของ${tSubj()})`}` : ''} ไปจนถึงภพวินาศ</p>`
    : step(3, 'เรื่องที่อยากรู้', topics) + step(4, 'คำถามในใจ <small>ไม่บังคับ</small>', question)}
<button class="btn t-cta" data-act="tarotDraw"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>สับไพ่ แล้วเลือกเอง ${spread.pos.length} ใบ</button>`;
  } else {
    const all = t.flipped.length === t.cards.length;
    const grid = spread.house
      ? wheelHTML((i) => tarotCardHTML(t.cards[i], i, { sel: all && t.sel === i }), wheelCenter(), all ? t.sel : -1)
      : `<div class="t-row n${t.cards.length}">${t.cards.map((d, i) => `<div class="t-slot">${tarotCardHTML(d, i)}<span class="t-lbl">${spread.pos[i].th}</span></div>`).join('')}</div>`;
    body = `${forChip()}${t.q && !spread.house ? `<p class="small" style="text-align:center">“${esc(t.q)}”</p>` : ''}
${grid}
<div id="tarot-reading">${tarotReadingArea()}</div>
<div style="display:flex;gap:8px">${!all ? '<button class="btn" data-act="tarotAll" style="flex:1">เปิดทั้งหมด</button>' : ''}<button class="btn btn-line" data-act="tarotReset" style="flex:1">สับไพ่ใหม่</button></div>`;
  }
  return `<main class="screen" style="--accent:var(--violet)">
${pageHead('03', 'TAROT', 'ไพ่ทาโรต์', 'var(--violet)', 'tarot')}
${body}
<p class="small" style="text-align:center;font-size:11px">สำรับ Rider–Waite–Smith 78 ใบ ภาพวาดต้นฉบับของ Pamela Colman Smith (1909) · ความหมายตามตำรา A. E. Waite</p>
</main>`;
}

function tarotReadingArea() {
  const t = state.tarot, spread = SPREADS[t.spread];
  if (!t.cards) return '';
  const sum = tarotSummary(spread, t.cards);
  if (spread.house) {
    const all = t.flipped.length === t.cards.length;
    if (!all) return `<p class="small" style="text-align:center">แตะไพ่เพื่อเปิดทีละภพ หรือกด "เปิดทั้งหมด"</p>`;
    return sum + tarotReading(t.cards[t.sel], t.sel, spread);
  }
  const open = t.flipped.slice().sort((a, b) => a - b);
  if (!open.length) return `<p class="small" style="text-align:center">แตะที่ไพ่เพื่อเปิด</p>`;
  return sum + open.map((i) => tarotReading(t.cards[i], i, spread)).join('');
}

function reduceNum(n, keepMaster) {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) n = String(n).split('').reduce((a, b) => a + +b, 0);
  return n;
}
const NUM_ICONS = {
  name: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 14h5"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 18.5h3"/>',
  plate: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M6 12h3M11 12h7"/>',
  id: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h5M14 13.5h4"/>',
  house: '<path d="M3 11L12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  bank: '<path d="M3 9.5L12 4l9 5.5M4.5 9.5v8M9.5 9.5v8M14.5 9.5v8M19.5 9.5v8M3 20h18"/>',
  hex: '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M9 9.5l-1.5 5M12.5 9.5L11 14.5M8 11h5M7.5 13h5"/>'
};
function nameResults() {
  const n = state.num, bp = n.day || (state.profile ? birthPlanet(state.profile) : 0);
  const L = bp ? luckOf(bp) : null;
  const r = analyzeName(n.first, n.last, { gender: n.gender, avoidPlanet: L ? L.avoid : null, goodPlanets: L ? [L.money, L.work, L.patron] : [] });
  if (!r) return '<p class="small num-empty">พิมพ์ชื่อเพื่อดูพลังของชื่อ</p>';
  const LVC = { best: 'var(--teal)', mid: 'var(--gold)', weak: 'var(--amber)', bad: 'var(--tension)' };
  const [gTh, gL] = gradeOf(r.score);
  const R = 30, C = 2 * Math.PI * R;
  const chip = (p) => { const tk = taksaOf(p.ch), kal = L && tk === L.avoid, good = L && [L.money, L.work, L.patron].includes(tk); return `<span class="lt${kal ? ' kal' : good ? ' good' : ''}"><b>${p.ch === '์' ? '◌์' : /[ะาำิีึืุูั็่้๊๋]/.test(p.ch) ? '◌' + p.ch : p.ch}</b><i>${p.v}</i></span>`; };
  return `<div class="card num-sum"><div class="ns-top">
<svg class="ns-ring" viewBox="0 0 72 72" aria-label="คะแนน ${r.score}"><circle cx="36" cy="36" r="${R}" fill="none" stroke="#2C261B" stroke-width="6"/><circle class="ring-arc" cx="36" cy="36" r="${R}" fill="none" stroke="#7FC4B4" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(r.score / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 36 36)" style="--c:${C.toFixed(1)}"/><text x="36" y="40" text-anchor="middle" font-family="IBM Plex Mono" font-size="15" fill="#F1E6CF">${r.score}</text></svg>
<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span class="eyebrow" style="color:var(--teal)">พลังชื่อรวม · เกรด ${gL}</span><b class="ns-title">${esc(n.first)} ${esc(n.last)}</b><span class="small" style="color:var(--text)">${gTh} · ชื่อ 40% นามสกุล 20% ชื่อรวมสกุล 40%</span></span></div>
${r.kalakiniFirst.length ? `<p class="small ns-note" style="color:var(--tension)">พบอักษรกาลกิณีในชื่อ: <b>${r.kalakiniFirst.join(' ')}</b> (ของคนเกิด${TH_PLANETS[bp].day}) ตำราแนะนำให้เลี่ยง</p>` : L ? `<p class="small ns-note" style="color:var(--teal)">ชื่อไม่มีอักษรกาลกิณีของคนเกิด${TH_PLANETS[bp].day}${r.kalakini.length ? ` (นามสกุลมี ${r.kalakini.join(' ')} แต่ตำรามักผ่อนผันให้นามสกุล)` : ''}</p>` : ''}
${r.lucky.length ? `<p class="small" style="margin:0">อักษรมงคลในชื่อ (ศรี เดช มนตรี): <b style="color:var(--gold-2)">${r.lucky.join(' ')}</b></p>` : ''}
</div>
${r.rows.map((row) => `<div class="nm-row" style="--lc:${LVC[row.rate.level]}">
<div class="nm-head"><span>${row.th}</span><b class="mono">${row.total}${row.rate.n !== row.total ? ' → ' + row.rate.n : ''}</b><span class="nm-lv">${LEVEL_TH[row.rate.level]}</span></div>
<div class="lt-row">${row.parts.map(chip).join('')}</div>
<p class="small" style="margin:0">ผลรวมรากเลข ${row.rate.root} ดาว${row.rate.planet}${row.rate.notes.length ? ' · ' + row.rate.notes.join(' · ') : ''}</p></div>`).join('')}
<p class="small">กรอบทองคืออักษรมงคลตามทักษาวันเกิด กรอบแดงคืออักษรกาลกิณี · กลุ่มผลรวมดี กลาง และที่ควรระวังตามตำราโหราเลขศาสตร์ ใช้เป็นแนวทางในการตั้งหรือเปลี่ยนชื่อ</p>`;
}
function numResults() {
  if (state.num.mode === 'name') return nameResults();
  const n = state.num, tool = NUM_TOOLS.find((t) => t.id === n.mode), v = n.values[n.mode] || '';
  const r = analyzeNumber(n.mode, v);
  if (!r) return `<p class="small num-empty">พิมพ์${tool.th}เพื่อดูผลวิเคราะห์</p>`;
  if (n.mode === 'hex') {
    return `<div class="card num-sum"><div class="ns-top">${r.color ? `<span class="hex-sw" style="background:${r.color}"></span>` : ''}<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="eyebrow" style="color:var(--teal)">HEX ${r.hex}</span><b class="ns-title">พลังเลข ${r.red}</b><span class="small">${r.meaning}</span></span></div>
<div class="hex-row">${r.hex.split('').map((c, i) => `<span><b>${c}</b><i>${r.vals[i]}</i></span>`).join('')}</div>
<p class="mono small" style="font-size:11px;margin:0">${r.vals.join(' + ')} = ${r.sum} → ${r.red}${r.decimal ? ` · ฐานสิบ ${r.decimal}` : ''}</p>
${r.color ? `<p class="small" style="margin:0">สีนี้ให้พลังเลข ${r.red} ใช้เป็นสีพื้นหลังโทรศัพท์หรือสีแบรนด์เพื่อเสริมพลังด้านนี้</p>` : ''}</div>`;
  }
  const [gTh, gL] = r.score != null ? gradeOf(r.score) : ['', ''];
  const R = 30, C = 2 * Math.PI * R;
  return `<div class="card num-sum"><div class="ns-top">
${r.score != null ? `<svg class="ns-ring" viewBox="0 0 72 72" aria-label="คะแนน ${r.score}"><circle cx="36" cy="36" r="${R}" fill="none" stroke="#2C261B" stroke-width="6"/><circle class="ring-arc" cx="36" cy="36" r="${R}" fill="none" stroke="#7FC4B4" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(r.score / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 36 36)" style="--c:${C.toFixed(1)}"/><text x="36" y="40" text-anchor="middle" font-family="IBM Plex Mono" font-size="15" fill="#F1E6CF">${r.score}</text></svg>` : ''}
<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span class="eyebrow" style="color:var(--teal)">ผลรวม ${r.sum} → ${r.red}${gL ? ' · เกรด ' + gL : ''}</span><b class="ns-title">${gTh || 'เลข ' + r.red}</b><span class="small" style="color:var(--text)">${r.meaning}</span></span></div>
${r.notes.map((x) => `<p class="small ns-note">${x}</p>`).join('')}</div>
${r.pairs.length ? `<h2 class="label" style="margin-top:4px">คู่เลข${r.pairNote ? ' · ' + r.pairNote : ''}</h2>
<div class="pairs">${r.pairs.map((p) => `<div class="${p.bad ? 'bad' : ''}"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="mono" style="font-size:22px">${p.n}</span><span class="mono small" style="color:${p.bad ? 'var(--tension)' : p.neutral ? 'var(--muted)' : 'var(--teal)'}">${p.bad ? '!' : p.neutral ? '·' : '+'}</span></div><span class="small" style="font-size:11px">${p.meaning}</span></div>`).join('')}</div>
<p class="small">+ ส่งเสริม · ! ควรระวัง · · กลาง ๆ — ตามหลักเลขศาสตร์ไทยแบบทั่วไป เพื่อเป็นแนวทาง</p>` : ''}`;
}
function viewNumbers() {
  const p = state.profile, n = state.num, tool = NUM_TOOLS.find((t) => t.id === n.mode);
  let lp = '', hexCard = '';
  if (p) {
    const ce = p.yearBE - 543;
    const digits = `${p.day}${p.month}${ce}`.split('').map(Number);
    const total = digits.reduce((a, b) => a + b, 0);
    const num = reduceNum(total, true);
    const [title, text] = LIFE_PATH[num] || LIFE_PATH[reduceNum(num, false)];
    lp = `<section class="card" style="flex-direction:row;gap:16px;align-items:center" aria-label="เลขชีวิตของคุณ">
<div class="lp-ring"><span class="mono" style="font-size:30px;line-height:1">${num}</span><span class="mono" style="font-size:8px;letter-spacing:.14em;color:var(--teal)">LIFE PATH</span></div>
<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="h2" style="font-size:17px">${title}</span><span class="body" style="font-size:13px">${text}</span>
<span class="mono small" style="font-size:10px">${digits.join('+')} = ${total}${total !== num ? ' → ' + num : ''}</span></div></section>`;
    const col = birthHexColor(p);
    hexCard = `<div class="birth-hex"><span class="hex-sw" style="background:${col}"></span><span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="small" style="font-size:11px">สีฐาน 16 ประจำวันเกิด</span><b class="mono">${col.toUpperCase()}</b></span><span class="small" style="margin-left:auto;text-align:right;font-size:11px">วัน เดือน ปี<br>อ่านเป็นรหัสสี</span></div>`;
  }
  return `<main class="screen" style="--accent:var(--teal)">
${pageHead('04', 'NUMEROLOGY', 'ศาสตร์ตัวเลข', 'var(--teal)', 'numbers')}
${lp}${hexCard}
<section class="t-step"><h2 class="t-step-h"><span style="border-color:var(--teal);color:var(--teal)">✦</span>เลือกสิ่งที่อยากดู</h2>
<div class="num-tools">${NUM_TOOLS.map((t) => `<button class="num-tool${t.id === 'name' ? ' wide' : ''}" data-act="numMode" data-v="${t.id}" aria-pressed="${n.mode === t.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${NUM_ICONS[t.id]}</svg>${t.th}</button>`).join('')}</div></section>
${tool.kind === 'name' ? `<div class="nm-form">
<label class="field">ชื่อ<input class="input" data-in="nmFirst" value="${esc(n.first)}" placeholder="เช่น ธัญพร" autocomplete="off" maxlength="40"></label>
<label class="field">นามสกุล<input class="input" data-in="nmLast" value="${esc(n.last)}" placeholder="ไม่บังคับ" autocomplete="off" maxlength="40"></label>
<div class="nm-opts"><div class="seg" role="group" aria-label="เพศ">${[['', 'ไม่ระบุ'], ['f', 'หญิง'], ['m', 'ชาย']].map(([v, t]) => `<button aria-pressed="${n.gender === v}" data-act="nmGender" data-v="${v}">${t}</button>`).join('')}</div>
<label class="field" style="flex:1">วันเกิดเจ้าของชื่อ<select class="select" data-in="nm.day">${[[0, state.profile ? 'ของฉัน (' + TH_PLANETS[birthPlanet(state.profile)].day + ')' : 'ไม่ระบุ'], ...[1, 2, 3, 4, 8, 5, 6, 7].map((k) => [k, TH_PLANETS[k].day])].map(([v, t]) => `<option value="${v}"${v === n.day ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div></div>
<p class="small" style="margin-top:-12px">${tool.hint}</p>`
    : `<label class="field">${tool.th}<input class="input mono num-input" inputmode="${tool.kind === 'digits' ? 'numeric' : 'text'}" autocomplete="off" maxlength="${tool.max + 4}" data-in="numValue" value="${esc(n.values[n.mode] || '')}" placeholder="${tool.ph}"></label>
<p class="small" style="margin-top:-12px">${tool.hint}</p>`}
<div id="num-results" style="display:flex;flex-direction:column;gap:10px">${numResults()}</div>
</main>`;
}

const LUCK_MODES = [['ball', 'ลูกปิงปอง'], ['incense', 'ธูปเลข'], ['siamsi', 'เซียมซี']];
const ballSlots = (vals) => `<div class="b-slots">${[0, 1, 2].map((k) => vals[k] ? `<span class="b-slot on h${vals[k].hue}"><b>${vals[k].d}</b></span>` : `<span class="b-slot">${k + 1}</span>`).join('')}</div>`;
const incSlots = (vals) => `<div class="b-slots inc">${[0, 1, 2].map((k) => vals[k] != null ? `<span class="n-slot on">${vals[k]}</span>` : `<span class="n-slot">–</span>`).join('')}</div>`;
const INCENSE_POT = `<svg class="i-pot" viewBox="0 0 220 110" aria-hidden="true"><defs><linearGradient id="potg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#C9A24E"/><stop offset=".5" stop-color="#8A6A2C"/><stop offset="1" stop-color="#4A3815"/></linearGradient><radialGradient id="sand" cx="50%" cy="40%"><stop offset="0" stop-color="#9A8C74"/><stop offset="1" stop-color="#5E5446"/></radialGradient></defs>
<ellipse cx="110" cy="18" rx="92" ry="14" fill="url(#sand)"/><path d="M18 18q4 64 40 78h104q36-14 40-78" fill="url(#potg)"/><ellipse cx="110" cy="18" rx="92" ry="14" fill="none" stroke="#E8C77A" stroke-width="1.5"/>
<path d="M40 48q70 14 140 0" stroke="#E8C77A" stroke-width=".8" fill="none" opacity=".6"/><path d="M52 70q58 10 116 0" stroke="#E8C77A" stroke-width=".8" fill="none" opacity=".4"/>
<path d="M70 96l-8 12h96l-8-12" fill="#3A2C10"/><text x="110" y="62" text-anchor="middle" font-family="Taviraj, serif" font-size="15" fill="#F4DFA3" opacity=".85">ตักศิลา</text></svg>`;
const SS_CYL = (() => {
  const sticks = Array.from({ length: 13 }, (_, k) => `<rect x="${34 + k * 4.6}" y="${8 + ((k * 7) % 11)}" width="3.2" height="60" rx="1.2" fill="${k % 4 === 0 ? '#E7C98A' : '#D9B472'}" stroke="#8A6630" stroke-width=".4"/>`).join('');
  return `<svg viewBox="0 0 130 230" aria-hidden="true"><defs><linearGradient id="lac" x1="0" x2="1"><stop offset="0" stop-color="#5E140F"/><stop offset=".35" stop-color="#B3271C"/><stop offset=".55" stop-color="#D2372A"/><stop offset="1" stop-color="#5E140F"/></linearGradient>
<linearGradient id="gband" x1="0" x2="1"><stop offset="0" stop-color="#8A6630"/><stop offset=".5" stop-color="#F2D58C"/><stop offset="1" stop-color="#8A6630"/></linearGradient></defs>
<g class="ss-sticks">${sticks}</g>
<path d="M28 50h74v162q0 10-10 10H38q-10 0-10-10z" fill="url(#lac)"/><ellipse cx="65" cy="50" rx="37" ry="7" fill="#3A0C08" stroke="url(#gband)" stroke-width="2"/>
<rect x="28" y="66" width="74" height="6" fill="url(#gband)"/><rect x="28" y="196" width="74" height="6" fill="url(#gband)"/>
<circle cx="65" cy="134" r="24" fill="none" stroke="url(#gband)" stroke-width="2"/><text x="65" y="142" text-anchor="middle" font-family="Taviraj, serif" font-size="22" font-weight="600" fill="#F2D58C">ซี</text>
<path d="M41 100q24-10 48 0M41 168q24 10 48 0" stroke="#F2D58C" stroke-width=".8" fill="none" opacity=".7"/></svg>`;
})();

function siamsiSlip(no) {
  const f = SIAMSI[no - 1];
  const lvColor = f.level >= 4 ? '#A8231A' : f.level === 3 ? '#B5541E' : f.level === 2 ? '#6B5A3A' : '#4A4A4A';
  return `<article class="slip">
<header class="slip-head"><span class="slip-no">ใบที่ ${thaiNum(no)}</span><span class="slip-seal" style="border-color:${lvColor};color:${lvColor}">${f.levelTh}</span></header>
<div class="slip-verse"><p>${f.verse[0]}</p><p>${f.verse[1]}</p></div>
<p class="slip-sum">${f.summary}</p>
<dl class="slip-topics">${f.topics.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
<p class="slip-tip"><b>ข้อคิด</b> ${f.advice}</p>
<p class="slip-foot">เซียมซีตักศิลา · คำทำนายเป็นกำลังใจ ผลจริงขึ้นอยู่กับการลงมือของคุณ</p>
</article>`;
}

function viewLuck() {
  const l = state.luck, mode = l.mode;
  let body = '';
  if (mode === 'ball') {
    const done = l.balls.length >= 3;
    body = `<div class="globe-stage"><div class="globe${done ? ' full' : ''}" id="globe"></div><div class="globe-neck"></div><div class="globe-base"></div></div>
<div id="ball-slots">${ballSlots(l.balls)}</div>
<p class="p-hint" id="ball-hint">${done ? `เลขของคุณคือ <b>${l.balls.map((b) => b.d).join(' ')}</b>` : 'กด "หมุนโถ" ให้ลูกกระจาย แล้วแตะจับลูกที่ใจเรียก · ตัวเลขจะโผล่ตอนลูกออกมา'}</p>
<div style="display:flex;gap:8px"><button class="btn" data-act="stirGlobe" style="flex:1"${done ? ' disabled' : ''}>หมุนโถ</button>${l.balls.length ? '<button class="btn btn-line" data-act="ballReset" style="flex:1">เริ่มใหม่</button>' : ''}</div>`;
  } else if (mode === 'incense') {
    body = `<div class="inc-stage"><div class="i-stick-wrap"><div class="i-stick" id="inc">
<div class="i-body"></div><div class="i-ash"></div><span class="i-dig"></span><span class="i-dig"></span><span class="i-dig"></span>
<span class="i-ember"></span><span class="i-smoke"><i></i><i></i><i></i></span></div></div>${INCENSE_POT}</div>
<div id="inc-slots">${incSlots(l.incShown)}</div>
<p class="p-hint" id="inc-hint">${l.inc === 'done' ? `ธูปเผยเลข <b>${l.incDigits.join(' ')}</b>` : l.inc === 'burning' ? 'ธูปกำลังไหม้ ขี้ธูปจะค่อย ๆ หล่นเผยเลขทีละตัว' : 'ตั้งจิตอธิษฐาน แล้วจุดธูปเลข'}</p>
<button class="btn" data-act="lightUp"${l.inc === 'burning' ? ' disabled' : ''}>${l.inc === 'done' ? 'จุดธูปดอกใหม่' : 'จุดธูป'}</button>`;
  } else {
    body = `<div class="ss-stage${l.ss ? ' fallen' : ''}" id="ss"><div class="ss-cyl"><span class="ss-rise"><b>${l.ss ? thaiNum(l.ss) : ''}</b></span>${SS_CYL}</div><div class="ss-out"><b>${l.ss ? thaiNum(l.ss) : ''}</b></div><div class="ss-floor"></div></div>
${l.ss ? siamsiSlip(l.ss) + '<button class="btn btn-line" data-act="ssReset">เสี่ยงเซียมซีใหม่</button>'
    : `<p class="p-hint">ตั้งจิตนึกถึงเรื่องที่อยากรู้ แล้ว<b>ใช้นิ้วจับกระบอกลากเขย่าไปมา</b> ไม้เซียมซีจะค่อย ๆ โผล่ขึ้นมาจนกระเด็นออกหนึ่งอัน</p>
<div class="ss-meter" aria-hidden="true"><i></i></div>
<button class="btn btn-line ss-shake">หรือกดค้างที่นี่เพื่อเขย่า</button>
<button class="link-btn" data-act="ssMotion" style="align-self:center">หรือเขย่ามือถือจริง</button>`}`;
  }
  return `<main class="screen" style="--accent:var(--amber)">
${pageHead('05', 'FORTUNE', 'โชคลาภ', 'var(--amber)', 'luck')}
<div class="seg" role="group" aria-label="วิธีเสี่ยงโชค">${LUCK_MODES.map(([id, th]) => `<button aria-pressed="${mode === id}" data-act="luckMode" data-v="${id}">${th}</button>`).join('')}</div>
${body}
<p class="small" style="text-align:center;font-size:11px">${mode === 'siamsi' ? 'คำทำนายแต่งขึ้นใหม่โดยตักศิลา ใช้เป็นข้อคิดและกำลังใจ' : 'เพื่อความบันเทิง ตัวเลขสุ่มจากเครื่องของคุณ ไม่ใช่การรับประกันผลใด ๆ · โปรดเล่นอย่างพอประมาณ'}</p>
</main>`;
}

function syncWheel() {
  const t = state.tarot, c = document.getElementById('wheel-center');
  if (!c || !t.cards) return;
  c.innerHTML = wheelCenter();
  const all = t.flipped.length === t.cards.length;
  document.querySelectorAll('.w-sec').forEach((g) => g.classList.toggle('on', all && +g.dataset.h === t.sel));
  if (all) document.querySelectorAll('.tc').forEach((b) => b.classList.toggle('sel', +b.dataset.i === t.sel));
}

let luckCtl = null;
function mountLuck() {
  if (luckCtl) { luckCtl.destroy(); luckCtl = null; }
  if (route() !== 'luck') return;
  const l = state.luck;
  if (l.mode === 'ball') {
    const g = document.getElementById('globe');
    if (!g || l.balls.length >= 3) return;
    luckCtl = mountGlobe(g, {
      onPick(d, hue) {
        if (l.balls.length >= 3) return;
        l.balls.push({ d, hue });
        if (navigator.vibrate) navigator.vibrate(20);
        document.getElementById('ball-slots').innerHTML = ballSlots(l.balls);
        if (l.balls.length >= 3) setTimeout(render, 700);
        else { const h = document.getElementById('ball-hint'); if (h) h.textContent = `ได้ลูกที่ ${l.balls.length} แล้ว จับต่ออีก ${3 - l.balls.length} ลูก`; }
      }
    });
  } else if (l.mode === 'siamsi' && !l.ss) {
    const el = document.getElementById('ss');
    if (el) luckCtl = mountSiamsi(el, { total: SIAMSI.length, onFall(no) { l.ss = no; render(); const sl = document.querySelector('.slip'); if (sl) sl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  }
}


// ---------------- consult (rule-based, grounded in the chart) ----------------
const ASK_TOPICS = [
  { th: 'โหราศาสตร์', color: 'var(--gold)', code: '01 · NATAL & TRANSITS', greet: 'ผมเห็นผังดาวของคุณแล้ว ถามได้ทั้งเรื่องงาน ความรัก การเงิน สุขภาพ ย้ายบ้าน หรือการเดินทาง ทุกคำตอบจะบอกว่ามาจากดาวดวงใด', chips: ['ช่วงนี้ควรเปลี่ยนงานไหม', 'การเงินปีนี้เป็นอย่างไร', 'ควรย้ายที่อยู่หรือไม่'] },
  { th: 'ความรัก', color: 'var(--rose)', code: '02 · LOVE', greet: 'เรื่องความรักใช่ไหม ถามได้เลย หรือไปที่หน้าคู่ดวงเพื่อเทียบดวงกับอีกฝ่าย', chips: ['ความรักช่วงนี้เป็นอย่างไร', 'จะเจอคนที่ใช่เมื่อไร', 'ควรคืนดีไหม'] },
  { th: 'ไพ่', color: 'var(--violet)', code: '03 · TAROT', greet: 'ตั้งคำถามให้ชัดเจน แล้วพิมพ์มา จะเปิดไพ่หนึ่งใบตอบให้', chips: ['งานใหม่จะไปได้ดีไหม', 'เขาคิดอย่างไรกับเรา', 'ขอไพ่ประจำวัน'] },
  { th: 'ตัวเลข', color: 'var(--teal)', code: '04 · NUMEROLOGY', greet: 'พิมพ์เบอร์โทรหรือทะเบียนรถมาได้ จะคำนวณผลรวมและคู่เลขให้', chips: ['0812345678', 'เลขชีวิตของฉันคืออะไร'] },
  { th: 'โชคลาภ', color: 'var(--amber)', code: '05 · FORTUNE', greet: 'อยากได้เลขเสี่ยงโชคพอเป็นสีสันใช่ไหม พิมพ์อะไรมาก็ได้ จะสุ่มเลขให้ เพื่อความบันเทิงเท่านั้น', chips: ['ขอเลขประจำวัน', 'ขอเลขจากวันเกิด'] }
];
const AREAS = [
  { re: /งาน|อาชีพ|ธุรกิจ|เลื่อน|หัวหน้า|ลาออก/, th: 'การงาน', houses: [10, 6], cat: 1 },
  { re: /รัก|แฟน|คู่|โสด|แต่งงาน|คืนดี|เขา/, th: 'ความรัก', houses: [5, 7], cat: 0 },
  { re: /เงิน|ลงทุน|หนี้|รวย|มั่งคั่ง|ทรัพย์|หุ้น/, th: 'การเงิน', houses: [2, 8], cat: 2 },
  { re: /สุขภาพ|ป่วย|เจ็บ|ร่างกาย/, th: 'สุขภาพ', houses: [6, 1], cat: 3 },
  { re: /ย้าย|บ้าน|ครอบครัว|คอนโด/, th: 'บ้านและครอบครัว', houses: [4], cat: 0 },
  { re: /เดินทาง|ต่างประเทศ|เรียน|สอบ/, th: 'การเดินทางและการเรียน', houses: [9, 3], cat: 1 }
];
function answer(topicIdx, text) {
  const ch = state.chart, now = new Date();
  if (topicIdx === 2) {
    const c = drawCards(1)[0], card = CARDS[c.i];
    return { text: `ไพ่ที่ได้คือ "${card.th}" (${card.en}${c.rev ? ', กลับหัว' : ''}) — ${c.rev ? card.rev : card.up}`, basis: ['TAROT · ' + card.en] };
  }
  if (topicIdx === 3) {
    const v = text.replace(/[^0-9]/g, '');
    if (/เลขชีวิต/.test(text) || !v) {
      const p = state.profile, d = `${p.day}${p.month}${p.yearBE - 543}`.split('').map(Number);
      const n = reduceNum(d.reduce((a, b) => a + b, 0), true);
      return { text: `เลขชีวิตของคุณคือ ${n} — ${(LIFE_PATH[n] || LIFE_PATH[reduceNum(n, false)]).join(': ')}`, basis: [d.join('+')] };
    }
    const sum = v.split('').reduce((a, b) => a + +b, 0), r = reduceNum(sum, false);
    const risky = (v.slice(-7).match(/[78]/g) || []).length;
    return { text: `ผลรวม ${sum} ลดเหลือ ${r}: ${SUM_MEANING[r]} ${risky ? `มีเลข 7 หรือ 8 อยู่ ${risky} ตัวใน 7 หลักท้าย ควรระวังเรื่องความแปรปรวน` : 'คู่เลขส่วนใหญ่ส่งเสริมกันดี'}`, basis: ['SUM ' + sum, 'LAST7 ' + v.slice(-7)] };
  }
  if (topicIdx === 4) {
    const n = () => Math.floor(Math.random() * 10);
    return { text: `เลขเสี่ยงโชคสำหรับวันนี้: ${n()}${n()}${n()} และ ${n()}${n()} ขอให้เล่นพอประมาณนะครับ`, basis: ['RANDOM · เพื่อความบันเทิง'] };
  }
  let area = AREAS.find((a) => a.re.test(text));
  if (!area) area = topicIdx === 1 ? AREAS[1] : AREAS[0];
  const tr = transits(ch, now);
  const dl = daily(ch, now);
  const lines = [], basis = [];
  for (const t of tr) {
    if (area.houses.includes(t.house)) {
      lines.push(`${t.title.replace(/ · ภพ \d+/, '')} อยู่ในภพที่ ${t.house} ของคุณ${t.exit ? ' ถึง ' + monthYear(t.exit) : ''}: ${t.body}`);
      basis.push(`${t.glyph} H${t.house}`);
    }
  }
  const natal = ch.planets.filter((p) => area.houses.includes(p.house));
  if (natal.length) {
    lines.push(`ในดวงกำเนิดมีดาว${natal.map((p) => p.th).join(' ')} อยู่ในภพเรื่อง${area.th} ทำให้เรื่องนี้เป็นเรื่องสำคัญในชีวิตคุณ`);
    natal.slice(0, 2).forEach((p) => basis.push(`${p.glyph} ${SIGNS[p.sign].th} H${p.house}`));
  }
  const sc = dl.scores[area.cat];
  lines.push(`พลังวันนี้ด้าน${sc.name} อยู่ที่ ${sc.score}/5 ${sc.score >= 4 ? 'จังหวะดี ลงมือได้' : sc.score <= 2 ? 'ควรรอจังหวะ หรือเตรียมตัวให้พร้อมก่อน' : 'ทำได้แต่ไม่ควรรีบ'}`);
  basis.push('TODAY ' + sc.name + ' ' + sc.score + '/5');
  if (lines.length === 1) lines.unshift(`ช่วงนี้ไม่มีดาวเคลื่อนช้าผ่านภพเรื่อง${area.th}ของคุณ สถานการณ์จึงค่อนข้างคงที่ ขึ้นอยู่กับการตัดสินใจของคุณเองเป็นหลัก`);
  return { text: lines.join(' '), basis };
}
function viewAsk() {
  const a = state.ask, t = ASK_TOPICS[a.topic];
  return `<main class="screen" style="--accent:${t.color};padding-bottom:20px">
<header class="page-head" style="flex-direction:column;align-items:stretch;gap:10px">
<div style="display:flex;align-items:center;gap:8px"><button class="back" data-act="go" data-to="home" aria-label="กลับหน้าหลัก">${icon('back', 20, 1.5)}</button>
<span class="sigil" style="color:${t.color};width:40px;height:40px"><span style="width:8px;height:8px;border-radius:4px;background:currentColor;box-shadow:0 0 10px currentColor"></span></span>
<div style="display:flex;flex-direction:column"><span class="h2" style="font-size:19px">ผู้เชี่ยวชาญด้าน${t.th}</span><span class="label" style="font-size:10px">${t.code}</span></div></div>
<div class="chips" role="group" aria-label="เลือกด้านที่จะปรึกษา">${ASK_TOPICS.map((x, i) => `<button class="chip" aria-pressed="${i === a.topic}" style="--accent:${x.color}" data-act="askTopic" data-i="${i}">${x.th}</button>`).join('')}</div>
</header>
<p class="mono small" style="font-size:10px;text-align:center">ตอบอัตโนมัติจากผังดาวของคุณ · เพื่อเป็นแนวทางและความบันเทิง</p>
<div class="chat" id="chat">
<div class="msg bot">${t.greet}</div>
${a.messages.map((m) => m.me ? `<div class="msg me">${esc(m.text)}</div>` : `<div class="msg bot">${esc(m.text)}${m.basis && m.basis.length ? `<div class="basis"><span class="eyebrow" style="letter-spacing:.18em">BASED ON</span><div class="tags">${m.basis.map((b) => `<span class="tag">${esc(b)}</span>`).join('')}</div></div>` : ''}</div>`).join('')}
</div>
<div class="composer">
<div class="chips">${t.chips.map((c) => `<button class="chip" data-act="askChip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
<form data-act="askSend"><label class="sr-only" for="askIn">คำถามของคุณ</label><input id="askIn" class="input" style="border-radius:24px;padding:0 18px" placeholder="พิมพ์คำถามของคุณ" autocomplete="off">
<button class="send" aria-label="ส่งคำถาม">${icon('arrow', 18, 1.8)}</button></form></div>
</main>`;
}

// ---------------- router ----------------
// Routes live in memory (and are mirrored to the URL hash when the host allows it),
// so the app also works inside sandboxed frames that ignore hash changes.
const NEEDS_PROFILE = ['home', 'chart', 'match', 'ask'];
let current = location.hash.replace(/^#\/?/, '');
function route() {
  let r = current || (state.profile ? 'home' : 'welcome');
  if (NEEDS_PROFILE.includes(r) && !state.chart) r = 'welcome';
  return r;
}
function go(r) {
  if (r !== 'setup') state.draft = null;
  current = r;
  try { history.replaceState(null, '', '#/' + r); } catch (e) { /* not allowed in some frames */ }
  render();
}
const VIEWS = { auspice: viewAuspice, welcome: viewWelcome, setup: viewSetup, home: viewHome, chart: viewChart, match: viewMatch, tarot: viewTarot, numbers: viewNumbers, luck: viewLuck, ask: viewAsk };
const root = document.getElementById('app');
let lastRoute = null;

function render() {
  const r = route();
  const view = VIEWS[r] || viewWelcome;
  const showNav = !['welcome', 'setup'].includes(r);
  root.innerHTML = view() + (showNav ? nav(r) : '');
  if (r === 'home') startLive(); else clearInterval(liveTimer);
  mountLuck();
  if (r !== lastRoute) { window.scrollTo(0, 0); lastRoute = r; }
  document.title = 'ตักศิลา · ' + ({ home: 'หน้าหลัก', chart: 'ผังดาว', match: 'คู่ดวง', tarot: 'ไพ่ทาโรต์', numbers: 'ศาสตร์ตัวเลข', luck: 'โชคลาภ', ask: 'ปรึกษา', setup: 'ข้อมูลกำเนิด' }[r] || 'อ่านดวงจากดาวจริง');
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------------- events ----------------
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#/"]');
  const el = e.target.closest('[data-act]');
  if (link) {
    e.preventDefault();
    if (el && el.dataset.act === 'chartTab') state.chartTab = +el.dataset.i;
    go(link.getAttribute('href').slice(2));
    return;
  }
  if (!el || el.tagName === 'FORM') return;
  const act = el.dataset.act, i = el.dataset.i != null ? +el.dataset.i : null;
  switch (act) {
    case 'go': go(el.dataset.to); return;
    case 'install': if (installEvt) { installEvt.prompt(); installEvt.userChoice.then((r) => { installEvt = null; const sl = document.getElementById('install-slot'); if (sl) sl.innerHTML = r.outcome === 'accepted' ? '' : installHTML(); }); } return;
    case 'installHelp': { installHelp = !installHelp; const sl = document.getElementById('install-slot'); if (sl) sl.innerHTML = installHTML(); return; }
    case 'installDismiss': { try { localStorage.setItem('taksila.installDismissed', '1'); } catch {} const sl = document.getElementById('install-slot'); if (sl) sl.innerHTML = ''; return; }
    case 'senseToggle': { const li = el.closest('.sense'); const o = !li.classList.contains('open'); li.classList.toggle('open', o); el.setAttribute('aria-expanded', o); return; }
    case 'auspTab': state.ausp.tab = i; break;
    case 'auspEvent': state.ausp.event = el.dataset.v; state.ausp.open = 0; break;
    case 'auspDays': state.ausp.days = i; state.ausp.open = 0; break;
    case 'auspOpen': {
      state.ausp.open = state.ausp.open === i ? -1 : i;
      document.querySelectorAll('.rk').forEach((li, j) => { li.classList.toggle('open', j === state.ausp.open); li.querySelector('.rk-head').setAttribute('aria-expanded', j === state.ausp.open); });
      return;
    }
    case 'weekDay': {
      state.weekSel = state.weekSel === i ? null : i;
      const box = document.getElementById('week');
      if (box) box.innerHTML = weekHTML();
      return;
    }
    case 'liveToggle': {
      state.liveOpen = !state.liveOpen;
      const card = el.closest('.daily');
      card.classList.toggle('open', state.liveOpen);
      el.setAttribute('aria-expanded', state.liveOpen);
      el.querySelector('.lbl').textContent = state.liveOpen ? 'พับเก็บ' : el.dataset.closed;
      return;
    }
    case 'aspToggle': {
      const k = el.dataset.k, li = el.closest('.asp');
      if (state.aspOpen.has(k)) state.aspOpen.delete(k); else state.aspOpen.add(k);
      li.classList.toggle('open', state.aspOpen.has(k));
      el.setAttribute('aria-expanded', state.aspOpen.has(k));
      return;
    }
    case 'place': state.draft.placeIdx = i; if (i >= 0) state.draft.place = PLACES[i]; break;
    case 'unknownTime': state.draft.timeKnown = !state.draft.timeKnown; break;
    case 'saveProfile': {
      const d = state.draft;
      const place = d.placeIdx >= 0 ? PLACES[d.placeIdx]
        : { name: 'พิกัดกำหนดเอง', lat: parseFloat(d.custom.lat), lon: parseFloat(d.custom.lon), offset: parseFloat(d.custom.offset) };
      if (d.placeIdx < 0 && [place.lat, place.lon, place.offset].some((x) => Number.isNaN(x) || x === undefined)) { toast('กรุณากรอกพิกัดและเขตเวลาให้ครบ'); return; }
      state.profile = { name: d.name.trim(), day: +d.day, month: +d.month, yearBE: +d.yearBE, hour: +d.hour, minute: +d.minute, timeKnown: d.timeKnown, place, placeIdx: d.placeIdx, custom: d.custom };
      state.chart = safeChart(state.profile);
      state.draft = null; state.placeQuery = ''; state.chartTab = 0; state.match.sign = null;
      save();
      go('chart');
      return;
    }
    case 'chartTab': state.chartTab = i; break;
    case 'matchSign': state.match.sign = i; break;
    case 'matchDate': state.match.useDate = !state.match.useDate; break;
    case 'tarotTopic': state.tarot.topic = i; break;
    case 'tarotSpread': state.tarot.spread = i; break;
    case 'tarotWho': state.tarot.who = el.dataset.v; break;
    case 'tarotOtherKnown': state.tarot.other.known = !state.tarot.other.known; break;
    case 'tarotDraw': {
      const t = state.tarot;
      t.deck = drawCards(78); t.picks = []; t.cards = null; t.flipped = []; t.sel = 0;
      render();
      const fan = document.getElementById('fan');
      if (fan) { fan.scrollLeft = (fan.scrollWidth - fan.clientWidth) / 2; fan.classList.add('shuffle'); }
      return;
    }
    case 'tarotPick': {
      const t = state.tarot, need = SPREADS[t.spread].pos.length;
      if (t.picks.includes(i) || t.picks.length >= need) return;
      t.picks.push(i);
      el.classList.add('taken');
      const slots = document.getElementById('pick-slots');
      if (slots) slots.innerHTML = pickSlotsHTML();
      if (t.picks.length === need) {
        setTimeout(() => { t.cards = t.picks.map((k) => t.deck[k]); t.flipped = []; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 650);
      }
      return;
    }
    case 'tarotFlip': {
      const t = state.tarot, spread = SPREADS[t.spread];
      if (!t.flipped.includes(i)) { t.flipped.push(i); el.classList.add('flipped'); el.setAttribute('aria-label', CARDS[t.cards[i].i].th); }
      else if (spread.house) t.sel = i;
      if (spread.house && t.flipped.length === t.cards.length) {
        if (!el.dataset.justAll) document.querySelectorAll('.tc').forEach((b) => b.classList.toggle('sel', +b.dataset.i === t.sel));
      }
      const box = document.getElementById('tarot-reading');
      if (box) box.innerHTML = tarotReadingArea();
      syncWheel();
      if (t.flipped.length === t.cards.length) { const all = document.querySelector('[data-act="tarotAll"]'); if (all) all.remove(); }
      if (spread.house && t.flipped.length === t.cards.length && box) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    case 'tarotAll': {
      const t = state.tarot;
      t.flipped = t.cards.map((_, k) => k);
      document.querySelectorAll('.tc').forEach((b) => b.classList.add('flipped'));
      const box = document.getElementById('tarot-reading');
      if (box) box.innerHTML = tarotReadingArea();
      if (SPREADS[t.spread].house) document.querySelectorAll('.tc').forEach((b) => b.classList.toggle('sel', +b.dataset.i === t.sel));
      syncWheel();
      el.remove();
      return;
    }
    case 'tarotReset': Object.assign(state.tarot, { cards: null, deck: null, picks: [], flipped: [] }); break;
    case 'numMode': state.num.mode = el.dataset.v; break;
    case 'nmGender': { state.num.gender = el.dataset.v; document.querySelectorAll('[data-act=nmGender]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === state.num.gender)); const box = document.getElementById('num-results'); if (box) box.innerHTML = numResults(); return; }
    case 'luckMode': state.luck.mode = el.dataset.v; if (state.luck.inc === 'burning') state.luck.inc = 'idle'; break;
    case 'stirGlobe': if (luckCtl && luckCtl.stir) luckCtl.stir(); return;
    case 'ballReset': state.luck.balls = []; break;
    case 'lightUp': {
      const l = state.luck;
      l.inc = 'burning'; l.incDigits = [randomDigit(), randomDigit(), randomDigit()]; l.incShown = [];
      render();
      const el = document.getElementById('inc');
      luckCtl = burnIncense(el, l.incDigits, {
        onDigit(k, d) { l.incShown[k] = d; const s2 = document.getElementById('inc-slots'); if (s2) s2.innerHTML = incSlots(l.incShown); },
        onDone() { l.inc = 'done'; if (route() === 'luck' && l.mode === 'incense') render(); }
      });
      return;
    }
    case 'ssReset': state.luck.ss = null; break;
    case 'ssMotion': askMotion().then((ok) => toast(ok ? 'พร้อมแล้ว เขย่ามือถือได้เลย' : 'เครื่องนี้ไม่รองรับการเขย่า ใช้วิธีกดค้างแทน')); return;
    case 'askTopic': state.ask.topic = i; state.ask.messages = []; break;
    case 'askChip': ask(el.dataset.q); return;
    default: return;
  }
  render();
});

function ask(q) {
  if (!q || !q.trim()) return;
  state.ask.messages.push({ me: true, text: q.trim() });
  state.ask.messages.push({ me: false, ...answer(state.ask.topic, q) });
  render();
  const chat = document.getElementById('chat');
  if (chat) chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
document.addEventListener('submit', (e) => {
  if (e.target.dataset.act !== 'askSend') return;
  e.preventDefault();
  const input = e.target.querySelector('input');
  ask(input.value);
});

document.addEventListener('input', (e) => {
  const key = e.target.dataset.in;
  if (!key) return;
  const v = e.target.value;
  if (key === 'tarotQ') { state.tarot.q = v; return; }
  if (key === 'tarotOtherName') { state.tarot.other.name = v; return; }
  if (key === 'placeQuery') {
    state.placeQuery = v;
    const list = document.getElementById('place-list');
    if (list) list.innerHTML = placeOptions();
    return;
  }
  if (key === 'nmFirst' || key === 'nmLast') {
    state.num[key === 'nmFirst' ? 'first' : 'last'] = v;
    const box = document.getElementById('num-results');
    if (box) box.innerHTML = numResults();
    return;
  }
  if (key === 'numValue') {
    state.num.values[state.num.mode] = v;
    const box = document.getElementById('num-results');
    if (box) box.innerHTML = numResults();
    return;
  }

  if (key === 'name') { state.draft.name = v; return; }
  if (key.startsWith('c.')) { state.draft.custom[key.slice(2)] = v; return; }
});
document.addEventListener('change', (e) => {
  const key = e.target.dataset.in;
  if (!key) return;
  const v = +e.target.value;
  if (key.startsWith('m.')) { state.match[key.slice(2)] = v; render(); return; }
  if (key === 'nm.day') { state.num.day = v; const box = document.getElementById('num-results'); if (box) box.innerHTML = numResults(); return; }
  if (key.startsWith('t.')) { state.tarot.other[key.slice(2)] = v; render(); return; }
  if (key.startsWith('a.')) { state.ausp[key.slice(2)] = v; state.ausp.open = 0; render(); return; }
  if (['day', 'month', 'yearBE', 'hour', 'minute'].includes(key)) { state.draft[key] = v; if (key !== 'hour' && key !== 'minute') render(); }
});

window.addEventListener('hashchange', () => {
  const r = location.hash.replace(/^#\/?/, '');
  if (r && r !== current) go(r);
});
render();

// Installable app (PWA): only on the real website, which links a manifest.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && document.querySelector('link[rel="manifest"]')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); installEvt = e;
  const slot = document.getElementById('install-slot');
  if (slot) slot.innerHTML = installHTML();
});
window.addEventListener('appinstalled', () => { installEvt = null; const slot = document.getElementById('install-slot'); if (slot) slot.innerHTML = ''; toast('ติดตั้งตักศิลาบนหน้าจอเรียบร้อย'); });
