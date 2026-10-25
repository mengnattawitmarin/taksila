// Taksila app — screens, state and routing (hash routes, no framework).
import {
  SIGNS, ELEMENTS, PLANETS, HOUSES, planetById, computeChart, transits, daily, compatibility,
  planetPositions, signOf, fmtDeg, localToUtc, liveAspects, upcomingIngresses, ASPECT_GLYPH, lonOf, weekAhead, lunarPhase
} from './astro.js';
import { PLACES, MONTHS_TH, MONTHS_SHORT, TAROT, TOPICS, LIFE_PATH, DIGITS, SUM_MEANING } from './data.js';
import { starMap, logoRing } from './starmap.js';
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
  match: { sign: null, useDate: false, day: 1, month: 1, yearBE: 2540 },
  tarot: { topic: 0, cards: null, open: 0 },
  num: { mode: 'phone', value: '' },
  luck: { mode: 'ball', balls: [], ash: null, shake: false },
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
    ['tarot', 'ไพ่ทาโรต์', 'เปิดสามใบ', 'var(--violet)'],
    ['numbers', 'ตัวเลข', 'เบอร์ ทะเบียน', 'var(--teal)'],
    ['luck', 'โชคลาภ', 'ปิงปอง ธูป', 'var(--amber)'],
    ['ask', 'ปรึกษา', 'ถามเรื่องเฉพาะ', 'var(--gold-2)']
  ];
  return `<main class="screen">
<header style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
<div style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow" style="letter-spacing:.28em">TAKSILA · ${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear() + 543}</span>
<h1 class="h1">${greeting(now)} ${p.name ? 'คุณ' + esc(p.name) : ''}</h1>
<p class="small" style="font-size:13px">ดวงอาทิตย์จรราศี${SIGNS[dl.sunSign].th} · ดวงจันทร์จรราศี${SIGNS[dl.moonSign].th}</p></div>
<a href="#/setup" aria-label="ข้อมูลเกิดของฉัน" class="back" style="margin:0;border:1px solid var(--line-2);border-radius:22px">${icon('user', 18)}</a>
</header>
<a class="map-link" href="#/chart" aria-label="เปิดผังดาวฉบับเต็ม">${starMap(ch, { id: 'home', hud: hudFor(p), label: 'ผังดาวกำเนิดของคุณ' })}</a>
${bigThree(ch)}
<section id="live-daily" aria-label="ดวงรายวันแบบสด">${liveDailyHTML()}</section>
<nav class="oracle-grid" aria-label="ศาสตร์การทำนาย">${tools.map(([r, t, s, c]) => `<a class="oracle" href="#/${r}" style="--c:${c}"><span class="sigil">${icon(r, 20)}</span><span class="n">${t}</span><span class="small">${s}</span></a>`).join('')}</nav>
<section id="auspice-mini" aria-label="มงคลวันนี้">${auspiceMiniHTML()}</section>
<section id="week" style="display:flex;flex-direction:column;gap:10px" aria-label="ดวง 7 วันข้างหน้า">${weekHTML()}</section>
<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">TRANSITS · ดาวจรระยะยาว</h2>
<div class="hscroll edge">${tr.map((t) => `<a class="mini" href="#/chart" data-act="chartTab" data-i="2">
<span style="display:flex;justify-content:space-between;align-items:center"><span class="sym" style="font-size:20px;color:${trColor(t)}">${t.glyph}&#xFE0E;</span><span class="mono small" style="font-size:10px">H${t.house}</span></span>
<span class="t">${t.isReturn ? (t.id === 'saturn' ? 'เสาร์คืนเรือน' : 'พฤหัสคืนเรือน') : planetById(t.id).th + 'จร' + SIGNS[t.sign].th}</span>
<span class="small">${HOUSES[t.house - 1]}</span></a>`).join('')}</div>
</section>
<div id="install-slot">${installHTML()}</div>
</main>`;
}

function installHTML() {
  if (!installEvt) return '';
  return `<button class="ask-link" data-act="install" style="width:100%;background:none;font:inherit;text-align:left;cursor:pointer"><span class="sigil" style="color:var(--gold);width:40px;height:40px">${icon('down', 18, 1.6)}</span>
<span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="h2" style="font-size:16px">ติดตั้งเป็นแอป</span><span class="small">เปิดดูดวงรายวันจากหน้าจอโทรศัพท์ได้ทันที</span></span></button>`;
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
  return `<div class="card daily${open ? ' open' : ''}">
<span style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow" style="letter-spacing:.2em;display:flex;align-items:center;gap:8px"><span class="live-dot" aria-hidden="true"></span>TODAY · LIVE</span><span class="mono small" style="font-size:10px">อัปเดต ${pad(now.getHours())}:${pad(now.getMinutes())}</span></span>
<p class="h2" style="font-size:20px">${headline}</p>
<p class="small">ที่มา · <span style="color:var(--text)">${basis}</span></p>
<div class="score-grid">${dl.scores.map((s) => `<div><span>${s.name}</span><span class="bars" role="img" aria-label="${s.name} ${s.score} จาก 5">${[1, 2, 3, 4, 5].map((i) => `<span${i <= s.score ? ' class="on"' : ''}></span>`).join('')}</span></div>`).join('')}</div>
<button class="drawer-toggle" data-act="liveToggle" data-closed="ดูเหตุผล ${la.length} มุมดาว" aria-expanded="${open}">
<span class="peek" aria-hidden="true">${la.slice(0, 3).map((x) => `<span class="chip">${trio(x)}</span>`).join('')}</span>
<span class="lbl">${open ? 'พับเก็บ' : `ดูเหตุผล ${la.length} มุมดาว`}</span>
<span class="chev">${icon('down', 16, 1.6)}</span>
</button>
<div class="fold"><div class="fold-in"><div class="drawer-body">
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
  return `<a class="card ausp-mini" href="#/auspice">
<span style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow" style="letter-spacing:.2em;color:var(--amber)">มงคลวันนี้ · ${TH_PLANETS[today.owner].day}</span>${icon('next', 14, 1.5)}</span>
<div class="ausp-row">
<div class="ausp-col"><span class="small">สีเสริมดวงคุณ</span><span class="dot-row"><i style="background:${TH_PLANETS[best].hex}"></i><b>${TH_PLANETS[best].color.split(' ')[0]}</b></span></div>
<div class="ausp-col"><span class="small">สีที่ควรเลี่ยง</span><span class="dot-row"><i style="background:${TH_PLANETS[me.avoid].hex}"></i><b>${TH_PLANETS[me.avoid].color.split(' ')[0]}</b></span></div>
<div class="ausp-col"><span class="small">เลขมงคล</span><b class="mono" style="font-size:16px;color:var(--gold-2)">${me.numbers.slice(0, 3).join(' ')}</b></div>
</div>
<span class="small" style="color:var(--text)">${cur ? `ตอนนี้ยาม${cur.pos.th} (${hm(cur.start)}–${hm(cur.end)})` : ''}${nextGood ? ` · ยามดีถัดไป <b style="color:var(--gold-2)">${hm(nextGood.start)}</b> ยาม${nextGood.pos.th}` : ''}</span>
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

function viewAuspice() {
  const now = new Date(), p = state.profile, { bp, me, lagna } = personalLuck();
  const today = dayColors(now), rel = posOf(bp, today.owner);
  const { all, cur } = currentYams(now);
  const lg = lagna ? luckOf(lagna.lord) : null;
  const yamRow = (y) => {
    const tone = y.pos.tone === 2 ? 'good' : y.pos.tone < 0 ? 'bad' : '';
    const isCur = y === cur, past = y.end <= now;
    return `<li class="yam ${tone}${isCur ? ' cur' : ''}${past ? ' past' : ''}"><span class="mono t">${hm(y.start)}</span>
<span class="ydot" style="background:${TH_PLANETS[y.planet].hex}"></span>
<span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="n">ยาม${y.pos.th} <span class="small">· ${TH_PLANETS[y.planet].th}</span>${isCur ? ' <span class="now">ตอนนี้</span>' : ''}</span><span class="small">${yamUse(y.pos)}</span></span></li>`;
  };
  return `<main class="screen" style="--accent:var(--amber)">
${pageHead('06', 'AUSPICE', 'ฤกษ์และมงคล', 'var(--amber)', 'auspice', `<button class="back" data-act="go" data-to="home" aria-label="กลับหน้าหลัก" style="margin:0">${icon('back', 20, 1.5)}</button>`)}
<section class="card" style="gap:6px">
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
</section>
<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">ทักษาประจำตัว · เกิด${TH_PLANETS[bp].day}${p.timeKnown ? '' : ' (ไม่ทราบเวลาเกิด ใช้เวลากลางวัน)'}</h2>
${thaksaWheel(bp)}
</section>
${luckBlock('สีและเลขถูกโฉลกกับวันเกิด', `ตามทักษา ดาวประจำตัวคือ${TH_PLANETS[bp].th} (${bp})`, me)}
${lg ? luckBlock(`สีและเลขถูกโฉลกกับลัคนา`, `ลัคนาแบบไทยราศี${SIGNS[lagna.sign].th} ${Math.floor(lagna.deg)}° เจ้าเรือนลัคนาคือดาว${TH_PLANETS[lagna.lord].th} (${lagna.lord})`, lg)
    : '<div class="card"><p class="small">ใส่เวลาเกิดเพื่อดูสีและเลขถูกโฉลกกับลัคนา</p></div>'}
${lagna && lagna.sign !== state.chart.firstSign ? `<p class="small" style="font-size:11px">หมายเหตุ: โหราศาสตร์ไทยใช้จักรราศีแบบนิรายนะ (ถอยราว ${Math.round(23.9)}°) ลัคนาแบบไทยจึงเป็นราศี${SIGNS[lagna.sign].th} ขณะที่ผังดาวสากลเป็นราศี${SIGNS[state.chart.firstSign].th}</p>` : ''}
<p class="small" style="text-align:center;font-size:11px">ตามตำราทักษาและยามอัฏฐกาล เพื่อเป็นแนวทางเสริมความมั่นใจ</p>
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
<div class="tabs" role="tablist" aria-label="มุมมองดวง">${tabBtn(0, 'ผังดาว')}${tabBtn(1, 'ดาวในภพ')}${tabBtn(2, 'ดวงจร')}</div></div>
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

const MOTIFS = [
  '<path d="M24 6l4.2 13.2L42 24l-13.8 4.8L24 42l-4.2-13.2L6 24l13.8-4.8z"/>',
  '<circle cx="24" cy="24" r="8"/><path d="M24 6v8M24 34v8M6 24h8M34 24h8M11 11l6 6M31 31l6 6M37 11l-6 6M17 31l-6 6"/>',
  '<path d="M30 10A14 14 0 1 0 30 38A11 11 0 1 1 30 10Z"/>',
  '<path d="M6 24c6-9 30-9 36 0c-6 9-30 9-36 0z"/><circle cx="24" cy="24" r="5"/>'
];
function tarotFace(card) {
  const [roman, en, th] = TAROT[card.i];
  return `<div class="tcard${card.rev ? ' rev' : ''}"><span class="num">${roman}</span>
<svg role="img" aria-label="ภาพไพ่${th}" width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="#F0D89A" stroke-width="1.1" stroke-linejoin="round"><circle cx="24" cy="24" r="20" stroke="#3D3424"/>${MOTIFS[card.i % 4]}</svg>
<span class="nm">${th}${card.rev ? '<br><span class="mono small" style="font-size:9px">กลับหัว</span>' : ''}</span></div>`;
}
const CARD_BACK = `<svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 80 130" fill="none" stroke="currentColor" stroke-width="0.8" preserveAspectRatio="none"><rect x="3" y="3" width="74" height="124" rx="3"/><circle cx="40" cy="65" r="22"/><circle cx="40" cy="65" r="14"/><circle cx="40" cy="65" r="6"/><path d="M40 35v8M40 87v8M10 65h8M62 65h8M19 44l6 6M55 80l6 6M61 44l-6 6M25 80l-6 6"/></svg>`;

function viewTarot() {
  const t = state.tarot, topic = TOPICS[t.topic];
  const pos = ['อดีต', 'ปัจจุบัน', 'อนาคต'], posEn = ['PAST', 'PRESENT', 'FUTURE'];
  let spread = '', reading = '', action = '';
  if (!t.cards) {
    spread = [0, 1, 2].map((i) => `<div class="slot"><div class="tback" style="opacity:.5">${CARD_BACK}</div><span class="label" style="font-size:10px">${posEn[i]}</span></div>`).join('');
    action = `<button class="btn" data-act="tarotDraw">สับไพ่และเลือก 3 ใบ</button><p class="small" style="text-align:center">ตั้งคำถาม${topic.lead}ให้ชัดในใจก่อนกด</p>`;
  } else {
    spread = t.cards.map((c, i) => `<div class="slot">${i < t.open ? tarotFace(c) : `<button class="tback" data-act="tarotOpen" aria-label="เปิดไพ่ใบ${pos[i]}"${i === t.open ? '' : ' disabled'}>${CARD_BACK}</button>`}<span class="label" style="font-size:10px;${i === t.open - 1 ? 'color:var(--text)' : ''}">${posEn[i]}</span></div>`).join('');
    reading = t.cards.slice(0, t.open).map((c, i) => {
      const card = TAROT[c.i];
      return `<section class="card" style="gap:6px"><span class="eyebrow" style="color:var(--violet);letter-spacing:.2em">${posEn[i]} · ${card[1].toUpperCase()}${c.rev ? ' · REVERSED' : ''}</span>
<h2 class="h2">${pos[i]}: ${card[2]}</h2><p class="body">${topic.lead} ${c.rev ? card[4] : card[3]}</p></section>`;
    }).reverse().join('');
    action = t.open < 3 ? `<button class="btn" data-act="tarotOpen">เปิดไพ่ใบ${pos[t.open]}</button>` : `<button class="btn btn-line" data-act="tarotReset">สับไพ่ใหม่</button>`;
  }
  return `<main class="screen" style="--accent:var(--violet)">
${pageHead('03', 'TAROT', 'ไพ่ทาโรต์', 'var(--violet)', 'tarot')}
<div class="seg" role="group" aria-label="หัวข้อที่อยากรู้">${TOPICS.map((x, i) => `<button aria-pressed="${i === t.topic}" data-act="tarotTopic" data-i="${i}">${x.th}</button>`).join('')}</div>
<div class="spread">${spread}</div>
${action}
${reading}
<p class="small" style="text-align:center">ใช้ไพ่ชุดใหญ่ 22 ใบ · สุ่มใหม่ทุกครั้งที่สับ</p>
</main>`;
}

function reduceNum(n, keepMaster) {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) n = String(n).split('').reduce((a, b) => a + +b, 0);
  return n;
}
function numResults() {
  const v = state.num.value.replace(/[^0-9]/g, '');
  if (!v) return '<p class="small">พิมพ์ตัวเลขเพื่อดูผลวิเคราะห์</p>';
  const sum = v.split('').reduce((a, b) => a + +b, 0);
  const red = reduceNum(sum, false);
  const src = state.num.mode === 'phone' ? v.slice(-7) : v;
  const pairs = [];
  for (let i = 0; i < src.length - 1; i++) {
    const a = +src[i], b = +src[i + 1];
    const bad = [7, 8].includes(a) || [7, 8].includes(b);
    const neutral = a === 0 || b === 0;
    pairs.push({ n: src[i] + src[i + 1], bad, neutral, meaning: DIGITS[a] + ' + ' + DIGITS[b] });
  }
  return `<p class="mono" style="font-size:13px;margin:0;color:var(--text-2)">SUM <span style="color:var(--teal)">${sum}</span> → ${red} · ${SUM_MEANING[red] || ''}</p>
${pairs.length ? `<h2 class="label" style="margin-top:6px">PAIRS · คู่เลข${state.num.mode === 'phone' ? ' (7 หลักท้าย)' : ''}</h2>
<div class="pairs">${pairs.map((p) => `<div class="${p.bad ? 'bad' : ''}"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="mono" style="font-size:22px">${p.n}</span><span class="mono" style="font-size:12px;font-weight:600;color:${p.bad ? 'var(--tension)' : p.neutral ? 'var(--muted)' : 'var(--teal)'}">${p.bad ? '!' : p.neutral ? '·' : '+'}</span></div><span class="small" style="font-size:11px">${p.meaning}</span></div>`).join('')}</div>` : ''}
<p class="small">+ ส่งเสริม · ! ควรระวัง · · กลาง ๆ — ตามหลักเลขศาสตร์ไทยแบบทั่วไป เพื่อเป็นแนวทาง</p>`;
}
function viewNumbers() {
  const p = state.profile;
  let lp = '';
  if (p) {
    const ce = p.yearBE - 543;
    const digits = `${p.day}${p.month}${ce}`.split('').map(Number);
    const total = digits.reduce((a, b) => a + b, 0);
    const n = reduceNum(total, true);
    const [title, text] = LIFE_PATH[n] || LIFE_PATH[reduceNum(n, false)];
    lp = `<section class="card" style="flex-direction:row;gap:16px;align-items:center" aria-label="เลขชีวิตของคุณ">
<div class="lp-ring"><span class="mono" style="font-size:30px;line-height:1">${n}</span><span class="mono" style="font-size:8px;letter-spacing:.14em;color:var(--teal)">LIFE PATH</span></div>
<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="h2" style="font-size:17px">${title}</span><span class="body" style="font-size:13px">${text}</span>
<span class="mono small" style="font-size:10px">${digits.join('+')} = ${total}${total !== n ? ' → ' + n : ''}</span></div></section>`;
  }
  const m = state.num.mode;
  return `<main class="screen" style="--accent:var(--teal)">
${pageHead('04', 'NUMEROLOGY', 'ศาสตร์ตัวเลข', 'var(--teal)', 'numbers')}
${lp}
<div class="seg" role="group" aria-label="ประเภทการวิเคราะห์"><button aria-pressed="${m === 'phone'}" data-act="numMode" data-v="phone">เบอร์โทร</button><button aria-pressed="${m === 'plate'}" data-act="numMode" data-v="plate">ทะเบียนรถ</button></div>
<label class="field">${m === 'phone' ? 'เบอร์โทรศัพท์' : 'ทะเบียนรถ (ใช้เฉพาะตัวเลข)'}<input class="input mono" style="font-size:20px;letter-spacing:.1em" inputmode="${m === 'phone' ? 'tel' : 'text'}" data-in="numValue" value="${esc(state.num.value)}" placeholder="${m === 'phone' ? '08X-XXX-XXXX' : 'กข 1234'}"></label>
<div id="num-results" style="display:flex;flex-direction:column;gap:10px">${numResults()}</div>
</main>`;
}

const BOX_SVG = (() => {
  const balls = [[78, 114, 3], [102, 116, 7], [126, 113, 1], [150, 116, 9], [174, 113, 0], [198, 116, 5], [90, 92, 8], [114, 92, 4], [138, 90, 6], [162, 92, 2], [186, 91, 7], [126, 69, 5], [154, 69, 3]];
  return `<svg role="img" aria-label="กล่องใสบรรจุลูกเลข 0 ถึง 9" width="280" height="160" viewBox="0 0 280 160" fill="none">
<defs><radialGradient id="lGlow"><stop offset="0" stop-color="#E0A458" stop-opacity="0.35"/><stop offset="1" stop-color="#E0A458" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="140" cy="96" rx="120" ry="60" fill="url(#lGlow)"/><rect x="50" y="14" width="180" height="120" rx="10" stroke="#E0A458" opacity="0.8"/><rect x="56" y="20" width="168" height="108" rx="7" stroke="#3D3424" stroke-width="0.6"/>
<path d="M118 14a22 5 0 0 0 44 0" stroke="#E0A458"/><path d="M40 140H240M60 148H220" stroke="#3D3424"/>
${balls.map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="11" fill="#15120D" stroke="#E0A458" stroke-width="0.8"/><text x="${x}" y="${y}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="#F1E6CF" text-anchor="middle" dominant-baseline="central">${n}</text>`).join('')}</svg>`;
})();
function potSvg(lit) {
  return `<svg role="img" aria-label="กระถางธูป${lit ? ' จุดธูปสามดอก มีควันลอย' : ' ยังไม่ได้จุด'}" width="260" height="160" viewBox="0 0 240 160" fill="none">
<defs><radialGradient id="iGlow"><stop offset="0" stop-color="#FFB45E" stop-opacity="0.9"/><stop offset="1" stop-color="#FFB45E" stop-opacity="0"/></radialGradient></defs>
${lit ? `<path d="M90 36q-7-7 0-14q7-7 0-14M120 30q-7-7 0-14q7-7 0-12M150 36q-7-7 0-14q7-7 0-14" stroke="#C9BC9F" stroke-width="0.8" stroke-linecap="round" opacity="0.6"><animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite"/></path>` : ''}
<path d="M96 110L90 44M120 110V38M144 110L150 44" stroke="#C0574A" stroke-width="2" stroke-linecap="round"/>
${lit ? '<circle cx="90" cy="44" r="8" fill="url(#iGlow)"/><circle cx="120" cy="38" r="8" fill="url(#iGlow)"/><circle cx="150" cy="44" r="8" fill="url(#iGlow)"/><g fill="#FFE3B0"><circle cx="90" cy="44" r="2"/><circle cx="120" cy="38" r="2"/><circle cx="150" cy="44" r="2"/></g>' : ''}
<g stroke="#E0A458"><ellipse cx="120" cy="110" rx="76" ry="9"/><path d="M44 110L58 146Q120 160 182 146L196 110M66 130H174"/></g></svg>`;
}
function viewLuck() {
  const l = state.luck, ball = l.mode === 'ball';
  const slots = (vals) => `<div class="slots">${[0, 1, 2].map((i) => vals[i] != null ? `<span class="slot-n on">${vals[i]}</span>` : '<span class="slot-n">–</span>').join('')}</div>`;
  return `<main class="screen" style="--accent:var(--amber)">
${pageHead('05', 'FORTUNE', 'โชคลาภ', 'var(--amber)', 'luck')}
<div class="seg" role="group" aria-label="วิธีเสี่ยงโชค"><button aria-pressed="${ball}" data-act="luckMode" data-v="ball">ล้วงลูกเลข</button><button aria-pressed="${!ball}" data-act="luckMode" data-v="incense">จุดธูปขอเลข</button></div>
${ball ? `<div style="display:flex;justify-content:center"><div class="${l.shake ? 'shake' : ''}" style="line-height:0">${BOX_SVG}</div></div>
${slots(l.balls)}<button class="btn" data-act="drawBall">${l.balls.length < 3 ? 'ล้วงลูกที่ ' + (l.balls.length + 1) : 'เริ่มใหม่'}</button>`
    : `<div style="display:flex;justify-content:center">${potSvg(!!l.ash)}</div>${slots(l.ash || [])}<button class="btn" data-act="lightUp">${l.ash ? 'จุดธูปใหม่' : 'จุดธูปสามดอก'}</button>`}
<p class="small" style="text-align:center">เพื่อความบันเทิงเท่านั้น ตัวเลขสุ่มจากเครื่องของคุณ ไม่ใช่การรับประกันผลใด ๆ · โปรดเล่นอย่างพอประมาณ</p>
</main>`;
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
    const c = { i: Math.floor(Math.random() * 22), rev: Math.random() < 0.25 };
    const card = TAROT[c.i];
    return { text: `ไพ่ที่ได้คือ "${card[2]}" (${card[1]}${c.rev ? ', กลับหัว' : ''}) — ${c.rev ? card[4] : card[3]}`, basis: ['TAROT · ' + card[0]] };
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
    case 'install': if (installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; el.remove(); }); } return;
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
    case 'tarotDraw': {
      const pool = Array.from({ length: 22 }, (_, k) => k);
      for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
      state.tarot.cards = pool.slice(0, 3).map((n) => ({ i: n, rev: Math.random() < 0.25 }));
      state.tarot.open = 0;
      break;
    }
    case 'tarotOpen': if (state.tarot.cards && state.tarot.open < 3) state.tarot.open += 1; break;
    case 'tarotReset': state.tarot.cards = null; state.tarot.open = 0; break;
    case 'numMode': state.num.mode = el.dataset.v; break;
    case 'luckMode': state.luck.mode = el.dataset.v; break;
    case 'drawBall': {
      const l = state.luck;
      if (l.balls.length >= 3) { l.balls = []; break; }
      l.shake = true; render();
      setTimeout(() => { l.shake = false; l.balls = l.balls.concat([Math.floor(Math.random() * 10)]); render(); }, 500);
      return;
    }
    case 'lightUp': state.luck.ash = [0, 1, 2].map(() => Math.floor(Math.random() * 10)); break;
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
  if (key === 'placeQuery') {
    state.placeQuery = v;
    const list = document.getElementById('place-list');
    if (list) list.innerHTML = placeOptions();
    return;
  }
  if (key === 'numValue') {
    state.num.value = v;
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
