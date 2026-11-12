// Taksila app — screens, state and routing (hash routes, no framework).
import {
  SIGNS, ELEMENTS, PLANETS, HOUSES, planetById, computeChart, transits, daily, compatibility,
  planetPositions, signOf, fmtDeg, localToUtc, liveAspects, upcomingIngresses, ASPECT_GLYPH, lonOf, weekAhead, lunarPhase, findAspect, elementOf
} from './astro.js';
import { PLACES, MONTHS_TH, MONTHS_SHORT, TOPICS, LIFE_PATH, DIGITS, SUM_MEANING } from './data.js';
import { starMap, logoRing, EL_HEX } from './starmap.js';
import { EVENTS, findAuspicious } from './auspice.js';
import { natalProfile, sixthSense } from './profile.js';
import { CARDS, drawCards, SPREADS, HOUSE_READ, houseMeaning } from './tarot.js';
import { mountGlobe, burnIncense, mountSiamsi, mountTree, askMotion, randomDigit, thaiNum } from './luck.js';
import { SIAMSI } from './siamsi.js';
import { PURPOSES, purposeById, PRAYERS, PRAYER_CATS, prayerById, dailyRemedy, tarotRemedy, siamsiRemedy, birthChant, devaOfDay, EVENT_CHANT } from './prayer.js';
import { prayerTr } from './prayer-tr.js';
import { qrSVG } from './qr.js';
import { LEARN_CATS, LESSONS } from './learn.js';
import { PH_HAIRK, faceMeasure, facePoseOK, averageMeasures, faceElement, elementRelation, faceRead, FACE_ZONES, handMeasure, handPoseOK, handElement, handRead, PALM_LINES, palmGuides, palmTrace, yearElementTh } from './physio.js';
import { FS_DIRS, FS_DIR_TH, FS_DIR_SHORT, FS_DIR_DEG, mountainOf, flyingStars, solarYear, yearAfflictions, kuaOf, EL_COLOR, STAR, sectorRead, FS_PERIODS, monthInfo, ROOM_TYPES, roomRead, starTone, starGood, guideOf, comboOf, FS_PTYPES, ptypeOf } from './fengshui.js';
import { NUM_TOOLS, analyzeNumber, analyzeAngel, gradeOf, birthHexColor, reduceTo9, analyzeName, LEVEL_TH, NUM_PLANET, taksaOf } from './numerology.js';
import { DAY_MERIT, PLANET_NO, RITES, templesFor, NAKSHAT, PAGODA, nakshatOf, chongOf, CHONG_FIX, luckWindows, windowRange, remedyPlan } from './remedy.js';
import { dignityOf, houseLord, tarotSynthesis, dreamLookup } from './insight.js';
import { forecastDay, aspectEffect, ingressEffect } from './forecast.js';
import { nextHolyDay, upcomingSpecial, thaiLunar } from './lunar.js';
import { MU_PLACES, MU_CATS, MU_WISH, MU_REGIONS, BLOOD_LINK } from './places.js';
import { TH_PLANETS, thaksa, luckOf, birthPlanet, thaiLagna, dayColors, yams, yamUse, posOf, dayPlanet, ayanamsa } from './thai.js';

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
  tarot: { topic: 0, spread: 3, histAll: false, logged: false, cards: null, deck: null, picks: [], flipped: [], sel: 0, q: '', who: 'me', other: { name: '', known: false, day: 1, month: 1, yearBE: 2540 } },
  prayer: { cat: 'all', purpose: null, open: null, counts: {} },
  dream: { q: '', sel: null, time: 'dawn', saved: false },
  map: { cat: 'all', wish: null, reg: 'all', sel: null, me: null },
  ph: { tab: 'face', status: 'idle', side: 'R', facing: 'environment', mirror: false, enh: false, hide: {}, err: '', warn: [], ...(() => { try { const j = JSON.parse(localStorage.getItem('taksila.physio')) || {}; return { face: j.face || null, hand: j.hand || null, side: j.side || 'R', lines: j.lines || {}, who: j.who || 'me', birth: j.birth || null }; } catch (e) { return {}; } })() },
  fs: { tab: 'kua', gender: '', facing: 180, period: 9, repl: false, rooms: {}, members: [], home: null, radius: 40, cell: null, roomPick: null, newMember: null, heading: null, sensor: false, cam: false, ...(() => { try { const j = JSON.parse(localStorage.getItem('taksila.fs')) || {}; const o = {}; for (const k of ['gender', 'facing', 'period', 'repl', 'rooms', 'members', 'home', 'radius', 'ptype', 'chk']) if (j[k] != null) o[k] = j[k]; return o; } catch (e) { return {}; } })() },
  pvConfirm: false,
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
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  more: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><circle cx="16.75" cy="16.75" r="3.25"/>',
  dream: '<path d="M14.5 4.5a7 7 0 1 0 5 11.4A7.5 7.5 0 0 1 14.5 4.5z"/><path d="M17 4l.6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6z"/>',
  privacy: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><rect x="9.5" y="10.5" width="5" height="4.5" rx="1"/><path d="M10.5 10.5V9a1.5 1.5 0 0 1 3 0v1.5"/>',
  setup: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  learn: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/>',
  face: '<path d="M12 3c-4 0-6.5 3-6.5 7.5 0 5 3 9.5 6.5 10.5 3.5-1 6.5-5.5 6.5-10.5C18.5 6 16 3 12 3z"/><path d="M9 10.5h.01M15 10.5h.01M10 15.5q2 1.2 4 0M12 11v2.5"/>',
  fengshui: '<path d="M12 2.5l6.7 2.8 2.8 6.7-2.8 6.7-6.7 2.8-6.7-2.8L2.5 12l2.8-6.7z"/><path d="M12 7.5a4.5 4.5 0 0 1 0 9 2.25 2.25 0 0 1 0-4.5 2.25 2.25 0 0 0 0-4.5z"/><circle cx="12" cy="14.25" r=".6"/><circle cx="12" cy="9.75" r=".6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="2.2"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  map: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><path d="M12 6.5l.9 2 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>'
};
const icon = (name, size = 20, sw = 1.4) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[name]}</svg>`;

function pageHead(n, code, title, color, iconName, extra = '') {
  return `<header class="page-head"><span class="sigil" style="color:${color}">${icon(iconName, 22, 1.3)}</span>
<div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1"><span class="eyebrow" style="color:${color}">${n} · ${code}</span><h1 class="h1" style="font-size:24px">${title}</h1></div>${extra}</header>`;
}

const NAV = [
  ['home', 'หน้าหลัก', 'home'], ['chart', 'ผังดาว', 'chart'], ['tarot', 'ไพ่', 'tarot'],
  ['numbers', 'ตัวเลข', 'numbers'], ['luck', 'โชคลาภ', 'luck']
];
function nav(route) {
  const elsewhere = !NAV.some(([r]) => r === route);
  return `<nav class="nav" aria-label="เมนูหลัก">${NAV.map(([r, label, ic]) =>
    `<a href="#/${r}"${r === route ? ' aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('')}<button class="nav-more${elsewhere ? ' on' : ''}" data-act="moreOpen" aria-haspopup="dialog">${icon('more')}<span>เพิ่มเติม</span></button></nav>`;
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
<p class="lock-note">🔒 เก็บไว้ในเครื่องนี้เท่านั้น ไม่ส่งไปเซิร์ฟเวอร์ · <a href="#/privacy">ความเป็นส่วนตัว</a></p>
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
const INVITE_RAW = (() => { try { return new URLSearchParams(location.search).get('inv'); } catch (e) { return null; } })();
const HERO_VAR = (() => { try { return new URLSearchParams(location.search).get('hero') || ''; } catch (e) { return ''; } })();
const VERDICT = ['', 'วันพักเก็บแรง', 'วันต้องใจเย็น', 'วันกลาง ๆ', 'วันพลังดี', 'วันพลังดีมาก'];
const VERDICT_COL = ['', 'var(--tension)', '#F0A08C', '#F0D89A', 'var(--gold-2)', 'var(--gold-2)'];
function todayOracle() {
  const now = new Date(), d0 = weekData()[0], fc = d0.fc;
  const lun = fc.lunar, nh = nextHolyDay(now);
  const lunLine = lun ? lun.full : d0.phase.th;
  const holyLine = lun && lun.holy ? 'วันนี้วันพระ' : nh ? `วันพระถัดไป ${WEEKDAY_SHORT[nh.date.getDay()]}. ${nh.date.getDate()} ${MONTHS_SHORT[nh.date.getMonth()]}${nh.inDays === 1 ? ' (พรุ่งนี้)' : ` (อีก ${nh.inDays} วัน)`}` : '';
  const special = upcomingSpecial(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), 30).filter((e) => e.k !== 'merit' || e.th === 'วันลอยกระทง')[0];
  const fsa = fsAlert();
  return { d0, fc, total: fc.total, scores: fc.scores, advice: fsa ? [...fc.advice.slice(0, 3), fsa] : fc.advice, lun, lunLine, holyLine, special, events: lun ? lun.events : [],
    date: `${WEEKDAY[now.getDay()]} ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`, verdict: VERDICT[fc.rating], col: VERDICT_COL[fc.rating], luck: luckToday() };
}
const advHref = (l) => l.href.startsWith('map:') ? `href="#/map" data-act="mapOpen" data-v="${l.href.slice(4)}"` : l.href.startsWith('prayer:') ? `href="#/prayer" data-act="openPrayer" data-v="${l.href.slice(7)}"` : `href="${l.href}"`;
function adviceHTML(list) {
  return `<ul class="ora-adv">${list.map((a) => `<li class="${a.tone < 0 ? 'neg' : a.tone > 0 ? 'pos' : ''}"><i aria-hidden="true">${a.tone < 0 ? '!' : '✓'}</i><span>${a.text}${a.link ? ` <a class="ora-go" ${advHref(a.link)}>${a.link.label} ›</a>` : ''}</span></li>`).join('')}</ul>`;
}
function lunarRowHTML(o) {
  const ev = o.events.map((e) => `<span class="ora-ev ${e.k}">${e.th}</span>`).join('');
  const nxt = o.special ? `<span class="ora-next">ถัดไป · ${o.special.th} ${o.special.date.getDate()} ${MONTHS_SHORT[o.special.date.getMonth()]}</span>` : '';
  return `<div class="ora-lun"><span class="ora-lun-d">${moonIcon(o.d0.phase, 8)}<b>${o.lunLine}</b></span>${o.lun && o.lun.holy ? '<span class="ora-ev holy">วันพระ</span>' : `<span class="ora-hol">${o.holyLine}</span>`}${ev}${nxt}</div>`;
}
function sourcesHTML(fc) {
  return `<details class="ora-src"><summary>อ่านจาก 5 ศาสตร์ <span>${fc.sources.map((x) => `<em style="--v:${x.score}%"></em>`).join('')}</span></summary>
<ul>${fc.sources.map((x) => `<li><span class="os-h"><b>${x.th}</b><span class="mono">${x.score} · น้ำหนัก ${Math.round(x.w * 100)}%</span></span><span class="os-bar"><span style="width:${x.score}%"></span></span><span class="small">${x.note}</span></li>`).join('')}</ul>
<p class="small">คะแนนรวม = ค่าเฉลี่ยถ่วงน้ำหนักของทั้ง 5 ศาสตร์ ใช้ตัวเดียวกันทั้งแอป (หน้าแรก แถบ 7 วัน และหน้าต้อนรับ)</p></details>`;
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
${lunarRowHTML(o)}
<div class="ora-top"><div class="ora-v"><b style="color:${o.col}">${o.verdict}</b><span>รวมโหราศาสตร์สากล ไทย ทักษา เลข และจันทรคติ</span></div>${oracleRing(o.total)}</div>
${adviceHTML(o.advice)}
<div class="ora-cats">${o.scores.map((x, k) => `<span style="--c:${ORA_COL[k]}"><i></i>${x.name}<b>${x.score}</b></span>`).join('')}</div>
${sourcesHTML(o.fc)}
<span class="ora-sub">มงคลประจำวัน</span>
${luckCells(o.luck)}
<div class="ora-acts"><a class="ora-go" href="#/calendar">${(() => { const t = meritToday(), n = (meritLoad().done[t.key] || []).length; return `ภารกิจบุญ ${n}/${t.list.length}${n === t.list.length ? ' ✓' : ''} ›`; })()}</a><button class="ora-go ora-sh" data-act="dailyShare">แชร์ดวงวันนี้ ↗</button></div>
<button class="ora-more" data-act="oraMore">ดูดาวที่ส่งผลวันนี้ ↓</button>
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
<p class="ora-hi">${greeting(new Date())} คุณ${esc((state.profile.name || '').split(' ')[0])}</p>
${oracleRing(o.total, 112)}
<b class="ora-big" style="color:${o.col}">${o.verdict}</b>
${lunarRowHTML(o)}
${adviceHTML(o.advice)}
<div class="ora-cats">${o.scores.map((x, k) => `<span style="--c:${ORA_COL[k]}"><i></i>${x.name}<b>${x.score}</b></span>`).join('')}</div>
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
    ['ask', 'ปรึกษา', 'ถามเรื่องเฉพาะ', 'var(--rose)'],
    ['dream', 'ทำนายฝัน', 'ตำรา เลขเด็ด', 'var(--violet)'],
    ['map', 'แผนที่มู', 'วัด เกจิ มูลนิธิ', 'var(--amber)'],
    ['face', 'โหงวเฮ้ง', 'หน้า ลายมือ AR', '#E8A2B8'],
    ['fengshui', 'ฮวงจุ้ย', 'บ้าน คอนโด ที่ดิน', '#E5675A']
  ];
  return `<main class="screen home">
<header class="home-head">
<div class="hh-text"><span class="eyebrow" style="letter-spacing:.24em">TAKSILA · ${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear() + 543}</span>
<h1 class="hh-title">${greeting(now)}${p.name ? ' คุณ' + esc(p.name.split(' ')[0]) : ''}</h1>
<p class="hh-big3"><span>${SIGNS[ch.planets[0].sign].glyph}&#xFE0E; ${SIGNS[ch.planets[0].sign].th}</span><span>${SIGNS[ch.planets[1].sign].glyph}&#xFE0E; ${SIGNS[ch.planets[1].sign].th}</span>${ch.timeKnown ? `<span>ลัคนา ${SIGNS[signOf(ch.asc)].th}</span>` : ''}</p>${thaiSunSign(ch) !== ch.planets[0].sign ? `<a class="hh-thai" href="#/chart">ราศีแบบไทย: ${SIGNS[thaiSunSign(ch)].th} · ทำไมไม่ตรง? ⓘ</a>` : ''}</div>
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
const fxBadge = (fx) => `<span class="fx-b ${fx.tone > 0 ? 'pos' : fx.tone < 0 ? 'neg' : 'mid'}">${fx.badge}</span>`;
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
    const m = x.mover, t = x.target, col = natureColor(x.asp.nature), k = aspKey(x), fx = aspectEffect(x);
    const pct = Math.round(Math.min(1, x.strength / 1.6) * 100);
    const isOpen = state.aspOpen.has(k);
    return `<li class="asp${isOpen ? ' open' : ''}" style="--c:${col}">
<button class="asp-head" data-act="aspToggle" data-k="${k}" aria-expanded="${isOpen}">
<span class="asp-glyphs" aria-hidden="true">${trio(x)}</span>
<span class="asp-title"><span>${pname(m.id, m.th)}${x.asp.th}${pname(t.id, t.th)} ${fxBadge(fx)}</span><span class="fx-line">${fx.text}</span><span class="mono">${timing(x)}</span></span>
<span class="chev">${icon('down', 16, 1.6)}</span>
</button>
<div class="fold"><div class="fold-in"><div class="asp-body">
<p class="body" style="font-size:14px">ในเชิงโหราศาสตร์ ${x.reason}</p>
<p class="small" style="color:${col}">${x.advice}</p>
<dl class="asp-facts">
<div><dt>ดาวจร</dt><dd>${SIGNS[m.sign].th} ${fmtDeg(m.lon)}${m.retro ? ' (ถอยหลัง)' : ''} · ภพ ${m.house}</dd></div>
<div><dt>ดาวกำเนิด</dt><dd>${SIGNS[t.sign].th} ${fmtDeg(t.lon)}</dd></div>
<div><dt>ระยะห่าง</dt><dd>${x.off.toFixed(1)}° · ${x.applying ? 'กำลังเข้าใกล้' : 'ผ่านจุดแม่นยำแล้ว'}</dd></div>
<div><dt>น้ำหนัก</dt><dd><span class="tr-bar" role="img" aria-label="${pct}%"><span style="width:${pct}%;background:${col}"></span></span></dd></div>
</dl></div></div></div></li>`;
  }).join('');
  const nextEvents = up.slice(0, 4).map((e) => { const fx = ingressEffect(e); return `<li><span class="sym" style="color:var(--gold-2)">${PLANETS.find((p) => p.id === e.id).glyph}&#xFE0E;</span>
<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:14px">${pname(e.id, PLANETS.find((p) => p.id === e.id).th)}เข้าราศี${SIGNS[e.sign].th} ${fxBadge(fx)}</span><span class="small">${fx.text}</span><span class="small" style="font-size:11px">ภพ ${e.house} · ${HOUSES[e.house - 1]}</span></span>
<span class="mono" style="font-size:10px;color:var(--gold);white-space:nowrap">${when(e.at, now)}</span></li>`; }).join('');
  return `<div class="card daily day-hero${open ? ' open' : ''}">
<span class="dh-top"><span class="eyebrow" style="letter-spacing:.2em;display:flex;align-items:center;gap:8px"><span class="live-dot" aria-hidden="true"></span>เหตุผลจากดาววันนี้ · LIVE</span><span class="mono small" style="font-size:10px">อัปเดต ${pad(now.getHours())}:${pad(now.getMinutes())}</span></span>
<p class="small dh-intro">ดาวที่กำลังส่งผลกับดวงของคุณ พร้อมบทสวดและทางแก้ประจำวัน</p>
${remedyChip(dailyRemedy(la, birthPlanet(state.profile), weekData()[0].fc.total))}
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
  if (!weekCache || weekCache.key !== key || weekCache.chart !== state.chart || weekCache.profile !== state.profile) {
    const days = weekAhead(state.chart, now).map((w) => { const fc = forecastDay(state.chart, state.profile, w); return { ...w, fc, rating: fc.rating }; });
    weekCache = { key, chart: state.chart, profile: state.profile, days };
  }
  return weekCache.days;
}
function weekHTML() {
  const days = weekData(), sel = state.weekSel;
  const strip = days.map((d, i) => `<button class="day${sel === i ? ' sel' : ''}" data-act="weekDay" data-i="${i}" aria-pressed="${sel === i}" aria-label="${WEEKDAY[d.date.getDay()]} ${d.date.getDate()} ${RATING_TH[d.rating]}">
<span class="wd">${i === 0 ? 'วันนี้' : WEEKDAY_SHORT[d.date.getDay()]}</span><span class="dn">${d.date.getDate()}</span>${moonIcon(d.phase)}${d.fc.lunar && (d.fc.lunar.holy || d.fc.lunar.events.length) ? `<span class="wk-holy${d.fc.lunar.events.length ? ' ev' : ''}">${d.fc.lunar.events.length ? '★' : 'พระ'}</span>` : ''}
<span class="dots" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i style="background:${n <= d.rating ? ratingColor(d.rating) : 'var(--line)'}"></i>`).join('')}</span></button>`).join('');
  let detail = '';
  if (sel != null) {
    const d = days[sel];
    detail = `<div class="card day-detail">
<span class="eyebrow" style="letter-spacing:.14em">${WEEKDAY[d.date.getDay()].toUpperCase()} ${d.date.getDate()} ${MONTHS_SHORT[d.date.getMonth()]} · ${d.fc.lunar ? d.fc.lunar.full : d.phase.th}</span>
<p class="h2" style="font-size:18px;color:${ratingColor(d.rating)}">${RATING_TH[d.rating]} <span class="mono" style="font-size:12px;color:var(--muted)">${d.fc.total}/100</span></p>
${d.fc.lunar && (d.fc.lunar.holy || d.fc.lunar.events.length) ? `<div class="ora-lun">${d.fc.lunar.holy ? '<span class="ora-ev holy">วันพระ</span>' : ''}${d.fc.lunar.events.map((e) => `<span class="ora-ev ${e.k}">${e.th}</span>`).join('')}</div>` : ''}
${adviceHTML(d.fc.advice.slice(0, 2))}
<p class="small">ดวงจันทร์อยู่ราศี${SIGNS[d.moonSign].th} ผ่านภพ ${d.moonHouse} ของคุณ เรื่อง${HOUSES[d.moonHouse - 1]}จะเด่นขึ้นมาในวันนี้ · ${d.phase.name}</p>
${d.top.length ? `<ul class="day-asp">${d.top.map((x) => `<li style="--c:${natureColor(x.asp.nature)}"><span class="asp-glyphs" aria-hidden="true"><span class="sym">${x.mover.glyph}&#xFE0E;</span><span class="sym" style="color:var(--c)">${ASPECT_GLYPH[x.asp.id]}&#xFE0E;</span>${targetGlyph(x.target)}</span>
<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:14px;font-weight:600">${pname(x.mover.id, x.mover.th)}${x.asp.th}${pname(x.target.id, x.target.th)} ${fxBadge(aspectEffect(x))}</span><span class="small">${aspectEffect(x).text}</span></span></li>`).join('')}</ul>` : '<p class="small">ดาวเคลื่อนเร็วไม่ทำมุมสำคัญ เป็นวันเรียบ ๆ เหมาะกับงานประจำ</p>'}
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
// ราศีสองระบบ: สากล (ทรอปิคอล ตามฤดูกาล) กับแบบไทย (นิรายนะ ตามกลุ่มดาวจริง ใช้ในโหราศาสตร์ไทย)
const thaiSunSign = (ch) => signOf(((ch.planets[0].lon - ayanamsa(ch.utc)) % 360 + 360) % 360);
function zodiacNoteHTML(ch, open = false) {
  const w = ch.planets[0].sign, t = thaiSunSign(ch), same = w === t;
  return `<details class="zd-note"${open ? ' open' : ''}><summary><span class="zd-pair"><span><i>ราศีสากล</i><b>${SIGNS[w].glyph}&#xFE0E; ${SIGNS[w].th}</b></span><span><i>ราศีแบบไทย</i><b>${SIGNS[t].glyph}&#xFE0E; ${SIGNS[t].th}</b></span></span><span class="zd-q">${same ? 'ตรงกันทั้งสองแบบ' : 'ทำไมไม่ตรงกัน?'} ⓘ</span></summary>
<div class="zd-body"><p>ราศีมีสองระบบที่ใช้กันทั่วไป และนับวันเปลี่ยนราศีต่างกัน</p>
<ul><li><b>ราศีสากล (Astrology ตะวันตก)</b> นับตามฤดูกาล เริ่มราศีเมษที่วันวสันตวิษุวัต ราว 21 มี.ค. ราศีจึงเปลี่ยนราววันที่ 20–23 ของทุกเดือน ใช้ในดูดวงรายวันแบบสากล ผังดาว และดวงคู่ในแอปนี้</li>
<li><b>ราศีแบบไทย (โหราศาสตร์ไทย)</b> นับตามกลุ่มดาวจริงบนฟ้า เริ่มราศีเมษวันมหาสงกรานต์ ราว 13–14 เม.ย. ราศีจึงเปลี่ยนราววันที่ 13–17 ของทุกเดือน ใช้ในห้องโหราศาสตร์ไทย ทักษา และที่หมอดูไทยส่วนใหญ่ใช้</li></ul>
<p>สองระบบห่างกันราว 24 วัน คนที่เกิดช่วงรอยต่อจึงได้คนละราศี ${same ? 'ของคุณตรงกันทั้งสองแบบ' : `เช่นของคุณ เป็นราศี${SIGNS[w].th}แบบสากล แต่เป็นราศี${SIGNS[t].th}แบบไทย`} ไม่มีแบบไหนผิด แค่คนละตำรา</p>
<p class="small">แอปคำนวณราศีแบบไทยด้วยอายนางศ์ลาหิรี ตรวจแล้วตรงกับเวลามหาสงกรานต์ตามประกาศทางการปี 2567 และ 2569 คลาดไม่ถึง 5 นาที</p></div></details>`;
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
${zodiacNoteHTML(ch)}
<section class="kp"><span class="eyebrow" style="letter-spacing:.2em">KEY PATTERN · จุดเด่นของผัง</span><p class="h2" style="font-size:18px">${kp.title}</p><p class="body" style="font-size:14px">${kp.body}</p><p class="mono" style="font-size:10px;color:var(--muted)">${kp.code}</p></section>
<section class="ch-sec"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">◇</span>สมดุลธาตุ</h2>
<div class="ch-els">${[0, 1, 2, 3].map((e) => elRing(e, ch.elementCount[e], elTotal, e === top ? 'top' : e === low ? 'low' : '')).join('')}</div>
<p class="small" style="font-size:13px">ธาตุ${ELEMENTS[top].th}เด่น (${EL_HINT[top]}) ส่วนธาตุ${ELEMENTS[low].th}น้อยที่สุด ลองเติมพลังด้าน${EL_HINT[low]}ในชีวิตประจำวัน</p></section>
<section class="ch-sec"><h2 class="t-step-h"><span style="border-color:var(--gold);color:var(--gold)">✦</span>มุมดาวสำคัญ</h2>
<div class="asp-sum" role="img" aria-label="ส่งเสริม ${nh} ท้าทาย ${nt} ร่วม ${nc}"><span style="flex:${nh || 0.001};background:var(--harmony)"></span><span style="flex:${nc || 0.001};background:var(--gold)"></span><span style="flex:${nt || 0.001};background:var(--tension)"></span></div>
<p class="asp-leg small"><span style="color:var(--harmony)">ส่งเสริม ${nh}</span><span style="color:var(--gold)">ร่วม ${nc}</span><span style="color:var(--tension)">ท้าทาย ${nt}</span></p>
<ul class="asp-list">${asp.map(aspectCard).join('')}</ul></section>`;
  } else if (tab === 1) {
    body = `<p class="small" style="font-size:13px">ตำแหน่งดาว 10 ดวง ณ เวลาเกิด แตะการ์ดเพื่ออ่านความหมาย · สีวงบอกธาตุของราศี${ch.timeKnown ? '' : ' (ไม่ทราบเวลา: ภพนับจากราศีดวงอาทิตย์ และดวงจันทร์อาจคลาดได้ถึง ±6°)'}</p>${ch.moonSigns ? `<p class="small tneg" style="font-size:13px;margin:0">⚠️ วันเกิดของคุณดวงจันทร์ย้ายราศีกลางวัน: ถ้าเกิดก่อนราว ${ch.moonSigns.at} น. จันทร์อยู่ราศี${SIGNS[ch.moonSigns.from].th} หลังจากนั้นอยู่ราศี${SIGNS[ch.moonSigns.to].th} ใส่เวลาเกิดเพื่อความแม่นยำ</p>` : ''}
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
<button class="mt-invite" data-act="inviteShare"><b>ชวนเขามาดูคู่ดวงกับเรา ↗</b><span>ส่งลิงก์ให้เพื่อนหรือแฟน เปิดแล้วเห็นวันเกิดของคุณพร้อมเทียบดวงทันที · ลิงก์มีวันเกิดของคุณ ส่งให้คนที่ไว้ใจเท่านั้น</span></button>
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
  const hm = spread.house ? houseMeaning(c, d.rev, i) : null;
  const main = hm ? hm.lead : d.rev ? c.rev : (field === 'up' ? c.up : c[field]);
  const extra = hm ? `${hm.note} · ความหมายทั่วไปของไพ่: ${d.rev ? c.rev : c.up}` : d.rev ? `ถ้าแก้จุดนี้ได้ พลังของไพ่จะกลับมา: ${field === 'up' ? c.up : c[field]}` : (field !== 'up' ? c.up : '');
  const links = cardLink(c, houseSign);
  return `<article class="reading">
<img class="r-img${d.rev ? ' rev' : ''}" src="${c.img}" alt="" loading="lazy">
<div class="r-body">
<span class="eyebrow" style="color:var(--violet);letter-spacing:.14em">${spread.house ? `ภพที่ ${i + 1} · ${HOUSE_READ[i].th}${houseSign != null ? ' · ราศี' + SIGNS[houseSign].th : ''}` : pos.en}${d.rev ? ' · กลับหัว' : ''}</span>
<h3 class="h2" style="font-size:18px">${spread.house ? `พบ${HOUSE_READ[i].short}: ` : head + ': '}${c.th}</h3>
<span class="mono" style="font-size:10px;color:var(--muted)">${c.en}${spread.house ? ' · ' + head : ''}</span>
<span class="r-kw">${c.kw}</span>
<p class="body${hm ? ' r-house ' + (hm.tone > 0 ? 'pos' : hm.tone < 0 ? 'neg' : 'mid') : ''}" style="font-size:14px">${hm ? `<span class="fx-b ${hm.tone > 0 ? 'pos' : hm.tone < 0 ? 'neg' : 'mid'}">${hm.tone > 0 ? 'ดี' : hm.tone < 0 ? 'ระวัง' : 'กลาง ๆ'}</span> ` : ''}${main}</p>
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
    const spreads = `<button class="t-feat" data-act="tarotSpread" data-i="3" aria-pressed="${t.spread === 3}">
<span class="tf-wheel" aria-hidden="true">${Array.from({ length: 12 }, (_, k) => { const a = (195 + k * 30) * Math.PI / 180; return `<i style="left:${(50 + 40 * Math.cos(a)).toFixed(1)}%;top:${(50 - 40 * Math.sin(a)).toFixed(1)}%;--k:${k}">${CARD_BACK}</i>`; }).join('')}<b>12</b></span>
<span class="tf-t"><span class="tf-badge">แนะนำ · ละเอียดที่สุด</span><b>ไพ่ 12 ภพ</b><span>วางไพ่ลงบนภพทั้ง 12 ตามโหราศาสตร์ไทย ตีความแต่ละใบตามเรื่องของภพ เงิน งาน ความรัก บ้าน ครบทุกด้านในครั้งเดียว</span></span></button>
<div class="t-pick">${SPREADS.slice(0, 3).map((x, i) => `<button class="t-sp" data-act="tarotSpread" data-i="${i}" aria-pressed="${i === t.spread}">
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
${step(1, 'วิธีเปิดไพ่', spreads)}
${step(2, 'ดูให้ใคร', who)}
${spread.house ? `<p class="small t-note">เปิดไพ่ 12 ใบลงบนภพทั้ง 12 ตามหลักโหราศาสตร์ไทย เริ่มจากภพตนุ (ตัวเรา)${tFirst() != null ? ` ที่ราศี${SIGNS[tFirst()].th}${t.who === 'me' ? ' ซึ่งเป็นลัคนาของคุณ' : ` (ราศีเกิดของ${tSubj()})`}` : ''} ไปจนถึงภพวินาศ</p>`
    : step(3, 'เรื่องที่อยากรู้', topics) + step(4, 'คำถามในใจ <small>ไม่บังคับ</small>', question)}
<button class="btn t-cta" data-act="tarotDraw"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>สับไพ่ แล้วเลือกเอง ${spread.pos.length} ใบ</button>
${tarotHistHTML()}`;
  } else {
    const all = t.flipped.length === t.cards.length;
    const grid = spread.house
      ? wheelHTML((i) => tarotCardHTML(t.cards[i], i, { sel: all && t.sel === i }), wheelCenter(), all ? t.sel : -1)
      : `<div class="t-row n${t.cards.length}">${t.cards.map((d, i) => `<div class="t-slot">${tarotCardHTML(d, i)}<span class="t-lbl">${spread.pos[i].th}</span></div>`).join('')}</div>`;
    body = `${forChip()}${t.q && !spread.house ? `<p class="small" style="text-align:center">“${esc(t.q)}”</p>` : ''}
${grid}
<div id="tarot-reading">${tarotReadingArea()}</div>
<div class="t-share" id="t-share"${all ? '' : ' hidden'}><button class="btn" data-act="tarotSave">${icon('down', 18, 1.8)}บันทึกรูป</button><button class="btn btn-line" data-act="tarotShare">แชร์ให้เพื่อนช่วยอ่าน</button></div>
<div style="display:flex;gap:8px">${!all ? '<button class="btn" data-act="tarotAll" style="flex:1">เปิดทั้งหมด</button>' : ''}<button class="btn btn-line" data-act="tarotReset" style="flex:1">สับไพ่ใหม่</button></div>`;
  }
  return `<main class="screen" style="--accent:var(--violet)">
${pageHead('03', 'TAROT', 'ไพ่ทาโรต์', 'var(--violet)', 'tarot')}
${body}
<p class="small" style="text-align:center;font-size:11px">สำรับ Rider–Waite–Smith 78 ใบ ภาพวาดต้นฉบับของ Pamela Colman Smith (1909) · ความหมายตามตำรา A. E. Waite</p>
</main>`;
}

// ---------- tarot history & share image ----------
function tarotDone() { tarotLogSave(); const sh = document.getElementById('t-share'); if (sh) sh.hidden = false; }
const TAROT_LOG = 'taksila.tarotHist';
function tarotLog() { try { return JSON.parse(localStorage.getItem(TAROT_LOG)) || []; } catch (e) { return []; } }
function tarotLogSave() {
  const t = state.tarot;
  if (t.logged || !t.cards || t.flipped.length < t.cards.length) return;
  t.logged = true;
  const rec = { ts: Date.now(), sp: t.spread, q: t.q, topic: t.topic, who: t.who, other: t.who === 'other' ? { ...t.other } : null, cards: t.cards.map((d) => [d.i, d.rev ? 1 : 0]) };
  try { localStorage.setItem(TAROT_LOG, JSON.stringify([rec, ...tarotLog()].slice(0, 40))); } catch (e) {}
}
const tDate = (ts) => { const d = new Date(ts); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function tarotHistHTML() {
  const log = tarotLog();
  if (!log.length) return '';
  return `<section class="t-step"><h2 class="t-step-h"><span>☰</span>ประวัติการเปิดไพ่ <small>${log.length} ครั้ง · เก็บในเครื่องนี้</small></h2>
<ul class="th-list">${log.slice(0, state.tarot.histAll ? 40 : 5).map((r, k) => `<li><button class="th-open" data-act="tarotHist" data-i="${k}">
<span class="th-cards">${r.cards.slice(0, 3).map(([ci, rv]) => `<img src="${CARDS[ci].img}" alt=""${rv ? ' class="rev"' : ''} loading="lazy">`).join('')}</span>
<span class="th-t"><b>${SPREADS[r.sp].th}${r.who === 'other' && r.other && r.other.name ? ' · ให้' + esc(r.other.name) : ''}</b><span>${r.q ? '“' + esc(r.q) + '”' : r.cards.slice(0, 3).map(([ci]) => CARDS[ci].th).join(' · ')}</span><i class="mono">${tDate(r.ts)}</i></span></button>
<button class="th-del" data-act="tarotHistDel" data-i="${k}" aria-label="ลบ">✕</button></li>`).join('')}</ul>
${log.length > 5 && !state.tarot.histAll ? '<button class="link-btn" data-act="tarotHistAll" style="align-self:center">ดูทั้งหมด</button>' : ''}</section>`;
}
function tarotHistOpen(k) {
  const r = tarotLog()[k];
  if (!r) return;
  Object.assign(state.tarot, { spread: r.sp, q: r.q || '', topic: r.topic || 0, who: r.who === 'other' && r.other ? 'other' : 'me', deck: null, picks: [], sel: 0, logged: true, histTs: r.ts,
    cards: r.cards.map(([i, rv]) => ({ i, rev: !!rv })), flipped: r.cards.map((_, n) => n) });
  if (r.other) state.tarot.other = { ...r.other };
}

// Share card: draws the reading on a 1080×1350 canvas. Card pictures are drawn when the browser allows it;
// otherwise (e.g. opened from a local file) the card names are drawn instead.
function wrapText(ctx, text, x, y, maxW, lh, maxLines = 3) {
  const words = text.split(/([\s\u200b]+)/);
  let line = '', n = 0;
  const parts = [];
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW && line) { parts.push(line); line = w.trimStart(); } else line += w;
  }
  if (line) parts.push(line);
  for (const p of parts.slice(0, maxLines)) { ctx.fillText(p, x, y + n * lh); n++; }
  return y + n * lh;
}
// Thai has no spaces between words; break long Thai runs at a character budget.
const thaiChunks = (s) => s.replace(/(.{14,}?)(?=[ก-ฮ][ก-ฮ])/g, '$1​');
function loadImg(src) { return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
async function tarotImage(withPics = true) {
  const t = state.tarot, sp = SPREADS[t.spread], W = 1080, H = 1350;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1A1428'); g.addColorStop(.5, '#0D0B10'); g.addColorStop(1, '#16110A'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 70; k++) { x.fillStyle = `rgba(240,216,154,${0.15 + (k % 5) * 0.08})`; x.beginPath(); x.arc((k * 397) % W, (k * 211) % 420, 1 + (k % 3), 0, 7); x.fill(); }
  const F = (w, s) => `${w} ${s}px "IBM Plex Sans Thai", "Taviraj", sans-serif`;
  x.textAlign = 'center'; x.fillStyle = '#D4AF63'; x.font = F(500, 26); x.fillText('ตักศิลา · TAROT', W / 2, 70);
  x.fillStyle = '#F6E3B0'; x.font = F(700, 58); x.fillText(sp.house ? 'ไพ่ 12 ภพ' : `ไพ่ ${sp.th} · ${sp.sub}`, W / 2, 140);
  x.fillStyle = '#B9AD94'; x.font = F(400, 28); x.fillText(`${t.who === 'other' && t.other.name ? 'ดูให้ ' + t.other.name + ' · ' : ''}${tDate(t.histTs || Date.now())}`, W / 2, 186);
  if (t.q && !sp.house) { x.fillStyle = '#E9DFC8'; x.font = F(400, 30); x.fillText('“' + t.q.slice(0, 40) + '”', W / 2, 230); }
  const pics = withPics ? await Promise.all(t.cards.map((d) => loadImg(CARDS[d.i].img))) : [];
  const cols = sp.house ? 4 : t.cards.length, rows = Math.ceil(t.cards.length / cols);
  const cw = sp.house ? 150 : Math.min(260, (W - 120) / cols - 30), chh = cw * 1.72, gapX = (W - cols * cw) / (cols + 1), top = sp.house ? 250 : 290;
  const rowH = chh + (sp.house ? 66 : 110);
  t.cards.forEach((d, i) => {
    const c = CARDS[d.i], col = i % cols, row = Math.floor(i / cols);
    const cx = gapX + col * (cw + gapX), cy = top + row * rowH;
    x.save();
    x.fillStyle = '#1E1830'; x.strokeStyle = '#D4AF63'; x.lineWidth = 2;
    if (pics[i]) { x.translate(cx + cw / 2, cy + chh / 2); if (d.rev) x.rotate(Math.PI); x.drawImage(pics[i], -cw / 2, -chh / 2, cw, chh); x.setTransform(1, 0, 0, 1, 0, 0); x.strokeRect(cx, cy, cw, chh); }
    else { x.fillRect(cx, cy, cw, chh); x.strokeRect(cx, cy, cw, chh); x.fillStyle = '#F6E3B0'; x.font = F(600, 26); x.textAlign = 'center'; wrapText(x, thaiChunks(c.th), cx + cw / 2, cy + chh / 2 - 10, cw - 20, 32, 3); x.fillStyle = '#9C8F76'; x.font = F(400, 18); x.fillText(c.en, cx + cw / 2, cy + chh - 24); }
    x.restore();
    x.textAlign = 'center'; x.fillStyle = '#D4AF63'; x.font = F(600, sp.house ? 22 : 28);
    x.fillText(sp.house ? `${i + 1} · ${HOUSE_READ[i].th}` : sp.pos[i].th, cx + cw / 2, cy + chh + (sp.house ? 30 : 38));
    x.fillStyle = '#E9DFC8'; x.font = F(400, sp.house ? 19 : 24);
    x.fillText((c.th.length > 14 ? c.th.split(' ')[0] : c.th) + (d.rev ? ' (กลับ)' : ''), cx + cw / 2, cy + chh + (sp.house ? 56 : 72));
  });
  x.fillStyle = '#8F836C'; x.font = F(400, 22); x.textAlign = 'center';
  x.fillText('เปิดไพ่ฟรีที่ตักศิลา · mengnattawitmarin.github.io/taksila', W / 2, H - 36);
  return new Promise((res) => {
    try { cv.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); }
  });
}
async function tarotShare(mode) {
  let blob = await tarotImage(true);
  if (!blob) blob = await tarotImage(false);
  if (!blob) { toast('สร้างรูปไม่สำเร็จ'); return; }
  const name = `taksila-tarot-${Date.now()}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'ผลไพ่จากตักศิลา' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast(mode === 'share' ? 'เครื่องนี้แชร์ตรงไม่ได้ บันทึกรูปไว้ให้แล้ว ส่งต่อได้เลย' : 'บันทึกรูปแล้ว');
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
<p class="small" style="margin-top:-12px">${tool.hint}</p>${LOCK_NOTE}`
    : `<label class="field">${tool.th}<input class="input mono num-input" inputmode="${tool.kind === 'digits' ? 'numeric' : 'text'}" autocomplete="off" maxlength="${tool.max + 4}" data-in="numValue" value="${esc(n.values[n.mode] || '')}" placeholder="${tool.ph}"></label>
<p class="small" style="margin-top:-12px">${tool.hint}</p>${LOCK_NOTE}`}
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
<div class="fold"><div class="fold-in"><ol class="rm-steps">${plan.steps.map((s) => `<li><span class="rm-si">${s.ic}</span><span class="rm-sb"><span class="rm-k">${s.k}</span><b>${s.t}</b>${s.d && s.d !== s.t ? `<span>${s.d}</span>` : ''}${s.chant ? `<a href="#/prayer" data-act="openPrayer" data-v="${s.chant}" class="rm-go">เปิดบทสวด ›</a>` : ''}${s.map ? `<a href="#/map" data-act="mapCat" data-v="${s.map}" class="rm-go">ดูสถานที่ในแผนที่มู ›</a>` : ''}${s.src ? `<i>ที่มา: ${s.src}</i>` : ''}</span></li>`).join('')}</ol>
<p class="rm-foot">ทำเท่าที่สะดวกและตามกำลังทรัพย์ ทุกข้อเป็นความเชื่อตามประเพณีไทย ที่ได้ผลแน่นอนคือใจที่สงบลงและความดีที่ได้ทำ</p></div></div></section>`;
}
// What troubles the person right now: a hard transit from a heavy planet, or a low day score.
function troubleNow() {
  const ch = state.chart, now = new Date(), bp = birthPlanet(state.profile);
  const fc = weekData()[0].fc, dl = { scores: fc.scores }, total = fc.total;
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
const NEEDS_PROFILE = ['fengshui', 'map', 'dream', 'home', 'chart', 'match', 'ask'];
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
  return pr.blocks.map((b) => `${b.note ? `<p class="pr-note">${b.note}</p>` : ''}${b.lines ? `<div class="pr-stanza">${b.n ? `<span class="pr-n">${thaiNum(b.n)}</span>` : ''}<div>${b.lines.map((l) => `<p>${l.replace('{deva}', 'พระ' + TH_PLANETS[birthPlanet(state.profile)].th)}</p>`).join('')}</div></div>` : ''}${b.p ? `<p class="pr-prose">${b.p}</p>` : ''}${b.go ? `<a href="#/prayer" class="ask-link" data-act="openPrayer" data-v="${b.go}" style="align-self:center">เปิด${prayerById(b.go).th} ›</a>` : ''}`).join('');
}
// The birth-day deva chant is recited as many times as the birth planet's strength (กำลังพระเคราะห์), like the day chants.
const prOf = (id) => id === 'deva-birth' && state.profile ? { ...prayerById(id), count: prayerById(birthChant(birthPlanet(state.profile))).count, cat: 'day' } : prayerById(id);
const QUICK_CHANTS = [['metta-all', 'แผ่เมตตา', '♡'], ['metta-self', 'เมตตาตนเอง', '☺'], ['kruadnam', 'กรวดน้ำ', '≈'], ['khama', 'ขอขมา', '☸'], ['ts-popular', 'คนนิยม', '✿'], ['ts-trade', 'ค้าขายดี', '◈'], ['ts-talk', 'การเจรจา', '❝'], ['ts-safe', 'แคล้วคลาด', '➶'], ['ts-lightning', 'กันฟ้าผ่า', 'ϟ'], ['ts-ghost', 'ป้องกันผี', '☾'], ['ts-dog', 'กันสุนัข', '⚑'], ['ts-snake', 'ป้องกันงู', '§'], ['itipiso', 'อิติปิโส', '☸'], ['itipiso-rev', 'อิติปิโสถอยหลัง', '↺'], ['itipiso-8', 'อิติปิโส 8 ทิศ', '✳'], ['lp-iam', 'มงกุฎพระพุทธเจ้า', '♔'], ['deva-birth', 'เทวดาประจำตัว', '✧'], ['chinabanchon', 'ชินบัญชร', '❖'], ['ngoenlan', 'คาถาเงินล้าน', '¤'], ['siwali', 'พระสีวลี', '◎']];
function viewPrayer() {
  const st = state.prayer, bp = birthPlanet(state.profile);
  const head = pageHead('07', 'PRAYER', 'บทสวดมนต์', 'var(--gold-2)', 'prayer', st.open ? `<button class="back" data-act="prayerBack" aria-label="กลับ" style="margin:0">${icon('back', 20, 1.5)}</button>` : '');
  if (st.open) {
    const pr = prOf(st.open), done = st.counts[pr.id] || 0;
    const cat = PRAYER_CATS.find((c) => c.id === pr.cat);
    return `<main class="screen pr-screen">
${head}
<section class="pr-head"><span class="eyebrow" style="color:var(--gold)">${cat.th}${pr.sub ? ' · ' + pr.sub : ''}</span>
<h2 class="pr-title">${pr.th}</h2>
<p class="small" style="color:var(--text-2)">${pr.use}</p>
${pr.origin ? `<p class="pr-origin"><b>ที่มา</b> ${pr.origin}</p>` : ''}
${pr.src ? `<p class="small" style="font-size:11px">อ้างอิงตัวบท: ${pr.src}${pr.cat === 'folk' || pr.cat === 'geji' || pr.cat === 'thasung' || pr.cat === 'khanun' ? ' · เป็นคาถาตามความเชื่อ ถ้อยคำอาจต่างกันในแต่ละสำนัก' : ''}</p>` : ''}
<span class="pr-count">สวด ${pr.count} จบ${pr.cat === 'day' ? ' · ตามกำลังดาวประจำวัน' : ''}</span></section>
<section class="pr-text${pr.heart ? ' heart' : ''}">${prayerText(pr)}</section>
<details class="pr-tr"${state.prayer.trOpen ? ' open' : ''}><summary data-act="prTrToggle"><span>📖 คำแปลภาษาไทย</span><i>แตะเพื่อ${state.prayer.trOpen ? 'ซ่อน' : 'อ่าน'}</i></summary>
<div class="pr-tr-in">${prayerTr(pr).map((t) => t.startsWith('## ') ? `<h3>${t.slice(3)}</h3>` : `<p>${t}</p>`).join('')}<p class="pr-tr-note">แปลโดยสรุปเพื่อความเข้าใจ ไม่ใช่คำแปลจากพระไตรปิฎกฉบับทางการ</p></div></details>
<section class="pr-counter" id="pr-counter">${counterHTML(pr)}</section>
<button class="pr-report" data-act="prReport">พบตัวบทผิด? แจ้งทาง LINE (ไอดี Mengfrog)</button>
<p class="small" style="text-align:center;font-size:11px">ตั้งนะโม 3 จบก่อนสวด · สวดด้วยใจสงบ ความหมายเป็นสรุปสั้นเพื่อความเข้าใจ</p>
</main>`;
  }
  const L = luckOf(bp), total = weekData()[0].fc.total;
  const today = dailyRemedy(liveAspects(state.chart, new Date(), { n: 6, exact: false }), bp, total);
  const recs = [{ id: birthChant(bp), kind: 'เสริม', reason: `บทประจำวันเกิดของคุณ (${TH_PLANETS[bp].day})` }];
  if (today.id !== recs[0].id) recs.unshift(today);
  recs.push({ id: devaOfDay(bp), kind: 'บูชา', reason: `เทพประจำวันเกิดตามคติฮินดู (${TH_PLANETS[bp].day})` });
  recs.push({ id: 'deva-birth', kind: 'บูชา', reason: `เทวดานพเคราะห์ประจำตัวของคนเกิด${TH_PLANETS[bp].day} คือพระ${TH_PLANETS[bp].th}` });
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

// ---------------- เพิ่มเติม: every room in one sheet ----------------
const ROOMS = [
  ['chart', 'ผังดาว', 'ดวงกำเนิด', 'var(--gold)'], ['match', 'คู่ดวง', 'เทียบสองคน', 'var(--rose)'],
  ['tarot', 'ไพ่ทาโรต์', '78 ใบ 12 ภพ', 'var(--violet)'], ['numbers', 'ตัวเลข', 'เบอร์ ทะเบียน ชื่อ', 'var(--teal)'],
  ['luck', 'โชคลาภ', 'ปิงปอง ธูป ต้นไม้', 'var(--amber)'], ['auspice', 'ฤกษ์ยาม', 'แต่ง บวช ขึ้นบ้าน', 'var(--amber)'],
  ['prayer', 'บทสวด', 'คาถา เกจิ เทพ', 'var(--gold-2)'], ['ask', 'ปรึกษา', 'ถามเรื่องเฉพาะ', 'var(--rose)'],
  ['dream', 'ทำนายฝัน', 'ตำรา เลขเด็ด', 'var(--violet)'], ['map', 'แผนที่มู', 'วัด เกจิ มูลนิธิ', 'var(--amber)'], ['calendar', 'วันพระ · ทำบุญ', 'เตือน ภารกิจบุญ', 'var(--gold-2)'], ['fengshui', 'ฮวงจุ้ย', 'เลขกัว ดาวเหิน', '#E5675A'], ['face', 'โหงวเฮ้ง', 'หน้า ลายมือ AR', '#E8A2B8'], ['learn', 'ศึกษาตำรา', 'บทเรียนสั้น', '#D4AF63'], ['setup', 'ข้อมูลเกิด', 'แก้วันเวลาเกิด', 'var(--muted)'],
  ['privacy', 'ความเป็นส่วนตัว', 'PDPA ลบข้อมูล', 'var(--teal)'], ['about', 'เกี่ยวกับ', 'แหล่งอ้างอิง', 'var(--gold)']
];
const NAV_ROUTES = ['home', 'chart', 'tarot', 'numbers', 'luck'];
function moreSheetHTML() {
  return `<div class="more-sheet" id="more-sheet" role="dialog" aria-label="ห้องทั้งหมด"><button class="more-bg" data-act="moreClose" aria-label="ปิด"></button>
<div class="more-in"><span class="more-grip" aria-hidden="true"></span><div class="more-h"><b>ห้องทั้งหมดในตักศิลา</b><button class="ic-x" data-act="moreClose">ปิด</button></div>
<nav class="more-grid">${ROOMS.map(([r, t, s, c]) => `<a href="#/${r}" class="more-t" style="--c:${c}"${route() === r ? ' aria-current="page"' : ''}><span class="sigil">${icon(r, 20)}</span><b>${t}</b><span>${s}</span></a>`).join('')}</nav>
${shareAppHTML()}
${otherAppsHTML()}</div></div>`;
}
// ชวนเพื่อน: QR และปุ่มแชร์ลิงก์ ใช้ได้ทั้ง Android และ iPhone
function shareAppHTML() {
  return `<section class="sa"><div class="sa-qr">${qrSVG(APP_URL, 112)}</div><div class="sa-t"><b>ชวนเพื่อนมาดูดวง</b><span>ลิงก์เดียวใช้ได้ทั้ง Android และ iPhone ให้เพื่อนสแกน QR หรือส่งลิงก์</span>
<div class="sa-btns"><button class="chip small-chip" data-act="shareApp">แชร์ลิงก์ ↗</button><button class="chip small-chip" data-act="copyApp">คัดลอกลิงก์</button></div></div></section>`;
}
// แอปอื่นของผู้พัฒนา
const OTHER_APPS = [
  { name: 'รอดรู้', en: 'RODRU', ic: '🛟', c: '#5BA4E6', desc: 'แอปเตรียมรับมือภัยพิบัติ เรดาร์ฝน ระดับน้ำ แผ่นดินไหว เบอร์ฉุกเฉิน และปุ่ม SOS',
    links: [['Android', 'https://github.com/mengnattawitmarin/rodru/releases/latest', 'โหลด rodru.apk แล้วติดตั้งทับตัวเดิมได้เลย ข้อมูลที่บันทึกไว้ไม่หาย'], ['iPhone', 'https://mengnattawitmarin.github.io/rodru/', 'เปิดใน Safari แล้วกด แชร์ → เพิ่มไปยังหน้าจอโฮม']] },
  { name: 'Finder Marin', en: 'FINDER', ic: '🐾', c: '#E8A2B8', desc: 'ชุมชนตามหาสัตว์เลี้ยงหาย ปักหมุดสัตว์จรให้ได้บ้านใหม่ และคุยกับคนรักสัตว์',
    links: [['เปิดเว็บ', 'https://finder-marin.pages.dev', 'ใช้ได้ทั้ง Android และ iPhone']] }
];
function otherAppsHTML() {
  return `<section class="oa"><h3 class="oa-h">แอปอื่นของผู้พัฒนา</h3>${OTHER_APPS.map((a) => `<article class="oa-c" style="--c:${a.c}"><div class="oa-top"><span class="oa-ic" aria-hidden="true">${a.ic}</span><div><b>${a.name}</b><span>${a.desc}</span></div></div>
<div class="oa-links">${a.links.map(([t, u, h]) => `<a class="oa-btn" href="${u}" target="_blank" rel="noopener"><b>${t === 'Android' ? '🤖 ' : t === 'iPhone' ? '📱 ' : '🌐 '}${t}</b><span>${h}</span></a>`).join('')}</div></article>`).join('')}</section>`;
}
function closeMore() { const m = document.getElementById('more-sheet'); if (m) m.remove(); }

// ---------------- ทำนายฝัน ----------------
const DREAM_GROUPS = [
  ['สัตว์', ['งูรัดหรือพันตัว', 'งูกัด', 'งูเข้าบ้าน', 'งูไล่', 'งูเหลือม', 'งูเห่า', 'งูจงอาง', 'เห็นงู', 'พญานาค', 'ช้าง', 'จระเข้', 'เต่า', 'เสือ', 'แมว', 'ปลา', 'หมา', 'ปู', 'ไก่', 'ม้า', 'กระต่าย', 'กบ', 'ฉลาม', 'หนอน', 'จิ้งจก', 'ตุ๊กแก', 'กิ้งก่า', 'หนู', 'นก', 'ลิง', 'มด', 'ปลิง', 'ไส้เดือน', 'ตะกวด', 'ผึ้งต่อย', 'หมาหอน']],
  ['คน', ['เด็ก', 'ตั้งท้อง', 'คลอดลูก', 'อุ้มเด็ก', 'แฟนเก่า', 'พระ', 'ผี', 'คนตาย', 'มีคนที่สาม', 'คู่รัก', 'ภรรยา', 'เพื่อน', 'หมอดู', 'พ่อแม่', 'แม่', 'เจ้านาย ผู้ใหญ่', 'ยักษ์', 'ตำรวจ ถูกจับ', 'ขโมย', 'ญาติพี่น้อง', 'ยมทูต']],
  ['ร่างกาย', ['ฟันหลุด', 'ฟันบนหลุด', 'ฟันล่างหลุด', 'ฟันหลุดทั้งปาก', 'ตัดผม', 'เลือด', 'เปลือยกาย', 'ผมร่วง', 'สระผม', 'เล็บ', 'ร้องไห้', 'โกนหัว', 'อาบน้ำ']],
  ['เงินทอง สิ่งของ', ['ทอง', 'เงิน', 'ถูกหวย', 'ปืน', 'เครื่องบิน', 'อุจจาระ', 'แหวน', 'นาฬิกา', 'กุญแจ', 'เกลือ', 'โกศ', 'สร้อยคอ', 'ต่างหู', 'หนังสือ', 'รถ', 'จักรยาน', 'นั่งเรือ', 'ไข่', 'ดอกไม้', 'ศาลพระภูมิ', 'โลงศพ', 'รูปถ่าย']],
  ['เหตุการณ์', ['ไฟไหม้', 'จมน้ำ', 'น้ำท่วม', 'น้ำท่วมบ้าน', 'ตกจากที่สูง', 'ถูกไล่ล่า', 'ฆ่างู', 'งานศพ', 'เผาศพ', 'แต่งงาน', 'ทะเลาะ', 'ถูกยิง', 'รถชน', 'ย้ายบ้าน', 'ปลูกต้นไม้', 'ขับรถ', 'ว่ายน้ำ', 'ตกปลา', 'ทะเล ชายหาด', 'ขึ้นบันได', 'ฟ้าผ่า', 'พระอาทิตย์', 'พระจันทร์', 'ภูเขา ป่า', 'แม่น้ำ', 'จอมปลวก', 'กระทง']]
];
// Folk belief on when the dream came (Shopee Blog: ทำนายฝัน). Shown as belief only.
const DREAM_TIMES = [
  ['day', 'กลางวัน', 'ตามความเชื่อ ฝันกลางวันมาจากความคิดของเราเอง มักไม่เป็นจริง'],
  ['eve', 'หัวค่ำ 18–22 น.', 'ตามความเชื่อ ฝันช่วงหัวค่ำจะส่งผลราว 6 เดือนข้างหน้า'],
  ['night', 'ดึก 22–02 น.', 'ตามความเชื่อ ฝันช่วงดึกจะส่งผลภายใน 1–3 เดือน'],
  ['dawn', 'ใกล้รุ่ง 02 น.–เช้า', 'ตามความเชื่อ ฝันใกล้รุ่งแม่นที่สุด ส่งผลเร็วภายใน 3–15 วัน']
];
const DREAM_KEY = 'taksila.dreams';
function dreamLog() { try { return JSON.parse(localStorage.getItem(DREAM_KEY)) || []; } catch (e) { return []; } }
const dreamByTh = (th) => DREAMS.find((d) => d.th === th);
function dreamResultHTML(d) {
  const st = state.dream, bp = birthPlanet(state.profile), L = luckOf(bp);
  const tm = DREAM_TIMES.find((x) => x[0] === st.time);
  const warn = /ระวัง|เคราะห์|อุบัติเหตุ|ขัดแย้ง|ดวงตก/.test(d.d);
  return `<section class="card dr-res${warn ? ' warn' : ''}" aria-live="polite">
<span class="eyebrow">ฝันเห็น</span><h2 class="h2" style="margin:0">${d.th}</h2>
<p class="body" style="font-size:15px;margin:0">${d.d}</p>
${tm ? `<p class="small dr-time">🕰 ${tm[2]}</p>` : ''}
${d.n.length ? `<div class="dr-nums"><span class="small">เลขตามตำรา</span><div>${d.n.map((n) => `<b class="mono">${n}</b>`).join('')}</div></div>` : ''}
<div class="dr-nums mine"><span class="small">เลขมงคลของคุณ (ทักษาคนเกิด${TH_PLANETS[bp].day})</span><div>${L.numbers.map((n) => `<b class="mono">${n}</b>`).join('')}</div></div>
${warn ? `<p class="small dr-fix">ฝันเตือน: ตามความเชื่อให้ตักบาตรเช้าวันรุ่งขึ้นแล้วกรวดน้ำ หรือสวดแผ่เมตตาก่อนนอน ให้ร้ายกลายเป็นดี</p>` : ''}
<div class="ask-links"><a href="#/prayer" data-act="openPrayer" data-v="${warn ? 'metta-all' : 'chinabanchon'}" class="ask-link">☸ ${warn ? 'สวดแผ่เมตตาก่อนนอน' : 'สวดชินบัญชรเสริมดวง'}</a><a href="#/luck" class="ask-link">🎲 ไปห้องโชคลาภ</a><button class="ask-link" data-act="dreamSave">${st.saved ? '✓ บันทึกแล้ว' : '📓 บันทึกลงสมุดฝัน'}</button></div>
<p class="small" style="font-size:11px;margin:0">ที่มา: ${d.src} · ความฝันเป็นความเชื่อ ใช้เป็นกำลังใจหรือความบันเทิง</p></section>`;
}
function viewDream() {
  const st = state.dream;
  const found = st.sel ? dreamByTh(st.sel) : st.q.trim() ? dreamLookup(st.q) : null;
  const log = dreamLog();
  return `<main class="screen" style="--accent:var(--violet)">
${pageHead('09', 'DREAMS', 'ทำนายฝัน', 'var(--violet)', 'dream')}
<label class="field">เมื่อคืนฝันว่าอะไร<input class="input" data-in="dreamQ" value="${esc(st.q)}" placeholder="เช่น ฝันเห็นงูรัด ฝันฟันหลุด" autocomplete="off" maxlength="80"></label>
<div class="seg dr-seg" role="group" aria-label="ฝันตอนไหน">${DREAM_TIMES.map(([k, t]) => `<button aria-pressed="${st.time === k}" data-act="dreamTime" data-v="${k}">${t.split(' ')[0]}</button>`).join('')}</div>
<div id="dream-out">${found ? dreamResultHTML(found) : st.q.trim() ? '<p class="small">ยังไม่มีฝันนี้ในตำรา ลองพิมพ์สั้น ๆ เช่น "งู" "ฟัน" "คนตาย" หรือแตะเลือกด้านล่าง</p>' : ''}</div>
${DREAM_GROUPS.map(([g, list]) => `<section class="dr-g"><h2 class="label">${g}</h2><div class="dr-chips">${list.map((th) => `<button class="chip" data-act="dreamPick" data-v="${th}" aria-pressed="${st.sel === th}">${th}</button>`).join('')}</div></section>`).join('')}
${log.length ? `<section class="dr-g"><h2 class="label" style="display:flex;justify-content:space-between"><span>สมุดฝันของฉัน</span><button class="link-btn" style="min-height:0;font-size:12px" data-act="dreamClear">ล้าง</button></h2>
<ul class="dr-log">${log.map((x) => `<li><span class="mono">${x.date}</span><button class="link-btn" data-act="dreamPick" data-v="${x.th}">${x.th}</button></li>`).join('')}</ul></section>` : ''}
<p class="small" style="font-size:11px">🔒 สมุดฝันเก็บไว้ในเครื่องนี้เท่านั้น ไม่ส่งออกไปที่ใด</p>
</main>`;
}

// ---------------- ความเป็นส่วนตัว (PDPA) ----------------
function viewPrivacy() {
  return `<main class="screen" style="--accent:var(--teal)">
${pageHead('10', 'PRIVACY · PDPA', 'ความเป็นส่วนตัว', 'var(--teal)', 'privacy')}
<section class="card pv-hero"><b>ข้อมูลของคุณอยู่ในเครื่องคุณเท่านั้น</b><span class="small">ตักศิลาไม่มีเซิร์ฟเวอร์เก็บข้อมูลผู้ใช้ ไม่มีระบบสมาชิก ไม่ติดตามการใช้งาน และไม่ขายหรือแบ่งปันข้อมูลให้ใคร การคำนวณดวงทั้งหมดทำในเครื่องของคุณ</span></section>
<section class="pv"><h2 class="label">เก็บอะไรบ้าง และเก็บที่ไหน</h2><ul>
<li><b>ชื่อเล่น วัน เวลา และสถานที่เกิด</b> ใช้คำนวณผังดาวและทักษา เก็บในหน่วยความจำของเบราว์เซอร์ในเครื่องนี้ (localStorage)</li>
<li><b>คนที่บันทึกไว้ในห้องคู่ดวง และสมุดฝัน</b> เก็บในเครื่องนี้เช่นกัน</li>
<li><b>เลขบัตรประชาชน เลขบัญชี เบอร์โทร ทะเบียนรถ ชื่อที่วิเคราะห์</b> คำนวณทันทีในเครื่อง <u>ไม่บันทึก ไม่ส่งออก</u> ปิดแอปแล้วหายไป</li>
</ul></section>
<section class="pv"><h2 class="label">สิ่งที่ออกจากเครื่องของคุณ</h2><ul>
<li>ตอนเปิดแอป เบราว์เซอร์จะโหลดไฟล์แอปจาก GitHub Pages และโหลดฟอนต์จาก Google Fonts ผู้ให้บริการเหล่านี้อาจเห็นข้อมูลทางเทคนิค เช่น หมายเลข IP ตามนโยบายของเขา แต่ไม่ได้รับข้อมูลดวงหรือตัวเลขที่คุณกรอก</li>
<li>เมื่อกดแชร์ รูปหรือข้อความจะถูกส่งไปยังแอปที่คุณเลือกเอง</li>
</ul></section>
<section class="pv"><h2 class="label">สิทธิของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</h2>
<p class="small">กฎหมายให้สิทธิเจ้าของข้อมูล เช่น ขอรับทราบรายละเอียด ขอเข้าถึงหรือรับสำเนา ขอแก้ไข ขอลบ ขอระงับหรือคัดค้านการใช้ ขอโอนข้อมูล และถอนความยินยอม เพราะข้อมูลอยู่ในเครื่องคุณเอง คุณใช้สิทธิเหล่านี้ได้ทันที: ดูและแก้ไขได้ที่ "ข้อมูลเกิด" และลบทั้งหมดได้ด้วยปุ่มด้านล่าง</p></section>
<section class="card pv-del"><b>ลบข้อมูลทั้งหมดในเครื่องนี้</b><span class="small">ลบวันเกิด คนที่บันทึก สมุดฝัน และการตั้งค่าทั้งหมดของตักศิลาในเบราว์เซอร์นี้ ย้อนกลับไม่ได้</span>
${state.pvConfirm ? `<div class="pv-row"><button class="btn pv-danger" data-act="pvWipe">ยืนยัน ลบทั้งหมด</button><button class="link-btn" data-act="pvCancel">ยกเลิก</button></div>` : `<button class="btn btn-line pv-danger-o" data-act="pvAsk">ลบข้อมูลทั้งหมด</button>`}</section>
<p class="small" style="font-size:11px">ติดต่อหรือขอใช้สิทธิ์เรื่องข้อมูล: LINE <a href="${LINE_URL}" target="_blank" rel="noopener" style="color:var(--gold)">ไอดี Mengfrog</a> · ปรับปรุงล่าสุด 28 ต.ค. 2569</p>
</main>`;
}
const LOCK_NOTE = '<p class="lock-note">🔒 ประมวลผลในเครื่องนี้เท่านั้น ไม่บันทึก ไม่ส่งออก · <a href="#/privacy">ความเป็นส่วนตัว</a></p>';

// ---------------- แผนที่มู ----------------
const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
let leafletState = 'idle'; // idle | loading | ready | failed
function ensureLeaflet(cb) {
  if (window.L && window.L.map) { leafletState = 'ready'; cb(); return; }
  if (leafletState === 'failed') { cb(); return; }
  if (leafletState === 'loading') { setTimeout(() => ensureLeaflet(cb), 300); return; }
  leafletState = 'loading';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LEAFLET + 'leaflet.min.css'; document.head.appendChild(css);
  const js = document.createElement('script'); js.src = LEAFLET + 'leaflet.min.js';
  const fail = () => { leafletState = 'failed'; cb(); };
  const timer = setTimeout(fail, 9000);
  js.onload = () => { clearTimeout(timer); leafletState = window.L ? 'ready' : 'failed'; cb(); };
  js.onerror = () => { clearTimeout(timer); fail(); };
  document.head.appendChild(js);
}
const muCat = (id) => MU_CATS.find((c) => c.id === id) || MU_CATS[0];
const gmapsDir = (p) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.th + ' ' + p.prov.replace(/\s*\(.*\)/, ''))}`;
const gmapsFind = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.full || p.th) + ' ' + p.prov.replace(/\s*\(.*\)/, ''))}`;
function kmBetween(a, b) {
  const R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function muList() {
  const m = state.map;
  let list = MU_PLACES.filter((p) => (m.cat === 'all' || p.k.includes(m.cat)) && (!m.wish || p.wish.includes(m.wish)) && (m.reg === 'all' || p.reg === m.reg));
  if (m.me) list = list.map((p) => ({ ...p, km: kmBetween(m.me, p) })).sort((a, b) => a.km - b.km);
  return list;
}
function muCardHTML(p, open) {
  const pr = p.chant ? prayerById(p.chant) : null, c = muCat(p.k[0]);
  return `<article class="mu-card${open ? ' open' : ''}" id="mu-${p.id}" style="--c:${c.col}">
<button class="mu-head" data-act="muSel" data-v="${p.id}" aria-expanded="${open}"><span class="mu-dot" aria-hidden="true"></span>
<span class="mu-t"><b>${p.th}</b><span>${p.prov}${p.km != null ? ` · ${p.km < 10 ? p.km.toFixed(1) : Math.round(p.km)} กม.` : ''}</span></span><span class="chev">${icon('down', 16, 1.6)}</span></button>
<div class="mu-tags">${p.k.map((k) => `<span>${muCat(k).th}</span>`).join('')}${p.wish.slice(0, 3).map((w) => `<span class="w">${MU_WISH[w]}</span>`).join('')}</div>
${open ? `<div class="mu-body">${p.full && p.full !== p.th ? `<p class="small" style="margin:0">${p.full}</p>` : ''}
<p class="mu-god">✦ ${p.god}</p><p class="body" style="font-size:14px;margin:0">${p.story}</p><p class="small mu-how">วิธีไหว้ / สิ่งที่ควรรู้: ${p.how}</p>
<div class="mu-btns"><a class="btn" href="${gmapsDir(p)}" target="_blank" rel="noopener">นำทาง</a><a class="btn btn-line" href="${gmapsFind(p)}" target="_blank" rel="noopener">ดูใน Google Maps</a></div>
<div class="ask-links">${pr ? `<a href="#/prayer" data-act="openPrayer" data-v="${pr.id}" class="ask-link">☸ ${pr.th}</a>` : ''}${p.k.includes('blood') ? `<a href="${BLOOD_LINK}" target="_blank" rel="noopener" class="ask-link">♥ จุดรับบริจาควันนี้ (สภากาชาดไทย)</a>` : ''}</div></div>` : ''}
</article>`;
}
function muListHTML() {
  const list = muList(), sel = state.map.sel;
  return list.length ? list.map((p) => muCardHTML(p, p.id === sel)).join('') : '<p class="small">ยังไม่มีสถานที่ในหมวดนี้</p>';
}
function viewMap() {
  const m = state.map;
  return `<main class="screen" style="--accent:var(--amber)">
${pageHead('11', 'MU MAP', 'แผนที่มู', 'var(--amber)', 'map')}
<div class="mu-map-wrap"><div id="mu-map" class="mu-map" aria-label="แผนที่สถานที่มู"></div><button class="mu-near" data-act="muNear">${m.me ? '◉ ใกล้ฉัน' : '◎ ใกล้ฉัน'}</button></div>
<div class="mu-cats hscroll">${MU_REGIONS.map(([k, t]) => `<button class="chip small-chip" data-act="muReg" data-v="${k}" aria-pressed="${m.reg === k}">${t}</button>`).join('')}</div>
<div class="mu-cats hscroll">${MU_CATS.map((c) => `<button class="chip" style="--accent:${c.col}" data-act="muCat" data-v="${c.id}" aria-pressed="${m.cat === c.id}">${c.th}</button>`).join('')}</div>
${m.cat === 'wish' || m.wish ? `<div class="mu-cats hscroll">${Object.entries(MU_WISH).map(([k, t]) => `<button class="chip small-chip" data-act="muWish" data-v="${k}" aria-pressed="${m.wish === k}">${t}</button>`).join('')}</div>` : ''}
${m.cat === 'blood' ? `<a class="mu-blood" href="${BLOOD_LINK}" target="_blank" rel="noopener"><b>♥ ดูจุดรับบริจาคโลหิตล่าสุด</b><span>หน่วยเคลื่อนที่เปลี่ยนทุกวัน ดูตารางที่เว็บไซต์ศูนย์บริการโลหิตแห่งชาติ สภากาชาดไทย</span></a>` : ''}
<p class="small" style="margin:0">${muList().length} แห่ง${m.me ? ' · เรียงจากใกล้คุณที่สุด' : ''}</p>
<section id="mu-list" class="mu-list">${muListHTML()}</section>
<p class="small" style="font-size:11px">หมุดบนแผนที่เป็นตำแหน่งโดยประมาณ ปุ่มนำทางจะค้นชื่อสถานที่ใน Google Maps ให้ตรงตำแหน่งจริง · ข้อมูลเรื่องเล่าและการขอพรเป็นความเชื่อ · แผนที่ © ผู้ร่วมพัฒนา OpenStreetMap</p>
</main>`;
}
let muMap = null, muLayer = null;
function mountMap() {
  const el = document.getElementById('mu-map');
  if (!el) { muMap = null; return; }
  document.querySelectorAll('.mu-cats').forEach((row) => { const on = row.querySelector('[aria-pressed="true"]'); if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; });
  ensureLeaflet(() => {
    if (!document.body.contains(el)) return;
    if (muMap) { try { muMap.remove(); } catch (e) {} muMap = null; muLayer = null; }
    if (leafletState !== 'ready') { el.classList.add('fail'); el.innerHTML = '<p>แผนที่โหลดไม่ได้ตอนนี้ (ต้องต่ออินเทอร์เน็ต) ใช้รายการด้านล่างและปุ่มนำทางแทนได้</p>'; return; }
    const L = window.L;
    muMap = L.map(el, { zoomControl: false, attributionControl: true }).setView([13.75, 100.52], 11);
    L.control.zoom({ position: 'bottomright' }).addTo(muMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(muMap);
    drawPins();
  });
}
function drawPins() {
  if (!muMap) return;
  const L = window.L, m = state.map;
  if (muLayer) muLayer.remove();
  muLayer = L.layerGroup().addTo(muMap);
  const list = muList();
  for (const p of list) {
    const c = muCat(m.cat !== 'all' && p.k.includes(m.cat) ? m.cat : p.k[0]);
    L.circleMarker([p.lat, p.lon], { radius: p.id === m.sel ? 10 : 7, color: '#0D0B08', weight: 2, fillColor: c.col, fillOpacity: 0.95 })
      .addTo(muLayer).bindTooltip(p.th, { direction: 'top' }).on('click', () => muSelect(p.id, true));
  }
  if (m.me) L.circleMarker([m.me.lat, m.me.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#5E92DA', fillOpacity: 1 }).addTo(muLayer).bindTooltip('คุณอยู่ที่นี่');
  const sel = m.sel && list.find((p) => p.id === m.sel);
  if (sel) muMap.setView([sel.lat, sel.lon], Math.max(muMap.getZoom(), 13));
  else if (list.length) muMap.fitBounds(L.latLngBounds(list.map((p) => [p.lat, p.lon]).concat(m.me ? [[m.me.lat, m.me.lon]] : [])), { padding: [24, 24], maxZoom: 13 });
}
function muRefresh() { const box = document.getElementById('mu-list'); if (box) box.innerHTML = muListHTML(); drawPins(); }
function muSelect(id, scroll) {
  state.map.sel = state.map.sel === id && !scroll ? null : id;
  muRefresh();
  if (scroll) { const c = document.getElementById('mu-' + id); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

// ---------------- ปฏิทินพระ: วันพระ วันโกน วันสำคัญ ----------------
const HOLY_CHANTS = [['itipiso', 'อิติปิโส'], ['metta-all', 'แผ่เมตตา'], ['kruadnam', 'กรวดน้ำ']];
// ---- เตือนวันพระ: สมัครปฏิทินในมือถือ (ทุกระบบ) + แจ้งเตือนในแอป ----
const ICS_URL = 'mengnattawitmarin.github.io/taksila/calendar/wanphra.ics';
const ymdIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function notifyDays(days = 45) {
  const out = [], now = new Date();
  for (let i = 0; i <= days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), l = thaiLunar(d);
    if (!l) continue;
    const ev = l.events.filter((e) => e.k === 'big' || e.k === 'luck' || e.k === 'merit' || e.k === 'sky');
    if (!l.holy && !ev.length) continue;
    out.push({ d: ymdIso(d), t: ev.length ? ev.map((e) => e.th).join(' · ') : 'วันพระ', b: `${l.full} · แตะเพื่อดูบทสวดและภารกิจทำบุญ` });
  }
  return out;
}
async function notifySync() {
  if (!('caches' in window) || !navigator.serviceWorker) return;
  try {
    const c = await caches.open('taksila-notify'), key = new URL('__notify.json', document.baseURI).href;
    const old = await c.match(key), prev = old ? await old.json() : {};
    await c.put(key, new Response(JSON.stringify({ days: notifyDays(), sent: prev.sent || {} }), { headers: { 'Content-Type': 'application/json' } }));
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) reg.active.postMessage('check-wanphra');
  } catch (e) {}
}
async function notifyEnable() {
  if (!('Notification' in window)) { toast('เครื่องนี้ยังไม่รองรับการแจ้งเตือนจากเว็บ ใช้ "เพิ่มลงปฏิทิน" แทนได้'); return; }
  const r = await Notification.requestPermission();
  if (r !== 'granted') { toast('ยังไม่ได้อนุญาตการแจ้งเตือน'); return; }
  try { localStorage.setItem('taksila.notify', '1'); } catch (e) {}
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.periodicSync) await reg.periodicSync.register('wanphra', { minInterval: 6 * 3600 * 1000 });
  } catch (e) {}
  await notifySync();
  toast('เปิดเตือนวันพระแล้ว');
  render();
}
const notifyOn = () => { try { return localStorage.getItem('taksila.notify') === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch (e) { return false; } };
function remindHTML() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<section class="card rm"><span class="eyebrow">เตือนวันพระ · ฤกษ์ใหญ่</span>
<p class="small" style="margin:0">เพิ่มวันพระทั้งปีลงปฏิทินในมือถือ จะเด้งเตือนตอนเย็นก่อนวันพระทุกครั้ง และอัปเดตเองเมื่อมีวันใหม่</p>
<div class="rm-btns"><a class="btn" href="webcal://${ICS_URL}">📅 ปฏิทิน iPhone</a><a class="btn btn-line" href="https://calendar.google.com/calendar/r?cid=${encodeURIComponent('webcal://' + ICS_URL)}" target="_blank" rel="noopener">📅 Google ปฏิทิน (Android)</a></div>
<button class="link-btn" data-act="notifyOn">${notifyOn() ? '🔔 แจ้งเตือนในแอปเปิดอยู่' : '🔔 หรือเปิดแจ้งเตือนจากแอป'}</button>
<p class="small" style="margin:0;font-size:11.5px">${isIOS && !standalone ? 'iPhone: แจ้งเตือนจากแอปใช้ได้เมื่อเพิ่มตักศิลาลงหน้าจอโฮมแล้ว ถ้ายังไม่ได้เพิ่ม ใช้ปุ่มปฏิทินด้านบนจะชัวร์ที่สุด' : 'แจ้งเตือนจากแอปทำงานดีที่สุดบน Android ที่ติดตั้งแอปลงหน้าจอหลักแล้ว ปุ่มปฏิทินใช้ได้ทุกเครื่อง'}</p></section>`;
}
// ---- ภารกิจทำบุญ: วันละ 3 ข้อ เก็บสถิติในเครื่อง ----
const MERIT = [
  ['alms', '🍚', 'ใส่บาตรตอนเช้า', 'ข้าวสวย กับข้าว หรือน้ำดื่ม พร้อมกรวดน้ำอุทิศ', 'holy'],
  ['chant', '📿', 'สวดอิติปิโส 9 จบ', 'ใช้ตัวนับในห้องบทสวดได้', 'prayer:itipiso'],
  ['metta', '💗', 'แผ่เมตตาก่อนนอน', 'ให้ตัวเองและคนที่เราไม่ชอบด้วย', 'prayer:metta-all'],
  ['kruad', '💧', 'กรวดน้ำอุทิศบุญ', 'ให้บรรพบุรุษและเจ้ากรรมนายเวร', 'prayer:kruadnam'],
  ['sit', '🧘', 'นั่งสมาธิ 10 นาที', 'ตามลมหายใจ หายใจเข้า "พุท" ออก "โธ"', ''],
  ['blood', '🩸', 'บริจาคโลหิต', 'ดูจุดรับบริจาคล่าสุดของสภากาชาดไทย', 'blood'],
  ['feed', '🐾', 'ให้อาหารสัตว์จร', 'อาหารเม็ดหรือน้ำสะอาด วางในที่ที่ไม่เกะกะ', ''],
  ['parents', '👵', 'โทรหาพ่อแม่หรือผู้ใหญ่', 'ถามไถ่สารทุกข์ ตำราว่าบุญกตัญญูหนุนดวงแรงที่สุด', ''],
  ['give', '🎁', 'บริจาคของที่ไม่ใช้', 'เสื้อผ้า หนังสือ ของเล่น ให้มูลนิธิหรือคนที่ต้องการ', ''],
  ['clean', '🧹', 'เก็บกวาดที่สาธารณะ', 'ศาลาวัด ป้ายรถเมล์ หน้าบ้าน ทำ 10 นาทีก็ได้บุญ', ''],
  ['praise', '🌸', 'ชมคนอื่นจากใจ 1 คน', 'วาจาดีเป็นทานที่ไม่ต้องใช้เงิน', ''],
  ['forgive', '🕊', 'ให้อภัย 1 เรื่อง', 'ปล่อยความโกรธที่ค้างใจ เป็นอภัยทาน', ''],
  ['veg', '🥬', 'งดเนื้อสัตว์ 1 มื้อ', 'ถือว่าละเว้นการเบียดเบียน', ''],
  ['precept', '🙏', 'ถือศีล 5 ทั้งวัน', 'ไม่ฆ่า ไม่ลัก ไม่ผิดลูกเมีย ไม่โกหก ไม่ดื่มของมึนเมา', 'holy'],
  ['dhamma', '📖', 'ฟังธรรม 15 นาที', 'ฟังเทศน์ออนไลน์หรืออ่านหนังสือธรรมะ', 'holy'],
  ['help', '🤝', 'ช่วยงานคนรอบตัว 1 อย่าง', 'ถือของ เปิดประตู ช่วยงานบ้าน', ''],
  ['oil', '🪔', 'ถวายน้ำมันตะเกียง หรือค่าไฟวัด', 'ตำราว่าเสริมปัญญาและความสว่างในชีวิต', ''],
  ['temple', '🏯', 'ไหว้พระที่วัดใกล้บ้าน', 'ดูวัดที่เหมาะกับคำขอในแผนที่มู', 'map'],
  ['water', '🚰', 'ตั้งน้ำดื่มให้คนผ่านทาง', 'ทานน้ำ ตำราว่าช่วยให้ชีวิตชุ่มชื่น ไม่ขาดแคลน', ''],
  ['book', '📚', 'สอนหรือแบ่งปันความรู้ให้ใคร 1 คน', 'ธรรมทาน ให้ความรู้ถือเป็นทานสูงสุด', '']
];
function meritLoad() { try { return JSON.parse(localStorage.getItem('taksila.merit')) || { done: {} }; } catch (e) { return { done: {} }; } }
function meritSave(m) { try { localStorage.setItem('taksila.merit', JSON.stringify(m)); } catch (e) {} }
function meritToday(d = new Date()) {
  const l = thaiLunar(d), key = ymdIso(d), seed = [...key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const pool = MERIT.filter((m) => m[4] !== 'holy' || (l && l.holy));
  const holyFirst = l && l.holy ? MERIT.filter((m) => m[4] === 'holy') : [];
  const pick = [...holyFirst.slice(0, 1)];
  for (let k = 0; pick.length < 3 && k < 50; k++) { const m = pool[(seed + k * 7) % pool.length]; if (!pick.includes(m)) pick.push(m); }
  return { key, list: pick, holy: !!(l && l.holy) };
}
function meritStreak(m) {
  let n = 0; const d = new Date();
  if (!(m.done[ymdIso(d)] || []).length) d.setDate(d.getDate() - 1);
  while ((m.done[ymdIso(d)] || []).length) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function meritHTML() {
  const m = meritLoad(), t = meritToday(), done = m.done[t.key] || [], total = Object.values(m.done).reduce((a, x) => a + x.length, 0), st = meritStreak(m);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return (m.done[ymdIso(d)] || []).length; });
  const link = (x) => x.startsWith('prayer:') ? `<a href="#/prayer" data-act="openPrayer" data-v="${x.slice(7)}" class="mr-go">เปิดบทสวด ›</a>` : x === 'blood' ? `<a href="${BLOOD_LINK}" target="_blank" rel="noopener" class="mr-go">จุดรับบริจาค ›</a>` : x === 'map' ? '<a href="#/map" class="mr-go">แผนที่มู ›</a>' : '';
  return `<section class="card mr"><div class="mr-top"><span class="eyebrow">ภารกิจทำบุญวันนี้${t.holy ? ' · วันพระ' : ''}</span><span class="mr-st">🔥 ${st} วันติด · บุญสะสม ${total}</span></div>
<div class="mr-week" aria-label="7 วันล่าสุด">${week.map((n, i) => `<i class="${n ? 'on' : ''}${i === 6 ? ' today' : ''}" title="${n} ข้อ"></i>`).join('')}</div>
<ul class="mr-list">${t.list.map(([id, ic, th, sub, x]) => `<li class="${done.includes(id) ? 'done' : ''}"><button class="mr-chk" data-act="meritDo" data-v="${id}" aria-pressed="${done.includes(id)}" aria-label="ทำแล้ว: ${th}">${done.includes(id) ? '✓' : ''}</button><span class="mr-ic">${ic}</span><span class="mr-t"><b>${th}</b><span>${sub}</span>${link(x)}</span></li>`).join('')}</ul>
<p class="small" style="margin:0;font-size:11.5px">${done.length === t.list.length ? '🙏 ครบทั้ง 3 ข้อวันนี้แล้ว อนุโมทนาบุญ' : 'ทำแล้วติ๊ก ภารกิจเปลี่ยนทุกวัน วันพระจะมีภารกิจพิเศษ'} · เก็บสถิติในเครื่องนี้เท่านั้น</p></section>`;
}
function viewCalendar() {
  const now = new Date(), rows = [];
  for (let i = 0; i < 75; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), l = thaiLunar(d);
    if (!l) continue;
    if (l.holy || l.kon || l.events.length) rows.push({ d, l, i });
  }
  let lastMonth = -1;
  return `<main class="screen" style="--accent:var(--gold-2)">
${pageHead('12', 'HOLY DAYS', 'ปฏิทินวันพระ', 'var(--gold-2)', 'calendar')}
${meritHTML()}
${remindHTML()}
<p class="small" style="margin:0">ตามปฏิทินจันทรคติไทย (ปฏิทินหลวง) 75 วันข้างหน้า วันโกนคือวันก่อนวันพระ เหมาะเตรียมของใส่บาตร</p>
<ul class="cal-list">${rows.map(({ d, l, i }) => {
    const head = d.getMonth() !== lastMonth ? `<li class="cal-m">${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}</li>` : '';
    lastMonth = d.getMonth();
    const big = l.events.some((e) => e.k === 'big' || e.k === 'luck' || e.k === 'sky');
    return `${head}<li class="cal-r${l.holy ? ' holy' : ''}${big ? ' big' : ''}"><span class="cal-d"><b>${d.getDate()}</b><i>${WEEKDAY_SHORT[d.getDay()]}</i></span>
<span class="cal-b"><span class="cal-t">${l.holy ? 'วันพระ' : l.kon ? 'วันโกน' : ''}${l.events.map((e) => `<span class="ora-ev ${e.k}">${e.th}</span>`).join('')}</span><span class="small">${l.full}${i === 0 ? ' · วันนี้' : i === 1 ? ' · พรุ่งนี้' : ` · อีก ${i} วัน`}</span>
${l.holy || big ? `<span class="ask-links">${(l.events.find((e) => e.k === 'sky') ? [['itipiso-8', 'อิติปิโส 8 ทิศ']] : HOLY_CHANTS).map(([id, t]) => `<a href="#/prayer" data-act="openPrayer" data-v="${id}" class="ask-link">☸ ${t}</a>`).join('')}</span>` : ''}</span></li>`;
  }).join('')}</ul>
</main>`;
}

// ---------------- แชร์การ์ดดวงวันนี้เป็นรูป ----------------
async function dailyImage() {
  const o = todayOracle(), W = 1080, H = 1350;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1C1530'); g.addColorStop(.55, '#0F0C12'); g.addColorStop(1, '#1E170C'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 80; k++) { x.fillStyle = `rgba(240,216,154,${0.12 + (k % 5) * 0.07})`; x.beginPath(); x.arc((k * 397) % W, (k * 271) % H, 1 + (k % 3), 0, 7); x.fill(); }
  const F = (w, s) => `${w} ${s}px "IBM Plex Sans Thai", "Taviraj", sans-serif`;
  x.textAlign = 'center';
  x.fillStyle = '#D4AF63'; x.font = F(500, 28); x.fillText(`ตักศิลา · คำทำนายวันนี้`, W / 2, 90);
  x.fillStyle = '#B9AD94'; x.font = F(400, 30); x.fillText(`${o.date} · ${o.lunLine}`, W / 2, 140);
  // ring
  const cx = W / 2, cy = 330, R = 120;
  x.lineWidth = 22; x.strokeStyle = '#2C261B'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
  const rg = x.createLinearGradient(cx - R, 0, cx + R, 0); rg.addColorStop(0, '#E592B2'); rg.addColorStop(.5, '#D4AF63'); rg.addColorStop(1, '#7FC4B4');
  x.strokeStyle = rg; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * o.total / 100); x.stroke();
  x.fillStyle = '#F1E6CF'; x.font = F(500, 78); x.fillText(String(o.total), cx, cy + 26);
  x.fillStyle = '#F6E3B0'; x.font = F(700, 76); x.fillText(o.verdict, W / 2, 560);
  if (o.events.length) { x.fillStyle = '#E9C9F0'; x.font = F(500, 32); x.fillText(o.events.map((e) => e.th).join(' · '), W / 2, 612); }
  x.textAlign = 'left'; x.font = F(400, 34); let y = 690;
  for (const a of o.advice) {
    x.fillStyle = a.tone < 0 ? '#F0A08C' : '#7FC4B4'; x.fillText(a.tone < 0 ? '!' : '✓', 110, y);
    x.fillStyle = '#EDE3CC';
    const words = thaiChunks(a.text).split(/([\s​]+)/); let line = '', lines = 0;
    for (const w of words) { if (x.measureText(line + w).width > 820 && line) { x.fillText(line, 160, y); y += 48; line = w.trimStart(); lines++; if (lines >= 2) break; } else line += w; }
    if (lines < 2 && line) { x.fillText(line, 160, y); y += 48; }
    y += 22;
  }
  // categories
  const cw = 200, gap = (W - 4 * cw) / 5, top = Math.max(y + 10, 1010);
  o.scores.forEach((s, k) => {
    const bx = gap + k * (cw + gap);
    x.fillStyle = 'rgba(255,255,255,.05)'; x.beginPath(); x.roundRect ? x.roundRect(bx, top, cw, 130, 22) : x.rect(bx, top, cw, 130); x.fill();
    x.textAlign = 'center'; x.fillStyle = ORA_COL[k]; x.font = F(500, 28); x.fillText(s.name, bx + cw / 2, top + 50);
    x.fillStyle = '#F1E6CF'; x.font = F(500, 50); x.fillText(String(s.score), bx + cw / 2, top + 108);
  });
  x.fillStyle = '#B9AD94'; x.font = F(400, 28);
  x.fillText(`สีเสริมดวง ${TH_PLANETS[o.luck.best].color.split(' ')[0]} · เลขมงคล ${o.luck.nums.join(' ')}`, W / 2, top + 200);
  x.fillStyle = '#8F836C'; x.font = F(400, 24); x.fillText('ดูดวงของคุณเองฟรีที่ตักศิลา · mengnattawitmarin.github.io/taksila', W / 2, H - 40);
  return new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); } });
}
async function shareBlob(blob, name, title) {
  if (!blob) { toast('สร้างรูปไม่สำเร็จ'); return; }
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('บันทึกรูปแล้ว ส่งต่อได้เลย');
}

// ---------------- ชวนเพื่อนมาดูคู่ดวง ----------------
const APP_URL = 'https://mengnattawitmarin.github.io/taksila/';
function inviteLink() {
  const p = state.profile;
  const data = { n: (p.name || '').split(' ')[0] || 'เพื่อน', d: p.day, m: p.month, y: p.yearBE, h: p.timeKnown ? p.hour : null, i: p.timeKnown ? p.minute : null };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${APP_URL}?go=match&inv=${b64}`;
}
async function shareInvite() {
  const url = inviteLink(), text = `มาดูคู่ดวงกับ${(state.profile.name || '').split(' ')[0] || 'เรา'}ในตักศิลากัน ใส่วันเกิดของคุณแล้วจะเห็นว่าเราเข้ากันแค่ไหน`;
  if (navigator.share) { try { await navigator.share({ title: 'ชวนดูคู่ดวง', text, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text + '\n' + url); toast('คัดลอกลิงก์แล้ว วางในแชตได้เลย'); } catch (e) { prompt('คัดลอกลิงก์นี้', url); }
}
// Read an invite (?inv=) once: save the inviter as a person in คู่ดวง and preselect them.
(function readInvite() {
  const inv = INVITE_RAW;
  if (!inv) return;
  try {
    const j = JSON.parse(decodeURIComponent(escape(atob(inv.replace(/-/g, '+').replace(/_/g, '/')))));
    const rec = { name: String(j.n || 'เพื่อน').slice(0, 20), day: +j.d, month: +j.m, yearBE: +j.y, hour: j.h == null ? 12 : +j.h, minute: j.i == null ? 0 : +j.i, timeKnown: j.h != null, rel: 'love' };
    if (!(rec.day >= 1 && rec.day <= 31 && rec.month >= 1 && rec.month <= 12 && rec.yearBE > 2400)) return;
    const k = state.match.people.findIndex((x) => x.name === rec.name);
    if (k >= 0) state.match.people[k] = rec; else state.match.people.push(rec);
    Object.assign(state.match, rec, { useDate: true });
    save();
  } catch (e) { /* bad link: ignore */ }
})();

// ---------------- เกี่ยวกับตักศิลา ----------------
function viewAbout() {
  const src = [
    ['ตำแหน่งดาว', 'คำนวณในเครื่องด้วยสูตรดาราศาสตร์ (แม่นยำในช่วงปี 1900–2100)'],
    ['ปฏิทินจันทรคติไทย', 'ระบบสุริยยาตร์ตามที่ไลบรารีโอเพนซอร์ส pythaidate อธิบายไว้ ตรวจกับวันสำคัญทางศาสนาที่ประกาศจริง'],
    ['อุปราคา', 'ตาราง time.now สำหรับประเทศไทย'],
    ['ไพ่ทาโรต์', 'สำรับ Rider–Waite–Smith (ภาพปี 1909 สาธารณสมบัติ) ความหมายตาม A. E. Waite เขียนใหม่เป็นภาษาไทย'],
    ['บทสวดมนต์', 'ตรวจตัวบทอย่างน้อย 2 แหล่ง และระบุที่มาในหน้าบทสวดทุกบท'],
    ['ทักษา ยามอัฏฐกาล ฤกษ์', 'หลักโหราศาสตร์ไทยแบบดั้งเดิม'],
    ['ทำนายฝัน', 'สรุปจากบทความความเชื่อไทย ระบุที่มาทุกข้อ'],
    ['แผนที่มู', 'ข้อมูลเขียนเอง แผนที่ © OpenStreetMap นำทางด้วย Google Maps'],
    ['บริจาคโลหิต', 'ศูนย์บริการโลหิตแห่งชาติ สภากาชาดไทย'],
    ['โหงวเฮ้ง ลายมือ', 'จุดบนใบหน้าและมือจาก MediaPipe ของ Google (สัญญาอนุญาต Apache 2.0) ประมวลผลในเครื่อง · หลักอ่านจากตำราโหงวเฮ้งจีน (สามส่วน 12 ตำแหน่ง ห้าธาตุ) และตำราลายมือสากล']
  ];
  return `<main class="screen" style="--accent:var(--gold)">
${pageHead('13', 'ABOUT', 'เกี่ยวกับตักศิลา', 'var(--gold)', 'about')}
<section class="card pv-hero"><b>ดูดวงจากดาวจริง ผสานศาสตร์ไทยและสากล</b><span class="small">ตักศิลาคำนวณตำแหน่งดาว ณ เวลาและสถานที่เกิดของคุณ แล้วอ่านร่วมกับโหราศาสตร์ไทย ทักษา เลขศาสตร์ ไพ่ และปฏิทินจันทรคติ ทุกอย่างทำงานในเครื่องของคุณ ใช้ฟรี</span></section>
<section class="pv"><h2 class="label">แหล่งข้อมูลและวิธีคำนวณ</h2><ul>${src.map(([a, b]) => `<li><b>${a}</b> ${b}</li>`).join('')}</ul></section>
<section class="pv"><h2 class="label">ข้อควรรู้</h2><p class="small">คำทำนาย คาถา และความเชื่อในแอปมีไว้เป็นกำลังใจและแนวทาง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน การตัดสินใจสำคัญควรใช้วิจารณญาณของคุณเอง</p></section>
<div class="ask-links"><a href="#/privacy" class="ask-link">🔒 ความเป็นส่วนตัว</a><a href="${LINE_URL}" target="_blank" rel="noopener" class="ask-link">💬 แจ้งปัญหา / เสนอแนะทาง LINE</a></div>
<p class="small" style="font-size:11px">ตักศิลา · ปรับปรุงล่าสุด 28 ต.ค. 2569</p>
</main>`;
}
const LINE_ID = 'Mengfrog', LINE_URL = 'https://line.me/ti/p/~Mengfrog';
const reportText = (pr) => `แจ้งตัวบทผิดในตักศิลา\nบทสวด: ${pr.th} (${pr.id})\nบรรทัดที่ผิด:\nที่ถูกควรเป็น:\nแหล่งอ้างอิง (ถ้ามี):`;

// ---------------- ฮวงจุ้ย ----------------
const FS_KEY = 'taksila.fs';
function fsLoad() { try { return JSON.parse(localStorage.getItem(FS_KEY)) || {}; } catch (e) { return {}; } }
const FS_KEEP = ['gender', 'facing', 'period', 'repl', 'rooms', 'members', 'home', 'radius', 'ptype', 'chk'];
const fsPt = () => ptypeOf(state.fs.ptype);
function fsSave() { try { const o = {}; FS_KEEP.forEach((k) => { o[k] = state.fs[k]; }); localStorage.setItem(FS_KEY, JSON.stringify(o)); } catch (e) {} }
const FS_TABS = [['kua', 'เลขกัว'], ['family', 'ครอบครัว'], ['house', 'ดาวบ้าน'], ['rooms', 'ผังห้อง'], ['score', 'เช็ก · คะแนน'], ['time', 'ปี · เดือน'], ['compass', 'เข็มทิศ'], ['map', 'แผนที่']];
const FS_GRID = ['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'];
const fsBirth = () => { const p = state.profile; return new Date(p.yearBE - 543, p.month - 1, p.day, p.timeKnown ? p.hour : 12, p.timeKnown ? p.minute : 0); };
const fsTone = (t) => (t > 0 ? 'pos' : t < 0 ? 'neg' : 'mid');
// 8-direction wheel: north at the top, each wedge coloured by the person's Kua.
function kuaWheel(k, size = 260, rot = 0) {
  const c = size / 2, R = c - 6, r0 = R * 0.36;
  const pt = (a, rr) => [c + rr * Math.sin(a * Math.PI / 180), c - rr * Math.cos(a * Math.PI / 180)];
  const wedge = (d) => {
    const a0 = FS_DIR_DEG[d] - 22.5, a1 = FS_DIR_DEG[d] + 22.5;
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r0), [x3, y3] = pt(a0, r0);
    return `M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
  };
  return `<svg class="fs-wheel" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="ทิศมงคลของคุณ"><g style="transform:rotate(${-rot}deg);transform-origin:50% 50%">${k.dirs.map((x, i) => {
    const [tx, ty] = pt(FS_DIR_DEG[x.dir], (R + r0) / 2);
    return `<path d="${wedge(x.dir)}" class="fw ${x.good ? 'good' : 'bad'}" style="--i:${i}"/><text x="${tx}" y="${ty - 6}" text-anchor="middle" class="fw-d" transform="rotate(${rot} ${tx} ${ty})">${FS_DIR_SHORT[x.dir]}</text><text x="${tx}" y="${ty + 11}" text-anchor="middle" class="fw-s" transform="rotate(${rot} ${tx} ${ty})">${x.th}</text>`;
  }).join('')}</g><circle cx="${c}" cy="${c}" r="${r0 - 4}" class="fw-c"/><text x="${c}" y="${c - 4}" text-anchor="middle" class="fw-k">${k.kua}</text><text x="${c}" y="${c + 16}" text-anchor="middle" class="fw-kl">เลขกัว</text></svg>`;
}
function fsKuaHTML(k) {
  return `<section class="card fs-kua"><div class="fs-kua-top">${kuaWheel(k, 230)}<div class="fs-kua-t"><span class="eyebrow">เลขกัว · ปาจาย 八宅</span><b>${k.kua}</b><span>${k.trigram} · ธาตุ${k.element}</span><span class="fs-grp ${k.group}">${k.group === 'east' ? 'กลุ่มตะวันออก' : 'กลุ่มตะวันตก'}</span><span class="small">สีเสริม: ${EL_COLOR[k.element]}</span></div></div>
<p class="small" style="margin:0">นับปีเกิดแบบจีน (เปลี่ยนปีที่ลี่ชุน ราว 4 ก.พ.) ปี ${k.sy} · ทิศที่ดีกับคนกลุ่ม${k.group === 'east' ? 'ตะวันออก' : 'ตะวันตก'}คือ ${k.dirs.slice(0, 4).map((x) => FS_DIR_SHORT[x.dir]).join(' ')}</p></section>
<section class="fs-list"><h2 class="label">ทิศมงคล 4 ทิศ</h2>${k.dirs.slice(0, 4).map((x) => `<div class="fs-row pos"><span class="fs-dir">${FS_DIR_SHORT[x.dir]}<i>${x.dir}</i></span><span class="fs-row-t"><b>${x.th} ${x.cn}</b><span>${x.use}</span><span class="small">${x.tip}</span></span></div>`).join('')}
<h2 class="label">ทิศควรเลี่ยง 4 ทิศ</h2>${k.dirs.slice(4).map((x) => `<div class="fs-row neg"><span class="fs-dir">${FS_DIR_SHORT[x.dir]}<i>${x.dir}</i></span><span class="fs-row-t"><b>${x.th} ${x.cn}</b><span>${x.use}</span><span class="small">${x.tip}</span></span></div>`).join('')}</section>`;
}
function fsFacingPicker(fs) {
  const m = mountainOf(fs.facing);
  return `<section class="card fs-face"><div class="fs-face-top">${fsDial(fs.facing)}<div class="fs-face-t"><span class="eyebrow">${fsPt().face} · ${fsPt().th}</span><b id="fs-face-read">${Math.round(fs.facing)}° ${FS_DIR_SHORT[m.palace]}</b><span>ภูเขา ${m.cn} (${m.th}) · ${m.yuan}</span>${m.edge ? '<span class="fs-warn">⚠ ใกล้เส้นแบ่งภูเขา ผังอาจเปลี่ยน ควรวัดซ้ำหรือให้ซินแสตรวจ</span>' : ''}</div></div>
<input type="range" min="0" max="359" step="1" value="${Math.round(fs.facing)}" data-in="fsFacing" aria-label="องศาทิศหน้าบ้าน" class="fs-range">
<div class="fs-quick">${FS_DIRS.map((d) => `<button class="chip small-chip" data-act="fsQuick" data-v="${d}" aria-pressed="${m.palace === d}">${FS_DIR_SHORT[d]}</button>`).join('')}</div>
<div class="fs-nrow2"><label class="field fs-nf">${fs.ptype === 'land' ? 'จะสร้างบ้านเสร็จช่วง' : 'เข้าอยู่หรือสร้างเสร็จช่วง'}<select class="input" data-in="fsPeriod">${FS_PERIODS.map(([v, t]) => `<option value="${v}"${(fs.period || 9) === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div>
${m.edge ? `<button class="chip small-chip fs-repl" data-act="fsRepl" aria-pressed="${!!fs.repl}">${fs.repl ? '✓ ' : ''}ใช้ผังคาบเส้น (替卦)</button><p class="small" style="margin:0">บ้านที่หันใกล้เส้นแบ่งภูเขา หลายสำนักใช้ดาวแทน (替卦) ลองเทียบทั้งสองผัง ถ้าไม่แน่ใจให้ซินแสวัดซ้ำ</p>` : ''}
<button class="btn btn-line" data-act="fsTab" data-v="compass">◎ วัดด้วยเข็มทิศมือถือ</button>
${fsMeasure()}</section>`;
}
function fsDial(deg, size = 92) {
  const c = size / 2;
  return `<svg class="fs-dial" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${c - 3}"/>${FS_DIRS.map((d) => { const a = FS_DIR_DEG[d] * Math.PI / 180; return `<text x="${c + (c - 12) * Math.sin(a)}" y="${c - (c - 12) * Math.cos(a) + 3}" text-anchor="middle">${d}</text>`; }).join('')}<g id="fs-dial-g" style="transform:rotate(${deg}deg);transform-origin:50% 50%"><path d="M${c},${10} L${c + 6},${c} L${c},${c - 4} L${c - 6},${c}Z" class="fs-needle"/><circle cx="${c}" cy="${c}" r="3"/></g></svg>`;
}
function fsHouseHTML(fs, k) {
  const fc = fsChart(), ya = yearAfflictions(solarYear(new Date()));
  const sel = fs.cell || fc.facing.palace;
  const cell = (p) => {
    const w = fc.water[p], mo = fc.mount[p], rd = p === 'C' ? { tone: 0 } : sectorRead(w, mo, fc.period);
    const kd = k && p !== 'C' ? k.dirs.find((x) => x.dir === p) : null;
    return `<button class="fs-cell ${fsTone(rd.tone)}${p === sel ? ' on' : ''}${p === fc.facing.palace ? ' front' : ''}" data-act="fsCell" data-v="${p}">
<span class="fc-p">${FS_DIR_SHORT[p]}${p === fc.facing.palace ? ' · หน้า' : p === fc.sitting.palace ? ' · หลัง' : ''}</span>
<span class="fc-st"><i title="ดาวภูเขา">${mo}</i><b title="ดาวยุค">${fc.base[p]}</b><i title="ดาวน้ำ" class="w">${w}</i></span>
<span class="fc-y" title="ดาวจรปีนี้">ปี ${ya.chart[p]}</span>${kd ? `<span class="fc-k ${kd.good ? 'g' : 'b'}">${kd.th}</span>` : ''}</button>`;
  };
  const w = fc.water[sel], mo = fc.mount[sel];
  const rd = sel === 'C' ? null : sectorRead(w, mo, fc.period);
  const kd = k && sel !== 'C' ? k.dirs.find((x) => x.dir === sel) : null;
  const yStar = ya.chart[sel];
  return `${fsFacingPicker(fs)}
${fc.pattern ? `<section class="fs-pat ${fc.pattern.k}"><b>${fc.pattern.th}</b><span>${fc.pattern.d}</span></section>` : ''}
<section class="fs-chart"><div class="fs-chart-h"><b>ผังดาวเหิน ยุค ${fc.period}${fc.replace ? ' (คาบเส้น)' : ''} · นั่ง ${fc.sitting.cn} หัน ${fc.facing.cn}</b><span class="small">ทิศเหนืออยู่ด้านบน · <i class="lg-m">ภูเขา</i> <i class="lg-b">ยุค</i> <i class="lg-w">น้ำ</i></span></div>
<div class="fs-grid">${FS_GRID.map(cell).join('')}</div></section>
<section class="card fs-detail"><span class="eyebrow">${FS_DIR_TH[sel]}</span>
${sel === 'C' ? '<p class="body" style="margin:0">กลางบ้านควรโล่ง สะอาด ไม่วางของหนักหรือห้องน้ำ</p>' : `
<div class="fs-stars"><div class="${fsTone(STAR[mo].tone)}"><span class="small">ดาวภูเขา · คน สุขภาพ</span><b>${STAR[mo].th}</b><span>${STAR[mo].use}</span></div><div class="${fsTone(STAR[w].tone)}"><span class="small">ดาวน้ำ · เงินทอง</span><b>${STAR[w].th}</b><span>${STAR[w].use}</span></div></div>
<p class="small" style="margin:0">ดาวจรปี ${ya.sy}: <b>${STAR[yStar].th}</b> (${STAR[yStar].use})${yStar === 5 || yStar === 2 ? ' · ปีนี้ควรแก้เป็นพิเศษ' : ''}</p>
${kd ? `<p class="small" style="margin:0">สำหรับคุณ (เลขกัว ${k.kua}): ทิศนี้คือ <b class="${kd.good ? 'tpos' : 'tneg'}">${kd.th}</b> · ${kd.use}</p>` : ''}
${(() => { const cb = comboOf(mo, w); return cb ? `<p class="small fs-combo ${fsTone(cb.tone)}" style="margin:0">คู่ดาว ${mo}-${w}: ${cb.th}</p>` : ''; })()}
${rd.tips.filter((t) => /^ดาว(น้ำ|ภูเขา)ดี/.test(t)).map((t) => `<p class="small" style="margin:.3rem 0 0">📍 ${t}</p>`).join('')}
${(() => { const hw = fsPalaceHow(w, mo, fc.period, yStar); return fsHowHTML(hw.fix, hw.boost); })()}`}</section>`;
}
function fsYearHTML() {
  const now = new Date(), sy = solarYear(now), ya = yearAfflictions(sy), nx = yearAfflictions(sy + 1);
  const row = (lab, dir, txt, fix) => `<div class="fs-row neg"><span class="fs-dir">${FS_DIR_SHORT[dir]}<i>${dir}</i></span><span class="fs-row-t"><b>${lab}</b><span>${txt}</span>${Array.isArray(fix) ? fsHowHTML(fix, []) : `<span class="small">${fix}</span>`}</span></div>`;
  return `<section class="card fs-yr"><span class="eyebrow">ปีจีน ${sy} · ปี${ya.animal} · ดาวกลาง ${ya.star}</span>
<div class="fs-grid sm">${FS_GRID.map((p) => `<div class="fs-cell ${fsTone(STAR[ya.chart[p]].tone)}"><span class="fc-p">${FS_DIR_SHORT[p]}</span><span class="fc-big">${ya.chart[p]}</span></div>`).join('')}</div>
<p class="small" style="margin:0">ปีจีนเปลี่ยนที่ลี่ชุน ราว 4 ก.พ. ของทุกปี</p></section>
<section class="fs-list"><h2 class="label">ทิศที่ต้องระวังปีนี้</h2>
${row('ดาวเหลือง 5 (五黄)', ya.five, 'ดาวเคราะห์ร้ายที่สุดของปี', guideOf(5).fix.slice(0, 3))}
${row('ดาวดำ 2 (二黑)', ya.two, 'โรคภัยไข้เจ็บ', guideOf(2).fix.slice(0, 3))}
${row('ไท่ส่วย (太歲)', ya.taisui, `เทพประจำปี${ya.animal}`, ['จัดโต๊ะทำงานให้นั่งหันหลังพิงทิศนี้ (เหมือนมีผู้ใหญ่หนุนหลัง) อย่านั่งหันหน้าเข้าหา','งดรีโนเวต เจาะผนัง หรือขุดดินฝั่งนี้ทั้งปี ถ้าจำเป็นให้เริ่มงานจากฝั่งอื่นก่อน','รักษาโซนนี้ให้สงบ ไม่ตั้งลำโพงหรือเครื่องออกกำลังกายที่สั่นแรง'])}
${row('ซุ่ยผั่ว (歲破)', ya.suipo, 'ทิศตรงข้ามไท่ส่วย', ['อย่าจัดโต๊ะหรือโซฟาให้นั่งหันหลังให้ทิศนี้','งดต่อเติมหรือเจาะผนังฝั่งนี้ทั้งปี','เก็บโซนนี้ให้โล่ง สะอาด ไม่วางของรกหรือของเสีย'])}
${row('ซาซัว (三煞)', ya.sansha, 'สามพิฆาต', ['จัดที่นั่งให้หันหน้าเข้าหาทิศนี้ได้ แต่อย่าหันหลังให้','งดต่อเติม ขุด หรือรื้อฝั่งนี้ทั้งปี','ติดผ้าม่านทึบหรือมู่ลี่ที่หน้าต่างฝั่งนี้ ช่วยลดพลังรบกวน'])}
<p class="small">ปีหน้า (${sy + 1} ปี${nx.animal}): ดาว 5 ย้ายไป${FS_DIR_SHORT[nx.five]} ดาว 2 ไป${FS_DIR_SHORT[nx.two]} ไท่ส่วยอยู่${FS_DIR_SHORT[nx.taisui]}</p></section>`;
}
// วิธีแก้ / วิธีเสริม แบบอ่านง่าย
function fsHowHTML(fix = [], boost = [], open = true) {
  if (!(fix && fix.length) && !(boost && boost.length)) return '';
  return `<div class="fs-how">${fix && fix.length ? `<div class="fs-how-b fix"><b>🛠 วิธีแก้</b><ul>${fix.map((t) => `<li>${t}</li>`).join('')}</ul></div>` : ''}${boost && boost.length ? `<div class="fs-how-b boost"><b>✨ วิธีเสริม</b><ul>${boost.map((t) => `<li>${t}</li>`).join('')}</ul></div>` : ''}</div>`;
}
// Fix / boost for one palace: bad stars → fix, good stars → boost, plus this year's 5 or 2.
function fsPalaceHow(w, m, period, yStar) {
  const fix = [], boost = [], add = (arr, xs) => { for (const x of xs || []) if (!arr.includes(x)) arr.push(x); };
  for (const n of [w, m]) { const g = starGood(n, period), gd = guideOf(n); if (g < 0) add(fix, gd.fix); else add(boost, gd.boost); }
  if (yStar === 5 || yStar === 2) add(fix, guideOf(yStar).fix.slice(0, 2));
  return { fix: fix.slice(0, 5), boost: boost.slice(0, 4) };
}
function fsMeasure() {
  const pt = fsPt();
  return `<details class="fs-guide"><summary>📐 วิธีวัด${pt.face}ให้แม่น (${pt.th})</summary><ol>
<li><b>${pt.measure[0]}</b></li>
<li>${pt.measure[1]}</li>
<li><b>ถือมือถือให้ราบ ระดับเอว</b> หน้าจอขนานกับพื้น ขอบบนชี้ออกไปข้างหน้า แล้วรอให้ตัวเลขนิ่ง</li>
<li><b>วัด 3 จุดแล้วเฉลี่ย</b> ตรงกลางและสองมุมด้านหน้า ถ้าต่างกันเกิน 15° ให้ถอยห่างจากโลหะแล้ววัดใหม่</li>
<li><b>อยู่ห่างโลหะ</b> รถยนต์ ประตูรั้วเหล็ก ตู้ไฟ ลำโพง ถอดนาฬิกาและเครื่องประดับโลหะ ก่อนวัดให้หมุนมือถือเป็นรูปเลข 8 สัก 2–3 รอบเพื่อปรับเข็มทิศ</li>
${pt.id === 'land' ? '<li><b>ยุคของที่ดิน</b> นับจากปีที่สร้างบ้านเสร็จและเข้าอยู่ ถ้าจะสร้างช่วงนี้ให้เลือกยุค 9 แล้วใช้แท็บผังห้องวางแผนว่าจะวางประตู ห้องนอน และครัวตรงไหน</li>' : `<li><b>กลาง${pt.place}ใช้แบ่งผัง ไม่ใช่ใช้วัด${pt.face}</b> หาจุดกึ่งกลางของแปลน แล้วยืนตรงนั้นดูว่าแต่ละห้องอยู่ทิศไหน เพื่อนำไปใส่ในแท็บผังห้อง</li>`}</ol></details>`;
}
function fsTapeHTML(h, k) {
  const ppd = 5; let ticks = '';
  for (let a = 0; a < 720; a += 15) {
    const d = a % 360, m = mountainOf(d + 0.01), main = d % 45 === 0;
    const dir = FS_DIRS[Math.round(d / 45) % 8], kd = k && main ? k.dirs.find((x) => x.dir === dir) : null;
    ticks += `<span class="tp${main ? ' main' : ''}${kd ? (kd.good ? ' good' : ' bad') : ''}" style="left:${a * ppd}px">${main ? `<b>${FS_DIR_SHORT[dir]}</b>` : ''}<i>${m.cn}</i></span>`;
  }
  return `<div class="fs-tape"><div class="fs-tape-in" id="fs-tape" style="transform:translateX(${-((h || 0) + 360) * ppd}px)">${ticks}</div><span class="fs-tape-mark" aria-hidden="true"></span></div>`;
}
function fsCamRead(h, k) {
  if (h == null) return '<span>ถือมือถือตั้งตรง แล้วส่องกล้องไปทางที่อยากรู้ทิศ</span>';
  const m = mountainOf(h), kd = k ? k.dirs.find((x) => x.dir === m.palace) : null;
  return `<b>${Math.round(h)}°</b><span>กล้องหันไปทาง${FS_DIR_TH[m.palace]} · ${m.cn} ${m.th}</span>${kd ? `<span class="${kd.good ? 'tpos' : 'tneg'}">สำหรับคุณ: ${kd.th} · ${kd.use}</span>` : ''}`;
}
function fsCompassHTML(fs, k) {
  const h = fs.heading;
  const m = h != null ? mountainOf(h) : null;
  return `${fsMeasure()}<section class="fs-cmp${fs.cam ? ' cam' : ''}"><video id="fs-video" playsinline muted autoplay${fs.cam ? '' : ' hidden'}></video>
${fs.cam ? `<div class="fs-ar">${fsTapeHTML(h, k)}<div class="fs-ar-cross" aria-hidden="true"></div><div class="fs-read" id="fs-read">${fsCamRead(h, k)}</div></div>` : `<div class="fs-cmp-in"><div class="fs-lp" id="fs-lp">${luopanSVG(k, h || 0)}</div><div class="fs-tick" aria-hidden="true"></div>
<div class="fs-read" id="fs-read">${h != null ? `<b>${Math.round(h)}°</b><span>${FS_DIR_SHORT[m.palace]} · ${m.cn} ${m.th}</span>` : '<span>แตะ "เริ่มเข็มทิศ" แล้วถือมือถือให้ราบ</span>'}</div></div>`}</section>
<div class="fs-cmp-btns">${fs.sensor ? '' : '<button class="btn" data-act="fsSensor">◎ เริ่มเข็มทิศ</button>'}<button class="btn btn-line" data-act="fsCam">${fs.cam ? 'ปิดกล้อง' : '📷 เปิดกล้อง (AR)'}</button></div>
${h != null ? '<button class="btn" data-act="fsUseHeading">ใช้ทิศนี้เป็นทิศหน้าบ้าน</button>' : ''}
<p class="small" style="margin:0">${fs.cam ? 'โหมดกล้อง: ถือมือถือตั้งตรงแล้วส่องไปรอบตัว แถบด้านบนบอกทิศที่กล้องมอง ใช้ส่องหาว่าประตู หน้าต่าง หรือห้องอยู่ทิศไหน (วัดทิศหน้าบ้านให้แม่นที่สุด ให้ปิดกล้องแล้วถือมือถือราบ)' : 'เข็มทิศมือถือคลาดเคลื่อนได้ 5–15° ถ้าเครื่องไม่มีเข็มทิศ ให้เลื่อนตั้งองศาในแท็บดาวบ้านเอง'}</p>`;
}
// Luo pan: ring of 8 directions coloured by Kua + ring of 24 mountains, rotated so the top points where the phone faces.
function luopanSVG(k, rot) {
  const S = 300, c = S / 2, R1 = 146, R2 = 116, R3 = 84;
  const pt = (a, r) => [c + r * Math.sin(a * Math.PI / 180), c - r * Math.cos(a * Math.PI / 180)];
  const arc = (a0, a1, ro, ri) => { const [x0, y0] = pt(a0, ro), [x1, y1] = pt(a1, ro), [x2, y2] = pt(a1, ri), [x3, y3] = pt(a0, ri); return `M${x0},${y0} A${ro},${ro} 0 0 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 0 0 ${x3},${y3}Z`; };
  let g = '';
  for (let i = 0; i < 24; i++) { const a0 = 337.5 + i * 15, mid = a0 + 7.5; const [tx, ty] = pt(mid, (R1 + R2) / 2); g += `<path d="${arc(a0, a0 + 15, R1, R2)}" class="lp-m"/><text x="${tx}" y="${ty + 5}" text-anchor="middle" class="lp-mt" transform="rotate(${mid} ${tx} ${ty})">${mountainOf(mid).cn}</text>`; }
  for (const d of FS_DIRS) {
    const kd = k ? k.dirs.find((x) => x.dir === d) : null, a = FS_DIR_DEG[d]; const [tx, ty] = pt(a, (R2 + R3) / 2);
    g += `<path d="${arc(a - 22.5, a + 22.5, R2, R3)}" class="lp-d ${kd ? (kd.good ? 'good' : 'bad') : ''}"/><text x="${tx}" y="${ty + 4}" text-anchor="middle" class="lp-dt" transform="rotate(${a} ${tx} ${ty})">${FS_DIR_SHORT[d]}</text>`;
  }
  return `<svg viewBox="0 0 ${S} ${S}" width="100%" style="max-width:300px;transform:rotate(${-rot}deg)" id="fs-lp-svg" aria-label="ลั่วแก"><circle cx="${c}" cy="${c}" r="${R1}" class="lp-bg"/>${g}<circle cx="${c}" cy="${c}" r="${R3}" class="lp-in"/><text x="${c}" y="${c - 50}" text-anchor="middle" class="lp-n">N</text><text x="${c}" y="${c + 8}" text-anchor="middle" class="lp-taiji">☯</text></svg>`;
}
let fsStream = null, fsRaf = 0;
function fsStopCam() { if (fsStream) { fsStream.getTracks().forEach((t) => t.stop()); fsStream = null; } }
function fsOnOrient(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading; // iOS: already the direction the back camera faces when upright
  else if (e.absolute && typeof e.alpha === 'number') {
    const b = e.beta || 0;
    if (Math.abs(b) > 45 && Math.abs(b) < 135) {
      // Phone held upright: heading of the rear camera (device −Z axis) from alpha, beta, gamma.
      const r = Math.PI / 180, A = e.alpha * r, B = b * r, G = (e.gamma || 0) * r;
      const x = Math.cos(A) * Math.sin(G) + Math.sin(A) * Math.sin(B) * Math.cos(G);
      const y = Math.sin(A) * Math.sin(G) - Math.cos(A) * Math.sin(B) * Math.cos(G);
      h = (Math.atan2(-x, -y) * 180 / Math.PI + 360) % 360;
    } else h = (360 - e.alpha) % 360;
  }
  if (h == null) return;
  const so = (screen.orientation && screen.orientation.angle) || 0;
  state.fs.heading = (h + so + 360) % 360;
  if (fsRaf) return;
  fsRaf = requestAnimationFrame(() => {
    fsRaf = 0;
    const svg = document.getElementById('fs-lp-svg'), rd = document.getElementById('fs-read'), hd = state.fs.heading;
    if (svg) svg.style.transform = `rotate(${-hd}deg)`;
    const tp = document.getElementById('fs-tape');
    if (tp) tp.style.transform = `translateX(${-(hd + 360) * 5}px)`;
    const kk = state.fs.gender ? kuaOf(fsBirth(), state.fs.gender) : null;
    if (rd) { const m = mountainOf(hd); rd.innerHTML = state.fs.cam ? fsCamRead(hd, kk) : `<b>${Math.round(hd)}°</b><span>${FS_DIR_SHORT[m.palace]} · ${m.cn} ${m.th}</span>`; }
    if (!document.querySelector('[data-act="fsUseHeading"]') && route() === 'fengshui' && state.fs.tab === 'compass') render();
  });
}
async function fsStartSensor() {
  // Attach the listeners first: on Android they fire right away; on iOS they start once permission is granted.
  window.addEventListener('deviceorientationabsolute', fsOnOrient, true);
  window.addEventListener('deviceorientation', fsOnOrient, true);
  state.fs.sensor = true; render();
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      await DeviceOrientationEvent.requestPermission(); // the result varies by browser; we judge by whether readings arrive
    }
  } catch (e) { /* older browsers */ }
  setTimeout(() => { if (state.fs.heading == null) { state.fs.sensor = false; render(); toast('ยังไม่ได้รับค่าเข็มทิศ ตรวจสิทธิ์ "การเคลื่อนไหวและการวางแนว" ของเบราว์เซอร์ หรือเลื่อนตั้งองศาเอง'); } }, 3000);
}
async function fsToggleCam() {
  if (state.fs.cam) { fsStopCam(); state.fs.cam = false; render(); return; }
  if (!state.fs.sensor) fsStartSensor(); // ask compass permission inside the same tap (iOS needs a user gesture)
  try {
    fsStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    state.fs.cam = true; render();
  } catch (e) { toast('เปิดกล้องไม่ได้ ตรวจสิทธิ์กล้องของเบราว์เซอร์'); }
}
function mountFengshui() {
  if (route() !== 'fengshui' || state.fs.tab !== 'compass') { if (fsStream && route() !== 'fengshui') { fsStopCam(); state.fs.cam = false; } return; }
  const v = document.getElementById('fs-video');
  if (v && fsStream) { v.srcObject = fsStream; v.play && v.play().catch(() => {}); }
}
// ---- ฮวงจุ้ย: ส่วนต่อยอด (ครอบครัว ผังห้อง คะแนน ดาวเดือน แผนที่) ----
const fsChart = () => flyingStars(state.fs.facing, state.fs.period || 9, !!state.fs.repl);
function fsPeople() {
  const p = state.profile, out = [];
  if (state.fs.gender) out.push({ id: 'me', name: (p.name || 'ฉัน').split(' ')[0], gender: state.fs.gender, day: p.day, month: p.month, yearBE: p.yearBE, me: true });
  for (const m of state.fs.members || []) out.push(m);
  return out.map((x) => ({ ...x, k: kuaOf(new Date(x.yearBE - 543, x.month - 1, x.day, 12), x.gender) }));
}
function fsFamilyHTML() {
  const people = fsPeople(), f = state.fs.newMember || { name: '', gender: 'f', day: 1, month: 1, yearBE: 2540 };
  const saved = (state.match.people || []).filter((x) => !(state.fs.members || []).some((m) => m.name === x.name));
  const sel = (key, from, to, v, lab) => `<label class="field fs-nf">${lab}<select class="input" data-in="fsNew.${key}">${Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => `<option${n === +v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  return `${people.length ? `<section class="fs-list">${people.map((x) => `<div class="fs-mem"><span class="fs-mem-k">${x.k.kua}</span><span class="fs-row-t"><b>${esc(x.name)}${x.me ? ' (คุณ)' : ''}</b><span>${x.k.group === 'east' ? 'กลุ่มตะวันออก' : 'กลุ่มตะวันตก'} · ธาตุ${x.k.element}</span><span class="small">หันหัวนอนดีสุด: ${FS_DIR_SHORT[x.k.dirs[1].dir]} (สุขภาพ) หรือ ${FS_DIR_SHORT[x.k.dirs[2].dir]} (ความรัก) · โต๊ะทำงาน: ${FS_DIR_SHORT[x.k.dirs[0].dir]}</span></span>${x.me ? '' : `<button class="th-del" data-act="fsMemDel" data-v="${esc(x.name)}" aria-label="ลบ">✕</button>`}</div>`).join('')}</section>` : '<section class="card"><p class="body" style="margin:0">เลือกเพศของคุณด้านบนก่อน แล้วเพิ่มคนในบ้านได้</p></section>'}
${people.length > 1 ? `<section class="card fs-match"><span class="eyebrow">ทิศที่ดีร่วมกันของทุกคน</span><p class="body" style="margin:0">${(() => { const common = FS_DIRS.filter((d) => people.every((x) => x.k.dirs.find((y) => y.dir === d).good)); return common.length ? `ทิศ ${common.map((d) => FS_DIR_SHORT[d]).join(' ')} ดีกับทุกคน เหมาะเป็นห้องนั่งเล่น โต๊ะกินข้าว หรือมุมรวมครอบครัว` : 'คนในบ้านอยู่ต่างกลุ่มกัน (ตะวันออก/ตะวันตก) จึงไม่มีทิศที่ดีกับทุกคน ให้แต่ละคนใช้ทิศมงคลของตัวเองตอนจัดเตียงและโต๊ะ'; })()}</p></section>` : ''}
<section class="card fs-add"><span class="eyebrow">เพิ่มคนในบ้าน</span>
${saved.length ? `<div class="fs-quick">${saved.map((x, i) => `<button class="chip small-chip" data-act="fsMemPick" data-i="${i}">${esc(x.name)}</button>`).join('')}</div><p class="small" style="margin:0">แตะชื่อจากห้องคู่ดวงเพื่อใส่วันเกิดให้อัตโนมัติ</p>` : ''}
<label class="field">ชื่อ<input class="input" data-in="fsNew.name" value="${esc(f.name)}" maxlength="20" placeholder="เช่น แม่ แฟน น้องต้น"></label>
<div class="fs-nrow">${sel('day', 1, 31, f.day, 'วัน')}${sel('month', 1, 12, f.month, 'เดือน')}${sel('yearBE', 2450, 2575, f.yearBE, 'ปี พ.ศ.')}</div>
<div class="seg" role="group" aria-label="เพศ">${[['m', 'ชาย'], ['f', 'หญิง']].map(([v, t]) => `<button aria-pressed="${f.gender === v}" data-act="fsNewGender" data-v="${v}">${t}</button>`).join('')}</div>
<button class="btn" data-act="fsMemAdd">เพิ่ม</button><p class="small" style="margin:0">🔒 เก็บไว้ในเครื่องนี้เท่านั้น</p></section>`;
}
function fsRoomsHTML() {
  const fs = state.fs, fc = fsChart(), rooms = fs.rooms || {}, people = fsPeople(), pick = fs.roomPick;
  const ya = yearAfflictions(solarYear(new Date()));
  const evals = [];
  const cellHTML = (p) => {
    const list = rooms[p] || [];
    return `<button class="fs-cell fs-room${p === pick ? ' on' : ''}" data-act="fsRoomPick" data-v="${p}"><span class="fc-p">${FS_DIR_SHORT[p]}${p === fc.facing.palace ? ' · หน้า' : ''}</span>
<span class="fc-st"><i>${fc.mount[p]}</i><b>${fc.base[p]}</b><i class="w">${fc.water[p]}</i></span>
<span class="fr-list">${list.length ? list.map((r) => `<em>${ROOM_TYPES.find((t) => t.id === r.type).th}${r.who ? '·' + esc(r.who) : ''}</em>`).join('') : '<em class="emp">+ ใส่ห้อง</em>'}</span></button>`;
  };
  for (const p of FS_GRID) for (const r of rooms[p] || []) {
    if (p === 'C') { evals.push({ p, r, tone: r.type === 'toilet' || r.type === 'kitchen' ? -1 : 0, th: `${ROOM_TYPES.find((t) => t.id === r.type).th}กลางบ้าน${r.type === 'toilet' || r.type === 'kitchen' ? ' ตามตำราไม่ควรมีห้องน้ำหรือครัวกลางบ้าน' : ''}` }); continue; }
    const rd = roomRead(r.type, fc.water[p], fc.mount[p], fc.period);
    const out = { p, r, tone: rd.tone, th: rd.th, fix: rd.fix, boost: rd.boost };
    const who = r.who && people.find((x) => x.name === r.who);
    if (who) { const kd = who.k.dirs.find((x) => x.dir === p); out.kua = `${esc(who.name)}: ห้องนี้อยู่ทิศ${kd.th} (${kd.use})`; out.kuaTone = kd.good ? 1 : -1; }
    if ((r.type === 'door' || r.type === 'bed') && (ya.chart[p] === 5 || ya.chart[p] === 2)) out.year = `ปีนี้ดาวจร ${ya.chart[p]} เข้าโซนนี้ ควรแก้ด้วยโลหะ`;
    evals.push(out);
  }
  const picker = pick ? `<section class="card fs-pick"><span class="eyebrow">โซน${FS_DIR_TH[pick]} มีห้องอะไรบ้าง</span>
<div class="fs-quick">${ROOM_TYPES.map((t) => { const on = (rooms[pick] || []).some((r) => r.type === t.id); return `<button class="chip small-chip" data-act="fsRoomToggle" data-v="${t.id}" aria-pressed="${on}">${t.th}</button>`; }).join('')}</div>
${(rooms[pick] || []).filter((r) => ROOM_TYPES.find((t) => t.id === r.type).person).map((r) => `<label class="field">ใครใช้${ROOM_TYPES.find((t) => t.id === r.type).th}นี้<select class="input" data-in="fsWho" data-room="${r.type}"><option value="">ไม่ระบุ</option>${people.map((x) => `<option${r.who === x.name ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>`).join('')}
<button class="link-btn" data-act="fsRoomPick" data-v="">เสร็จ</button></section>` : '';
  return `<p class="small" style="margin:0">${fs.ptype === 'land' ? 'ที่ดินยังไม่มีบ้าน: ใช้ผัง 9 ช่องนี้วางแผนว่าจะวางประตู ห้องนอน ครัว ไว้ตรงไหน (ทิศเหนืออยู่ด้านบน) แตะช่องเพื่อลองใส่ห้อง' : `แบ่งผัง${fsPt().place}เป็น 9 ช่องตามทิศจริง (ทิศเหนืออยู่ด้านบน) แตะช่องแล้วเลือกห้องที่อยู่ในโซนนั้น`}</p>
${fsPlanHTML(fc, fs.ptype === 'land' || !Object.values(rooms).some((l) => l.length))}
<div class="fs-grid">${FS_GRID.map(cellHTML).join('')}</div>${picker}
${evals.length ? `<section class="fs-list"><h2 class="label">ผลการจัดห้อง</h2>${evals.map((e) => `<div class="fs-row ${fsTone(e.tone)}"><span class="fs-dir">${FS_DIR_SHORT[e.p]}<i>${e.p}</i></span><span class="fs-row-t"><b>${ROOM_TYPES.find((t) => t.id === e.r.type).th}</b><span>${e.th}</span>${e.kua ? `<span class="small ${e.kuaTone > 0 ? 'tpos' : 'tneg'}">${e.kua}</span>` : ''}${e.year ? `<span class="small tneg">${e.year}</span>` : ''}${fsHowHTML(e.fix, e.tone >= 0 ? (e.boost || []).slice(0, 2) : [])}</span></div>`).join('')}</section>` : ''}`;
}
// คะแนนบ้านรวม 0–100 พร้อมจุดแข็งและจุดที่ควรแก้
function fsScore() {
  const fs = state.fs, fc = fsChart(), rooms = fs.rooms || {}, people = fsPeople(), ya = yearAfflictions(solarYear(new Date()));
  let sc = 52; const plus = [], minus = [];
  const add = (v, txt, how) => { sc += v; (v > 0 ? plus : minus).push({ v, txt, how }); };
  if (fc.pattern && fc.pattern.k === 'best') add(10, 'ผังภูเขาดี น้ำดี เป็นผังที่ดีที่สุดของยุค');
  if (fc.pattern && fc.pattern.k === 'worst') add(-10, 'ผังภูเขาตกน้ำ ควรวางของสูงหน้าบ้านและน้ำหลังบ้านเพื่อแก้');
  const fw = starTone(fc.water[fc.facing.palace], fc.period), sm = starTone(fc.mount[fc.sitting.palace], fc.period);
  if (fw) { const n = fc.water[fc.facing.palace], gd = guideOf(n); add(fw * 5, `หน้าบ้านได้ดาวน้ำ ${n} (${STAR[n].use})`, fw > 0 ? (gd.boost || [])[0] : (gd.fix || [])[0]); }
  if (sm) { const n = fc.mount[fc.sitting.palace], gd = guideOf(n); add(sm * 4, `หลังบ้านได้ดาวภูเขา ${n} (${STAR[n].use})`, sm > 0 ? 'วางของสูงมั่นคง เช่น ตู้ใหญ่หรือชั้นหนังสือ ชิดผนังหลังบ้าน' : (gd.fix || [])[0]); }
  const me = people[0];
  if (me) { const kd = me.k.dirs.find((x) => x.dir === fc.sitting.palace); add(kd.good ? 6 : -6, kd.good ? `บ้านนั่ง${FS_DIR_SHORT[fc.sitting.palace]} ตรงกับกลุ่มเลขกัวของ${esc(me.name)}` : `บ้านนั่ง${FS_DIR_SHORT[fc.sitting.palace]} ไม่ตรงกลุ่มเลขกัวของ${esc(me.name)} ใช้ทิศมงคลจัดเตียงและโต๊ะช่วย`); }
  for (const p of FS_GRID) for (const r of rooms[p] || []) {
    if (p === 'C') continue;
    const rd = roomRead(r.type, fc.water[p], fc.mount[p], fc.period), w = r.type === 'door' ? 2 : 1;
    if (rd.tone) add(rd.tone * 3 * w, rd.th + ` (${FS_DIR_SHORT[p]})`, rd.tone > 0 ? (rd.boost || [])[0] : (rd.fix || [])[0]);
    if ((r.type === 'door' || r.type === 'bed') && (ya.chart[p] === 5 || ya.chart[p] === 2)) add(-3, `ปีนี้ดาว ${ya.chart[p]} เข้า${ROOM_TYPES.find((t) => t.id === r.type).th} (${FS_DIR_SHORT[p]})`, guideOf(ya.chart[p]).fix[1]);
  }
  const chk = (fs.chk || {})[fsPt().id] || {};
  for (const c of fsPt().checks) if (chk[c.id]) add(c.w, c.q, c.how);
  plus.sort((a, b) => b.v - a.v); minus.sort((a, b) => a.v - b.v);
  return { score: Math.max(5, Math.min(98, Math.round(sc))), plus: plus.slice(0, 5), minus: minus.slice(0, 6), chkN: Object.values(chk).filter(Boolean).length, roomsDone: Object.values(rooms).some((l) => l.length) };
}
function fsCheckHTML() {
  const pt = fsPt(), chk = (state.fs.chk || {})[pt.id] || {};
  return `<section class="card fs-chk"><span class="eyebrow">เช็กลิสต์${pt.th} ${pt.ic}</span><p class="small" style="margin:0">ติ๊กข้อที่ตรงกับ${pt.place}ของคุณ คะแนนจะปรับตาม และบอกวิธีแก้หรือวิธีเสริมให้</p>
<div class="fs-chk-list">${pt.checks.map((c) => `<button class="fs-chk-i ${c.w > 0 ? 'good' : 'bad'}" data-act="fsChk" data-v="${c.id}" aria-pressed="${!!chk[c.id]}"><span class="box">${chk[c.id] ? '✓' : ''}</span><span class="t"><span>${c.w > 0 ? '👍 ' : ''}${c.q}</span>${chk[c.id] ? `<span class="small fs-how-1">${c.w > 0 ? '✨ เสริม' : '🛠 แก้'}: ${c.how}</span>` : ''}</span></button>`).join('')}</div></section>`;
}
// Suggested placement from the flying-star chart: the plan for an empty plot, or a check for an existing home.
function fsPlanHTML(fc, open) {
  const P = FS_GRID.filter((p) => p !== 'C'), pts = (f) => P.map((p) => [p, f(p)]).sort((a, b) => b[1] - a[1]);
  const fi = FS_DIRS.indexOf(fc.facing.palace), front = [FS_DIRS[(fi + 7) % 8], fc.facing.palace, FS_DIRS[(fi + 1) % 8]];
  const wScore = (p) => starTone(fc.water[p], fc.period) * 2 + starTone(fc.mount[p], fc.period) * 0.5;
  const door = pts(wScore).filter(([p]) => front.includes(p)).slice(0, 1).map(([p]) => p);
  const living = pts(wScore).filter(([p]) => !door.includes(p)).slice(0, 1).map(([p]) => p);
  const bed = pts((p) => starTone(fc.mount[p], fc.period) * 2 + starTone(fc.water[p], fc.period) * 0.3).filter(([p]) => !door.includes(p) && !living.includes(p)).slice(0, 2).map(([p]) => p);
  const low = pts((p) => -(starTone(fc.water[p], fc.period) + starTone(fc.mount[p], fc.period))).filter(([p]) => !door.includes(p) && !living.includes(p) && !bed.includes(p)).slice(0, 2).map(([p]) => p);
  const L = (a) => a.map((p) => `<b>${FS_DIR_SHORT[p]}</b> (${fc.mount[p]}-${fc.water[p]})`).join(' หรือ ');
  return `<details class="fs-guide"${open ? ' open' : ''}><summary>🧭 แนะนำตำแหน่งห้องจากผังดาว</summary><ul class="fs-plan">
<li>🚪 <span><span>ประตูหลัก${state.fs.ptype === 'land' ? ' / ประตูรั้ว' : ''}: ${L(door)}</span><i>เลือกฝั่งหน้าที่ดาวน้ำดีที่สุด รับทรัพย์</i></span></li>
<li>🛋 <span><span>ห้องนั่งเล่น มุมรับแขก: ${L(living)}</span><i>โซนดาวน้ำดี คนใช้บ่อย พลังเคลื่อนไหว</i></span></li>
<li>🛏 <span><span>ห้องนอน ห้องทำงาน หิ้งพระ: ${L(bed)}</span><i>โซนดาวภูเขาดี สุขภาพ ความมั่นคง ผู้ใหญ่หนุน</i></span></li>
<li>🚽 <span><span>ห้องน้ำ ครัว ห้องเก็บของ: ${L(low)}</span><i>โซนดาวร้าย วางห้องที่ใช้กดพลังร้ายไว้</i></span></li></ul>
<p class="small" style="margin:.4rem 0 0">ตัวเลขในวงเล็บคือ ดาวภูเขา-ดาวน้ำ ของโซนนั้น · ก่อนสร้างจริงควรให้สถาปนิกดูเรื่องแดด ลม และกฎหมายอาคารร่วมด้วย</p></details>`;
}
function fsScoreHTML() {
  const r = fsScore(), fc = fsChart();
  const v = r.score >= 75 ? 'บ้านมงคล' : r.score >= 60 ? 'บ้านดี มีจุดเสริม' : r.score >= 45 ? 'บ้านกลาง ๆ ควรปรับ' : 'ควรปรับหลายจุด';
  return `<section class="card fs-score"><div class="fs-score-top">${oracleRing(r.score, 96)}<div><span class="eyebrow">คะแนนฮวงจุ้ย${fsPt().place} · ${fsPt().th}</span><b>${v}</b><span class="small">หัน ${fc.facing.cn} ${Math.round(state.fs.facing)}° · ยุค ${fc.period}${fc.replace ? ' · ผังคาบเส้น' : ''}</span></div></div>
${r.roomsDone || fsPt().id === 'land' ? '' : '<p class="small" style="margin:0">ใส่ผังห้องในแท็บผังห้องเพื่อให้คะแนนละเอียดขึ้น</p>'}</section>
${fsCheckHTML()}
<section class="fs-list"><h2 class="label">จุดแข็ง</h2>${r.plus.length ? r.plus.map((x) => `<div class="fs-row pos"><span class="fs-row-t" style="grid-column:1/-1"><span>${x.txt}</span>${x.how ? `<span class="small fs-how-1">✨ เสริม: ${x.how}</span>` : ''}</span></div>`).join('') : '<p class="small">ยังไม่มีจุดเด่น ลองใส่ผังห้องหรือตรวจทิศหน้าบ้าน</p>'}
<h2 class="label">ควรแก้ก่อน</h2>${r.minus.length ? r.minus.map((x) => `<div class="fs-row neg"><span class="fs-row-t" style="grid-column:1/-1"><span>${x.txt}</span>${x.how ? `<span class="small fs-how-1">🛠 แก้: ${x.how}</span>` : ''}</span></div>`).join('') : '<p class="small">ไม่มีจุดที่ต้องแก้เร่งด่วน</p>'}</section>
<button class="btn" data-act="fsShare">แชร์ผลฮวงจุ้ย${fsPt().place} ↗</button>`;
}
async function fsImage() {
  const r = fsScore(), fc = fsChart(), W = 1080, H = 1350;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2A1410'); g.addColorStop(.6, '#0F0C10'); g.addColorStop(1, '#1E170C'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const F = (w, s) => `${w} ${s}px "IBM Plex Sans Thai", "Taviraj", sans-serif`;
  x.textAlign = 'center'; x.fillStyle = '#E5675A'; x.font = F(500, 28); x.fillText(`ตักศิลา · ฮวงจุ้ย${fsPt().th}`, W / 2, 80);
  x.fillStyle = '#F6E3B0'; x.font = F(700, 120); x.fillText(String(r.score), W / 2, 230);
  x.fillStyle = '#B9AD94'; x.font = F(400, 30); x.fillText(`หน้าบ้าน ${Math.round(state.fs.facing)}° ${FS_DIR_SHORT[fc.facing.palace]} · ยุค ${fc.period}${fc.pattern ? ' · ' + fc.pattern.th.split(' (')[0] : ''}`, W / 2, 285);
  const cw = 230, gx = (W - cw * 3 - 24) / 2, gy = 330;
  FS_GRID.forEach((p, i) => {
    const cx = gx + (i % 3) * (cw + 12), cy = gy + Math.floor(i / 3) * (190 + 12);
    const t = p === 'C' ? 0 : sectorRead(fc.water[p], fc.mount[p], fc.period).tone;
    x.fillStyle = t > 0 ? 'rgba(111,195,178,.22)' : t < 0 ? 'rgba(229,103,90,.22)' : 'rgba(255,255,255,.05)'; x.fillRect(cx, cy, cw, 190);
    x.fillStyle = '#E9DFC8'; x.font = F(500, 26); x.fillText(FS_DIR_SHORT[p], cx + cw / 2, cy + 40);
    x.font = F(500, 60); x.fillStyle = '#F0D89A'; x.fillText(String(fc.mount[p]), cx + cw / 2 - 50, cy + 125);
    x.fillStyle = '#A9C6EE'; x.fillText(String(fc.water[p]), cx + cw / 2 + 50, cy + 125);
    x.fillStyle = '#8F836C'; x.font = F(400, 26); x.fillText(String(fc.base[p]), cx + cw / 2, cy + 120);
  });
  x.textAlign = 'left'; let y = 990;
  for (const [arr, col, mark] of [[r.plus, '#7FC4B4', '✓'], [r.minus, '#F0A08C', '!']]) for (const it of arr.slice(0, 2)) { x.fillStyle = col; x.font = F(500, 30); x.fillText(mark, 90, y); x.fillStyle = '#EDE3CC'; x.font = F(400, 28); x.textAlign = 'left'; y = wrapText(x, thaiChunks(it.txt), 130, y, 860, 38, 2) + 16; }
  x.textAlign = 'center'; x.fillStyle = '#8F836C'; x.font = F(400, 24); x.fillText('ดูฮวงจุ้ยบ้านคุณฟรีที่ตักศิลา · mengnattawitmarin.github.io/taksila', W / 2, H - 40);
  return new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); } });
}
function fsTimeHTML() {
  const now = new Date(), mi = monthInfo(now), fc = fsChart();
  const door = Object.keys(state.fs.rooms || {}).find((p) => (state.fs.rooms[p] || []).some((r) => r.type === 'door')) || fc.facing.palace;
  const m5 = FS_GRID.find((p) => mi.chart[p] === 5), m2 = FS_GRID.find((p) => mi.chart[p] === 2);
  return `${fsYearHTML()}
<section class="card fs-yr"><span class="eyebrow">เดือนจีน${mi.animal} · ดาวกลาง ${mi.star} · ถึง ${mi.change.getDate()} ${MONTHS_SHORT[mi.change.getMonth()]}</span>
<div class="fs-grid sm">${FS_GRID.map((p) => `<div class="fs-cell ${fsTone(STAR[mi.chart[p]].tone)}"><span class="fc-p">${FS_DIR_SHORT[p]}${p === door ? ' · ประตู' : ''}</span><span class="fc-big">${mi.chart[p]}</span></div>`).join('')}</div>
<p class="small" style="margin:0">เดือนนี้ดาว 5 อยู่${FS_DIR_SHORT[m5]} ดาว 2 อยู่${FS_DIR_SHORT[m2]}${m5 === door || m2 === door ? ' · <b class="tneg">ตรงประตูบ้านคุณ ควรวางโลหะที่ประตูช่วงนี้</b>' : ''} · เดือนจีนเปลี่ยนราววันที่ 4–8 ของทุกเดือน ตามปฏิทิน 24 สารทของจีน</p>
<details class="fs-guide"><summary>🛠 เดือนนี้แก้ตรงไหน ทำอย่างไร</summary><p class="small" style="margin:.4rem 0 0"><b>${FS_DIR_SHORT[m5]} (ดาว 5)</b></p>${fsHowHTML(guideOf(5).fix.slice(0, 3), [])}<p class="small" style="margin:.4rem 0 0"><b>${FS_DIR_SHORT[m2]} (ดาว 2)</b></p>${fsHowHTML(guideOf(2).fix.slice(0, 3), [])}${(() => { const g = FS_GRID.find((p) => mi.chart[p] === 8), n9 = FS_GRID.find((p) => mi.chart[p] === 9); return `<p class="small" style="margin:.4rem 0 0"><b>มุมเสริมเดือนนี้: ${FS_DIR_SHORT[n9]} (ดาว 9) · ${FS_DIR_SHORT[g]} (ดาว 8)</b></p>${fsHowHTML([], [...guideOf(9).boost.slice(0, 2), ...guideOf(8).boost.slice(0, 1)])}`; })()}</details></section>
<button class="btn btn-line" data-act="fsAusp">หาฤกษ์ขึ้นบ้านใหม่ ย้ายบ้าน ›</button>`;
}
// แผนที่: ปักหมุดบ้าน แล้ววาง 8 ทิศสีดีร้ายตามผังดาวรอบบ้าน
let fsMap = null, fsMapLayer = null;
function fsMapHTML() {
  return `<div class="mu-map-wrap"><div id="fs-map" class="mu-map" aria-label="ผังแปดทิศบนแผนที่"></div><button class="mu-near" data-act="fsMapMe">◎ ตำแหน่งฉัน</button></div>
<label class="field">รัศมีผัง ${state.fs.radius || 40} เมตร<input type="range" min="15" max="300" step="5" value="${state.fs.radius || 40}" data-in="fsRadius" class="fs-range"></label>
<p class="small" style="margin:0">แตะบนแผนที่เพื่อย้ายหมุดไปที่กลางบ้าน แต่ละทิศระบายสีตามผังดาวเหินของบ้าน (เขียว = ดี แดง = ระวัง) ใช้ดูสิ่งรอบบ้าน เช่น ถนนพุ่งเข้า แม่น้ำ ตึกสูง ว่าตกทิศไหน · แผนที่ © OpenStreetMap</p>`;
}
function fsMapDraw() {
  if (!fsMap) return;
  const L = window.L, fs = state.fs, fc = fsChart(), h = fs.home, R = fs.radius || 40;
  if (fsMapLayer) fsMapLayer.remove();
  fsMapLayer = L.layerGroup().addTo(fsMap);
  const dLat = R / 111320, dLon = R / (111320 * Math.cos(h.lat * Math.PI / 180));
  const at = (a, f) => [h.lat + dLat * f * Math.cos(a * Math.PI / 180), h.lon + dLon * f * Math.sin(a * Math.PI / 180)];
  for (const d of FS_DIRS) {
    const a0 = FS_DIR_DEG[d] - 22.5, pts = [[h.lat, h.lon]];
    for (let a = a0; a <= a0 + 45.01; a += 7.5) pts.push(at(a, 1));
    const t = sectorRead(fc.water[d], fc.mount[d], fc.period).tone;
    L.polygon(pts, { color: '#0D0B08', weight: 1, fillColor: t > 0 ? '#6FC3B2' : t < 0 ? '#E5675A' : '#D4AF63', fillOpacity: 0.38 }).addTo(fsMapLayer)
      .bindTooltip(`${FS_DIR_SHORT[d]} ${fc.mount[d]}-${fc.water[d]}${d === fc.facing.palace ? ' · หน้าบ้าน' : ''}`, { permanent: true, direction: 'center', className: 'fs-tt' });
  }
  L.circleMarker([h.lat, h.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#E5675A', fillOpacity: 1 }).addTo(fsMapLayer);
}
function mountFsMap() {
  const el = document.getElementById('fs-map');
  if (!el) { fsMap = null; return; }
  if (!state.fs.home) { const pl = state.profile.place || {}; state.fs.home = { lat: pl.lat || 13.7563, lon: pl.lon || 100.5018 }; }
  ensureLeaflet(() => {
    if (!document.body.contains(el)) return;
    if (leafletState !== 'ready') { el.classList.add('fail'); el.innerHTML = '<p>แผนที่โหลดไม่ได้ตอนนี้ (ต้องต่ออินเทอร์เน็ต)</p>'; return; }
    if (fsMap) { try { fsMap.remove(); } catch (e) {} }
    const L = window.L, h = state.fs.home;
    fsMap = L.map(el, { zoomControl: false }).setView([h.lat, h.lon], 18);
    L.control.zoom({ position: 'bottomright' }).addTo(fsMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(fsMap);
    fsMap.on('click', (e) => { state.fs.home = { lat: e.latlng.lat, lon: e.latlng.lng }; fsSave(); fsMapDraw(); });
    fsMapDraw();
  });
}
// เตือนบนหน้าแรกเมื่อมีเรื่องฮวงจุ้ยที่ควรรู้
function fsAlert() {
  if (!state.fs.gender && !(state.fs.rooms && Object.keys(state.fs.rooms).length)) return null;
  const now = new Date(), mi = monthInfo(now), fc = fsChart();
  const door = Object.keys(state.fs.rooms || {}).find((p) => (state.fs.rooms[p] || []).some((r) => r.type === 'door')) || fc.facing.palace;
  const days = Math.round((mi.change - now) / 86400000);
  if (mi.chart[door] === 5 || mi.chart[door] === 2) return { tone: -1, text: `ฮวงจุ้ยเดือนนี้: ดาว ${mi.chart[door]} มาอยู่ที่ประตูบ้านคุณ (${FS_DIR_SHORT[door]}) วางของโลหะ เช่น กระดิ่งลมหรือน้ำเต้าทองเหลืองไว้ใกล้ประตู`, link: { href: '#/fengshui', label: 'ดูฮวงจุ้ย' } };
  if (days >= 0 && days <= 2) return { tone: 0, text: `ฮวงจุ้ย: ดาวจรเดือนใหม่เริ่ม ${mi.change.getDate()} ${MONTHS_SHORT[mi.change.getMonth()]} ลองดูว่าโซนไหนในบ้านต้องระวัง`, link: { href: '#/fengshui', label: 'ดูฮวงจุ้ย' } };
  return null;
}

function viewFengshui() {
  const fs = state.fs;
  const k = fs.gender ? kuaOf(fsBirth(), fs.gender) : null;
  const genderSeg = `<div class="seg" role="group" aria-label="เพศ">${[['m', 'ชาย'], ['f', 'หญิง']].map(([v, t]) => `<button aria-pressed="${fs.gender === v}" data-act="fsGender" data-v="${v}">${t}</button>`).join('')}</div>`;
  let body = '';
  if (fs.tab === 'kua') body = k ? fsKuaHTML(k) : `<section class="card"><p class="body" style="margin:0">เลขกัวคำนวณจากปีเกิดและเพศ เลือกเพศด้านบนเพื่อดูทิศมงคลของคุณ</p></section>`;
  else if (fs.tab === 'house') body = fsHouseHTML(fs, k);
  else if (fs.tab === 'family') body = fsFamilyHTML();
  else if (fs.tab === 'rooms') body = fsRoomsHTML();
  else if (fs.tab === 'score') body = fsScoreHTML();
  else if (fs.tab === 'time' || fs.tab === 'year') body = fsTimeHTML();
  else if (fs.tab === 'map') body = fsMapHTML();
  else body = fsCompassHTML(fs, k);
  return `<main class="screen" style="--accent:#E5675A">
${pageHead('14', 'FENG SHUI', 'ฮวงจุ้ย', '#E5675A', 'fengshui')}
<div class="fs-gender"><span class="small">เพศ (ใช้คำนวณเลขกัว)</span>${genderSeg}</div>
<div class="fs-ptype"><span class="small">ประเภทสถานที่</span><div class="fs-pt-row hscroll">${FS_PTYPES.map((t) => `<button class="fs-pt" data-act="fsPtype" data-v="${t.id}" aria-pressed="${fsPt().id === t.id}"><i>${t.ic}</i>${t.th}</button>`).join('')}</div></div>
<div class="fs-tabs hscroll" role="tablist">${FS_TABS.map(([t, l]) => `<button class="chip" role="tab" aria-pressed="${fs.tab === t}" data-act="fsTab" data-v="${t}">${l}</button>`).join('')}</div>
${body}
<p class="small" style="font-size:11px">คำนวณตามสูตรปาจาย (八宅) และเสวียนคงเฟยซิง (玄空飛星) ยุค 9 (ปี 2024–2043) ผังดาวตรวจเทียบกับเครื่องคิดเลขฮวงจุ้ยสากลแล้ว ใช้เป็นแนวทางศึกษา หากจะสร้างหรือรีโนเวตบ้าน ควรปรึกษาซินแส</p>
</main>`;
}

// ---------------- โหงวเฮ้ง · ลายมือ (AR) ----------------
// MediaPipe โหลดจากโฟลเดอร์ vendor ของแอปเอง ประมวลผลในเครื่อง ไม่ส่งรูปออกไปไหน
const PH_KEY = 'taksila.physio';
const PH_WEB = 'https://mengnattawitmarin.github.io/taksila/#/face';
function phLoadSaved() { try { return JSON.parse(localStorage.getItem(PH_KEY)) || {}; } catch (e) { return {}; } }
function phSaveSaved(o) { try { localStorage.setItem(PH_KEY, JSON.stringify({ ...phLoadSaved(), ...o })); } catch (e) {} }
const PH_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const PH_HAND = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
const PH_NEED = 18; // จำนวนเฟรมท่าถูกต้องที่ใช้เฉลี่ยก่อนอ่านผล
let phVision = null, phFaceLm = null, phHandLm = null, phStream = null, phRaf = 0, phBuf = [], phLastT = 0;
let phSnap = null, phSnapLm = null, phSnapHair = null, phEnh = null, phT0 = 0, phForce = false, phHairSeg = null, phQ = { n: 0, msg: '' };

async function phEnsure(kind) {
  const base = new URL('vendor/mediapipe/', document.baseURI).href;
  if (!phVision) {
    const mod = await import(base + 'vision_bundle.mjs');
    phVision = { mod, fs: await mod.FilesetResolver.forVisionTasks(base + 'wasm') };
  }
  const { mod, fs } = phVision;
  const make = async (Cls, file, extra) => {
    for (const delegate of ['GPU', 'CPU']) {
      try { return await Cls.createFromOptions(fs, { baseOptions: { modelAssetPath: base + file, delegate }, runningMode: 'VIDEO', ...extra }); } catch (e) { if (delegate === 'CPU') throw e; }
    }
  };
  if (kind === 'face' && !phFaceLm) phFaceLm = await make(mod.FaceLandmarker, 'face_landmarker.task', { numFaces: 1, outputFaceBlendshapes: true });
  if (kind === 'face' && !phHairSeg) { try { phHairSeg = await make(mod.ImageSegmenter, 'hair_segmenter.tflite', { runningMode: 'IMAGE', outputConfidenceMasks: true, outputCategoryMask: false }); } catch (e) { phHairSeg = false; } }
  if (kind === 'palm' && !phHandLm) phHandLm = await make(mod.HandLandmarker, 'hand_landmarker.task', { numHands: 1 });
  return kind === 'face' ? phFaceLm : phHandLm;
}
function phStopCam() {
  cancelAnimationFrame(phRaf); phRaf = 0;
  if (phStream) { phStream.getTracks().forEach((t) => t.stop()); phStream = null; }
}
async function phStart() {
  const ph = state.ph, kind = ph.tab;
  phBuf = []; phForce = false; ph.status = 'loading'; ph.err = ''; render();
  try {
    const lmk = await phEnsure(kind);
    await lmk.setOptions({ runningMode: 'VIDEO' });
    ph.mirror = kind === 'face' ? true : ph.facing === 'user';
    phStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: kind === 'face' ? 'user' : (ph.facing || 'environment'), width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    ph.status = 'live'; phT0 = performance.now(); render();
  } catch (e) {
    phStopCam();
    ph.status = 'idle';
    ph.err = /vision_bundle|import|Failed to fetch|dynamically imported/i.test(String(e && e.message)) ? 'nomodel' : /Permission|NotAllowed/i.test(String(e && e.name) + e) ? 'perm' : 'cam';
    render();
  }
}
function phPhoto(file) {
  const ph = state.ph, kind = ph.tab;
  const img = new Image();
  img.onload = async () => {
    ph.status = 'loading'; render();
    try {
      const lmk = await phEnsure(kind);
      await lmk.setOptions({ runningMode: 'IMAGE' });
      const res = lmk.detect(img);
      const cv = document.createElement('canvas'), sc = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      ph.mirror = false;
      if (kind === 'face') {
        if (!res.faceLandmarks.length) throw new Error('noface');
        const lm = res.faceLandmarks[0], bs = phBs(res), hair = phHairline(cv, lm), m = faceMeasure(lm, cv.width, cv.height, hair);
        phFinish(cv, lm, m, facePoseOK(m, bs).issues, hair);
      } else {
        if (!res.landmarks.length) throw new Error('nohand');
        const lm = res.landmarks[0], h = handMeasure(res.worldLandmarks[0]);
        const side = phSideOf(res); if (side) ph.side = side;
        const pose = handPoseOK(lm, h, side || ph.side, false); ph.palmIn = pose.palmIn;
        phFinish(cv, lm, h, pose.issues);
      }
    } catch (e) {
      ph.status = 'idle';
      ph.err = e.message === 'noface' ? 'noface' : e.message === 'nohand' ? 'nohand' : /vision_bundle|import|fetch/i.test(String(e.message)) ? 'nomodel' : 'cam';
      render();
    }
  };
  img.src = URL.createObjectURL(file);
}
// มือซ้ายหรือขวา: ใช้ผลของโมเดล (ทดสอบกับภาพถ่ายฝ่ามือจริง ป้ายตรงกับมือจริงเมื่อป้อนภาพไม่กลับด้าน)
const phSideOf = (res) => (res.handedness && res.handedness[0] && res.handedness[0][0] ? (res.handedness[0][0].categoryName === 'Right' ? 'R' : 'L') : null);
const phBs = (res) => (res.faceBlendshapes && res.faceBlendshapes[0] ? Object.fromEntries(res.faceBlendshapes[0].categories.map((c) => [c.categoryName, c.score])) : null);
// ครอปภาพให้เหลือเฉพาะหน้าหรือมือ (เผื่อขอบไว้วางป้าย) แล้วแปลงพิกัดจุดตาม
function phCrop(cv, lm, padX, padY) {
  const xs = lm.map((p) => p.x * cv.width), ys = lm.map((p) => p.y * cv.height);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = x1 - x0, h = y1 - y0;
  x0 = Math.max(0, x0 - w * padX); x1 = Math.min(cv.width, x1 + w * padX); y0 = Math.max(0, y0 - h * padY); y1 = Math.min(cv.height, y1 + h * padY * 0.7);
  const W = Math.round(x1 - x0), H = Math.round(y1 - y0), sc = Math.min(2, 900 / Math.max(W, H));
  const out = document.createElement('canvas'); out.width = Math.round(W * sc); out.height = Math.round(H * sc);
  out.getContext('2d').drawImage(cv, x0, y0, W, H, 0, 0, out.width, out.height);
  return { cv: out, lm: lm.map((p) => ({ ...p, x: (p.x * cv.width - x0) / W, y: (p.y * cv.height - y0) / H })) };
}
function phFinish(cv, lm, meas, warn, hair) {
  const ph = state.ph, kind = ph.tab;
  const pts = hair ? [...lm, { x: hair.x, y: hair.y, z: 0 }] : lm;
  const cr = kind === 'face' ? phCrop(cv, pts, 0.55, 0.45) : phCrop(cv, pts, 0.3, 0.2);
  phSnap = cr.cv; phSnapLm = cr.lm.slice(0, lm.length); phSnapHair = hair ? cr.lm[lm.length] : null; phEnh = null;
  ph.status = 'result'; ph.warn = warn || [];
  if (kind === 'face') { ph.face = meas; phSaveSaved({ face: meas, faceAt: Date.now() }); }
  else { ph.hand = meas; phSaveSaved({ hand: meas, handAt: Date.now(), side: ph.side }); phMap = null; if (ph.palmIn !== false) phAutoPalm(); else ph.auto = null; ph.lines = {}; phSaveSaved({ lines: {} }); }
  render();
}
// ลูป AR: ตรวจทุก ~70 ms วาดจุดซ้อนบนวิดีโอ และเก็บค่าเมื่อท่าถูก
function phLoop() {
  const v = document.getElementById('ph-video'), c = document.getElementById('ph-ov'), ph = state.ph;
  if (!v || !c || ph.status !== 'live') { phRaf = 0; return; }
  phRaf = requestAnimationFrame(phLoop);
  const now = performance.now();
  if (v.readyState < 2 || now - phLastT < 70) return;
  phLastT = now;
  if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; const w = document.getElementById('ph-stage'); if (w) w.style.aspectRatio = `${v.videoWidth} / ${v.videoHeight}`; }
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  let hint = '', ok = false;
  if (ph.tab === 'face') {
    const res = phFaceLm.detectForVideo(v, now);
    if (res.faceLandmarks.length) {
      const lm = res.faceLandmarks[0], m = faceMeasure(lm, W, H), pose = facePoseOK(m, phBs(res)), qm = phQuality(v, lm, W, H);
      phDrawFace(ctx, lm, W, H, ph.mirror, pose.ok && !qm);
      ok = (pose.ok && !qm) || phForce; hint = ok ? 'นิ่งไว้ กำลังวัด…' : qm || pose.issues[0];
      if (ok) phBuf.push(m);
    } else hint = 'มองตรงเข้ากล้อง ให้เห็นทั้งหน้า';
  } else {
    const res = phHandLm.detectForVideo(v, now);
    if (res.landmarks.length) {
      const side = phSideOf(res) || ph.side, lm = res.landmarks[0], h = handMeasure(res.worldLandmarks[0]), pose = handPoseOK(lm, h, side, false), qm = phQuality(v, lm, W, H);
      if (pose.ok) { ph.side = side; ph.palmIn = true; }
      phDrawHand(ctx, lm, W, H, ph.mirror, pose.ok && !qm);
      ok = (pose.ok && !qm) || phForce; hint = ok ? 'นิ่งไว้ กำลังวัด…' : qm || pose.issues[0];
      if (ok) phBuf.push(h);
    } else hint = 'หงายฝ่ามือให้อยู่ในกรอบ กางนิ้วเล็กน้อย';
  }
  const hn = document.getElementById('ph-hint'), pr = document.getElementById('ph-prog');
  if (hn) { hn.textContent = hint; hn.className = 'ph-hint' + (ok ? ' ok' : ''); }
  if (pr) pr.style.width = `${Math.min(100, phBuf.length / PH_NEED * 100)}%`;
  const sk = document.getElementById('ph-skip');
  if (sk && sk.hidden && !phForce && now - phT0 > 9000) sk.hidden = false;
  if (phBuf.length >= PH_NEED) phCapture(v);
}
function phCapture(v) {
  const ph = state.ph, cv = document.createElement('canvas');
  cv.width = v.videoWidth; cv.height = v.videoHeight;
  const x = cv.getContext('2d');
  if (ph.mirror) { x.translate(cv.width, 0); x.scale(-1, 1); }
  x.drawImage(v, 0, 0);
  const lmk = ph.tab === 'face' ? phFaceLm : phHandLm, res = lmk.detectForVideo(v, performance.now() + 1);
  let lm = ph.tab === 'face' ? res.faceLandmarks[0] : res.landmarks[0];
  if (!lm) { phBuf = phBuf.slice(-6); return; }
  if (ph.mirror) lm = lm.map((p) => ({ ...p, x: 1 - p.x }));
  const avg = averageMeasures(phBuf.map((m) => { const o = {}; for (const k in m) if (typeof m[k] === 'number') o[k] = m[k]; return o; }));
  if (ph.tab === 'palm') avg.straight = true;
  let hair = null;
  if (ph.tab === 'face') { // สามส่วนของหน้าต้องใช้แนวไรผม: วัดจากภาพที่จับไว้
    hair = phHairline(cv, lm);
    const mh = faceMeasure(lm, cv.width, cv.height, hair);
    for (const k of ['up', 'md', 'lo', 'noseLR', 'hairOK']) avg[k] = mh[k];
  }
  phStopCam();
  const was = ph.mirror; ph.mirror = false;
  phFinish(cv, lm, avg, [], hair);
  ph.wasMirror = was;
}
// หาแนวไรผมจริง: ไล่จากจุดบนหน้าผาก (10) ขึ้นไปจนเจอพิกเซลเส้นผม เฉลี่ย 7 แนว
function phHairline(cv, lm) {
  if (!phHairSeg) return null;
  try {
    const r = phHairSeg.segment(cv), mk = r.confidenceMasks[r.confidenceMasks.length - 1], W = mk.width, H = mk.height, d = mk.getAsFloat32Array();
    const ys = [];
    for (let k = -3; k <= 3; k++) {
      const x = Math.max(0, Math.min(W - 1, Math.round((lm[10].x + k * 0.01) * W)));
      for (let y = Math.floor(lm[10].y * H) - 1; y >= 0; y--) if (d[y * W + x] > 0.5) { ys.push((y + 1) / H); break; }
    }
    r.confidenceMasks.forEach((m) => m.close && m.close());
    if (ys.length < 4) return null;
    ys.sort((a, b) => a - b);
    const y = ys[ys.length >> 1];
    return lm[10].y - y > 0.005 ? { x: lm[10].x, y } : null;
  } catch (e) { return null; }
}
// ตรวจคุณภาพภาพ: แสง ความคม ระยะ (คำนวณทุก ~8 รอบ)
const phQc = document.createElement('canvas');
function phQuality(v, lm, W, H, mir) {
  if (phQ.n++ % 8) return phQ.msg;
  const xs = lm.map((p) => p.x), ys = lm.map((p) => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const fw = x1 - x0;
  if (fw < 0.28) return (phQ.msg = state.ph.tab === 'face' ? 'ขยับหน้าเข้าใกล้กล้องอีกนิด' : 'ยื่นมือเข้าใกล้กล้องอีกนิด');
  if (state.ph.tab === 'face' && fw > 0.8) return (phQ.msg = 'ถอยออกจากกล้องอีกนิด');
  const S = 64; phQc.width = S; phQc.height = S;
  const c = phQc.getContext('2d', { willReadFrequently: true });
  c.drawImage(v, x0 * W, y0 * H, fw * W, (y1 - y0) * H, 0, 0, S, S);
  const d = c.getImageData(0, 0, S, S).data, g = new Float32Array(S * S);
  let mean = 0;
  for (let i = 0; i < S * S; i++) { g[i] = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11; mean += g[i]; }
  mean /= S * S;
  let lap = 0, lm2 = 0, n = 0;
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) { const i = y * S + x, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - S] - g[i + S]; lap += l; lm2 += l * l; n++; }
  const sharp = lm2 / n - (lap / n) ** 2;
  phQ.msg = mean < 65 ? 'แสงน้อยไป หันหน้าเข้าหาหน้าต่างหรือเปิดไฟ' : mean > 215 ? 'แสงจ้าเกินไป ถอยห่างจากแสงตรง' : sharp < 6 ? 'ภาพเบลอ ถือมือถือให้นิ่ง ๆ' : '';
  return phQ.msg;
}
// ---- วาดซ้อน ----
const phX = (p, W, mir) => (mir ? (1 - p.x) * W : p.x * W);
function phLabel(ctx, x, y, t, color = '#F0D89A', s = 1) {
  ctx.font = `600 ${Math.round(13 * s)}px "IBM Plex Sans Thai", sans-serif`;
  const w = ctx.measureText(t).width + 10 * s;
  ctx.fillStyle = 'rgba(13,11,8,.72)'; ctx.fillRect(x, y - 11 * s, w, 20 * s);
  ctx.fillStyle = color; ctx.fillText(t, x + 5 * s, y + 4 * s);
}
function phDrawFace(ctx, lm, W, H, mir, ok, full) {
  const s = full ? W / 400 : Math.max(1, W / 640), P = (i) => ({ x: phX(lm[i], W, mir), y: lm[i].y * H });
  ctx.lineWidth = 1.5 * s; ctx.strokeStyle = ok ? 'rgba(111,195,178,.85)' : 'rgba(240,216,154,.6)';
  ctx.beginPath(); PH_OVAL.forEach((i, k) => { const p = P(i); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.closePath(); ctx.stroke();
  // เส้นแบ่งสามส่วน
  const top = P(10), brow = { x: (P(70).x + P(300).x) / 2, y: (P(105).y + P(334).y) / 2 }, sub = P(2), chin = P(152);
  const hair = full && phSnapHair ? { x: phX(phSnapHair, W, mir), y: phSnapHair.y * H } : { x: top.x, y: top.y - (brow.y - top.y) * (PH_HAIRK - 1) };
  const xl = Math.min(P(234).x, P(454).x) - 10 * s, xr = Math.max(P(234).x, P(454).x) + 10 * s;
  ctx.setLineDash([6 * s, 5 * s]); ctx.strokeStyle = 'rgba(229,103,90,.85)';
  for (const y of [hair.y, brow.y, sub.y, chin.y]) { ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr, y); ctx.stroke(); }
  ctx.setLineDash([]);
  if (full) {
    [['บน', (hair.y + brow.y) / 2], ['กลาง', (brow.y + sub.y) / 2], ['ล่าง', (sub.y + chin.y) / 2]].forEach(([t, y]) => phLabel(ctx, xr + 4 * s, y, t, '#E5675A', s));
  }
  // จุดสำคัญ
  const zones = full ? ['fore', 'yintang', 'brow', 'eye', 'nose', 'phil', 'mouth', 'chin', 'temple'].map((k) => FACE_ZONES[k]) : [FACE_ZONES.yintang, FACE_ZONES.nose, FACE_ZONES.mouth, FACE_ZONES.chin, FACE_ZONES.fore];
  for (const z of zones) {
    const p = P(z.at);
    ctx.fillStyle = '#E5675A'; ctx.beginPath(); ctx.arc(p.x, p.y, 4 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2 * s; ctx.stroke();
    if (full) phLabel(ctx, p.x + 6 * s, p.y, z.th, '#F0D89A', s * 0.82);
  }
}
function phCurve(ctx, pts, W, H, mir) {
  const [a, c, b] = pts.map((p) => ({ x: phX(p, W, mir), y: p.y * H }));
  const cp = { x: 2 * c.x - (a.x + b.x) / 2, y: 2 * c.y - (a.y + b.y) / 2 };
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cp.x, cp.y, b.x, b.y); ctx.stroke();
  return b;
}
function phDrawHand(ctx, lm, W, H, mir, ok, full) {
  const s = full ? W / 400 : Math.max(1, W / 640), P = (i) => ({ x: phX(lm[i], W, mir), y: lm[i].y * H });
  ctx.lineWidth = 2 * s; ctx.strokeStyle = ok ? 'rgba(111,195,178,.8)' : 'rgba(240,216,154,.55)';
  for (const [a, b] of PH_HAND) { const p = P(a), q = P(b); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  ctx.fillStyle = '#fff'; lm.forEach((_, i) => { const p = P(i); ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 * s, 0, 7); ctx.fill(); });
  const g = palmGuides(lm);
  ctx.lineWidth = 3 * s; ctx.setLineDash(full ? [] : [8 * s, 6 * s]);
  for (const L of PALM_LINES) {
    if (full && state.ph.hide && state.ph.hide[L.id]) continue;
    const auto = full && state.ph.auto && state.ph.auto.paths[L.id];
    if (auto) { // เส้นที่ AI หาเจอ: ทึบตรงที่เห็นรอยจริง เส้นนำบาง ๆ ตรงที่ไม่เห็น
      ctx.lineWidth = 1.5 * s; ctx.setLineDash([4 * s, 5 * s]); ctx.strokeStyle = L.color + '66'; phCurve(ctx, g[L.id], W, H, mir); ctx.setLineDash([]);
      ctx.lineWidth = 3.5 * s; ctx.strokeStyle = L.color; ctx.lineCap = 'round';
      let end = null;
      auto.forEach((p, i) => { if (!p.on) return; const q = auto[i - 1]; const a = { x: phX(p, W, mir), y: p.y * H }; if (q && q.on) { ctx.beginPath(); ctx.moveTo(phX(q, W, mir), q.y * H); ctx.lineTo(a.x, a.y); ctx.stroke(); } end = a; });
      const tip = end || (() => { const e = g[L.id][2]; return { x: phX(e, W, mir), y: e.y * H }; })();
      phLabel(ctx, tip.x + 4 * s, tip.y, L.th.split(' ')[0], L.color, s * 0.9);
      continue;
    }
    ctx.strokeStyle = L.color + (full ? 'CC' : '99');
    const end = phCurve(ctx, g[L.id], W, H, mir);
    if (full) phLabel(ctx, end.x + 4 * s, end.y, L.th.split(' ')[0], L.color, s * 0.9);
  }
  ctx.setLineDash([]);
}
// เน้นรอยเส้นลายมือ: ภาพเทา − ภาพเบลอ (รอยพับเข้มกว่ารอบข้าง) แล้วระบายสีเฉพาะในฝ่ามือ
// แผนที่รอยพับ: ภาพเบลอกว้าง − ภาพเบลอแคบ (รอยเส้นเข้มกว่ารอบข้างจึงได้ค่าบวก) เฉพาะในฝ่ามือ
let phMap = null;
function phCreaseMap(src, lm) {
  const sc = Math.min(1, 720 / Math.max(src.width, src.height)), W = Math.round(src.width * sc), H = Math.round(src.height * sc);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data, g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
  const blur = (a, r) => { // box blur แยกแกน
    const t = new Float32Array(a.length), o = new Float32Array(a.length);
    for (let y = 0; y < H; y++) { let acc = 0; for (let k = -r; k <= r; k++) acc += a[y * W + Math.min(W - 1, Math.max(0, k))]; for (let xx = 0; xx < W; xx++) { t[y * W + xx] = acc / (2 * r + 1); acc += a[y * W + Math.min(W - 1, xx + r + 1)] - a[y * W + Math.max(0, xx - r)]; } }
    for (let xx = 0; xx < W; xx++) { let acc = 0; for (let k = -r; k <= r; k++) acc += t[Math.min(H - 1, Math.max(0, k)) * W + xx]; for (let y = 0; y < H; y++) { o[y * W + xx] = acc / (2 * r + 1); acc += t[Math.min(H - 1, y + r + 1) * W + xx] - t[Math.max(0, y - r) * W + xx]; } }
    return o;
  };
  const hw = Math.hypot((lm[5].x - lm[17].x) * W, (lm[5].y - lm[17].y) * H); // ความกว้างฝ่ามือเป็นพิกเซล
  const r = Math.max(3, Math.round(hw / 22)), b = blur(blur(g, r), r), fine = blur(g, Math.max(1, Math.round(hw / 160)));
  const mk = document.createElement('canvas'); mk.width = W; mk.height = H;
  const mx = mk.getContext('2d'); mx.fillStyle = '#fff'; mx.beginPath();
  [0, 1, 2, 5, 9, 13, 17].forEach((i, k) => { const p = { x: lm[i].x * W, y: lm[i].y * H }; k ? mx.lineTo(p.x, p.y) : mx.moveTo(p.x, p.y); });
  mx.closePath(); mx.fill();
  const md = mx.getImageData(0, 0, W, H).data, mask = new Uint8Array(W * H), resp = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { mask[i] = md[i * 4 + 3] > 0 ? 1 : 0; resp[i] = b[i] - fine[i]; }
  return { W, H, resp, mask };
}
function phEnhance(src, lm) {
  const m = phMap || (phMap = phCreaseMap(src, lm)), { W, H, resp, mask } = m;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'), id = x.createImageData(W, H), d = id.data;
  let mean = 0, n = 0;
  for (let i = 0; i < W * H; i++) if (mask[i] && resp[i] > 0) { mean += resp[i]; n++; }
  mean = n ? mean / n : 4;
  for (let i = 0; i < W * H; i++) {
    const a = mask[i] ? Math.max(0, Math.min(1, (resp[i] - mean * 1.2) / (mean * 2.5))) : 0;
    d[i * 4] = 255; d[i * 4 + 1] = 216; d[i * 4 + 2] = 120; d[i * 4 + 3] = Math.round(a * 230);
  }
  x.putImageData(id, 0, 0);
  return cv;
}
// ให้ AI หาเส้นจริงจากภาพ แล้วเลือกลักษณะให้ก่อน (ผู้ใช้แก้ได้)
function phAutoPalm() {
  try {
    phMap = phCreaseMap(phSnap, phSnapLm);
    const r = palmTrace(phMap.resp, phMap.mask, phMap.W, phMap.H, phSnapLm);
    if (window.__phDebug !== undefined) window.__phDebug = Object.fromEntries(Object.entries(r.lines).map(([k, L]) => [k, { cov: +L.cov.toFixed(2), gaps: L.gaps, str: +L.strength.toFixed(2), t0: L.first && +L.first.t.toFixed(2), t1: L.last && +L.last.t.toFixed(2) }]));
    state.ph.auto = { sug: r.sug, conf: r.conf, paths: Object.fromEntries(Object.entries(r.lines).map(([k, L]) => [k, L.path.map((p, i) => ({ x: p.x / phMap.W, y: p.y / phMap.H, on: L.on[i] }))])) };
  } catch (e) { state.ph.auto = null; }
}
function mountPhysio() {
  if (route() !== 'face') { if (phStream) phStopCam(); return; }
  const ph = state.ph;
  if (ph.status === 'live') {
    const v = document.getElementById('ph-video');
    if (v && phStream) { v.srcObject = phStream; v.play && v.play().catch(() => {}); if (!phRaf) phRaf = requestAnimationFrame(phLoop); }
  }
  const sn = document.getElementById('ph-snap');
  if (sn && phSnap && ph.status === 'result') {
    sn.width = phSnap.width; sn.height = phSnap.height;
    const x = sn.getContext('2d'); x.drawImage(phSnap, 0, 0);
    if (ph.tab === 'face') phDrawFace(x, phSnapLm, sn.width, sn.height, false, true, true);
    else {
      if (ph.enh) { if (!phEnh) phEnh = phEnhance(phSnap, phSnapLm); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, sn.width, sn.height); x.drawImage(phEnh, 0, 0, sn.width, sn.height); }
      phDrawHand(x, phSnapLm, sn.width, sn.height, false, true, true);
    }
  }
}
// ---- หน้าจอ ----
// วันเกิดของคนที่ส่อง: ใช้ข้อมูลในแอป หรือกรอกของคนอื่น
function phBirth() {
  const ph = state.ph, p = state.profile || {};
  if (ph.who === 'other' && ph.birth) return ph.birth;
  return p.yearBE ? { d: p.day || 1, m: p.month || 1, y: p.yearBE, name: (p.name || '').split(' ')[0] } : null;
}
function phBirthInfo() {
  const b = phBirth(); if (!b) return null;
  const sy = solarYear(new Date(b.y - 543, b.m - 1, b.d, 12));
  return { ...b, sy, el: yearElementTh(sy), animal: yearAfflictions(sy).animal };
}
function phBirthHTML() {
  const ph = state.ph, p = state.profile || {}, b = ph.birth || { d: 1, m: 1, y: 2540 }, info = phBirthInfo();
  return `<section class="card ph-bd"><span class="eyebrow">วันเกิดของคนที่ส่อง</span>
<div class="seg" role="group" aria-label="อ่านให้ใคร"><button aria-pressed="${ph.who !== 'other'}" data-act="phWho" data-v="me">${p.yearBE ? `ฉัน (${p.day} ${MONTHS_SHORT[(p.month || 1) - 1]} ${p.yearBE})` : 'ฉัน'}</button><button aria-pressed="${ph.who === 'other'}" data-act="phWho" data-v="other">คนอื่น</button></div>
${ph.who === 'other' ? `<div class="ph-bd-row"><label class="field">วัน<select class="select mono" data-in="phB.d">${opts(range(1, 31).map((n) => [n, n]), b.d)}</select></label><label class="field">เดือน<select class="select" data-in="phB.m">${opts(MONTHS_SHORT.map((m, i) => [i + 1, m]), b.m)}</select></label><label class="field">ปี พ.ศ.<select class="select mono" data-in="phB.y">${opts(range(2443, 2575).reverse().map((n) => [n, n]), b.y)}</select></label></div>` : ''}
${info ? `<p class="small" style="margin:0">ปีจีน ${info.sy} · ปี${info.animal} · ธาตุปีเกิด<b> ${info.el}</b> ใช้เทียบกับธาตุใบหน้า</p>` : '<p class="small" style="margin:0">ยังไม่มีวันเกิด เลือก "คนอื่น" แล้วกรอกได้</p>'}</section>`;
}
const PH_TABS = [['face', 'โหงวเฮ้ง'], ['palm', 'ลายมือ'], ['learn', 'ความรู้']];
function phErrHTML(err) {
  if (!err) return '';
  const t = { nomodel: `โหมดนี้ต้องใช้โมเดล AI ที่อยู่ในเว็บแอปหลัก เปิดที่ <a href="${PH_WEB}" target="_blank" rel="noopener">mengnattawitmarin.github.io/taksila</a> แล้วลองใหม่`, perm: 'ยังไม่ได้อนุญาตให้ใช้กล้อง เปิดสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์ หรือเลือกรูปจากเครื่องแทน', cam: 'เปิดกล้องไม่ได้ ลองเลือกรูปจากเครื่องแทน', noface: 'ไม่พบใบหน้าในรูป ลองรูปหน้าตรง เห็นทั้งหน้า แสงสว่าง', nohand: 'ไม่พบมือในรูป ลองรูปฝ่ามือเต็มมือ กางนิ้วเล็กน้อย บนพื้นหลังเรียบ' }[err];
  return `<p class="ph-err">${t}</p>`;
}
function phStartHTML(kind) {
  const ph = state.ph;
  return `${kind === 'face' ? phBirthHTML() : ''}<section class="card ph-start">
${kind === 'face' ? `<div class="ph-ill">${phFaceSVG()}</div><b class="ph-t">ส่องหน้าด้วยกล้อง แล้วอ่านโหงวเฮ้งจากสัดส่วนจริง</b>
<ul class="ph-steps"><li>หน้าตรง แสงสว่างด้านหน้า ไม่ย้อนแสง</li><li>เปิดหน้าผาก ถอดแว่น ทำหน้าปกติ ไม่ยิ้ม</li><li>วางมือถือระดับสายตา ห่างราว 40–50 ซม.</li></ul>`
    : `<div class="ph-ill">${phPalmSVG()}</div><b class="ph-t">ส่องฝ่ามือ แล้วอ่านรูปมือ นิ้ว และเส้นลายมือ</b>
<p class="small" style="margin:0">แอปรู้เองว่าเป็นมือซ้ายหรือขวา · ตำราลายมือสมัยใหม่: มือข้างที่ถนัดบอกสิ่งที่คุณสร้างเองและปัจจุบัน มืออีกข้างบอกพื้นฐานที่ติดตัวมา ดูทั้งสองข้างได้</p>
<ul class="ph-steps"><li>หงายฝ่ามือเข้ากล้อง กางนิ้วเล็กน้อย</li><li>แสงสว่างจากด้านข้าง จะเห็นเส้นชัด</li><li>ใช้กล้องหลังจะคมกว่า หรือวางมือบนโต๊ะแล้วถ่าย</li></ul>`}
${phErrHTML(ph.err)}
<div class="ph-btns"><button class="btn" data-act="phStart">📷 เปิดกล้อง AR</button>
<label class="btn btn-line ph-file">🖼 เลือกรูป<input type="file" accept="image/*" data-in="phFile" hidden></label></div>
${kind === 'palm' ? `<button class="link-btn" data-act="phFacing">${ph.facing === 'user' ? 'ใช้กล้องหน้าอยู่ · สลับเป็นกล้องหลัง' : 'ใช้กล้องหลังอยู่ · สลับเป็นกล้องหน้า'}</button>` : ''}
<p class="small" style="margin:0">🔒 ประมวลผลในเครื่องของคุณทั้งหมด ไม่อัปโหลดหรือเก็บรูปไว้ · ครั้งแรกต้องโหลดโมเดลราว ${kind === 'face' ? '13' : '17'} MB</p></section>`;
}
function phLiveHTML() {
  return `<section class="ph-live"><div class="ph-stage" id="ph-stage"><video id="ph-video" playsinline muted autoplay${state.ph.mirror ? ' class="mir"' : ''}></video><canvas id="ph-ov"></canvas>
<div class="ph-top"><span class="ph-hint" id="ph-hint">กำลังเริ่มกล้อง…</span><span class="ph-bar"><i id="ph-prog"></i></span></div></div>
<button class="btn btn-line" data-act="phSkip" id="ph-skip" hidden>อ่านเลย ไม่ต้องรอท่าตรง</button><button class="btn btn-line" data-act="phStop">ยกเลิก</button></section>`;
}
function phLoadingHTML() { return '<section class="card ph-start"><div class="ph-spin" aria-hidden="true"></div><b class="ph-t" style="text-align:center">กำลังโหลดโมเดล AI…</b><p class="small" style="margin:0;text-align:center">ครั้งแรกอาจใช้เวลาสักครู่ ครั้งต่อไปจะเร็วขึ้น</p></section>'; }
function phReadCard(r) {
  return `<article class="ph-read ${fsTone(r.tone)}"><header><b>${r.title}</b>${r.cn ? `<span class="ph-cn">${r.cn}</span>` : ''}</header><span class="ph-val mono">${r.val}</span><p>${r.read}</p>${r.tip ? `<p class="ph-tip">✨ เสริม: ${r.tip}</p>` : ''}</article>`;
}
function phFaceResultHTML() {
  const ph = state.ph, m = ph.face, el = faceElement(m), reads = faceRead(m);
  const bi = phBirthInfo(), rel = bi ? elementRelation(el.key, bi.sy) : null;
  return `${phSnap ? `<section class="ph-snapw"><canvas id="ph-snap" aria-label="ภาพใบหน้าพร้อมจุดโหงวเฮ้ง"></canvas></section>` : ''}
${ph.warn && ph.warn.length ? `<p class="ph-err">รูปนี้: ${ph.warn.join(' · ')} ผลอาจคลาดเคลื่อน ลองถ่ายใหม่ได้</p>` : ''}
<section class="card ph-el"><span class="eyebrow">รูปหน้าห้าธาตุ · 五行面相</span><div class="ph-el-top"><span class="ph-el-ic ${el.key}">${el.th}</span><div><b>ใบหน้าธาตุ${el.th}${el.mixTh ? ` ผสม${el.mixTh}` : ''}</b><span>${el.shape} ${el.cn}</span></div></div>
<p class="body" style="margin:0">${el.read}</p><p class="ph-tip">✨ เสริม: ${el.boost}</p>
${rel ? `<p class="small ${rel.tone > 0 ? 'tpos' : rel.tone < 0 ? 'tneg' : ''}" style="margin:0">เทียบปีเกิด${state.ph.who === 'other' ? ' (คนอื่น)' : ''} ปี${bi.animal} ธาตุ${bi.el}: ${rel.th}</p>` : ''}</section>
${phBirthHTML()}
<section class="ph-list"><h2 class="label">อ่านทีละส่วน</h2>${reads.map(phReadCard).join('')}</section>
<div class="ph-btns"><button class="btn" data-act="phAgain">อ่านใหม่</button><button class="btn btn-line" data-act="phShare">แชร์ผล ↗</button></div>
<p class="small" style="font-size:11px">วัดจากจุดบนใบหน้า ${m.n ? `เฉลี่ย ${m.n} เฟรม` : 'จากรูปเดียว'} · มุมกล้อง แสง และสีหน้ามีผลต่อค่า ใช้เพื่อรู้จักตัวเองและความบันเทิง ไม่ใช่การตัดสินคนจากหน้าตา</p>`;
}
function phPalmResultHTML() {
  const ph = state.ph, h = ph.hand, reads = handRead(h), el = handElement(h), sel = ph.lines || {};
  return `${phSnap ? `<section class="ph-snapw"><canvas id="ph-snap" aria-label="ภาพฝ่ามือพร้อมเส้นนำ"></canvas>
<div class="ph-snapbar"><button class="chip small-chip" data-act="phEnh" aria-pressed="${!!ph.enh}">${ph.enh ? '✓ ' : ''}เน้นเส้นลายมือ</button>${PALM_LINES.map((L) => `<button class="chip small-chip" data-act="phHide" data-v="${L.id}" aria-pressed="${!(ph.hide || {})[L.id]}" style="--accent:${L.color}"><i class="ph-dot" style="background:${L.color}"></i>${L.th.split(' ')[0]}</button>`).join('')}</div>
<p class="small" style="margin:0">${ph.auto ? 'เส้นทึบคือรอยเส้นที่ AI ไล่เจอในรูป เส้นประบางคือแนวเส้นตามตำรา' : 'เส้นสีคือตำแหน่งโดยประมาณของเส้นหลัก'} · กด "เน้นเส้นลายมือ" เพื่อดูรอยเส้นชัดขึ้น</p></section>` : ''}${ph.palmIn === false ? '<p class="ph-err">ดูเหมือนเป็นหลังมือ ถ่ายใหม่โดยหงายฝ่ามือเข้ากล้อง AI จึงจะหาเส้นลายมือให้ได้</p>' : ''}
${ph.warn && ph.warn.length ? `<p class="ph-err">รูปนี้: ${ph.warn.join(' · ')} ผลอาจคลาดเคลื่อน</p>` : ''}
<section class="card ph-el"><span class="eyebrow">รูปมือ · ${ph.side === 'L' ? 'มือซ้าย' : 'มือขวา'}</span><div class="ph-el-top"><span class="ph-el-ic h-${el.key}">${el.th.replace('มือธาตุ', '')}</span><div><b>${el.th}</b><span>${el.shape}</span></div></div>
<p class="body" style="margin:0">${el.read}</p><p class="ph-tip">💼 ${reads[0].tip}</p></section>
<section class="ph-list"><h2 class="label">นิ้วมือ</h2>${reads.slice(1).map(phReadCard).join('')}</section>
<section class="ph-list"><h2 class="label">เส้นลายมือ: AI เลือกให้ก่อน แตะเปลี่ยนได้ถ้าไม่ตรง</h2>
${PALM_LINES.map((L) => { const ai = ph.auto && ph.auto.sug[L.id], mine = sel[L.id], pick = mine || ai, o = L.opts.find((x) => x.id === pick), cf = ph.auto ? ph.auto.conf[L.id] || 0 : 0; return `<article class="ph-line" style="--lc:${L.color}"><header><i class="ph-dot" style="background:${L.color}"></i><b>${L.th}</b><span class="small">${L.about}</span></header>
<p class="small" style="margin:0">อยู่ตรงไหน: ${L.where}</p>
${ai && !mine ? `<p class="ph-ai">🤖 AI ไล่รอยเส้นในรูปแล้วเลือกให้ (ความมั่นใจ${cf > 0.6 ? 'สูง' : cf > 0.3 ? 'ปานกลาง' : 'ต่ำ'}) ดูรอยจริงบนมือ ถ้าไม่ตรงแตะเลือกใหม่ได้</p>` : mine ? '<p class="ph-ai mine">✋ คุณเลือกเอง</p>' : ''}
<div class="ph-opts">${L.opts.map((x) => `<button class="chip small-chip${!mine && ai === x.id ? ' ai' : ''}" data-act="phLine" data-l="${L.id}" data-v="${x.id}" aria-pressed="${pick === x.id}">${x.th}</button>`).join('')}</div>
${o ? `<p class="ph-lread">${o.read}</p><p class="ph-tip">✨ ${o.tip}</p>` : ''}</article>`; }).join('')}</section>
<div class="ph-btns"><button class="btn" data-act="phAgain">อ่านใหม่</button><button class="btn btn-line" data-act="phShare">แชร์ผล ↗</button></div>
<p class="small" style="font-size:11px">รูปมือและความยาวนิ้ววัดจากจุดบนมือแบบสามมิติ · เส้นลายมือให้คุณเลือกเองเพราะกล้องมือถือยังแยกรอยเส้นละเอียดได้ไม่แม่นพอ · ใช้เพื่อความบันเทิงและรู้จักตัวเอง</p>`;
}
function phFaceSVG() {
  return `<svg viewBox="0 0 200 230" class="ph-svg" role="img" aria-label="ตำแหน่งโหงวเฮ้งบนใบหน้า"><ellipse cx="100" cy="118" rx="70" ry="98" class="o"/>
<path d="M52 92q18-10 36-2M112 90q18-8 36 2" class="l"/><ellipse cx="72" cy="106" rx="13" ry="5" class="l"/><ellipse cx="128" cy="106" rx="13" ry="5" class="l"/>
<path d="M100 104v38q-10 6-12 10h24q-2-4-12-10" class="l"/><path d="M80 172q20 9 40 0" class="l"/>
<g class="z"><line x1="22" x2="178" y1="86" y2="86"/><line x1="22" x2="178" y1="152" y2="152"/></g>
${[[100, 50, 'หน้าผาก 官祿', 1], [100, 90, 'หว่างคิ้ว 命宮', 1], [134, 84, 'คิ้ว 兄弟', 0], [148, 106, 'หางตา 夫妻', 2], [72, 116, 'ใต้ตา 子女', 3], [100, 132, 'จมูก 財帛', 1], [120, 172, 'ปาก 出納', 1], [100, 198, 'คาง 地閣', 1]].map(([x, y, t, a]) => `<circle cx="${x}" cy="${y}" r="3.2" class="d"/><text x="${a === 3 ? x - 5 : a === 0 ? x : a === 2 ? x - 2 : x + 5}" y="${a === 0 ? y - 6 : a === 2 ? y + 13 : y + 3}" text-anchor="${a === 3 ? 'end' : a === 0 ? 'middle' : a === 2 ? 'middle' : 'start'}">${t}</text>`).join('')}</svg>`;
}
function phPalmSVG() {
  return `<svg viewBox="0 0 200 240" class="ph-svg" role="img" aria-label="เส้นหลักบนฝ่ามือ"><path d="M60 230q-24-60-20-110l-14-40q-4-14 8-16 10-2 16 12l14 32V40q0-12 11-12t11 12v62V22q0-12 11-12t11 12v80V30q0-12 11-12t11 12v78V58q0-11 10-11t10 11v82q0 50-24 90z" class="o"/>
<path d="M150 130q-30-6-62 2" style="stroke:#E5675A" class="pl"/><path d="M68 112q30 12 72 34" style="stroke:#D4AF63" class="pl"/><path d="M70 112q-30 44 8 104" style="stroke:#6FC3B2" class="pl"/><path d="M110 220q-4-40 0-96" style="stroke:#A99BD9" class="pl"/>
<text x="136" y="124" style="fill:#E5675A">เส้นใจ</text><text x="122" y="158" style="fill:#D4AF63">เส้นสมอง</text><text x="40" y="190" style="fill:#6FC3B2">ชีวิต</text><text x="114" y="206" style="fill:#A99BD9">วาสนา</text></svg>`;
}
function phLearnHTML() {
  return `<section class="card"><span class="eyebrow">สามส่วนของใบหน้า 三停</span><div class="ph-ill">${phFaceSVG()}</div>
<p class="body" style="margin:0">ตำราจีนแบ่งหน้าเป็นสามส่วนเท่า ๆ กัน: <b>ส่วนบน</b> แนวไรผมถึงคิ้ว ดูวัยต้นและสติปัญญา <b>ส่วนกลาง</b> คิ้วถึงปลายจมูก ดูวัยทำงาน <b>ส่วนล่าง</b> ใต้จมูกถึงคาง ดูบั้นปลายและความมั่นคง ส่วนที่ยาวเด่นบอกช่วงวัยที่ชีวิตโดดเด่น</p></section>
<section class="card"><span class="eyebrow">รูปหน้าห้าธาตุ 五行</span><ul class="ph-steps">
<li><b>ไม้</b> หน้ายาว ผอมสูง: มีอุดมการณ์ ชอบเรียนรู้</li><li><b>ไฟ</b> หน้าเรียว คางแหลม: คิดไว มีเสน่ห์ ใจร้อน</li><li><b>ดิน</b> หน้าเหลี่ยม กรามกว้าง: หนักแน่น อดทน เก็บเงินเก่ง</li><li><b>ทอง</b> หน้าเหลี่ยมสมส่วน: มีระเบียบ เด็ดขาด</li><li><b>น้ำ</b> หน้ากลม: อ่อนโยน ปรับตัวเก่ง</li></ul></section>
<section class="card"><span class="eyebrow">เส้นหลักบนฝ่ามือ</span><div class="ph-ill">${phPalmSVG()}</div>
<ul class="ph-steps">${PALM_LINES.map((L) => `<li><b style="color:${L.color}">${L.th}</b> ${L.where} · เกี่ยวกับ${L.about}</li>`).join('')}</ul>
<p class="small" style="margin:0">รูปมือสี่ธาตุ: ดิน (ฝ่ามือเหลี่ยม นิ้วสั้น) ลม (เหลี่ยม นิ้วยาว) ไฟ (ฝ่ามือยาว นิ้วสั้น) น้ำ (ยาว นิ้วยาว)</p></section>
<section class="card"><span class="eyebrow">AI อ่านหน้า อ่านมือ ต่างจากซินแสอย่างไร</span>
<div class="ph-pc"><div class="pos"><b>ข้อดี</b><ul><li>ใช้ได้ทันที ฟรี อ่านซ้ำได้ทุกเมื่อ</li><li>วัดสัดส่วนเป็นตัวเลข ไม่มีอคติจากความประทับใจแรก</li><li>AR ชี้ตำแหน่งให้เห็นบนหน้าและมือจริง</li><li>ประมวลผลในเครื่อง รูปไม่ออกไปไหน</li></ul></div>
<div class="neg"><b>ข้อจำกัด</b><ul><li>ยังไม่เห็นสีผิว ไฝ รอยตำหนิ และความลึกของเส้นแบบซินแส</li><li>แสง มุมกล้อง สีหน้า มีผลต่อค่า</li><li>เส้นลายมือละเอียดยังต้องให้ผู้ใช้ช่วยดู</li><li>เป็นศาสตร์ความเชื่อ ไม่ใช่วิทยาศาสตร์</li></ul></div></div>
<p class="small" style="margin:0">ตำราโหงวเฮ้งเองก็สอนว่าใจและการกระทำสำคัญกว่าหน้าตา การดูแลสุขภาพ ยิ้มแย้ม และพูดดี คือการ "เสริมโหงวเฮ้ง" ที่ได้ผลจริงที่สุด การศัลยกรรมเป็นเรื่องส่วนตัว ควรตัดสินใจเพราะความสบายใจของตัวเอง ไม่ใช่เพราะคำทำนาย</p></section>`;
}
function viewFace() {
  const ph = state.ph;
  let body;
  if (ph.tab === 'learn') body = phLearnHTML();
  else if (ph.status === 'loading') body = phLoadingHTML();
  else if (ph.status === 'live') body = phLiveHTML();
  else if (ph.status === 'result' || (ph.tab === 'face' ? ph.face : ph.hand) && ph.status !== 'start') body = (ph.tab === 'face' ? (ph.face ? phFaceResultHTML() : '') : (ph.hand ? phPalmResultHTML() : '')) || phStartHTML(ph.tab);
  else body = phStartHTML(ph.tab);
  return `<main class="screen" style="--accent:#E8A2B8">
${pageHead('15', 'FACE · PALM', 'โหงวเฮ้ง ลายมือ', '#E8A2B8', 'face')}
<div class="seg" role="tablist">${PH_TABS.map(([t, l]) => `<button role="tab" aria-selected="${ph.tab === t}" data-act="phTab" data-v="${t}">${l}</button>`).join('')}</div>
${body}
</main>`;
}
async function phImage() {
  const ph = state.ph, W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2A1420'); g.addColorStop(.6, '#0F0C10'); g.addColorStop(1, '#1E170C'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const F = (w, s) => `${w} ${s}px "IBM Plex Sans Thai", "Taviraj", sans-serif`;
  x.textAlign = 'center'; x.fillStyle = '#E8A2B8'; x.font = F(500, 30); x.fillText(ph.tab === 'face' ? 'ตักศิลา · โหงวเฮ้ง' : 'ตักศิลา · ลายมือ', W / 2, 90);
  let title, sub, items;
  if (ph.tab === 'face') { const el = faceElement(ph.face), rd = faceRead(ph.face); title = `ใบหน้าธาตุ${el.th}`; sub = el.shape + (el.mixTh ? ` ผสม${el.mixTh}` : ''); items = rd.filter((r) => r.tone > 0 && r.key !== 'sym').slice(0, 4).map((r) => [r.title, r.read]); }
  else { const el = handElement(ph.hand), rd = handRead(ph.hand); title = el.th; sub = el.shape; items = [[rd[0].title, el.read], ...PALM_LINES.map((L) => [L, (ph.lines || {})[L.id] || (ph.auto && ph.auto.sug[L.id])]).filter(([, v]) => v).slice(0, 3).map(([L, v]) => [L.th, L.opts.find((o) => o.id === v).read])]; }
  x.fillStyle = '#F6E3B0'; x.font = F(700, 92); x.fillText(title, W / 2, 230);
  x.fillStyle = '#B9AD94'; x.font = F(400, 34); x.fillText(sub, W / 2, 290);
  x.textAlign = 'left'; let y = 380;
  for (const [t, d] of items) {
    x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(80, y - 50, W - 160, 210);
    x.fillStyle = '#E8A2B8'; x.font = F(600, 34); x.fillText(t, 110, y);
    x.fillStyle = '#E9DFC8'; x.font = F(400, 30);
    wrapText(x, thaiChunks(d), 110, y + 46, W - 220, 40, 4);
    y += 230;
  }
  x.textAlign = 'center'; x.fillStyle = '#8F836C'; x.font = F(400, 26); x.fillText('ส่องหน้า อ่านลายมือฟรี ที่ตักศิลา · mengnattawitmarin.github.io/taksila', W / 2, H - 50);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}

// ---------------- ห้องศึกษาตำรา ----------------
function learnRead() { try { return new Set(JSON.parse(localStorage.getItem('taksila.learn')) || []); } catch (e) { return new Set(); } }
function viewLearn() {
  const st = state.learn || (state.learn = { cat: 'all', open: null }), read = learnRead(), cat = (k) => LEARN_CATS.find((c) => c[0] === k);
  if (st.open) {
    const i = LESSONS.findIndex((l) => l.id === st.open), L = LESSONS[i], c = cat(L.cat), nx = LESSONS[i + 1];
    return `<main class="screen" style="--accent:${c[2]}">
<button class="link-btn" data-act="learnBack">‹ กลับห้องศึกษาตำรา</button>
<article class="ln-art"><span class="eyebrow" style="color:${c[2]}">${c[1]} · อ่าน ${L.m} นาที</span><h1 class="h1">${L.t}</h1>
${L.b.map((x) => `<p>${x}</p>`).join('')}</article>
<a class="btn" href="#/${L.go[0]}">${L.go[1]} ›</a>
${nx ? `<button class="btn btn-line" data-act="learnOpen" data-v="${nx.id}">บทถัดไป: ${nx.t}</button>` : ''}
</main>`;
  }
  const list = LESSONS.filter((l) => st.cat === 'all' || l.cat === st.cat), n = LESSONS.filter((l) => read.has(l.id)).length;
  return `<main class="screen" style="--accent:#D4AF63">
${pageHead('16', 'STUDY', 'ห้องศึกษาตำรา', '#D4AF63', 'learn')}
<p class="small" style="margin:0">บทเรียนสั้น อ่านจบในไม่กี่นาที อธิบายหลักที่แอปใช้คำนวณ เรียบเรียงใหม่ด้วยภาษาง่าย · อ่านแล้ว ${n}/${LESSONS.length} บท</p>
<div class="ln-bar"><i style="width:${Math.round(n / LESSONS.length * 100)}%"></i></div>
<div class="chips">${[['all', 'ทั้งหมด', '#D4AF63'], ...LEARN_CATS].map(([k, t, c]) => `<button class="chip" style="--accent:${c}" data-act="learnCat" data-v="${k}" aria-pressed="${st.cat === k}">${t}</button>`).join('')}</div>
<ul class="ln-list">${list.map((l) => { const c = cat(l.cat); return `<li><button class="ln-it${read.has(l.id) ? ' read' : ''}" style="--c:${c[2]}" data-act="learnOpen" data-v="${l.id}"><span class="ln-dot">${read.has(l.id) ? '✓' : ''}</span><span class="ln-t"><b>${l.t}</b><span>${c[1]} · ${l.m} นาที</span></span><span aria-hidden="true">›</span></button></li>`; }).join('')}</ul>
</main>`;
}
const VIEWS = { learn: viewLearn, face: viewFace, fengshui: viewFengshui, calendar: viewCalendar, about: viewAbout, map: viewMap, dream: viewDream, privacy: viewPrivacy,  prayer: viewPrayer, auspice: viewAuspice, welcome: viewWelcome, setup: viewSetup, home: viewHome, chart: viewChart, match: viewMatch, tarot: viewTarot, numbers: viewNumbers, luck: viewLuck, ask: viewAsk };
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
  if (r === 'map') mountMap();
  mountFengshui();
  mountPhysio();
  if (r === 'fengshui' && state.fs.tab === 'map') mountFsMap();
  { const row = document.querySelector('.fs-tabs'); const on = row && row.querySelector('[aria-pressed="true"]'); if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; }
  if (r !== lastRoute) { window.scrollTo(0, 0); lastRoute = r; }
  document.title = 'ตักศิลา · ' + ({ prayer: 'บทสวดมนต์', home: 'หน้าหลัก', chart: 'ผังดาว', match: 'คู่ดวง', tarot: 'ไพ่ทาโรต์', numbers: 'ศาสตร์ตัวเลข', luck: 'โชคลาภ', ask: 'ปรึกษา', setup: 'ข้อมูลกำเนิด', dream: 'ทำนายฝัน', map: 'แผนที่มู', calendar: 'ปฏิทินวันพระ', fengshui: 'ฮวงจุ้ย', face: 'โหงวเฮ้ง ลายมือ', learn: 'ห้องศึกษาตำรา', about: 'เกี่ยวกับ', privacy: 'ความเป็นส่วนตัว', auspice: 'ฤกษ์ยาม' }[r] || 'อ่านดวงจากดาวจริง');
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
    closeMore();
    if (el && el.dataset.act === 'chartTab') state.chartTab = +el.dataset.i;
    if (el && el.dataset.act === 'openPrayer') { state.prayer.open = el.dataset.v; state.prayer.back = route(); }
    if (el && el.dataset.act === 'mapOpen') Object.assign(state.map, { cat: 'all', wish: null, sel: el.dataset.v });
    if (el && el.dataset.act === 'mapCat') Object.assign(state.map, { cat: el.dataset.v, wish: null, sel: null });
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
      t.deck = drawCards(78); t.picks = []; t.cards = null; t.flipped = []; t.sel = 0; t.logged = false; t.histTs = null;
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
      if (t.flipped.length === t.cards.length) { const all = document.querySelector('[data-act="tarotAll"]'); if (all) all.remove(); tarotDone(); }
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
      tarotDone();
      return;
    }
    case 'tarotReset': Object.assign(state.tarot, { cards: null, deck: null, picks: [], flipped: [], logged: false, histTs: null }); break;
    case 'tarotSave': tarotShare('save'); return;
    case 'tarotShare': tarotShare('share'); return;
    case 'tarotHist': tarotHistOpen(i); window.scrollTo(0, 0); break;
    case 'tarotHistDel': { const log = tarotLog(); log.splice(i, 1); try { localStorage.setItem(TAROT_LOG, JSON.stringify(log)); } catch (er) {} break; }
    case 'tarotHistAll': state.tarot.histAll = true; break;
    case 'numMode': state.num.mode = el.dataset.v; break;
    case 'prayerCat': state.prayer.cat = el.dataset.v; break;
    case 'prayerPurpose': state.prayer.purpose = el.dataset.v || null; break;
    case 'prayerBack': { const b = state.prayer.back; state.prayer.open = null; state.prayer.back = null; if (b && b !== 'prayer') { go(b); return; } break; }
    case 'prayerReset': state.prayer.counts[state.prayer.open] = 0; { const c = document.getElementById('pr-counter'); if (c) c.innerHTML = counterHTML(prOf(state.prayer.open)); } return;
    case 'prayerTap': {
      const pr = prOf(state.prayer.open), c0 = state.prayer.counts[pr.id] || 0;
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
    case 'muCat': Object.assign(state.map, { cat: el.dataset.v, wish: el.dataset.v === 'wish' ? state.map.wish : null, sel: null }); break;
    case 'muWish': state.map.wish = state.map.wish === el.dataset.v ? null : el.dataset.v; state.map.cat = 'wish'; state.map.sel = null; break;
    case 'fsTab': state.fs.tab = el.dataset.v; window.scrollTo(0, 0); break;
    case 'learnCat': state.learn.cat = el.dataset.v; break;
    case 'learnOpen': { state.learn.open = el.dataset.v; const r = learnRead(); r.add(el.dataset.v); try { localStorage.setItem('taksila.learn', JSON.stringify([...r])); } catch (e) {} render(); window.scrollTo(0, 0); return; }
    case 'learnBack': state.learn.open = null; break;
    case 'notifyOn': notifyEnable(); return;
    case 'meritDo': { const m = meritLoad(), k = ymdIso(new Date()), a = new Set(m.done[k] || []); a.has(el.dataset.v) ? a.delete(el.dataset.v) : a.add(el.dataset.v); m.done[k] = [...a]; meritSave(m); if (a.has(el.dataset.v)) toast('อนุโมทนาบุญ 🙏'); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    case 'shareApp': if (navigator.share) navigator.share({ title: 'ตักศิลา ดูดวงครบทุกศาสตร์', text: 'ดูดวงฟรี ผังดาว ไพ่ทาโรต์ ฮวงจุ้ย โหงวเฮ้ง บทสวด', url: APP_URL }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(APP_URL); toast('คัดลอกลิงก์แล้ว'); } return;
    case 'copyApp': (navigator.clipboard ? navigator.clipboard.writeText(APP_URL) : Promise.reject()).then(() => toast('คัดลอกลิงก์แล้ว'), () => toast(APP_URL)); return;
    case 'phTab': if (state.ph.status === 'live') phStopCam(); state.ph.tab = el.dataset.v; state.ph.status = 'idle'; state.ph.err = ''; break;
    case 'phStart': phStart(); return;
    case 'phStop': phStopCam(); state.ph.status = 'start'; break;
    case 'phSkip': phForce = true; el.hidden = true; return;
    case 'phAgain': phSnap = null; state.ph.status = 'start'; state.ph.err = ''; state.ph.warn = []; break;
    case 'phSide': state.ph.side = el.dataset.v; break;
    case 'phWho': state.ph.who = el.dataset.v; if (el.dataset.v === 'other' && !state.ph.birth) state.ph.birth = { d: 1, m: 1, y: 2540 }; phSaveSaved({ who: state.ph.who, birth: state.ph.birth }); { const y = window.scrollY; render(); window.scrollTo(0, y); } return;
    case 'phFacing': state.ph.facing = state.ph.facing === 'user' ? 'environment' : 'user'; break;
    case 'phEnh': state.ph.enh = !state.ph.enh; break;
    case 'phHide': state.ph.hide = { ...state.ph.hide, [el.dataset.v]: !state.ph.hide[el.dataset.v] }; break;
    case 'phLine': { const l = el.dataset.l, v = el.dataset.v; state.ph.lines = { ...state.ph.lines, [l]: state.ph.lines[l] === v ? null : v }; phSaveSaved({ lines: state.ph.lines }); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    case 'phShare': phImage().then((b) => shareBlob(b, `taksila-${state.ph.tab}-${Date.now()}.png`, state.ph.tab === 'face' ? 'โหงวเฮ้งจากตักศิลา' : 'ลายมือจากตักศิลา')); return;
    case 'fsGender': state.fs.gender = el.dataset.v; fsSave(); break;
    case 'fsPtype': state.fs.ptype = el.dataset.v; if (el.dataset.v === 'land') state.fs.period = 9; fsSave(); break;
    case 'fsChk': { const id = fsPt().id, c = { ...(state.fs.chk || {}) }; c[id] = { ...(c[id] || {}) }; c[id][el.dataset.v] = !c[id][el.dataset.v]; state.fs.chk = c; fsSave(); break; }
    case 'fsQuick': state.fs.facing = FS_DIR_DEG[el.dataset.v]; state.fs.cell = null; fsSave(); break;
    case 'fsCell': state.fs.cell = el.dataset.v; break;
    case 'fsSensor': fsStartSensor(); return;
    case 'fsCam': fsToggleCam(); return;
    case 'fsUseHeading': state.fs.facing = Math.round(state.fs.heading); state.fs.cell = null; state.fs.tab = 'house'; fsSave(); toast(`ตั้งทิศหน้าบ้าน ${state.fs.facing}° แล้ว`); break;
    case 'fsRepl': state.fs.repl = !state.fs.repl; fsSave(); break;
    case 'fsNewGender': state.fs.newMember = { ...(state.fs.newMember || { name: '', gender: 'f', day: 1, month: 1, yearBE: 2540 }), gender: el.dataset.v }; break;
    case 'fsMemPick': { const sv = (state.match.people || []).filter((x) => !(state.fs.members || []).some((m) => m.name === x.name))[i]; if (sv) state.fs.newMember = { name: sv.name, gender: (state.fs.newMember || {}).gender || 'f', day: sv.day, month: sv.month, yearBE: sv.yearBE }; break; }
    case 'fsMemAdd': {
      const nm = state.fs.newMember || { name: '', gender: 'f', day: 1, month: 1, yearBE: 2540 };
      if (!nm.name.trim()) { toast('ใส่ชื่อก่อน'); return; }
      state.fs.members = [...(state.fs.members || []).filter((x) => x.name !== nm.name.trim()), { ...nm, name: nm.name.trim(), day: +nm.day, month: +nm.month, yearBE: +nm.yearBE }];
      state.fs.newMember = null; fsSave(); toast('เพิ่มแล้ว'); break;
    }
    case 'fsMemDel': state.fs.members = (state.fs.members || []).filter((x) => x.name !== el.dataset.v); fsSave(); break;
    case 'fsRoomPick': state.fs.roomPick = el.dataset.v || null; break;
    case 'fsRoomToggle': {
      const pk = state.fs.roomPick, rooms = { ...(state.fs.rooms || {}) }, list = [...(rooms[pk] || [])], k2 = list.findIndex((r) => r.type === el.dataset.v);
      if (k2 >= 0) list.splice(k2, 1); else list.push({ type: el.dataset.v });
      rooms[pk] = list; state.fs.rooms = rooms; fsSave(); break;
    }
    case 'fsShare': fsImage().then((b) => shareBlob(b, `taksila-fengshui-${Date.now()}.png`, 'ฮวงจุ้ยบ้านจากตักศิลา')); return;
    case 'fsAusp': state.ausp.event = 'house'; state.ausp.tab = 1; state.ausp.open = 0; go('auspice'); return;
    case 'fsMapMe': {
      if (!navigator.geolocation) { toast('เครื่องนี้หาตำแหน่งไม่ได้'); return; }
      navigator.geolocation.getCurrentPosition((pos) => { state.fs.home = { lat: pos.coords.latitude, lon: pos.coords.longitude }; fsSave(); if (fsMap) { fsMap.setView([state.fs.home.lat, state.fs.home.lon], 18); fsMapDraw(); } }, () => toast('ยังไม่ได้รับอนุญาตให้ใช้ตำแหน่ง'), { timeout: 10000 });
      return;
    }
    case 'muReg': state.map.reg = el.dataset.v; state.map.sel = null; break;
    case 'muSel': muSelect(el.dataset.v, false); return;
    case 'muNear': {
      if (!navigator.geolocation) { toast('เครื่องนี้หาตำแหน่งไม่ได้'); return; }
      toast('กำลังหาตำแหน่งของคุณ…');
      navigator.geolocation.getCurrentPosition((pos) => { state.map.me = { lat: pos.coords.latitude, lon: pos.coords.longitude }; state.map.sel = null; if (route() === 'map') render(); }, () => toast('ยังไม่ได้รับอนุญาตให้ใช้ตำแหน่ง'), { timeout: 10000, maximumAge: 600000 });
      return;
    }
    case 'prTrToggle': state.prayer.trOpen = !state.prayer.trOpen; { const sm = el.querySelector('i'); if (sm) sm.textContent = 'แตะเพื่อ' + (state.prayer.trOpen ? 'ซ่อน' : 'อ่าน'); } return;
    case 'prReport': {
      const pr = prOf(state.prayer.open), txt = reportText(pr);
      const open = () => window.open(LINE_URL, '_blank', 'noopener');
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => { toast('คัดลอกข้อความแจ้งแล้ว วางในแชต LINE ได้เลย'); open(); }, open); else open();
      return;
    }
    case 'dailyShare': dailyImage().then((b) => shareBlob(b, `taksila-today-${Date.now()}.png`, 'ดวงวันนี้จากตักศิลา')); return;
    case 'inviteShare': shareInvite(); return;
    case 'moreOpen': { if (!document.getElementById('more-sheet')) document.body.insertAdjacentHTML('beforeend', moreSheetHTML()); return; }
    case 'moreClose': closeMore(); return;
    case 'dreamPick': state.dream.sel = el.dataset.v; state.dream.saved = false; break;
    case 'dreamTime': state.dream.time = el.dataset.v; break;
    case 'dreamSave': {
      const d = state.dream.sel ? dreamByTh(state.dream.sel) : dreamLookup(state.dream.q);
      if (d && !state.dream.saved) { const now = new Date(); const log = [{ date: `${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`, th: d.th }, ...dreamLog()].slice(0, 30); try { localStorage.setItem(DREAM_KEY, JSON.stringify(log)); } catch (er) {} state.dream.saved = true; toast('บันทึกลงสมุดฝันแล้ว'); }
      break;
    }
    case 'dreamClear': try { localStorage.removeItem(DREAM_KEY); } catch (er) {} break;
    case 'pvAsk': state.pvConfirm = true; break;
    case 'pvCancel': state.pvConfirm = false; break;
    case 'pvWipe': {
      try { Object.keys(localStorage).filter((k) => k.startsWith('taksila')).forEach((k) => localStorage.removeItem(k)); } catch (er) {}
      state.profile = null; state.chart = null; state.match.people = []; state.pvConfirm = false; weekCache = null;
      toast('ลบข้อมูลทั้งหมดในเครื่องแล้ว'); go('welcome'); return;
    }
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
  if (key && key.startsWith('fsNew.')) { state.fs.newMember = { ...(state.fs.newMember || { name: '', gender: 'f', day: 1, month: 1, yearBE: 2540 }), [key.slice(6)]: v }; return; }
  if (key === 'fsRadius') { state.fs.radius = +v; const lb = e.target.closest('label'); if (lb && lb.firstChild) lb.firstChild.textContent = `รัศมีผัง ${v} เมตร`; fsMapDraw(); return; }
  if (key === 'fsFacing') {
    state.fs.facing = +v; state.fs.cell = null;
    const m = mountainOf(+v), t = document.getElementById('fs-face-read'), g = document.getElementById('fs-dial-g');
    if (t) t.textContent = `${v}° ${FS_DIR_SHORT[m.palace]} · ${m.cn}`;
    if (g) g.style.transform = `rotate(${v}deg)`;
    return;
  }
  if (key === 'dreamQ') {
    state.dream.q = v; state.dream.sel = null; state.dream.saved = false;
    const out = document.getElementById('dream-out'), d = v.trim() ? dreamLookup(v) : null;
    if (out) out.innerHTML = d ? dreamResultHTML(d) : v.trim() ? '<p class="small">ยังไม่มีฝันนี้ในตำรา ลองพิมพ์สั้น ๆ เช่น "งู" "ฟัน" "คนตาย" หรือแตะเลือกด้านล่าง</p>' : '';
    return;
  }
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
  if (key && key.startsWith('phB.')) { state.ph.birth = { ...(state.ph.birth || { d: 1, m: 1, y: 2540 }), [key.slice(4)]: v }; phSaveSaved({ birth: state.ph.birth }); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
  if (key === 'phFile') { const f = e.target.files && e.target.files[0]; if (f) phPhoto(f); return; }
  if (key === 'fsFacing') { fsSave(); render(); return; }
  if (key === 'fsRadius') { fsSave(); return; }
  if (key === 'fsPeriod') { state.fs.period = v; fsSave(); render(); return; }
  if (key === 'fsWho') { const pk = state.fs.roomPick, rooms = { ...(state.fs.rooms || {}) }; rooms[pk] = (rooms[pk] || []).map((r) => (r.type === e.target.dataset.room ? { ...r, who: e.target.value || undefined } : r)); state.fs.rooms = rooms; fsSave(); render(); return; }
  if (key && key.startsWith('fsNew.')) return;
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
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').then(() => { if (notifyOn()) notifySync(); }).catch(() => {}); });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); installEvt = e;
  const slot = document.getElementById('install-slot');
  if (slot) slot.innerHTML = installHTML();
});
window.addEventListener('appinstalled', () => { installEvt = null; const slot = document.getElementById('install-slot'); if (slot) slot.innerHTML = ''; toast('ติดตั้งตักศิลาบนหน้าจอเรียบร้อย'); });
