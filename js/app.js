// Taksila app — screens, state and routing (hash routes, no framework).
import {
  SIGNS, ELEMENTS, PLANETS, HOUSES, planetById, computeChart, transits, daily, compatibility,
  planetPositions, signOf, fmtDeg, localToUtc, liveAspects, upcomingIngresses, ASPECT_GLYPH, lonOf, weekAhead, lunarPhase, findAspect, elementOf
} from './astro.js';
import { PLACES, MONTHS_TH, MONTHS_SHORT, TOPICS, LIFE_PATH, DIGITS, SUM_MEANING } from './data.js';
import { starMap, logoRing, EL_HEX } from './starmap.js';
import { EVENTS, findAuspicious } from './auspice.js';
import { natalProfile, sixthSense } from './profile.js';
import { CARDS, drawCards, SPREADS, HOUSE_READ } from './tarot.js';
import { mountGlobe, burnIncense, mountSiamsi, mountTree, askMotion, randomDigit, thaiNum } from './luck.js';
import { SIAMSI } from './siamsi.js';
import { PURPOSES, purposeById, PRAYERS, PRAYER_CATS, prayerById, dailyRemedy, tarotRemedy, siamsiRemedy, birthChant, devaOfDay, EVENT_CHANT } from './prayer.js';
import { NUM_TOOLS, analyzeNumber, analyzeAngel, gradeOf, birthHexColor, reduceTo9, analyzeName, LEVEL_TH, NUM_PLANET, taksaOf } from './numerology.js';
import { DAY_MERIT, PLANET_NO, RITES, templesFor, NAKSHAT, PAGODA, nakshatOf, chongOf, CHONG_FIX, luckWindows, windowRange, remedyPlan } from './remedy.js';
import { dignityOf, houseLord, tarotSynthesis, dreamLookup } from './insight.js';
import { TH_PLANETS, thaksa, luckOf, birthPlanet, thaiLagna, dayColors, yams, yamUse, posOf, dayPlanet } from './thai.js';

// ---------------- storage ----------------
const KEY = 'taksila.v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ profile: state.profile, people: state.match.people })); } catch (e) { /* storage unavailable */ } }

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
  match: { sign: null, useDate: true, rel: 'love', name: '', day: 14, month: 2, yearBE: 2535, hour: 12, minute: 0, timeKnown: false, people: saved.people || [] },
  tarot: { topic: 0, spread: 2, cards: null, deck: null, picks: [], flipped: [], sel: 0, q: '', who: 'me', other: { name: '', known: false, day: 1, month: 1, yearBE: 2540 } },
  prayer: { cat: 'all', purpose: null, open: null, counts: {} },
  num: { mode: 'name', values: {}, first: '', last: '', gender: '', day: 0 },
  luck: { mode: 'ball', balls: [], inc: 'idle', incDigits: [], incShown: [], ss: null, tree: { tied: false, digits: null, done: false, kind: null }, hist: [] },
  ask: { messages: [], persona: 'thai', ctx: null, pending: false }
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
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  prayer: '<path d="M12 20c-4 0-8-3-9-7 3 0 6 1.5 9 5 3-3.5 6-5 9-5-1 4-5 7-9 7z"/><path d="M12 18c-2.5-2.5-3-6.5 0-11 3 4.5 2.5 8.5 0 11z"/>',
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

const ORA_COL = ['#E58FA8', '#D4AF63', '#6FC3B2', '#A99BD9'];
// ---------- คำทำนายวันนี้ (home hero) ----------
// Preview variants: ?hero=a (big card on top), ?hero=b (once-a-day opening sheet), ?hero=c (headline banner).
const HERO_VAR = (() => { try { return new URLSearchParams(location.search).get('hero') || ''; } catch (e) { return ''; } })();
function todayOracle() {
  const ch = state.chart, now = new Date();
  const d0 = weekData()[0], dl = daily(ch, now), la = liveAspects(ch, now);
  const total = Math.round(dl.scores.reduce((a, x) => a + x.score, 0) / dl.scores.length * 20);
  const best = dl.scores.reduce((m, x) => (x.score > m.score ? x : m), dl.scores[0]);
  const worst = dl.scores.reduce((m, x) => (x.score < m.score ? x : m), dl.scores[0]);
  const lead = la[0] ? la[0].reason : dl.headline;
  const moon = `ดวงจันทร์ผ่านภพ ${d0.moonHouse} เรื่อง${HOUSES[d0.moonHouse - 1].split(' ').slice(0, 2).join(' ')}จะเด่นขึ้นมา`;
  const advice = best.score >= 4 ? `วันนี้เด่นเรื่อง${best.name} ลงมือได้เลย` : `วันนี้ค่อย ๆ ทำทีละเรื่อง`;
  const caution = worst.score <= 2 ? `ระวังเรื่อง${worst.name}` : '';
  const verdict = total >= 75 ? 'วันพลังดี' : total >= 55 ? 'วันกลาง ๆ ค่อนดี' : total >= 40 ? 'วันต้องใจเย็น' : 'วันพักเก็บแรง';
  const col = total >= 75 ? 'var(--gold-2)' : total >= 55 ? '#F0D89A' : total >= 40 ? '#F0A08C' : 'var(--tension)';
  return { d0, dl, la, total, best, worst, lead, moon, advice, caution, date: `${WEEKDAY[now.getDay()]} ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} · ${d0.phase.th}`, verdict, col, luck: luckToday() };
}
function oracleRing(total, size = 74) {
  const R = 30, C = 2 * Math.PI * R, len = (total / 100) * C;
  return `<svg class="ora-ring" width="${size}" height="${size}" viewBox="0 0 72 72" aria-label="คะแนนวันนี้ ${total}"><defs><linearGradient id="orag" x1="0" x2="1"><stop offset="0" stop-color="#E592B2"/><stop offset=".5" stop-color="#D4AF63"/><stop offset="1" stop-color="#7FC4B4"/></linearGradient></defs>
<circle cx="36" cy="36" r="${R}" fill="none" stroke="#2C261B" stroke-width="6"/><circle class="ring-arc" cx="36" cy="36" r="${R}" fill="none" stroke="url(#orag)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 36 36)" style="--len:${len.toFixed(1)};--c:${C.toFixed(1)}"/>
<text x="36" y="41" text-anchor="middle" font-family="IBM Plex Mono" font-size="17" fill="#F1E6CF">${total}</text></svg>`;
}
function oracleHeroA() {
  const o = todayOracle();
  return `<section class="ora ora-a" aria-label="คำทำนายวันนี้">
<span class="ora-eye"><span class="live-dot" aria-hidden="true"></span>คำทำนายวันนี้ · ${o.date}</span>
<div class="ora-top"><div class="ora-v"><b style="color:${o.col}">${o.verdict}</b><span>${o.advice}${o.caution ? ' · ' + o.caution : ''}</span></div>${oracleRing(o.total)}</div>
<p class="ora-lead">“${o.lead}”</p>
<p class="ora-moon">☽ ${o.moon}</p>
<div class="ora-cats">${o.dl.scores.map((x, k) => `<span style="--c:${ORA_COL[k]}"><i></i>${x.name}<b>${x.score}</b></span>`).join('')}</div>
<span class="ora-sub">มงคลประจำวัน</span>
${luckCells(o.luck)}
<button class="ora-more" data-act="oraMore">อ่านเหตุผลจากดาวทั้งหมด ↓</button>
</section>`;
}
function oracleBannerC() {
  const o = todayOracle();
  return `<button class="ora ora-c" data-act="oraMore" aria-label="คำทำนายวันนี้">
<span class="ora-c-l"><span class="ora-eye">คำทำนายวันนี้</span><b style="color:${o.col}">${o.verdict}</b></span>
<span class="ora-c-r">${o.lead}</span></button>`;
}
// The opening sheet shows once per day, on the first home render after the app opens.
let ORA_SHEET = null;
function showOraSheet() {
  if (ORA_SHEET !== null) return ORA_SHEET;
  if (HERO_VAR === 'b') return (ORA_SHEET = true);
  if (HERO_VAR === 'none') return (ORA_SHEET = false);
  const key = new Date().toDateString();
  try { ORA_SHEET = localStorage.getItem('taksila.oraDay') !== key; if (ORA_SHEET) localStorage.setItem('taksila.oraDay', key); } catch (e) { ORA_SHEET = false; }
  return ORA_SHEET;
}
function oracleSheetB() {
  const o = todayOracle();
  return `<div class="ora-sheet" id="ora-sheet" role="dialog" aria-label="คำทำนายวันนี้"><div class="ora-sheet-in">
<span class="ora-eye" style="justify-content:center">${o.date}</span>
<p class="ora-hi">สวัสดี${greeting(new Date()).replace('สวัสดี', '')} คุณ${esc((state.profile.name || '').split(' ')[0])}</p>
${oracleRing(o.total, 120)}
<b class="ora-big" style="color:${o.col}">${o.verdict}</b>
<p class="ora-lead" style="text-align:center">“${o.lead}”</p>
<p class="ora-moon" style="text-align:center">☽ ${o.moon}</p>
<div class="ora-cats">${o.dl.scores.map((x, k) => `<span style="--c:${ORA_COL[k]}"><i></i>${x.name}<b>${x.score}</b></span>`).join('')}</div>
<p class="ora-moon" style="text-align:center">${o.advice}${o.caution ? ' · ' + o.caution : ''}</p>
${luckCells(o.luck)}
<button class="btn" data-act="oraClose">เข้าสู่หน้าหลัก</button></div></div>`;
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
    ['auspice', 'ฤกษ์ยาม', 'แต่ง บวช ขึ้นบ้าน', 'var(--amber)'],
    ['prayer', 'บทสวด', 'แก้ดวง เสริมดวง', 'var(--gold-2)'],
    ['ask', 'ปรึกษา', 'ถามเรื่องเฉพาะ', 'var(--rose)']
  ];
  return `<main class="screen home">
<header class="home-head">
<div class="hh-text"><span class="eyebrow" style="letter-spacing:.24em">TAKSILA · ${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear() + 543}</span>
<h1 class="hh-title">${greeting(now)}${p.name ? ' คุณ' + esc(p.name.split(' ')[0]) : ''}</h1>
<p class="hh-big3"><span>${SIGNS[ch.planets[0].sign].glyph}&#xFE0E; ${SIGNS[ch.planets[0].sign].th}</span><span>${SIGNS[ch.planets[1].sign].glyph}&#xFE0E; ${SIGNS[ch.planets[1].sign].th}</span>${ch.timeKnown ? `<span>ลัคนา ${SIGNS[signOf(ch.asc)].th}</span>` : ''}</p></div>
<a class="hh-map" href="#/chart" aria-label="เปิดผังดาวกำเนิด">${starMap(ch, { id: 'home', label: 'ผังดาวกำเนิดของคุณ', size: 92 })}</a>
</header>
<section id="week" style="display:flex;flex-direction:column;gap:10px" aria-label="ดวง 7 วันข้างหน้า">${weekHTML()}</section>
<div id="oracle-card">${oracleHeroA()}</div>
<nav class="oracle-grid" aria-label="ศาสตร์การทำนาย">${tools.map(([r, t, s, c]) => `<a class="oracle" href="#/${r}" style="--c:${c}"><span class="sigil">${icon(r, 20)}</span><span class="n">${t}</span><span class="small">${s}</span></a>`).join('')}</nav>
<div id="install-slot">${installHTML()}</div>
<section id="live-daily" aria-label="ดวงรายวันแบบสด">${liveDailyHTML()}</section>
<section style="display:flex;flex-direction:column;gap:10px">
<h2 class="label">TRANSITS · ดาวจรระยะยาว</h2>
<div class="hscroll edge">${tr.map((t) => `<a class="mini" href="#/chart" data-act="chartTab" data-i="2">
<span style="display:flex;justify-content:space-between;align-items:center"><span class="sym" style="font-size:20px;color:${trColor(t)}">${t.glyph}&#xFE0E;</span><span class="mono small" style="font-size:10px">H${t.house}</span></span>
<span class="t">${t.isReturn ? (t.id === 'saturn' ? 'เสาร์คืนเรือน' : 'พฤหัสคืนเรือน') : planetById(t.id).th + 'จร' + SIGNS[t.sign].th}</span>
<span class="small">${HOUSES[t.house - 1]}</span></a>`).join('')}</div>
</section>
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
${remedyChip(dailyRemedy(la, birthPlanet(state.profile), total))}
${heroRemedy()}
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
function luckToday() {
  const now = new Date(), today = dayColors(now), { me } = personalLuck(), { cur, nextGood } = currentYams(now);
  const best = today.money !== me.avoid ? today.money : today.work;
  const goodNow = cur && cur.pos.tone === 2;
  return { best, avoid: me.avoid, nums: me.numbers.slice(0, 3), yamL: goodNow ? 'ตอนนี้ยามดี' : 'ยามดีถัดไป', yamV: goodNow ? 'ถึง ' + hm(cur.end) : nextGood ? hm(nextGood.start) : '–' };
}
function luckCells(k) {
  return `<a class="ora-luck" href="#/auspice" aria-label="มงคลวันนี้">
<span><i>สีเสริมดวง</i><b><em style="background:${TH_PLANETS[k.best].hex}"></em>${TH_PLANETS[k.best].color.split(' ')[0]}</b></span>
<span><i>สีที่ควรเลี่ยง</i><b><em style="background:${TH_PLANETS[k.avoid].hex}"></em>${TH_PLANETS[k.avoid].color.split(' ')[0]}</b></span>
<span><i>เลขมงคล</i><b class="mono">${k.nums.join(' ')}</b></span>
<span><i>${k.yamL}</i><b class="mono">${k.yamV}</b></span></a>`;
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
${remedyChip({ id: EVENT_CHANT[a.event], kind: 'เสริม', reason: `สวดก่อนเริ่มงาน${ev.th} เพื่อความเป็นสิริมงคล` })}
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
  const oc = document.getElementById('oracle-card');
  if (oc) oc.innerHTML = oracleHeroA();
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
${identityRemedy(p)}
<section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">โชคลาภและสุขภาพ</h2>
<div class="card" style="gap:8px"><p class="small" style="color:var(--text)"><span style="color:var(--gold-2)">โชคลาภ ·</span> ${r.luck}</p>
${r.health.map((h) => `<p class="small" style="color:var(--text)"><span style="color:var(--gold-2)">จุดที่ควรดูแล ·</span> ${h}</p>`).join('')}
<p class="small" style="font-size:11px">ข้อมูลสุขภาพตามตำราโหราศาสตร์ ไม่ใช่คำวินิจฉัยทางการแพทย์</p></div></section>`;
}

const EL_COL = EL_HEX;
const EL_HINT = ['กล้าลงมือ มีไฟ', 'มั่นคง ทำจริง', 'คิดไว สื่อสารเก่ง', 'อ่อนไหว เข้าใจคน'];
function elRing(e, n, total, tag) {
  const R = 26, C = 2 * Math.PI * R, d = Math.max(0.02, n / total) * C;
  return `<div class="ch-el${tag ? ' ' + tag : ''}"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" fill="none" stroke="#2C261B" stroke-width="5"/>
<circle cx="32" cy="32" r="${R}" fill="none" stroke="${EL_COL[e]}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${d.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/>
<text x="32" y="37" text-anchor="middle" font-family="IBM Plex Mono" font-size="15" fill="#F1E6CF">${n}</text></svg>
<b>ธาตุ${ELEMENTS[e].th}</b><span>${tag === 'top' ? 'เด่นที่สุด' : tag === 'low' ? 'ควรเติม' : EL_HINT[e]}</span></div>`;
}
function bigThree(ch) {
  const sun = ch.planets[0], moon = ch.planets[1], asc = ch.asc != null ? signOf(ch.asc) : null;
  const cell = (lab, th, glyph, s, note) => `<div class="b3"><span class="b3-m" style="--c:${s == null ? 'var(--faint)' : EL_COL[s % 4]}">${glyph}</span>
<span class="label" style="font-size:9px;letter-spacing:.18em">${lab}</span><b>${s == null ? 'ไม่ทราบ' : SIGNS[s].th}</b><span>${note}</span></div>`;
  return `<section class="b3-row">${cell('SUN · ตัวตน', 'อาทิตย์', G(sun.glyph), sun.sign, 'แก่นแท้ของคุณ')}${cell('MOON · ใจ', 'จันทร์', G(moon.glyph), moon.sign, 'อารมณ์ ความต้องการ')}${cell('RISING · ลัคนา', 'ลัคนา', asc == null ? '?' : `<span class="sym">${SIGNS[asc].glyph}&#xFE0E;</span>`, asc, asc == null ? 'ต้องมีเวลาเกิด' : 'ภาพที่คนอื่นเห็น')}</section>`;
}
function aspectCard(a) {
  const tone = a.nature > 0 ? 'h' : a.nature < 0 ? 't' : 'c';
  return `<li class="asp ${tone}"><span class="asp-pair"><span class="sym">${a.a.glyph}&#xFE0E;</span><i></i><span class="sym">${a.b.glyph}&#xFE0E;</span></span>
<span class="asp-t"><b>${a.a.th} ${a.th} ${a.b.th}</b><span>${ASPECT_TEXT[a.nature]}</span></span><span class="asp-o mono">${a.off.toFixed(1)}°</span></li>`;
}
function planetCard(pl) {
  const e = pl.sign % 4;
  return `<li class="pl-card sense"><button class="pl-head" data-act="senseToggle" aria-expanded="false">
<span class="b3-m sm" style="--c:${EL_COL[e]}"><span class="sym">${pl.glyph}&#xFE0E;</span></span>
<span class="pl-t"><b>${pl.th}${pl.retro ? ' <span class="pl-r">R ถอย</span>' : ''}${(() => { const dg = dignityOf(pl.id, pl.sign); return dg ? ` <span class="pl-dg ${dg.score > 0 ? 'up' : 'dn'}">${dg.th}</span>` : ''; })()}</b><span>${pl.kw}</span></span>
<span class="pl-b"><span class="pl-sign"><span class="sym">${SIGNS[pl.sign].glyph}&#xFE0E;</span> ${SIGNS[pl.sign].th}</span><span class="mono">ภพ ${pl.house} · ${fmtDeg(pl.lon)}</span></span>
<span class="chev">${icon('down', 14, 1.6)}</span></button>
<div class="fold"><div class="fold-in"><p class="small pl-body">${planetText(pl)}${(() => { const dg = dignityOf(pl.id, pl.sign); return dg ? ` · ดาว${pl.th}${dg.th}: ${dg.d}` : ''; })()}</p></div></div></li>`;
}
function viewChart() {
  const ch = state.chart, p = state.profile, tab = state.chartTab, now = new Date();
  const kp = keyPattern(ch);
  const elOrder = [0, 1, 2, 3].sort((a, b) => ch.elementCount[b] - ch.elementCount[a]);
  const top = elOrder[0], low = elOrder[3];
  const elTotal = ch.elementCount.reduce((a, b) => a + b, 0) || 1;
  let body = '';
  if (tab === 0) {
    const asp = ch.aspects.slice(0, 8), nh = asp.filter((a) => a.nature > 0).length, nt = asp.filter((a) => a.nature < 0).length, nc = asp.length - nh - nt;
    body = `<section class="ch-wheel">${starMap(ch, { id: 'chart', houses: true, label: 'ผังดาวกำเนิดฉบับเต็ม' })}
<div class="legend"><span><i style="background:var(--harmony)"></i>ส่งเสริม</span><span><i style="background:var(--tension)"></i>ท้าทาย</span><span class="mono">WHOLE SIGN</span></div></section>
${bigThree(ch)}
<section class="kp"><span class="eyebrow" style="letter-spacing:.2em">KEY PATTERN · จุดเด่นของผัง</span><p class="h2" style="font-size:18px">${kp.title}</p><p class="body" style="font-size:14px">${kp.body}</p><p class="mono" style="font-size:10px;color:var(--muted)">${kp.code}</p></section>
<section class="ch-sec"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">◇</span>สมดุลธาตุ</h2>
<div class="ch-els">${[0, 1, 2, 3].map((e) => elRing(e, ch.elementCount[e], elTotal, e === top ? 'top' : e === low ? 'low' : '')).join('')}</div>
<p class="small" style="font-size:13px">ธาตุ${ELEMENTS[top].th}เด่น (${EL_HINT[top]}) ส่วนธาตุ${ELEMENTS[low].th}น้อยที่สุด ลองเติมพลังด้าน${EL_HINT[low]}ในชีวิตประจำวัน</p></section>
<section class="ch-sec"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">✦</span>มุมดาวสำคัญ</h2>
<div class="asp-sum" role="img" aria-label="ส่งเสริม ${nh} ท้าทาย ${nt} ร่วม ${nc}"><span style="flex:${nh || 0.001};background:var(--harmony)"></span><span style="flex:${nc || 0.001};background:var(--gold)"></span><span style="flex:${nt || 0.001};background:var(--tension)"></span></div>
<p class="asp-leg small"><span style="color:var(--harmony)">ส่งเสริม ${nh}</span><span style="color:var(--gold)">ร่วม ${nc}</span><span style="color:var(--tension)">ท้าทาย ${nt}</span></p>
<ul class="asp-list">${asp.map(aspectCard).join('')}</ul></section>`;
  } else if (tab === 1) {
    body = `<p class="small" style="font-size:13px">ตำแหน่งดาว 10 ดวง ณ เวลาเกิด แตะการ์ดเพื่ออ่านความหมาย · สีวงบอกธาตุของราศี${ch.timeKnown ? '' : ' (ไม่ทราบเวลา: ภพนับจากราศีดวงอาทิตย์ และดวงจันทร์อาจคลาดได้ถึง ±6°)'}</p>
<ul class="pl-list">${ch.asc != null ? `<li class="pl-card asc"><div class="pl-head"><span class="b3-m sm" style="--c:${EL_COL[signOf(ch.asc) % 4]}"><span class="mono" style="font-size:10px">ASC</span></span>
<span class="pl-t"><b>ลัคนา</b><span>ภาพลักษณ์ที่คนอื่นเห็น: ${SIGNS[signOf(ch.asc)].trait}</span></span>
<span class="pl-b"><span class="pl-sign"><span class="sym">${SIGNS[signOf(ch.asc)].glyph}&#xFE0E;</span> ${SIGNS[signOf(ch.asc)].th}</span><span class="mono">${fmtDeg(ch.asc)}</span></span></div></li>` : ''}
${ch.planets.map(planetCard).join('')}</ul>`;
  } else if (tab === 3) {
    body = identityHTML(ch, p);
  } else {
    const tr = transits(ch, now);
    const col = (t) => t.level === 'HIGH' ? 'var(--tension)' : t.level === 'SUPPORT' ? 'var(--gold)' : 'var(--harmony)';
    const lvTh = (t) => t.level === 'HIGH' ? 'มีผลมาก' : t.level === 'SUPPORT' ? 'ช่วยหนุน' : 'เปลี่ยนผ่าน';
    body = `${luckCalendarHTML(ch)}<h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">◎</span>ดาวจรตอนนี้</h2><p class="small" style="font-size:13px">ดาวเคลื่อนช้าที่โคจรอยู่ตอนนี้ เทียบกับดวงกำเนิดของคุณ เรียงตามน้ำหนัก</p>
<ul class="tr-list">${tr.map((t) => `<li class="tr-card" style="--c:${col(t)}"><div class="tr-top"><span class="b3-m sm" style="--c:${col(t)}"><span class="sym">${t.glyph}&#xFE0E;</span></span>
<span class="pl-t"><b>${t.title}</b><span class="mono" style="font-size:11px">ตอนนี้${t.exit ? ' → ถึง ' + monthYear(t.exit) : ''}${t.retro ? ' · ถอยหลัง' : ''}</span></span><span class="tr-lv">${lvTh(t)}</span></div>
<p class="body" style="font-size:13px">${t.body}</p>
${t.hits.length ? `<span class="tags">${t.hits.map((h) => `<span class="tag">${h.th} ${h.target.th}</span>`).join('')}</span>` : ''}
${t.level === 'HIGH' && t.id !== 'jupiter' ? remedyCard(remedyPlan({ planetNo: PLANET_NO[t.id], topic: t.id === 'saturn' ? 'work' : 'bad', level: t.isReturn ? 3 : 2, reason: `บูชาดาว${TH_PLANETS[PLANET_NO[t.id]].th}ตลอดช่วงที่ดาวนี้จรผ่าน${t.exit ? ' (ถึง ' + monthYear(t.exit) + ')' : ''}` })) : ''}</li>`).join('')}</ul>`;
  }
  const tabBtn = (i, t) => `<button role="tab" aria-selected="${tab === i}" data-act="chartTab" data-i="${i}">${t}</button>`;
  const sun = ch.planets[0], bp = birthPlanet(p);
  return `<main class="screen">
${pageHead('01', 'NATAL CHART', 'ผังดาวกำเนิด', 'var(--gold)', 'chart')}
<section class="ch-id"><span class="b3-m" style="--c:${EL_COL[sun.sign % 4]}"><span class="sym">${SIGNS[sun.sign].glyph}&#xFE0E;</span></span>
<span class="ch-id-t"><b>${esc(p.name || 'ฉัน')}</b><span class="mono">${pad(p.day)}.${pad(p.month)}.${p.yearBE - 543} · ${p.timeKnown ? pad(p.hour) + ':' + pad(p.minute) : '--:--'}</span><span>${esc(p.place.name || 'พิกัดกำหนดเอง')} · เกิด${TH_PLANETS[bp].day}</span></span>
<a class="ch-edit" href="#/setup">แก้ไข</a></section>
<div class="ch-tabs" role="tablist" aria-label="มุมมองดวง">${tabBtn(0, 'ผังดาว')}${tabBtn(3, 'ตัวตน')}${tabBtn(1, 'ดาวในภพ')}${tabBtn(2, 'ดวงจร')}</div>
${body}
<a class="btn" href="#/ask">ถามผู้เชี่ยวชาญเรื่องดวงนี้</a>
</main>`;
}

// ---------------- คู่ดวง (synastry + Thai day pairs + Chinese years) ----------------
const REL = [
  { id: 'love', th: 'คนรัก', ic: '♡', who: 'คนรัก', w: { emo: .25, spark: .25, talk: .15, stable: .2, values: .15 }, cat: 0 },
  { id: 'crush', th: 'คนที่คุยอยู่', ic: '✧', who: 'เขา', w: { emo: .2, spark: .35, talk: .25, stable: .05, values: .15 }, cat: 0 },
  { id: 'friend', th: 'เพื่อน', ic: '☺', who: 'เพื่อน', w: { emo: .3, spark: .05, talk: .35, stable: .1, values: .2 }, cat: 0 },
  { id: 'biz', th: 'หุ้นส่วน · งาน', ic: '◈', who: 'หุ้นส่วน', w: { emo: .1, spark: 0, talk: .3, stable: .35, values: .25 }, cat: 1 },
  { id: 'family', th: 'ครอบครัว', ic: '⌂', who: 'คนในครอบครัว', w: { emo: .4, spark: 0, talk: .2, stable: .25, values: .15 }, cat: 0 }
];
const DIMS = [
  { id: 'emo', th: 'อารมณ์ ความเข้าใจ', col: '#A99BD9', pairs: [['moon', 'moon'], ['sun', 'moon'], ['moon', 'sun'], ['moon', 'venus'], ['venus', 'moon']] },
  { id: 'talk', th: 'การสื่อสาร', col: '#7FC4B4', pairs: [['mercury', 'mercury'], ['mercury', 'sun'], ['sun', 'mercury'], ['mercury', 'moon'], ['moon', 'mercury']] },
  { id: 'spark', th: 'แรงดึงดูด', col: '#E592B2', pairs: [['venus', 'mars'], ['mars', 'venus'], ['venus', 'venus'], ['mars', 'mars'], ['sun', 'venus'], ['venus', 'sun']] },
  { id: 'stable', th: 'ความมั่นคงระยะยาว', col: '#D4AF63', pairs: [['saturn', 'sun'], ['sun', 'saturn'], ['saturn', 'moon'], ['moon', 'saturn'], ['saturn', 'venus'], ['venus', 'saturn'], ['jupiter', 'sun'], ['sun', 'jupiter']] },
  { id: 'values', th: 'เป้าหมายชีวิต', col: '#E8845A', pairs: [['sun', 'sun'], ['jupiter', 'jupiter'], ['jupiter', 'moon'], ['moon', 'jupiter']] }
];
const DIM_TEXT = {
  emo: ['เข้าใจความรู้สึกกันโดยไม่ต้องพูดมาก', 'ความต้องการทางใจต่างกัน ต้องบอกกันตรง ๆ'],
  talk: ['คุยกันถูกคอ ความคิดไปทางเดียวกัน', 'สื่อสารคลาดกันง่าย ฟังให้จบก่อนตอบ'],
  spark: ['เคมีแรง ดึงดูดกันเป็นธรรมชาติ', 'แรงดึงดูดมาพร้อมการปะทะ ระวังอารมณ์ร้อน'],
  stable: ['ช่วยกันสร้างความมั่นคง อยู่ด้วยกันได้นาน', 'มีความกดดันหรือความคาดหวังต่อกัน ต้องให้พื้นที่กัน'],
  values: ['มองเป้าหมายชีวิตไปทางเดียวกัน', 'เป้าหมายหรือวิธีใช้ชีวิตต่างกัน ต้องหาจุดร่วม']
};
// Thai birth-day pairs (Wongnai, general reading) — 1..8 = Sun..Sat, 8 = Wed night.
const DAY_PAIR = { 1: { good: [6, 8], bad: [3] }, 2: { good: [5, 1], bad: [8] }, 3: { good: [4, 7], bad: [1] }, 4: { good: [6, 2], bad: [7] }, 5: { good: [2, 7], bad: [8] }, 6: { good: [1, 4], bad: [7] }, 7: { good: [3, 5], bad: [6] }, 8: { good: [1, 3], bad: [2] } };
function thaiDayMatch(a, b) {
  const pos = posOf(a, b), back = posOf(b, a);
  let s = 60; const notes = [];
  if (a === b) { s += 10; notes.push('เกิดวันเดียวกัน นิสัยและจังหวะชีวิตคล้ายกัน'); }
  if (DAY_PAIR[a].good.includes(b)) { s += 20; notes.push(`ตำราคู่วันเกิด: คน${TH_PLANETS[a].day}เข้ากันดีกับคน${TH_PLANETS[b].day}`); }
  if (DAY_PAIR[a].bad.includes(b)) { s -= 20; notes.push(`ตำราคู่วันเกิด: คน${TH_PLANETS[a].day}ควรระวังเมื่อคบกับคน${TH_PLANETS[b].day}`); }
  if (a !== b) {
    const tone = (p) => (p.id === 'kalakini' ? -20 : ['sri', 'det', 'montri'].includes(p.id) ? 12 : 4);
    s += Math.round((tone(pos) + tone(back)) / 2);
    notes.push(`ทักษา: ${TH_PLANETS[b].day}เป็น "${pos.th}" ของคุณ (${pos.use}) และคุณเป็น "${back.th}" ของเขา`);
  }
  return { score: Math.max(20, Math.min(98, s)), notes };
}
function chineseMatch(a, b) {
  if (a === b) return { score: 72, th: 'ปีเดียวกัน', d: 'นิสัยคล้ายกัน เข้าใจกันง่าย แต่ดื้อพอกัน' };
  if (a % 4 === b % 4) return { score: 92, th: 'สามประสาน', d: 'กลุ่มนักษัตรเดียวกัน ส่งเสริมกันทั้งงานและความรัก' };
  if ((a + b) % 12 === 1) return { score: 88, th: 'หกประสาน (คู่มิตร)', d: 'คู่มิตรตามตำราจีน ช่วยเหลือกันและกัน' };
  if (Math.abs(a - b) === 6) return { score: 40, th: 'คู่ชง', d: 'ขั้วตรงข้ามตามตำราจีน มักขัดแย้งกันตรง ๆ ต้องใจเย็น' };
  if ((a + b) % 12 === 7) return { score: 55, th: 'คู่ขัด', d: 'มักมีเรื่องให้ระคายใจเล็ก ๆ น้อย ๆ' };
  return { score: 66, th: 'เป็นกลาง', d: 'ไม่ส่งเสริมไม่ขัดกัน ขึ้นอยู่กับการปรับตัวของทั้งคู่' };
}
function theirProfile(m) {
  return { name: m.name || '', day: +m.day, month: +m.month, yearBE: +m.yearBE, hour: +m.hour, minute: +m.minute, timeKnown: !!m.timeKnown, place: { name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' } };
}
function synastry(me, them) {
  const P = (c, id) => c.planets.find((p) => p.id === id);
  const dims = {}, hits = [];
  for (const d of DIMS) {
    let s = 58;
    for (const [x, y] of d.pairs) {
      const a = P(me, x), b = P(them, y);
      const asp = findAspect(a.lon, b.lon, 0.8);
      if (!asp) continue;
      const k = 1 - asp.off / (asp.orb * 0.8 + 0.01) * 0.5;
      let v = asp.nature > 0 ? 13 : asp.nature < 0 ? (asp.id === 'opp' && d.id === 'spark' ? 5 : -9) : (x === 'saturn' || y === 'saturn' ? 3 : 9);
      s += v * k;
      hits.push({ dim: d, a, b, asp, v: v * k });
    }
    if (d.id === 'values') s += ((elementOf(P(me, 'sun').sign) - elementOf(P(them, 'sun').sign) + 4) % 2 === 0 ? 8 : -4);
    dims[d.id] = Math.round(Math.max(20, Math.min(98, s)));
  }
  hits.sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
  return { dims, hits };
}
function matchResult() {
  const m = state.match, ch = state.chart, rel = REL.find((r) => r.id === m.rel) || REL[0];
  const mySign = ch.planets[0].sign;
  if (!m.useDate) {
    if (m.sign == null) m.sign = (mySign + 4) % 12;
    const base = compatibility(mySign, m.sign);
    return { rel, signOnly: true, score: base.score, base, theirSign: m.sign };
  }
  const tp = theirProfile(m), them = computeChart(tp);
  const theirSign = them.planets[0].sign;
  const base = compatibility(mySign, theirSign);
  const syn = synastry(ch, them);
  const dimScore = Object.entries(rel.w).reduce((a, [k, w]) => a + syn.dims[k] * w, 0);
  const myDay = birthPlanet(state.profile), thDay = birthPlanet(tp);
  const td = thaiDayMatch(myDay, thDay);
  const cn = chineseMatch(nakshatOf(state.profile), nakshatOf(tp));
  const score = Math.round(dimScore * 0.6 + base.score * 0.15 + td.score * 0.125 + cn.score * 0.125);
  return { rel, signOnly: false, score, base, syn, td, cn, them, tp, theirSign, myDay, thDay };
}
const MATCH_LABEL = (s) => s >= 85 ? 'คู่สร้างคู่สม' : s >= 72 ? 'คู่เติมเต็ม' : s >= 60 ? 'คู่ที่ไปได้ดีถ้าเข้าใจกัน' : s >= 48 ? 'คู่ที่ต้องปรับจูน' : 'คู่ที่ต้องใช้ความอดทน';
function matchWeek(r) {
  const out = [], t0 = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i, 12);
    const a = daily(state.chart, d).scores[r.rel.cat].score, b = daily(r.them, d).scores[r.rel.cat].score;
    out.push({ d, s: (a + b) / 2 });
  }
  return out;
}
function matchHTML(r) {
  const m = state.match, ch = state.chart, mySign = ch.planets[0].sign;
  const R = 54, C = 2 * Math.PI * R, dash = (r.score / 100) * C;
  const who = esc(m.name || r.rel.who);
  const hero = `<section class="mt-hero">
<div class="mt-p"><span class="b3-m" style="--c:${EL_HEX[mySign % 4]}"><span class="sym">${SIGNS[mySign].glyph}&#xFE0E;</span></span><b>${esc(state.profile.name || 'คุณ')}</b><span>${SIGNS[mySign].th}${r.signOnly ? '' : ' · ' + TH_PLANETS[r.myDay].day.replace('วัน', '')}</span></div>
<div class="mt-g"><svg viewBox="0 0 132 132" role="img" aria-label="เข้ากัน ${r.score}%"><defs><linearGradient id="mtg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#E592B2"/><stop offset="1" stop-color="#F0D89A"/></linearGradient></defs>
<circle cx="66" cy="66" r="${R}" fill="none" stroke="#2C261B" stroke-width="8"/><circle class="ring-arc" cx="66" cy="66" r="${R}" fill="none" stroke="url(#mtg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 66 66)" style="--len:${dash.toFixed(1)};--c:${C.toFixed(1)}"/>
<text x="66" y="66" text-anchor="middle" font-family="IBM Plex Mono" font-size="28" fill="#F1E6CF">${r.score}</text><text x="66" y="86" text-anchor="middle" font-family="IBM Plex Mono" font-size="9" letter-spacing="2" fill="#A3967D">MATCH %</text></svg></div>
<div class="mt-p"><span class="b3-m" style="--c:${EL_HEX[r.theirSign % 4]}"><span class="sym">${SIGNS[r.theirSign].glyph}&#xFE0E;</span></span><b>${who}</b><span>${SIGNS[r.theirSign].th}${r.signOnly ? '' : ' · ' + TH_PLANETS[r.thDay].day.replace('วัน', '')}</span></div>
<p class="mt-label">${MATCH_LABEL(r.score)}</p><p class="mt-sub">${r.base.reading}</p></section>`;
  if (r.signOnly) return hero + `<section class="mt-card"><span class="eyebrow" style="color:var(--rose)">ราศีอาทิตย์</span><p class="small">${r.base.tags.join(' · ')}</p><p class="small" style="color:var(--text-2)">เปิด "ใส่วันเกิด" เพื่อดูคะแนน 5 ด้าน คู่วันเกิดแบบไทย ปีนักษัตรจีน และวันดีของคู่นี้</p></section>`;
  const good = r.syn.hits.filter((h) => h.v > 0).slice(0, 3), bad = r.syn.hits.filter((h) => h.v < 0).slice(0, 3);
  const line = (h) => `<li><span class="mt-asp" style="--c:${h.dim.col}"><span class="sym">${h.a.glyph}&#xFE0E;</span><i></i><span class="sym">${h.b.glyph}&#xFE0E;</span></span><span><b>${h.a.th}ของคุณ ${h.asp.th} ${h.b.th}ของ${who}</b><span>${h.dim.th}: ${DIM_TEXT[h.dim.id][h.v > 0 ? 0 : 1]}</span></span></li>`;
  const wk = matchWeek(r), best = wk.reduce((a, x) => (x.s > a.s ? x : a), wk[0]);
  const DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const L1 = luckOf(r.myDay), L2 = luckOf(r.thDay);
  return hero + `
<section class="mt-card"><h2 class="t-step-h"><span style="border-color:var(--rose);color:var(--rose)">✦</span>คะแนน 5 ด้าน</h2>
<ul class="mt-dims">${DIMS.map((d) => `<li${r.rel.w[d.id] ? '' : ' class="dim0"'}><span>${d.th}${r.rel.w[d.id] >= .25 ? ' <i>สำคัญ</i>' : ''}</span><span class="mt-bar"><span style="width:${r.syn.dims[d.id]}%;background:${d.col};box-shadow:0 0 8px ${d.col}"></span></span><b>${r.syn.dims[d.id]}</b></li>`).join('')}</ul>
<p class="small" style="font-size:11px">น้ำหนักแต่ละด้านปรับตามความสัมพันธ์ "${r.rel.th}"</p></section>
<section class="mt-3">
<div class="mt-mini"><span class="eyebrow">ราศีสากล</span><b>${r.base.score}</b><span>${SIGNS[mySign].th} × ${SIGNS[r.theirSign].th}</span><span>${r.base.tags[0]}</span></div>
<div class="mt-mini"><span class="eyebrow">คู่วันเกิดไทย</span><b>${r.td.score}</b><span>${TH_PLANETS[r.myDay].day.replace('วัน', '')} × ${TH_PLANETS[r.thDay].day.replace('วัน', '')}</span><span>ทักษา + ตำราคู่วัน</span></div>
<div class="mt-mini"><span class="eyebrow">นักษัตรจีน</span><b>${r.cn.score}</b><span>${NAKSHAT[nakshatOf(state.profile)]} × ${NAKSHAT[nakshatOf(r.tp)]}</span><span>${r.cn.th}</span></div></section>
<section class="mt-card"><h2 class="t-step-h"><span style="border-color:var(--rose);color:var(--rose)">☯</span>ตำราไทยและจีนว่าอย่างไร</h2>
${r.td.notes.map((n) => `<p class="small" style="color:var(--text)">• ${n}</p>`).join('')}<p class="small" style="color:var(--text)">• ปีนักษัตร ${r.cn.th}: ${r.cn.d}</p></section>
${good.length ? `<section class="mt-card good"><h2 class="t-step-h"><span style="border-color:var(--harmony);color:var(--harmony)">+</span>จุดแข็งของคู่นี้</h2><ul class="mt-list">${good.map(line).join('')}</ul></section>` : ''}
${bad.length ? `<section class="mt-card bad"><h2 class="t-step-h"><span style="border-color:var(--tension);color:var(--tension)">!</span>เรื่องที่ต้องระวัง</h2><ul class="mt-list">${bad.map(line).join('')}</ul></section>` : ''}
<section class="mt-card"><h2 class="t-step-h"><span style="border-color:var(--rose);color:var(--rose)">◷</span>7 วันข้างหน้าของคู่นี้</h2>
<div class="mt-week">${wk.map((x) => `<span class="${x === best ? 'best' : ''}"><i style="height:${Math.round(x.s * 18)}%"></i><b>${DOW[x.d.getDay()]}</b><em>${x.d.getDate()}</em></span>`).join('')}</div>
<p class="small">วันที่ดาวหนุนทั้งสองคนมากที่สุดคือ <b style="color:var(--gold-2)">${['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][best.d.getDay()]}ที่ ${best.d.getDate()} ${MONTHS_SHORT[best.d.getMonth()]}</b> เหมาะกับ${r.rel.id === 'biz' ? 'คุยงาน เซ็นสัญญา' : 'นัดเจอ คุยเรื่องสำคัญ'}</p></section>
<section class="mt-card"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">◇</span>เคล็ดเสริมคู่</h2>
<p class="small" style="color:var(--text)">• สีเสริมเสน่ห์ (ศรี) ของคุณ: ${TH_PLANETS[L1.money].color} · ของ${who}: ${TH_PLANETS[L2.money].color}</p>
<p class="small" style="color:var(--text)">• ${r.rel.id === 'biz' ? 'ไหว้พระพิฆเนศหรือวัดกัลยาณมิตรก่อนเริ่มธุรกิจร่วมกัน' : 'ไหว้ขอพรความรักที่วัดโพธิ์หรือวัดระฆัง และทำบุญร่วมกันในวันเกิดของอีกฝ่าย'}</p>
${chipsOf(r.rel.id === 'biz' ? ['ganesha', 'popular'] : ['metta-maha', 'uma'])}</section>
${r.score < 55 ? remedyCard(remedyPlan({ planetNo: 6, topic: 'love', level: r.score < 45 ? 2 : 1, reason: `ดวงเข้ากัน ${r.score}% เสริมด้วยบุญของดาวศุกร์ ดาวแห่งความรักและความกลมเกลียว` })) : ''}`;
}
function viewMatch() {
  const m = state.match, r = matchResult(), maxDay = daysIn(m.month, m.yearBE);
  return `<main class="screen" style="--accent:var(--rose)">
${pageHead('02', 'COMPATIBILITY', 'คู่ดวง', 'var(--rose)', 'match')}
<div class="mt-rel" role="group" aria-label="ความสัมพันธ์">${REL.map((x) => `<button class="mt-relb" aria-pressed="${x.id === r.rel.id}" data-act="matchRel" data-v="${x.id}"><span>${x.ic}</span>${x.th}</button>`).join('')}</div>
${m.people.length ? `<div class="mt-people"><span class="eyebrow">คนที่บันทึกไว้</span><div>${m.people.map((p, i) => `<span class="mt-pc"><button data-act="matchPick" data-i="${i}" aria-pressed="${m.name === p.name && m.useDate}">${esc(p.name)}</button><button class="x" data-act="matchDel" data-i="${i}" aria-label="ลบ ${esc(p.name)}">×</button></span>`).join('')}</div></div>` : ''}
<section class="mt-form mt-card"><h2 class="t-step-h"><span style="border-color:var(--rose);color:var(--rose)">✎</span>เทียบดวงกับใคร</h2>
<div class="seg2"><button aria-pressed="${m.useDate}" data-act="matchMode" data-v="date">ใส่วันเกิด (แม่นกว่า)</button><button aria-pressed="${!m.useDate}" data-act="matchMode" data-v="sign">รู้แค่ราศี</button></div>
${m.useDate ? `<label class="field">ชื่อเล่น<input class="input" data-in="m.name" value="${esc(m.name || '')}" placeholder="เช่น ฝน" maxlength="20"></label>
<div class="date-row">
<label class="field">วัน<select class="select mono" data-in="m.day">${opts(range(1, maxDay).map((n) => [n, n]), Math.min(m.day, maxDay))}</select></label>
<label class="field">เดือน<select class="select" data-in="m.month">${opts(MONTHS_TH.map((x, i) => [i + 1, x]), m.month)}</select></label>
<label class="field">ปี พ.ศ.<select class="select mono" data-in="m.yearBE">${opts(range(2443, 2643).reverse().map((n) => [n, n]), m.yearBE)}</select></label></div>
<button type="button" class="check" aria-pressed="${!!m.timeKnown}" data-act="matchTime"><span class="box">${m.timeKnown ? '✓' : ''}</span>รู้เวลาเกิดของอีกฝ่าย</button>
${m.timeKnown ? `<div class="date-row"><label class="field">ชั่วโมง<select class="select mono" data-in="m.hour">${opts(range(0, 23).map((n) => [n, pad(n)]), m.hour)}</select></label><label class="field">นาที<select class="select mono" data-in="m.minute">${opts(range(0, 59).map((n) => [n, pad(n)]), m.minute)}</select></label></div>` : ''}
<button class="btn ghost" data-act="matchSave"${m.name ? '' : ' disabled'}>${m.people.some((p) => p.name === m.name) ? 'อัปเดตข้อมูลที่บันทึก' : 'บันทึกคนนี้ไว้ดูครั้งหน้า'}</button>`
    : `<div class="sign-grid" role="radiogroup" aria-label="ราศีของอีกฝ่าย">${SIGNS.map((s, i) => `<button class="sign-btn${i === state.chart.planets[0].sign ? ' me' : ''}" role="radio" aria-checked="${i === m.sign}" data-act="matchSign" data-i="${i}"><span class="gl" aria-hidden="true">${s.glyph}&#xFE0E;</span>${s.th}</button>`).join('')}</div>`}
</section>
${matchHTML(r)}
<p class="small" style="text-align:center;font-size:11px">คำนวณจากตำแหน่งดาวจริงของทั้งสองคน ร่วมกับตำราคู่วันเกิดไทยและปีนักษัตรจีน · เพื่อความเข้าใจกัน ไม่ใช่คำตัดสินความรัก</p>
</main>`;
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
${remedyChip(tarotRemedy(c, d.rev))}
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
  const sum = tarotSummary(spread, t.cards) + tarotSynthHTML(t) + tarotFix(t);
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
  angel: '<path d="M12 6.5c-1.6-2.5-5-3-6.8-1.2-2 2-1 5.3 2 7.4L12 16l4.8-3.3c3-2.1 4-5.4 2-7.4-1.8-1.8-5.2-1.3-6.8 1.2z"/><ellipse cx="12" cy="3" rx="3.2" ry="1"/><path d="M12 16v5"/>',
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
${r.kalakiniFirst.length ? `<p class="small ns-note" style="color:var(--tension)">พบอักษรกาลกิณีในชื่อ: <b>${r.kalakiniFirst.join(' ')}</b> (ของคนเกิด${TH_PLANETS[bp].day}) ตำราแนะนำให้เลี่ยง</p>${remedyChip({ id: birthChant(bp), kind: 'แก้', reason: 'ระหว่างยังไม่เปลี่ยนชื่อ สวดบทประจำวันเกิดเพื่อเสริมดวง' })}` : L ? `<p class="small ns-note" style="color:var(--teal)">ชื่อไม่มีอักษรกาลกิณีของคนเกิด${TH_PLANETS[bp].day}${r.kalakini.length ? ` (นามสกุลมี ${r.kalakini.join(' ')} แต่ตำรามักผ่อนผันให้นามสกุล)` : ''}</p>` : ''}
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
  if (n.mode === 'angel') {
    const a = analyzeAngel(v);
    if (!a) return `<p class="small num-empty">พิมพ์เลขที่เห็นบ่อย ๆ เพื่อดูความหมาย</p>`;
    return `<div class="card ang-card"><span class="eyebrow" style="color:var(--teal)">ANGEL NUMBER</span>
<div class="ang-num mono">${a.digits.split('').map((c) => `<b>${c}</b>`).join('')}</div>
<p class="ang-title">${a.special ? 'เลขพิเศษ ' + a.digits : a.title}</p>
<p class="body" style="font-size:14px;margin:0">${a.message}</p>
${a.pattern ? `<p class="small ang-pat">✦ ${a.pattern}</p>` : ''}</div>
<div class="ang-3"><div><span>♡ ความรัก</span><p>${a.love}</p></div><div><span>◈ การงาน</span><p>${a.work}</p></div><div><span>◇ การเงิน</span><p>${a.money}</p></div></div>
${a.parts.length > 1 ? `<h2 class="label" style="margin-top:4px">พลังของแต่ละตัวเลข</h2><div class="ang-parts">${a.parts.map((x) => `<div><b class="mono">${x.n}</b><span>${x.k}${x.times > 1 ? ` <i>×${x.times}</i>` : ''}</span></div>`).join('')}</div>` : ''}
<div class="card ang-core"><span class="mono">${a.digits.split('').join('+')} = ${a.sum} → ${a.core}</span><span>เลขแก่น ${a.core}: ${a.coreMean}</span></div>
<p class="small">เมื่อเห็นเลขนี้: หยุดหายใจลึก ๆ สังเกตว่ากำลังคิดเรื่องอะไรอยู่ นั่นคือเรื่องที่เลขนี้ชี้ · Angel Number เป็นความเชื่อสมัยใหม่ที่มาจากเลขศาสตร์ตะวันตก ใช้เป็นข้อคิดและกำลังใจ</p>`;
  }
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
<div class="num-tools">${NUM_TOOLS.map((t) => `<button class="num-tool${t.id === 'name' || t.id === 'angel' ? ' wide' : ''}${t.id === 'angel' ? ' angel' : ''}" data-act="numMode" data-v="${t.id}" aria-pressed="${n.mode === t.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${NUM_ICONS[t.id]}</svg>${t.th}</button>`).join('')}</div></section>
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
</article>${remedyChip(siamsiRemedy(f.level))}${f.level <= 1 ? remedyCard(remedyPlan({ planetNo: troubleNow().planetNo, topic: 'bad', level: 2, reason: 'ใบเซียมซีเตือนให้ระวัง ทำบุญเสริมให้หนักเป็นเบา' })) : ''}`;
}

const LUCK_MODES = [
  ['ball', 'ลูกปิงปอง', 'จับลูกจากโถ', '<circle cx="12" cy="13" r="7"/><path d="M12 6V3M9 3h6"/><text x="12" y="16" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">8</text>'],
  ['incense', 'ธูปเลข', 'ขี้ธูปเผยเลข', '<path d="M12 21V9"/><path d="M12 7c-2-2 2-3 0-5"/><path d="M7 21h10"/>'],
  ['tree', 'ขูดต้นไม้', 'ถูแป้งหาเลข', '<path d="M12 21v-7M9 21h6"/><path d="M12 14c-5 0-7-3-6-6 1-3 4-4 6-4s5 1 6 4c1 3-1 6-6 6z"/><path d="M10 15.5h4" stroke-width="2.4"/>'],
  ['siamsi', 'เซียมซี', 'เขย่าเสี่ยงทาย', '<path d="M8 21h8l1-12H7z"/><path d="M10 9V3M12 9V2M14 9V4"/>']
];
const TREE_KINDS = [['ต้นตะเคียน', 'นางตะเคียน'], ['ต้นโพธิ์', 'รุกขเทวดา'], ['ต้นไทร', 'เจ้าแม่ต้นไทร'], ['ต้นมะขาม', 'รุกขเทวดา']];
// The tree scene: canopy, trunk, roots, garlands and offerings. The bark panel with the canvas sits on top.
const TREE_SVG = `<svg class="tr-svg" viewBox="0 -24 320 384" aria-hidden="true">
<defs><radialGradient id="trc" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#3E5A2E"/><stop offset="1" stop-color="#1C2A16"/></radialGradient>
<linearGradient id="trt" x1="0" x2="1"><stop offset="0" stop-color="#3A2A1C"/><stop offset=".45" stop-color="#6B4E33"/><stop offset=".7" stop-color="#5A4129"/><stop offset="1" stop-color="#2E2116"/></linearGradient>
<radialGradient id="trg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F0D89A" stop-opacity=".35"/><stop offset="1" stop-color="#F0D89A" stop-opacity="0"/></radialGradient></defs>
<circle cx="160" cy="150" r="150" fill="url(#trg)"/>
<g fill="url(#trc)"><circle cx="90" cy="80" r="62"/><circle cx="230" cy="78" r="64"/><circle cx="160" cy="52" r="70"/><circle cx="60" cy="130" r="44"/><circle cx="262" cy="128" r="46"/></g>
<g fill="#4F7239" opacity=".55"><circle cx="120" cy="40" r="22"/><circle cx="205" cy="34" r="20"/><circle cx="250" cy="96" r="16"/><circle cx="75" cy="95" r="18"/></g>
<path d="M112 360c10-30 14-70 14-110 0-50-6-80-26-110l24 6c10 18 18 30 22 46 6-22 4-40-4-60l26 4c4 20 4 40 0 56 10-16 22-28 38-36l14 12c-18 12-28 28-32 50-4 30-2 90 14 142z" fill="url(#trt)"/>
<path d="M126 360c-12-8-34-10-52-6M190 360c12-10 34-12 54-6" stroke="#4A3524" stroke-width="10" fill="none" stroke-linecap="round"/>
<g fill="#8A6A46" opacity=".9"><circle cx="70" cy="190" r="0"/></g>
<g class="tr-garland" fill="none" stroke-width="5" stroke-linecap="round"><path d="M128 120q32 22 64 0" stroke="#F2E6C8" stroke-dasharray="1 7"/><path d="M130 124q30 20 60 0" stroke="#E8A93A" stroke-dasharray="1 7" stroke-dashoffset="4"/></g>
<g class="tr-offer"><rect x="40" y="330" width="44" height="14" rx="4" fill="#B5541E"/><circle cx="52" cy="326" r="7" fill="#E8C14E"/><circle cx="66" cy="324" r="8" fill="#9BC25A"/><circle cx="78" cy="327" r="6" fill="#E8A93A"/>
<rect x="238" y="326" width="40" height="18" rx="3" fill="#F2E6C8"/><path d="M244 326v-14M252 326v-18M260 326v-14" stroke="#C93A2E" stroke-width="2"/><circle cx="252" cy="306" r="2" fill="#FFB54A"/></g>
</svg>`;
const CLOTH = (on) => `<div class="tr-cloth${on ? ' on' : ''}" aria-hidden="true"><i style="--c:#E0457B"></i><i style="--c:#F2C230"></i><i style="--c:#3FA35B"></i><span class="tr-tail"><b style="--c:#E0457B"></b><b style="--c:#F2C230"></b><b style="--c:#3FA35B"></b></span></div>`;
function treeSlots(t) {
  return `<div class="tr-slots">${(t.digits || [null, null, null]).map((d) => `<span class="tr-slot${t.done ? ' on' : ''}">${t.done ? d : '?'}</span>`).join('')}</div>`;
}
function luckTodayHTML() {
  const bp = birthPlanet(state.profile), L = luckOf(bp), now = new Date();
  const dp = dayPlanet(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours());
  const pos = posOf(bp, dp);
  const w = luckWindows(state.chart, now).find((x) => x.kind !== 'care');
  return `<section class="lk-today">
<div><span>เลขมงคลประจำตัว</span><b class="mono">${L.numbers.join(' ')}</b><i>ทักษาคนเกิด${TH_PLANETS[bp].day}</i></div>
<div><span>วันนี้เป็นวัน</span><b>${pos.th}</b><i>${pos.tone >= 2 ? 'วันดีเสี่ยงโชค' : pos.tone < 0 ? 'วันควรงดเสี่ยง' : 'วันกลาง ๆ'}</i></div>
<div><span>ช่วงโชคถัดไป</span><b>${w ? windowRange(w).split(' – ')[0] : '—'}</b><i>${w ? w.area : 'สร้างฐานก่อน'}</i></div></section>`;
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
  } else if (mode === 'tree') {
    const t = l.tree;
    if (!t.digits) { t.digits = [randomDigit(), randomDigit(), randomDigit()]; t.kind = TREE_KINDS[Math.floor(Math.random() * TREE_KINDS.length)]; }
    body = `<div class="tr-stage${t.tied ? ' tied' : ''}${t.done ? ' revealed' : ''}" id="tree">${TREE_SVG}
<div class="tr-bark"><canvas aria-label="เปลือกไม้ ใช้นิ้วถูเพื่อหาเลข"></canvas>${t.done ? `<span class="tr-num">${t.digits.join(' ')}</span>` : ''}</div>${CLOTH(t.tied)}
<span class="tr-name">${t.kind[0]}</span></div>
${treeSlots(t)}
<div class="tr-meter" aria-hidden="true"><i id="tr-meter" style="width:${t.done ? 100 : 0}%"></i></div>
<p class="p-hint" id="tree-hint">${t.done ? `${t.kind[1]}ให้เลข <b>${t.digits.join(' ')}</b> · สองตัวท้าย <b>${t.digits.slice(1).join('')}</b>` : t.tied ? '<b>ใช้นิ้วถูแป้งบนเปลือกไม้</b> ถูไปมาจนร่องเปลือกเผยตัวเลข' : `ขั้นแรก ผูกผ้าสามสีที่${t.kind[0]} ตั้งจิตขอพร${t.kind[1]}`}</p>
${t.done ? '<button class="btn btn-line" data-act="treeNew">ไปขอต้นใหม่</button>' : t.tied ? '' : '<button class="btn" data-act="treeTie">ผูกผ้าสามสี</button>'}`;
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
${luckTodayHTML()}
<div class="lk-modes" role="group" aria-label="วิธีเสี่ยงโชค">${LUCK_MODES.map(([id, th, sub, ic]) => `<button aria-pressed="${mode === id}" data-act="luckMode" data-v="${id}"><span class="lk-ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ic}</svg></span><b>${th}</b><span>${sub}</span></button>`).join('')}</div>
<section class="lk-stage lk-${mode}">${body}</section>
${l.hist.length ? `<section class="lk-hist"><span class="eyebrow">ผลล่าสุด</span><div>${l.hist.slice(-6).reverse().map((h) => `<span><i>${h.m}</i><b class="mono">${h.v}</b></span>`).join('')}</div></section>` : ''}
<p class="small" style="text-align:center;font-size:11px">${mode === 'siamsi' ? 'คำทำนายแต่งขึ้นใหม่โดยตักศิลา ใช้เป็นข้อคิดและกำลังใจ' : mode === 'tree' ? 'จำลองความเชื่อการขอเลขจากต้นไม้ใหญ่ · ตัวเลขสุ่มจากเครื่องของคุณ เพื่อความบันเทิง โปรดเล่นอย่างพอประมาณ' : 'เพื่อความบันเทิง ตัวเลขสุ่มจากเครื่องของคุณ ไม่ใช่การรับประกันผลใด ๆ · โปรดเล่นอย่างพอประมาณ'}</p>
</main>`;
}
const luckHist = (m, v) => { const h = state.luck.hist; if (!h.length || h[h.length - 1].v !== v) h.push({ m, v }); };

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
        if (l.balls.length >= 3) { luckHist('ปิงปอง', l.balls.map((b) => b.d).join('')); setTimeout(render, 700); }
        else { const h = document.getElementById('ball-hint'); if (h) h.textContent = `ได้ลูกที่ ${l.balls.length} แล้ว จับต่ออีก ${3 - l.balls.length} ลูก`; }
      }
    });
  } else if (l.mode === 'tree' && l.tree.tied && !l.tree.done) {
    const el = document.getElementById('tree');
    if (el) luckCtl = mountTree(el.querySelector('.tr-bark'), {
      digits: l.tree.digits,
      onProgress(p) { const m = document.getElementById('tr-meter'); if (m) m.style.width = Math.min(100, Math.round(p / 0.62 * 100)) + '%'; },
      onReveal() { l.tree.done = true; luckHist('ต้นไม้', l.tree.digits.join('')); setTimeout(() => { if (route() === 'luck' && l.mode === 'tree') render(); }, 900); }
    });
  } else if (l.mode === 'siamsi' && !l.ss) {
    const el = document.getElementById('ss');
    if (el) luckCtl = mountSiamsi(el, { total: SIAMSI.length, onFall(no) { l.ss = no; luckHist('เซียมซี', 'ใบ ' + no); render(); const sl = document.querySelector('.slip'); if (sl) sl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  }
}


// ---------------- consult: free questions, answered from the chart, with remedies ----------------
const CHANT_PLANET = { 'day-sun': 1, 'day-mon': 2, 'day-tue': 3, 'day-wed': 4, 'day-thu': 5, 'day-fri': 6, 'day-sat': 7, 'day-rahu': 8 };
const CAT_TOPIC = ['love', 'work', 'money', 'health'];
function remedyCard(plan, open = false) {
  return `<section class="rm-card sense${open ? ' open' : ''} lv${plan.level}">
<button class="rm-head" data-act="senseToggle" aria-expanded="${open}"><span class="rm-ic">☸</span><span class="rm-t"><b>${plan.title}</b><span>${plan.reason}</span></span><span class="rm-n">${plan.steps.length} วิธี</span><span class="chev">${icon('down', 14, 1.6)}</span></button>
<div class="fold"><div class="fold-in"><ol class="rm-steps">${plan.steps.map((s) => `<li><span class="rm-si">${s.ic}</span><span class="rm-sb"><span class="rm-k">${s.k}</span><b>${s.t}</b>${s.d && s.d !== s.t ? `<span>${s.d}</span>` : ''}${s.chant ? `<a href="#/prayer" data-act="openPrayer" data-v="${s.chant}" class="rm-go">เปิดบทสวด ›</a>` : ''}${s.src ? `<i>ที่มา: ${s.src}</i>` : ''}</span></li>`).join('')}</ol>
<p class="rm-foot">ทำเท่าที่สะดวกและตามกำลังทรัพย์ ทุกข้อเป็นความเชื่อตามประเพณีไทย ที่ได้ผลแน่นอนคือใจที่สงบลงและความดีที่ได้ทำ</p></div></div></section>`;
}
// What troubles the person right now: a hard transit from a heavy planet, or a low day score.
function troubleNow() {
  const ch = state.chart, now = new Date(), bp = birthPlanet(state.profile);
  const dl = daily(ch, now), total = Math.round(dl.scores.reduce((a, x) => a + x.score, 0) / dl.scores.length * 20);
  const r = dailyRemedy(liveAspects(ch, now, { n: 6, exact: false }), bp, total);
  const tr = transits(ch, now), heavy = tr.find((t) => t.level === 'HIGH' && t.id !== 'jupiter');
  let planetNo = r.kind === 'แก้' ? CHANT_PLANET[r.id] : heavy ? PLANET_NO[heavy.id] : bp;
  const worst = dl.scores.reduce((m, x, i) => (x.score < dl.scores[m].score ? i : m), 0);
  const level = total < 40 || (heavy && r.kind === 'แก้') ? 3 : total < 55 || heavy || r.kind === 'แก้' ? 2 : 1;
  const reason = r.kind === 'แก้' ? r.reason : heavy ? `${heavy.title.replace(/ · ภพ \d+/, '')} ทำมุมกับดวงเดิม (${heavy.hits.map((h) => h.th + ' ' + h.target.th).join(', ')})` : `ดวงวันนี้ ${total}/100 ด้าน${dl.scores[worst].name}อ่อนที่สุด`;
  return { planetNo, level, total, worstTopic: CAT_TOPIC[worst], worstName: dl.scores[worst].name, reason, heavy, r };
}
const AREAS = [
  { re: /งาน|อาชีพ|ธุรกิจ|เลื่อนตำแหน่ง|ลาออก|สมัครงาน|ค้าขาย|ร้าน/, th: 'การงาน', houses: [10, 6], cat: 1, topic: 'work' },
  { re: /รัก|แฟน|คู่ครอง|โสด|แต่งงาน|คืนดี|เนื้อคู่|สามี|ภรรยา|จีบ|เขาคิด|เธอคิด|คิดยังไงกับ|คนคุย/, th: 'ความรัก', houses: [5, 7], cat: 0, topic: 'love' },
  { re: /เงิน|ลงทุน|หนี้|รวย|มั่งคั่ง|ทรัพย์|หุ้น|รายได้|คริปโต/, th: 'การเงิน', houses: [2, 8], cat: 2, topic: 'money' },
  { re: /สุขภาพ|ป่วย|เจ็บ|ร่างกาย|ผ่าตัด|โรค/, th: 'สุขภาพ', houses: [6, 1], cat: 3, topic: 'health' },
  { re: /ย้าย|บ้าน|ครอบครัว|คอนโด|พ่อแม่|ลูก/, th: 'บ้านและครอบครัว', houses: [4], cat: 0, topic: 'home' },
  { re: /เดินทาง|ต่างประเทศ|เรียน|สอบ|ทุน/, th: 'การเดินทางและการเรียน', houses: [9, 3], cat: 1, topic: 'study' },
  { re: /เจ้านาย|หัวหน้า|ผู้ใหญ่/, th: 'ผู้ใหญ่และเจ้านาย', houses: [10, 11], cat: 1, topic: 'boss' }
];
const CHANT_RE = [[/ผี|วิญญาณ|ไล่|ของไม่ดี/, 'ghost'], [/หนี้/, 'debt'], [/เจ้านาย|หัวหน้า|ผู้ใหญ่/, 'boss'], [/สอบ/, 'exam'], [/ฉลาด|ความจำ|เรียน/, 'smart'], [/ป่วย|สุขภาพ|หายป่วย/, 'health'], [/รัก|เสน่ห์|แฟน/, 'love'], [/นอน|ฝันร้าย/, 'sleep'], [/เดินทาง|ขับรถ|บิน/, 'travel'], [/คดี|ชนะ|คู่แข่ง|อุปสรรค/, 'win'], [/ปล่อยปลา|ปล่อยสัตว์/, 'release'], [/เทพ|พิฆเนศ|ลักษมี|พรหม|ศิวะ/, 'deva'], [/กรรม|ดวงตก|เคราะห์/, 'karma'], [/เงิน|รวย|ทรัพย์|ค้าขาย|โชค/, 'wealth']];
const chipsOf = (ids) => `<div class="ask-links">${ids.map((id) => { const p = prayerById(id); return p ? `<a href="#/prayer" data-act="openPrayer" data-v="${id}" class="ask-link">☸ ${p.th} · ${p.count} จบ</a>` : ''; }).join('')}</div>`;
const roomLink = (to, th) => `<a href="#/${to}" class="ask-link">${th} ›</a>`;
function windowsHTML(ws, n = 5) {
  return `<ul class="lw-list">${ws.slice(0, n).map((w) => `<li class="lw ${w.kind}"><span class="lw-d">${windowRange(w)}</span><span class="lw-t"><b>${w.kind === 'care' ? 'ช่วงระวัง' : w.kind === 'money' ? 'ช่วงการเงินดี' : 'ช่วงโชคดี'} · ${w.area}</b><span>${w.planet === 'jupiter' ? 'ดาวพฤหัส' : 'ดาวเสาร์'}จร${w.asp}${w.kind === 'money' ? ' ' + w.target : 'กับ' + w.target + 'เดิม'}</span></span></li>`).join('')}</ul>`;
}
function answer(text) {
  const ch = state.chart, now = new Date(), p = state.profile, bp = birthPlanet(p);
  const q = text.trim(), out = [], basis = [];
  let html = '';
  const has = (re) => re.test(q);
  const ctx = state.ask.ctx || {}, persona = state.ask.persona;
  let area = AREAS.find((a) => a.re.test(q));
  let followUp = false;
  if (!area && ctx.area && has(/แล้ว|ล่ะ|ต่อ|ยังไง|อย่างไร|เมื่อไ|ช่วงไหน|แก้|ดีไหม|ควร|เพิ่ม|เสริม|ทำไม/)) { area = ctx.area; followUp = true; basis.push('ต่อจากเรื่อง' + area.th); }
  if (area) state.ask.ctx = { area };
  const T = troubleNow();
  // dreams
  if (has(/ฝัน/)) {
    const d = dreamLookup(q);
    if (d) {
      out.push(`ฝันเห็น${d.th}: ${d.d}`);
      if (d.n.length) out.push(`เลขตามตำราทำนายฝัน: ${d.n.join(' · ')}`);
      const L = luckOf(bp);
      out.push(`ถ้าจะใช้เลขคู่กับดวงคุณ ตามทักษาคนเกิด${TH_PLANETS[bp].day} เลขมงคลคือ ${L.numbers.join(' ')}`);
      if (/ระวัง|เคราะห์|อุบัติเหตุ|ขัดแย้ง/.test(d.d)) html += remedyCard(remedyPlan({ planetNo: T.planetNo, topic: 'bad', level: 1, reason: 'ฝันเตือนให้ระวัง ทำบุญตักบาตรเช้าวันรุ่งขึ้นแล้วกรวดน้ำ ตามความเชื่อช่วยให้ร้ายกลายเป็นดี' }));
      basis.push(d.src);
    } else out.push('ผมยังไม่มีคำทำนายของฝันนี้ในตำรา ลองบอกสิ่งที่เห็นในฝันเป็นคำสั้น ๆ เช่น "ฝันเห็นงู" "ฝันฟันหลุด" "ฝันเห็นคนตาย" "ฝันน้ำท่วม"');
    out.push('ความฝันเป็นความเชื่อ ใช้เป็นกำลังใจหรือความบันเทิง');
    return { text: out.join('\n'), basis, html };
  }
  // saved people: "ฉันกับฝน"
  const person = state.match.people.find((x) => x.name && q.includes(x.name));
  if (person) {
    const keep = { ...state.match };
    Object.assign(state.match, person, { useDate: true });
    const r = matchResult();
    Object.assign(state.match, keep);
    const top = Object.entries(r.syn.dims).sort((a, b) => b[1] - a[1]);
    const dimTh = (k) => DIMS.find((d) => d.id === k).th;
    out.push(`คุณกับ${person.name} เข้ากัน ${r.score}% (${MATCH_LABEL(r.score)}) ในฐานะ${r.rel.th}`);
    out.push(`ด้านที่ดีที่สุดคือ${dimTh(top[0][0])} (${top[0][1]}) ด้านที่ต้องดูแลคือ${dimTh(top[top.length - 1][0])} (${top[top.length - 1][1]})`);
    out.push(`คู่วันเกิดไทย ${r.td.score} คะแนน · ปีนักษัตรจีน ${r.cn.th}`);
    html += roomLink('match', 'ดูคู่ดวงละเอียด');
    basis.push('คู่ดวง · ' + person.name);
    return { text: out.join('\n'), basis, html };
  }
  // auspicious days inline
  const EV_RE = [[/แต่งงาน|สมรส|ขันหมาก|จดทะเบียน/, 'wedding'], [/บวช/, 'ordain'], [/ขึ้นบ้าน|ย้ายบ้าน|ย้ายเข้า/, 'house'], [/เปิดร้าน|เปิดบริษัท|เปิดกิจการ|ธุรกิจใหม่/, 'business'], [/ออกรถ|รถใหม่/, 'car'], [/เซ็นสัญญา|ทำสัญญา|ซื้อที่ดิน/, 'contract'], [/เริ่มงาน|สัมภาษณ์|สมัครงาน/, 'job'], [/เดินทาง|บินไป|ต่างประเทศ/, 'travel']];
  const evHit = has(/ฤกษ์|วันไหนดี|วันดี|วันไหน/) && EV_RE.find(([re]) => re.test(q));
  if (evHit) {
    const res = findAuspicious(ch, bp, evHit[1], { days: 60 });
    const DOWN = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    out.push(`ฤกษ์${res.event.th}ที่ดีที่สุดสำหรับคุณใน 60 วันข้างหน้า:`);
    res.results.slice(0, 3).forEach((x, k) => out.push(`${k + 1}. วัน${DOWN[x.date.getDay()]}ที่ ${x.date.getDate()} ${MONTHS_SHORT[x.date.getMonth()]} ${x.date.getFullYear() + 543} · คะแนน ${x.score}${x.good[0] ? ' · ' + x.good[0] : ''}`));
    html += remedyChip({ id: EVENT_CHANT[evHit[1]], kind: 'เสริม', reason: `สวดก่อนเริ่มงาน${res.event.th}` }) + roomLink('auspice', 'ดูฤกษ์ละเอียดและเวลา');
    basis.push('ฤกษ์ยาม · ทักษา + ดาวจร');
    return { text: out.join('\n'), basis, html };
  }
  // the tarot reader answers every question with three cards
  if (persona === 'tarot' && !has(/[0-9]{6,}|หวย|ชง|วัด|ทำบุญ|สวด|คาถา/)) {
    const ds = drawCards(3), C = ds.map((d) => ({ c: CARDS[d.i], rev: d.rev }));
    const POS = ['ที่มาของเรื่อง', 'สถานการณ์ตอนนี้', 'คำแนะนำ'];
    out.push(`แม่หมอสับไพ่แล้วเปิด 3 ใบ${area ? 'เรื่อง' + area.th : 'ให้'}`);
    C.forEach((x, k) => out.push(`${k + 1}. ${POS[k]}: "${x.c.th}"${x.rev ? ' (กลับหัว)' : ''} ${x.rev ? x.c.rev : (area && area.cat === 0 && x.c.love ? x.c.love : area && area.cat !== 0 && x.c.work ? x.c.work : x.c.up)}`));
    tarotSynthesis(C).forEach((l) => out.push('✦ ' + l));
    const l = lean(C[2].c, C[2].rev) + lean(C[1].c, C[1].rev) * 0.5 - C.filter((x) => x.rev).length * 0.25;
    out.push(`คำตอบโดยรวม: ${l > 0.4 ? 'ไปได้ดี เดินหน้าได้' : l < -0.4 ? 'ยังไม่ใช่จังหวะ ใช้คำแนะนำในใบที่ 3 ก่อน' : 'ยังก้ำกึ่ง ขึ้นกับการตัดสินใจของคุณ'}`);
    html += `<div class="ask-cards">${C.map((x) => `<img src="${x.c.img}" alt="${x.c.th}" class="${x.rev ? 'rev' : ''}" loading="lazy">`).join('')}</div>`;
    if (C.filter((x) => x.rev).length >= 2) html += remedyCard(remedyPlan({ planetNo: T.planetNo, topic: area ? area.topic : 'bad', level: 1, reason: 'ไพ่กลับหัวหลายใบ ทำบุญเสริมก่อนตัดสินใจ' }));
    basis.push('TAROT 3 ใบ', ...C.map((x) => x.c.en));
    return { text: out.join('\n'), basis: basis.slice(0, 5), html };
  }
  // tarot
  if (has(/ไพ่|ทาโร/)) {
    const c = drawCards(1)[0], card = CARDS[c.i];
    out.push(`เปิดไพ่ให้หนึ่งใบ ได้ "${card.th}" (${card.en}${c.rev ? ' กลับหัว' : ''}) ${c.rev ? card.rev : card.up}`);
    basis.push('TAROT · ' + card.en);
    html += remedyChip(tarotRemedy(card, c.rev)) + roomLink('tarot', 'เปิดไพ่แบบเต็มในห้องไพ่');
    return { text: out.join('\n'), basis, html };
  }
  // numbers
  const digits = q.replace(/[^0-9]/g, '');
  if (digits.length >= 6 || has(/เบอร์|ทะเบียน|เลขที่บ้าน/)) {
    const tool = has(/ทะเบียน/) ? 'plate' : has(/บ้าน/) ? 'house' : digits.length === 13 ? 'id' : 'phone';
    const r = analyzeNumber(tool, digits);
    if (r) {
      out.push(`ผลรวม ${r.sum} ลดเหลือ ${r.red}: ${r.meaning}${r.score != null ? ` · คะแนนคู่เลข ${r.score}/100` : ''}`);
      basis.push('SUM ' + r.sum);
      html += roomLink('numbers', 'ดูคู่เลขละเอียดในห้องตัวเลข');
      return { text: out.join('\n'), basis, html };
    }
  }
  if (has(/หวย|เลขเด็ด|เลขเสี่ยง|ลอตเตอรี่|สลาก/)) {
    const n = () => randomDigit();
    out.push(`เลขเสี่ยงโชคพอเป็นสีสัน: ${n()}${n()}${n()} และ ${n()}${n()} เล่นพอประมาณนะครับ`);
    out.push(`เลขมงคลประจำตัวคุณตามทักษา (คนเกิด${TH_PLANETS[bp].day}): ${luckOf(bp).numbers.join(' ')}`);
    html += roomLink('luck', 'ไปเสี่ยงเลขในห้องโชคลาภ');
    basis.push('ทักษา · ' + TH_PLANETS[bp].day);
  }
  if (has(/สวัสดี|หวัดดี|ดีครับ|ดีค่ะ/) && q.length < 12) out.push(`สวัสดีครับคุณ${p.name || ''} ถามได้ทุกเรื่อง เช่น งาน เงิน ความรัก ดวงตกทำอย่างไร ทำบุญอะไรดี ไหว้พระที่ไหน หรือช่วงไหนมีโชค`);
  // area reading from the chart
  if (area && followUp && has(/แก้|เสริม|ทำบุญ|สวด|ไหว้/)) {
    out.push(`ทางแก้เรื่อง${area.th}ของคุณตามดวงตอนนี้ครับ`);
    html += remedyCard(remedyPlan({ planetNo: T.planetNo, topic: area.topic, level: Math.max(1, T.level), reason: T.reason }), true);
  } else if (area) {
    const tr = transits(ch, now), dl = daily(ch, now);
    for (const t of tr) if (area.houses.includes(t.house)) { out.push(`${t.title.replace(/ · ภพ \d+/, '')} อยู่ในภพที่ ${t.house} ของคุณ${t.exit ? ' ถึง ' + monthYear(t.exit) : ''}: ${t.body}`); basis.push(`${t.glyph} H${t.house}`); }
    const natal = ch.planets.filter((x) => area.houses.includes(x.house));
    if (natal.length) { out.push(`ในดวงกำเนิดมีดาว${natal.map((x) => x.th).join(' ')} อยู่ในภพเรื่อง${area.th} เรื่องนี้จึงสำคัญในชีวิตคุณ`); natal.slice(0, 2).forEach((x) => basis.push(`${x.glyph} ${SIGNS[x.sign].th} H${x.house}`)); }
    if (persona === 'astro' && ch.timeKnown) {
      const hl = houseLord(ch, area.houses[0]);
      out.push(hl.text + (hl.tone >= 1.5 ? ' ดาวเจ้าเรือนแข็งแรง เรื่องนี้มีพื้นฐานดีในดวง' : hl.tone <= -1 ? ' ดาวเจ้าเรือนอ่อนกำลัง เรื่องนี้ต้องใช้ความพยายามมากกว่าคนอื่น' : ''));
      natal.forEach((x) => { const dg = dignityOf(x.id, x.sign); if (dg) out.push(`ดาว${x.th}ในราศี${SIGNS[x.sign].th}เป็น${dg.th}: ${dg.d}`); });
      basis.push('เจ้าเรือน H' + area.houses[0]);
    }
    if (persona === 'thai') {
      const L = luckOf(bp), POSK = { work: 'work', boss: 'patron', money: 'money', love: 'people', home: 'people', health: 'health', study: 'patron' };
      const k = POSK[area.topic];
      if (k) out.push(`ตามทักษาคนเกิด${TH_PLANETS[bp].day} เรื่อง${area.th}ให้ใช้พลังดาว${TH_PLANETS[L[k]].th} ใส่สี${TH_PLANETS[L[k]].color}ในวันสำคัญ และเลี่ยงสี${TH_PLANETS[L.avoid].color}`);
    }
    const sc = dl.scores[area.cat];
    out.push(`พลังวันนี้ด้าน${sc.name} ${sc.score}/5 ${sc.score >= 4 ? 'จังหวะดี ลงมือได้' : sc.score <= 2 ? 'ควรรอจังหวะ หรือเตรียมตัวให้พร้อมก่อน' : 'ทำได้แต่ไม่ควรรีบ'}`);
    basis.push('TODAY ' + sc.name + ' ' + sc.score + '/5');
    if (has(/เปลี่ยน|ลาออก|ย้าย|ลงทุน|ซื้อ|ควร|ดีไหม|ได้ไหม/)) {
      const ws = luckWindows(ch, now).filter((w) => w.kind !== 'care').slice(0, 2);
      if (ws.length) out.push(`ถ้ายังไม่รีบ ช่วงที่ดาวหนุนคือ ${ws.map((w) => windowRange(w) + ' (' + w.area + ')').join(' และ ')}`);
    }
    if (sc.score <= 2 || T.level >= 2) html += remedyCard(remedyPlan({ planetNo: T.planetNo, topic: area.topic, level: Math.max(1, T.level - (sc.score >= 3 ? 1 : 0)), reason: T.reason }));
  }
  // timing and luck
  if (has(/เมื่อไ|ช่วงไหน|เดือนไหน|โชค|ลาภ|ปีหน้า|ปีนี้|ช่วงนี้ดี|ดวงดี/) && !has(/หวย|เลขเด็ด|ชง/)) {
    let ws = luckWindows(ch, now);
    if (area && area.topic === 'money') ws = ws.filter((w) => w.kind === 'money' || /เงิน/.test(w.area) || w.kind === 'care');
    if (area && area.topic === 'love') ws = ws.filter((w) => /รัก|ครอบครัว/.test(w.area) || w.kind === 'care');
    const L = luckOf(bp);
    out.push(ws.length ? `ช่วงโชคถัดไปของคุณคือ ${windowRange(ws.find((w) => w.kind !== 'care') || ws[0])} ดูปฏิทินดวง 12 เดือนจากดาวพฤหัสและดาวเสาร์จรด้านล่าง` : 'ใน 12 เดือนข้างหน้าไม่มีดาวพฤหัสทำมุมเด่นกับดวงเดิม เป็นช่วงสร้างฐาน ค่อย ๆ สะสม');
    out.push(`เสริมโชคตามทักษา: สีของศรี (เงินทอง) คือ${TH_PLANETS[L.money].color} เลขมงคล ${L.numbers.join(' ')}`);
    if (ws.length) html += windowsHTML(ws, 6);
    html += remedyCard(remedyPlan({ planetNo: L.money, topic: 'luck', level: 1, reason: `เสริมดาวศรี (ดาว${TH_PLANETS[L.money].th}) ของคนเกิด${TH_PLANETS[bp].day}` }));
    basis.push('♃ TRANSIT', 'ทักษา');
  }
  // bad luck / fixing
  if (has(/ดวงตก|ซวย|เคราะห์|แก้ดวง|แก้กรรม|ไม่ดี|แย่|เจ้ากรรม|อุปสรรค|ไม่ราบรื่น|แก้ยังไง|แก้อย่างไร|แก้ไง/)) {
    out.push(T.planetNo !== bp || T.level >= 2 ? `ตอนนี้สิ่งที่กดดวงคุณคือ: ${T.reason} ตำราไทยแก้ด้วยการบูชาดาวที่ให้โทษ คือดาว${TH_PLANETS[T.planetNo].th} (วัน${DAY_MERIT[T.planetNo].day}) ตามด้านล่าง` : `ช่วงนี้ไม่มีดาวร้ายกดดวงคุณหนัก (${T.reason}) ถ้ารู้สึกติดขัด ตำราให้เสริมดาวประจำวันเกิดของคุณ คือดาว${TH_PLANETS[bp].th} ตามด้านล่าง`);
    html += remedyCard(remedyPlan({ planetNo: T.planetNo, topic: area ? area.topic : T.worstTopic, level: Math.max(2, T.level), reason: T.reason }), true);
    basis.push((T.planetNo !== bp || T.level >= 2 ? 'ดาวให้โทษ · ' : 'ดาวประจำวันเกิด · ') + TH_PLANETS[T.planetNo].th);
  }
  // merit
  if (has(/ทำบุญ|บุญอะไร|ถวายอะไร|สังฆทาน|บริจาค/)) {
    const m = DAY_MERIT[bp];
    out.push(`ทำบุญตามวันเกิด (คนเกิดวัน${m.day}): ถวาย${m.give} ทำทานให้${m.charity} และไหว้พระ${m.buddha}`);
    if (T.planetNo !== bp) { const t = DAY_MERIT[T.planetNo]; out.push(`ช่วงนี้ดาว${TH_PLANETS[T.planetNo].th}กดดวงอยู่ จึงควรทำบุญของวัน${t.day}ด้วย คือถวาย${t.give}`); }
    if (has(/โลง/)) out.push(RITES.coffin.d);
    if (has(/เลือด|โลหิต/)) out.push(RITES.blood.d);
    basis.push('ทำบุญตามวันเกิด');
  } else {
    if (has(/โลง/)) { out.push(RITES.coffin.d); basis.push(RITES.coffin.src); }
    if (has(/เลือด|โลหิต/)) out.push(RITES.blood.d);
  }
  if (has(/ปล่อยปลา|ปล่อยสัตว์|ฝอย/)) { out.push(RITES.release.d); html += chipsOf(['release']); }
  if (has(/สืบชะตา|ต่ออายุ|ต่อชะตา/)) { out.push(RITES.suebchata.d); basis.push(RITES.suebchata.src); }
  if (has(/ราหู/)) { out.push(RITES.rahu.d); html += chipsOf(['day-rahu']); }
  // temples
  if (has(/วัด|ไหว้พระ|ไหว้ที่ไหน|พระธาตุ|ไหว้อะไร/)) {
    const topic = area ? area.topic : has(/โชค|ลาภ|รวย/) ? 'luck' : has(/เคราะห์|ดวงตก/) ? 'bad' : 'any';
    const tp = templesFor(topic).length ? templesFor(topic) : templesFor('any');
    const nk = nakshatOf(p);
    out.push(`วัดที่เหมาะกับเรื่อง${area ? area.th : 'ที่ถาม'}: ${tp.map((t) => `${t.th} (${t.wish})`).join(' · ')}`);
    out.push(`พระประจำวันเกิดของคุณคือ${DAY_MERIT[bp].buddha} และพระธาตุประจำปีเกิด (ปี${NAKSHAT[nk]}) คือ${PAGODA[nk]}`);
    basis.push('ไหว้พระ 9 วัด', 'พระธาตุปี' + NAKSHAT[nk]);
  }
  // ปีชง
  if (has(/ชง/)) {
    const c = chongOf(p, now);
    out.push(c.level ? `ปีนี้ (ปี${NAKSHAT[c.year]}) คุณเกิดปี${NAKSHAT[c.me]} อยู่ในกลุ่ม${c.level} ${CHONG_FIX}` : `ปีนี้ (ปี${NAKSHAT[c.year]}) คนเกิดปี${NAKSHAT[c.me]}อย่างคุณไม่ชง ทำบุญเสริมตามปกติได้เลย`);
    basis.push('ปีนักษัตรนับจากตรุษจีน');
  }
  // chants
  if (has(/สวด|คาถา|บทสวด|ท่อง/)) {
    const hit = CHANT_RE.find(([re]) => re.test(q));
    const pu = hit ? purposeById(hit[1]) : null;
    if (pu) { out.push(`บทสวดเพื่อ${pu.th}: ${pu.note}`); html += chipsOf(pu.items.slice(0, 4)); }
    else { out.push(`บทหลักของคุณคือบทประจำวัน${DAY_MERIT[bp].day} ${DAY_MERIT[bp].count} จบ`); html += chipsOf([birthChant(bp), 'chinabanchon', 'itipiso']); }
  }
  if (has(/ฤกษ์|ขึ้นบ้านใหม่|ออกรถ|เปิดร้าน|บวช/)) { out.push('ฤกษ์ดีสำหรับงานมงคลหาได้ในห้องฤกษ์ยาม เลือกประเภทงานแล้วระบบจะหาวันที่ดีที่สุดตามดวงคุณ'); html += roomLink('auspice', 'ไปหาฤกษ์'); }
  if (has(/สีอะไร|สีมงคล|ใส่สี|เลขมงคล/)) {
    const L = luckOf(bp);
    out.push(`ตามทักษาของคนเกิด${TH_PLANETS[bp].day}: สีเงินทอง${TH_PLANETS[L.money].color} สีการงาน${TH_PLANETS[L.work].color} สีผู้ใหญ่อุปถัมภ์${TH_PLANETS[L.patron].color} สีที่ควรเลี่ยง${TH_PLANETS[L.avoid].color} เลขมงคล ${L.numbers.join(' ')}`);
    basis.push('ทักษา');
  }
  if (!out.length && !html) {
    out.push(`ผมขออ่านจากภาพรวมดวงของคุณนะครับ วันนี้ได้ ${T.total}/100 ด้านที่อ่อนที่สุดคือ${T.worstName}`);
    const ws = luckWindows(ch, now).filter((w) => w.kind !== 'care');
    if (ws.length) out.push(`ช่วงโชคถัดไป: ${windowRange(ws[0])} (${ws[0].area})`);
    out.push('ลองถามให้เจาะจงขึ้น เช่น "งานช่วงนี้เป็นอย่างไร" "ดวงตกแก้ยังไง" "ทำบุญอะไรดี" "ไหว้พระวัดไหนเรื่องเงิน" หรือ "ปีนี้ชงไหม"');
    if (T.level >= 2) html += remedyCard(remedyPlan({ planetNo: T.planetNo, topic: T.worstTopic, level: T.level, reason: T.reason }));
  }
  return { text: out.join('\n'), basis: [...new Set(basis)].slice(0, 5), html };
}
const PERSONAS = [
  { id: 'thai', th: 'หมอดูไทย', ic: '☸', col: 'var(--gold)', d: 'ทักษา ทำบุญ ไหว้พระ บทสวด ฤกษ์', greet: 'สวัสดีครับ หมอดูไทยประจำตักศิลา ดูตามทักษา ดาวจร และตำราไทย ถามเรื่องไหนมา จะบอกทั้งดวงและวิธีแก้ครบชุด' },
  { id: 'astro', th: 'โหราศาสตร์สากล', ic: '✦', col: 'var(--harmony)', d: 'เจ้าเรือน มุมดาว เกษตร อุจ นิจ', greet: 'สวัสดีครับ ผมจะอ่านจากผังดาวกำเนิดแบบละเอียด ทั้งดาวเจ้าเรือน กำลังดาว และดาวจร ถามเรื่องงาน เงิน ความรัก ได้เลย' },
  { id: 'tarot', th: 'แม่หมอไพ่', ic: '✧', col: 'var(--violet)', d: 'เปิดไพ่ 3 ใบตอบทุกคำถาม', greet: 'สวัสดีจ้ะ ตั้งใจนึกถึงเรื่องที่อยากรู้ แล้วพิมพ์คำถามมา แม่หมอจะเปิดไพ่ 3 ใบ อ่านที่มา ตอนนี้ และคำแนะนำให้' }
];
const ASK_CHIPS = {
  thai: ['ดวงตกแก้ยังไง', 'ช่วงไหนมีโชคลาภ', 'ทำบุญอะไรดี', 'ไหว้พระวัดไหนเรื่องเงิน', 'ปีนี้ชงไหม', 'ฝันเห็นงู', 'วันไหนดีออกรถ', 'สวดคาถาอะไรให้เจ้านายรัก'],
  astro: ['งานช่วงนี้เป็นอย่างไร', 'การเงินปีนี้', 'ความรักของฉัน', 'สุขภาพต้องระวังอะไร', 'ช่วงไหนมีโชคลาภ', 'ควรย้ายบ้านไหม', 'ฝันฟันหลุด'],
  tarot: ['เขาคิดยังไงกับเรา', 'งานใหม่จะไปได้ดีไหม', 'ควรลงทุนตอนนี้ไหม', 'ความรักเดือนนี้', 'จะสอบผ่านไหม', 'เรื่องที่ต้องระวังช่วงนี้']
};
const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
let recog = null;
function viewAsk() {
  const a = state.ask, T = troubleNow(), c = chongOf(state.profile), P = PERSONAS.find((x) => x.id === a.persona) || PERSONAS[0];
  const chips = [...ASK_CHIPS[P.id], ...state.match.people.slice(0, 2).map((x) => `ฉันกับ${x.name}`)];
  return `<main class="screen" style="padding-bottom:20px;--pc:${P.col}">
${pageHead('08', 'CONSULT', 'ปรึกษาดวง', 'var(--rose)', 'ask', a.messages.length ? `<button class="link-btn" data-act="askClear" style="font-size:13px">เริ่มใหม่</button>` : '')}
<div class="ask-ps" role="tablist" aria-label="เลือกผู้ทำนาย">${PERSONAS.map((x) => `<button role="tab" aria-selected="${x.id === P.id}" data-act="askPersona" data-v="${x.id}" style="--pc:${x.col}"><span class="ask-pi">${x.ic}</span><b>${x.th}</b><span>${x.d}</span></button>`).join('')}</div>
<div class="ask-stat"><span><b>${T.total}</b>ดวงวันนี้</span><span><b>${TH_PLANETS[T.planetNo].th}</b>${T.planetNo !== birthPlanet(state.profile) || T.level >= 2 ? 'ดาวที่ต้องแก้' : 'ดาวที่ควรเสริม'}</span><span><b>${c.level ? 'ชง' : 'ไม่ชง'}</b>ปี${NAKSHAT[c.year]}</span></div>
<div class="chat" id="chat">
<div class="msg bot"><span class="ask-who" style="color:${P.col}">${P.ic} ${P.th}</span><p>${P.greet}</p></div>
${a.messages.map((m) => m.me ? `<div class="msg me">${esc(m.text)}</div>` : `<div class="msg bot">${m.text.split('\n').map((l) => `<p>${esc(l)}</p>`).join('')}${m.html || ''}${m.basis && m.basis.length ? `<div class="basis"><span class="eyebrow" style="letter-spacing:.18em">อ่านจาก</span><div class="tags">${m.basis.map((b) => `<span class="tag">${esc(b)}</span>`).join('')}</div></div>` : ''}</div>`).join('')}
${a.pending ? `<div class="msg bot typing" aria-label="กำลังดูดวง"><span class="ask-who" style="color:${P.col}">${P.ic} ${P.id === 'tarot' ? 'กำลังสับไพ่' : 'กำลังดูดวง'}</span><span class="dots"><i></i><i></i><i></i></span></div>` : ''}
</div>
<div class="composer">
<div class="chips ask-chips">${chips.map((x) => `<button class="chip" data-act="askChip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
<form data-act="askSend"><label class="sr-only" for="askIn">คำถามของคุณ</label><input id="askIn" class="input" style="border-radius:24px;padding:0 18px" placeholder="พิมพ์คำถาม หรือเล่าความฝัน" autocomplete="off">
${SpeechRec ? `<button type="button" class="send mic" data-act="askMic" aria-label="พูดคำถาม">${icon('mic', 18, 1.8)}</button>` : ''}
<button class="send" aria-label="ส่งคำถาม">${icon('arrow', 18, 1.8)}</button></form></div>
<p class="small" style="text-align:center;font-size:11px">ตอบอัตโนมัติจากดวงของคุณตามตำราโหราศาสตร์และความเชื่อไทย เพื่อเป็นแนวทางและกำลังใจ</p>
</main>`;
}
function startMic(btn) {
  if (!SpeechRec) return;
  if (recog) { try { recog.stop(); } catch (e) {} recog = null; btn.classList.remove('on'); return; }
  recog = new SpeechRec();
  recog.lang = 'th-TH'; recog.interimResults = true; recog.maxAlternatives = 1;
  const input = document.getElementById('askIn');
  btn.classList.add('on');
  recog.onresult = (e) => { const t = Array.from(e.results).map((r) => r[0].transcript).join(''); if (input) input.value = t; if (e.results[e.results.length - 1].isFinal) { recog.stop(); ask(t); if (input) input.value = ''; } };
  recog.onerror = () => { toast('ไมค์ใช้งานไม่ได้ ลองพิมพ์แทนนะครับ'); };
  recog.onend = () => { recog = null; btn.classList.remove('on'); };
  try { recog.start(); } catch (e) { recog = null; btn.classList.remove('on'); }
}


// ---------- ทางแก้ที่ผูกกับทุกห้อง ----------
function heroRemedy() {
  const T = troubleNow();
  if (T.level < 2) return '';
  return remedyCard(remedyPlan({ planetNo: T.planetNo, topic: T.worstTopic, level: T.level, reason: `ครบชุดตามตำรา: สวด ทำบุญ ทำทาน ไหว้พระ ของดาว${TH_PLANETS[T.planetNo].th}${T.level >= 3 ? ' และพิธีสำหรับเคราะห์หนัก' : ''}` }));
}
function identityRemedy(p) {
  const bp = birthPlanet(p), m = DAY_MERIT[bp], nk = nakshatOf(p), c = chongOf(p);
  const plan = remedyPlan({ planetNo: bp, topic: 'any', level: 1, reason: `ทำบุญประจำดาววันเกิด ${m.day} ใช้เสริมจุดเด่นและแก้เรื่องที่ต้องระวังในดวง` });
  plan.title = 'เสริมดวงประจำตัว';
  plan.steps.splice(4, 0, { ic: '⛰', k: 'พระธาตุประจำปีเกิด', t: PAGODA[nk], d: `คุณเกิดปี${NAKSHAT[nk]} (นับปีนักษัตรจากวันตรุษจีน) ควรไปนมัสการสักครั้งในชีวิต` });
  if (c.level) plan.steps.splice(5, 0, { ic: '⚠', k: 'ปีชง', t: `ปี${NAKSHAT[c.year]}นี้คุณ${c.level}`, d: CHONG_FIX });
  return remedyCard(plan);
}
function tarotSynthHTML(t) {
  if (!t.cards || t.cards.length < 2 || t.flipped.length < t.cards.length) return '';
  const lines = tarotSynthesis(t.cards.map((d) => ({ c: CARDS[d.i], rev: d.rev })));
  return lines.length ? `<div class="card t-syn"><span class="eyebrow" style="color:var(--violet);letter-spacing:.16em">อ่านภาพรวมทั้งสำรับ</span>${lines.map((l) => `<p class="small" style="color:var(--text)">✦ ${l}</p>`).join('')}</div>` : '';
}
function tarotFix(t) {
  if (!t.cards || t.flipped.length < t.cards.length) return '';
  const rev = t.cards.filter((d) => d.rev).length;
  if (rev * 2 < t.cards.length || rev === 0) return '';
  const T = troubleNow();
  return remedyCard(remedyPlan({ planetNo: T.planetNo, topic: 'bad', level: rev === t.cards.length ? 2 : 1, reason: `ไพ่กลับหัว ${rev} จาก ${t.cards.length} ใบ พลังติดขัด ทำบุญเสริมก่อนตัดสินใจเรื่องสำคัญ` }));
}
function luckCalendarHTML(ch) {
  const ws = luckWindows(ch, new Date());
  return `<section class="ch-sec"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">✦</span>ปฏิทินโชค 12 เดือน</h2>
<p class="small" style="font-size:12px">คำนวณจากดาวพฤหัสจร (โชค การเงิน) และดาวเสาร์จร (ช่วงระวัง) เทียบกับดวงเดิมของคุณ</p>
${ws.length ? windowsHTML(ws, 10) : '<p class="small">12 เดือนนี้ไม่มีดาวใหญ่ทำมุมเด่น เป็นช่วงสร้างฐานอย่างมั่นคง</p>'}
${ws.some((w) => w.kind === 'care') ? remedyCard(remedyPlan({ planetNo: 7, topic: 'bad', level: 2, reason: 'สำหรับช่วงที่ดาวเสาร์ทำมุมร้าย: บูชาดาวเสาร์ ทำบุญของวันเสาร์ล่วงหน้า' })) : ''}</section>`;
}

// ---------------- router ----------------
// Routes live in memory (and are mirrored to the URL hash when the host allows it),
// so the app also works inside sandboxed frames that ignore hash changes.
const NEEDS_PROFILE = ['home', 'chart', 'match', 'ask'];
// Opening the app always starts at home. Home-screen shortcuts pass ?go=<room> to open a room directly.
let current = (() => { try { return new URLSearchParams(location.search).get('go') || ''; } catch (e) { return ''; } })();
try { history.replaceState(null, '', location.pathname); } catch (e) { /* not allowed in some frames */ }
// Coming back to the app after a while also returns to home.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 10 * 60000 && state.chart && !['home', 'setup', 'welcome'].includes(route())) go('home');
});
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
// ---------------- บทสวดมนต์ ----------------
function remedyChip(r) {
  if (!r || !r.id) return '';
  const pr = prayerById(r.id);
  if (!pr) return '';
  return `<a class="rem-chip${r.kind === 'แก้' ? ' fix' : ''}" href="#/prayer" data-act="openPrayer" data-v="${pr.id}">
<span class="rem-ic">${icon('prayer', 18, 1.5)}</span><span class="rem-t"><span class="rem-k">${r.kind === 'บูชา' ? 'เทพประจำวันเกิด' : r.kind + 'ดวง'} · สวด${pr.th.replace(/^บทสวด/, '')} ${pr.count} จบ</span><span class="rem-r">${r.reason}</span></span>${icon('next', 14, 1.5)}</a>`;
}
function malaSVG(n, done) {
  const R = 46, pts = n < 5 ? 36 : Math.min(n, 108), lit = Math.round((Math.min(done, n) / n) * pts);
  const dots = Array.from({ length: pts }, (_, k) => { const a = (k / pts) * Math.PI * 2 - Math.PI / 2; const on = k < lit; return `<circle cx="${(60 + R * Math.cos(a)).toFixed(2)}" cy="${(60 + R * Math.sin(a)).toFixed(2)}" r="${pts > 40 ? 1.5 : 2.6}" fill="${on ? '#F0D89A' : '#3A3224'}"/>`; }).join('');
  return `<svg class="mala" viewBox="0 0 120 120" aria-hidden="true">${dots}</svg>`;
}
function prayerText(pr) {
  return pr.blocks.map((b) => `${b.note ? `<p class="pr-note">${b.note}</p>` : ''}${b.lines ? `<div class="pr-stanza">${b.n ? `<span class="pr-n">${thaiNum(b.n)}</span>` : ''}<div>${b.lines.map((l) => `<p>${l}</p>`).join('')}</div></div>` : ''}${b.p ? `<p class="pr-prose">${b.p}</p>` : ''}${b.go ? `<a href="#/prayer" class="ask-link" data-act="openPrayer" data-v="${b.go}" style="align-self:center">เปิด${prayerById(b.go).th} ›</a>` : ''}`).join('');
}
const QUICK_CHANTS = [['metta-all', 'แผ่เมตตา', '♡'], ['metta-self', 'เมตตาตนเอง', '☺'], ['kruadnam', 'กรวดน้ำ', '≈'], ['khama', 'ขอขมา', '☸'], ['ts-popular', 'คนนิยม', '✿'], ['ts-trade', 'ค้าขายดี', '◈'], ['ts-talk', 'การเจรจา', '❝'], ['ts-safe', 'แคล้วคลาด', '➶'], ['ts-lightning', 'กันฟ้าผ่า', 'ϟ'], ['ts-ghost', 'ป้องกันผี', '☾'], ['ts-dog', 'กันสุนัข', '⚑'], ['ts-snake', 'ป้องกันงู', '§']];
function viewPrayer() {
  const st = state.prayer, bp = birthPlanet(state.profile);
  const head = pageHead('07', 'PRAYER', 'บทสวดมนต์', 'var(--gold-2)', 'prayer', st.open ? `<button class="back" data-act="prayerBack" aria-label="กลับ" style="margin:0">${icon('back', 20, 1.5)}</button>` : '');
  if (st.open) {
    const pr = prayerById(st.open), done = st.counts[pr.id] || 0;
    const cat = PRAYER_CATS.find((c) => c.id === pr.cat);
    return `<main class="screen pr-screen">
${head}
<section class="pr-head"><span class="eyebrow" style="color:var(--gold)">${cat.th}${pr.sub ? ' · ' + pr.sub : ''}</span>
<h2 class="pr-title">${pr.th}</h2>
<p class="small" style="color:var(--text-2)">${pr.use}</p>
${pr.origin ? `<p class="pr-origin"><b>ที่มา</b> ${pr.origin}</p>` : ''}
${pr.src ? `<p class="small" style="font-size:11px">อ้างอิงตัวบท: ${pr.src}${pr.cat === 'folk' || pr.cat === 'geji' || pr.cat === 'thasung' ? ' · เป็นคาถาตามความเชื่อ ถ้อยคำอาจต่างกันในแต่ละสำนัก' : ''}</p>` : ''}
<span class="pr-count">สวด ${pr.count} จบ${pr.cat === 'day' ? ' · ตามกำลังดาวประจำวัน' : ''}</span></section>
<section class="pr-text${pr.heart ? ' heart' : ''}">${prayerText(pr)}</section>
<section class="pr-counter" id="pr-counter">${counterHTML(pr)}</section>
<p class="small" style="text-align:center;font-size:11px">ตั้งนะโม 3 จบก่อนสวด · สวดด้วยใจสงบ ความหมายเป็นสรุปสั้นเพื่อความเข้าใจ</p>
</main>`;
  }
  const L = luckOf(bp), dl = daily(state.chart, new Date());
  const total = Math.round(dl.scores.reduce((a, x) => a + x.score, 0) / dl.scores.length * 20);
  const today = dailyRemedy(liveAspects(state.chart, new Date(), { n: 6, exact: false }), bp, total);
  const recs = [{ id: birthChant(bp), kind: 'เสริม', reason: `บทประจำวันเกิดของคุณ (${TH_PLANETS[bp].day})` }];
  if (today.id !== recs[0].id) recs.unshift(today);
  recs.push({ id: devaOfDay(bp), kind: 'บูชา', reason: `เทพประจำวันเกิดตามคติฮินดู (${TH_PLANETS[bp].day})` });
  const pu = st.purpose ? purposeById(st.purpose) : null;
  const list = pu ? pu.items.map(prayerById) : PRAYERS.filter((p) => st.cat === 'all' || p.cat === st.cat);
  return `<main class="screen">
${head}
<section class="pr-recs"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">✦</span>แนะนำสำหรับคุณวันนี้</h2>${recs.map(remedyChip).join('')}</section>
<section class="pr-quick"><h2 class="t-step-h" ><span style="border-color:var(--gold);color:var(--gold)">⚡</span>คาถาลัด · กดแล้วสวดได้ทันที</h2>
<div class="qk-grid">${QUICK_CHANTS.map(([id, th, ic]) => `<a href="#/prayer" class="qk" data-act="openPrayer" data-v="${id}"><span class="qk-ic">${ic}</span><b>${th}</b></a>`).join('')}</div></section>
<section class="pr-purpose"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">✦</span>สวดเพื่อ…</h2>
<div class="pu-grid">${PURPOSES.map((x) => `<button class="pu" data-act="prayerPurpose" data-v="${x.id}" aria-pressed="${st.purpose === x.id}"><span class="pu-ic">${x.ic}</span><b>${x.th}</b><span>${x.sub}</span></button>`).join('')}</div></section>
${pu ? `<div class="pu-note"><span><b>${pu.th}</b> · ${pu.note}</span><button class="link-btn" data-act="prayerPurpose" data-v="">ดูบทสวดทั้งหมด</button></div>` : `<h2 class="t-step-h" style="margin-top:4px"><span style="border-color:var(--gold);color:var(--gold)">☰</span>ตามหมวด</h2>`}
${pu ? '' : `<div class="chips pr-cats" role="group" aria-label="หมวดบทสวด">${[{ id: 'all', th: 'ทั้งหมด' }, ...PRAYER_CATS].map((c) => `<button class="chip" aria-pressed="${st.cat === c.id}" data-act="prayerCat" data-v="${c.id}">${c.th}</button>`).join('')}
</div>`}
${!pu && st.cat === 'heart' ? '<p class="small">หัวใจคาถาคือการย่ออักษรตัวแรกของหลักธรรมให้ภาวนาง่าย ตำราหัวใจ 108 มีหลายบท ที่นี่คัดบทที่อธิบายที่มาได้ชัด ภาวนา 108 ครั้งตามเม็ดลูกประคำ</p>' : ''}
<ul class="pr-list">${list.map((p) => `<li><a href="#/prayer" data-act="openPrayer" data-v="${p.id}" class="pr-item">
<span class="pr-ic">${p.heart ? `<b>${p.heart.split(' ')[0]}</b>` : icon('prayer', 18, 1.5)}</span>
<span class="pr-it"><b>${p.th}</b><span>${p.heart ? p.heart + ' · ' : ''}${p.use}</span></span><span class="pr-badge">${p.count}<i>จบ</i></span></a></li>`).join('')}</ul>
</main>`;
}
function counterHTML(pr) {
  const done = state.prayer.counts[pr.id] || 0, n = pr.count, full = done >= n;
  return `<button class="pr-tap${full ? ' full' : ''}" data-act="prayerTap" aria-label="นับจบ ${done} จาก ${n}">${malaSVG(n, done)}<span class="pr-num"><b class="mono">${done}</b><i>/ ${n} จบ</i></span></button>
<div class="pr-ctrl"><span class="small">${full ? 'ครบแล้ว สาธุ' : 'แตะวงกลมทุกครั้งที่สวดจบหนึ่งรอบ'}</span>${done ? '<button class="link-btn" data-act="prayerReset">เริ่มนับใหม่</button>' : ''}</div>`;
}

const VIEWS = { prayer: viewPrayer, auspice: viewAuspice, welcome: viewWelcome, setup: viewSetup, home: viewHome, chart: viewChart, match: viewMatch, tarot: viewTarot, numbers: viewNumbers, luck: viewLuck, ask: viewAsk };
const root = document.getElementById('app');
let lastRoute = null;

function render() {
  const r = route();
  const view = VIEWS[r] || viewWelcome;
  const showNav = !['welcome', 'setup'].includes(r);
  root.innerHTML = view() + (showNav ? nav(r) : '');
  if (r === 'home') startLive(); else clearInterval(liveTimer);
  if (r === 'home' && showOraSheet() && !document.getElementById('ora-sheet')) document.body.insertAdjacentHTML('beforeend', oracleSheetB());
  mountLuck();
  if (r !== lastRoute) { window.scrollTo(0, 0); lastRoute = r; }
  document.title = 'ตักศิลา · ' + ({ prayer: 'บทสวดมนต์', home: 'หน้าหลัก', chart: 'ผังดาว', match: 'คู่ดวง', tarot: 'ไพ่ทาโรต์', numbers: 'ศาสตร์ตัวเลข', luck: 'โชคลาภ', ask: 'ปรึกษา', setup: 'ข้อมูลกำเนิด' }[r] || 'อ่านดวงจากดาวจริง');
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
    if (el && el.dataset.act === 'openPrayer') { state.prayer.open = el.dataset.v; state.prayer.back = route(); }
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
    case 'matchMode': state.match.useDate = el.dataset.v === 'date'; break;
    case 'matchRel': state.match.rel = el.dataset.v; break;
    case 'matchTime': state.match.timeKnown = !state.match.timeKnown; break;
    case 'matchPick': { const pp = state.match.people[i]; Object.assign(state.match, pp, { useDate: true }); break; }
    case 'matchDel': state.match.people.splice(i, 1); save(); break;
    case 'matchSave': { const mm = state.match; if (!mm.name) return; const rec = { name: mm.name, day: +mm.day, month: +mm.month, yearBE: +mm.yearBE, hour: +mm.hour, minute: +mm.minute, timeKnown: !!mm.timeKnown, rel: mm.rel }; const k = mm.people.findIndex((x) => x.name === mm.name); if (k >= 0) mm.people[k] = rec; else mm.people.push(rec); save(); toast('บันทึก ' + mm.name + ' แล้ว'); break; }
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
    case 'prayerCat': state.prayer.cat = el.dataset.v; break;
    case 'prayerPurpose': state.prayer.purpose = el.dataset.v || null; break;
    case 'prayerBack': { const b = state.prayer.back; state.prayer.open = null; state.prayer.back = null; if (b && b !== 'prayer') { go(b); return; } break; }
    case 'prayerReset': state.prayer.counts[state.prayer.open] = 0; { const c = document.getElementById('pr-counter'); if (c) c.innerHTML = counterHTML(prayerById(state.prayer.open)); } return;
    case 'prayerTap': {
      const pr = prayerById(state.prayer.open), c0 = state.prayer.counts[pr.id] || 0;
      if (c0 >= pr.count) return;
      state.prayer.counts[pr.id] = c0 + 1;
      if (navigator.vibrate) navigator.vibrate(c0 + 1 >= pr.count ? [30, 50, 80] : 12);
      const c = document.getElementById('pr-counter'); if (c) c.innerHTML = counterHTML(pr);
      if (c0 + 1 >= pr.count) toast(`ครบ ${pr.count} จบ สาธุ`);
      return;
    }
    case 'nmGender': { state.num.gender = el.dataset.v; document.querySelectorAll('[data-act=nmGender]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === state.num.gender)); const box = document.getElementById('num-results'); if (box) box.innerHTML = numResults(); return; }
    case 'luckMode': state.luck.mode = el.dataset.v; if (state.luck.inc === 'burning') state.luck.inc = 'idle'; break;
    case 'stirGlobe': if (luckCtl && luckCtl.stir) luckCtl.stir(); return;
    case 'ballReset': state.luck.balls = []; break;
    case 'treeTie': state.luck.tree.tied = true; if (navigator.vibrate) navigator.vibrate(15); break;
    case 'treeNew': state.luck.tree = { tied: false, digits: null, done: false, kind: null }; break;
    case 'lightUp': {
      const l = state.luck;
      l.inc = 'burning'; l.incDigits = [randomDigit(), randomDigit(), randomDigit()]; l.incShown = [];
      render();
      const el = document.getElementById('inc');
      luckCtl = burnIncense(el, l.incDigits, {
        onDigit(k, d) { l.incShown[k] = d; const s2 = document.getElementById('inc-slots'); if (s2) s2.innerHTML = incSlots(l.incShown); },
        onDone() { l.inc = 'done'; luckHist('ธูป', l.incDigits.join('')); if (route() === 'luck' && l.mode === 'incense') render(); }
      });
      return;
    }
    case 'ssReset': state.luck.ss = null; break;
    case 'ssMotion': askMotion().then((ok) => toast(ok ? 'พร้อมแล้ว เขย่ามือถือได้เลย' : 'เครื่องนี้ไม่รองรับการเขย่า ใช้วิธีกดค้างแทน')); return;
    case 'askChip': ask(el.dataset.q); return;
    case 'oraClose': { ORA_SHEET = false; const sh = document.getElementById('ora-sheet'); if (sh) { sh.classList.add('out'); setTimeout(() => sh.remove(), 400); } return; }
    case 'oraMore': { e.preventDefault && e.preventDefault(); const t = document.getElementById('live-daily'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    case 'askPersona': state.ask.persona = el.dataset.v; break;
    case 'askClear': state.ask.messages = []; state.ask.ctx = null; break;
    case 'askMic': startMic(el); return;
    default: return;
  }
  render();
});

function ask(q) {
  if (!q || !q.trim()) return;
  if (state.ask.pending) return;
  state.ask.messages.push({ me: true, text: q.trim() });
  state.ask.pending = true;
  render();
  const scroll = () => { const chat = document.getElementById('chat'); if (chat && chat.lastElementChild) chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  scroll();
  setTimeout(() => {
    let a;
    try { a = answer(q); } catch (err) { console.error(err); a = { text: 'ขอโทษครับ ผมอ่านคำถามนี้ไม่ออก ลองถามใหม่อีกแบบได้ไหม', basis: [] }; }
    state.ask.pending = false;
    state.ask.messages.push({ me: false, ...a });
    if (route() === 'ask') render();
    scroll();
  }, 600 + Math.min(900, q.length * 25));
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
  if (key === 'm.name') { state.match.name = v.trim(); const sb = document.querySelector('[data-act=matchSave]'); if (sb) sb.disabled = !state.match.name; return; }
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
  if (key === 'm.name') return;
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
