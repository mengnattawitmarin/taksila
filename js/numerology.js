// Number readings: phone, plate, Thai ID card, house number, bank account, hexadecimal.
// Pair rules follow common Thai numerology: digits 7 and 8 are "heavy", 0 is "empty".
import { DIGITS, SUM_MEANING } from './data.js';

export const reduceTo9 = (n) => { while (n > 9) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };
const onlyDigits = (s) => (s || '').replace(/[^0-9]/g, '');

export const NUM_TOOLS = [
  { id: 'name', th: 'ชื่อ-นามสกุล', hint: 'เลขศาสตร์ชื่อตามหลักโหราเลขศาสตร์ และเช็กอักษรกาลกิณีตามวันเกิด', ph: '', kind: 'name', max: 40 },
  { id: 'phone', th: 'เบอร์มือถือ', hint: 'เช่น 081 234 5678', ph: '0812345678', kind: 'digits', max: 12 },
  { id: 'plate', th: 'ทะเบียนรถ', hint: 'ใส่ทั้งตัวอักษรและเลขได้ ระบบใช้เฉพาะตัวเลข', ph: '1กข 1234', kind: 'text', max: 12 },
  { id: 'id', th: 'บัตรประชาชน', hint: 'เลข 13 หลัก ประมวลผลในเครื่องเท่านั้น ไม่บันทึก ไม่ส่งออก', ph: '1 2345 67890 12 3', kind: 'digits', max: 17 },
  { id: 'house', th: 'บ้านเลขที่', hint: 'เช่น 99/123 หรือห้อง 1205', ph: '99/123', kind: 'text', max: 16 },
  { id: 'bank', th: 'บัญชีธนาคาร', hint: 'ใส่เลขบัญชี 10–12 หลัก', ph: '123-4-56789-0', kind: 'digits', max: 16 },
  { id: 'hex', th: 'เลขฐาน 16', hint: 'ตัวเลข 0–9 และตัวอักษร A–F เช่น รหัสสี #C9A24E', ph: '#C9A24E', kind: 'hex', max: 16 }
];

const HOUSE_MEANING = {
  1: 'บ้านของผู้นำ เจ้าของบ้านมีบารมี เหมาะทำธุรกิจที่บ้าน', 2: 'บ้านอบอุ่น คนในบ้านรักใคร่กัน เหมาะกับครอบครัว',
  3: 'บ้านมีพลัง คึกคัก ขยันทำมาหากิน แต่ระวังการกระทบกระทั่ง', 4: 'บ้านแห่งการเรียนรู้ เหมาะกับนักเรียนและงานที่ใช้ความคิด',
  5: 'บ้านที่ผู้ใหญ่เมตตา มั่นคง อยู่ได้ยาว', 6: 'บ้านสวยงาม การเงินดี อยู่แล้วมีความสุข',
  7: 'บ้านที่ต้องอดทน ควรดูแลความสงบและสุขภาพของคนในบ้าน', 8: 'บ้านที่ชีวิตเปลี่ยนแปลงบ่อย ควรวางแผนการเงินให้รัดกุม',
  9: 'บ้านมีสิริมงคล มีโชค สิ่งศักดิ์สิทธิ์คุ้มครอง'
};
const BANK_MEANING = {
  1: 'เงินเข้าจากตำแหน่งงานและชื่อเสียง', 2: 'เงินมาจากความร่วมมือและคนรอบตัว', 3: 'เงินมาเร็วไปเร็ว ควรแยกบัญชีเก็บออม',
  4: 'เงินจากการเจรจาและงานความคิด', 5: 'เงินจากผู้ใหญ่และความรู้ เหมาะเป็นบัญชีออม', 6: 'บัญชีที่การเงินดีที่สุด มีโชคเรื่องเงิน',
  7: 'เก็บเงินยาก แต่ถ้าเก็บได้จะมั่นคงมาก', 8: 'เงินหมุนเวียนแรง ขึ้นลงเร็ว เหมาะเป็นบัญชีค้าขาย', 9: 'เงินจากโชคและบุญเก่า'
};
const PLATE_MEANING = {
  1: 'รถพาไปสู่ตำแหน่งและงานใหญ่', 2: 'รถแห่งความราบรื่น เดินทางกับครอบครัวสบายใจ', 3: 'รถแรง ใจร้อนได้ ควรขับอย่างมีสติ',
  4: 'รถของคนช่างคิด เดินทางไปเจรจาได้ผล', 5: 'รถที่ผู้ใหญ่คุ้มครอง ปลอดภัย', 6: 'รถนำโชค ค้าขายดี',
  7: 'ควรตรวจสภาพรถสม่ำเสมอ และขับด้วยความอดทน', 8: 'รถที่พาไปพบความเปลี่ยนแปลง ควรระวังเป็นพิเศษ', 9: 'รถมีสิริมงคล เดินทางปลอดภัย'
};
const ID_MEANING = {
  1: 'ชีวิตเด่นเรื่องความเป็นผู้นำและการตัดสินใจ', 2: 'ชีวิตเด่นเรื่องคนรอบตัวและความรัก', 3: 'ชีวิตเด่นเรื่องความกล้าและการลงมือ',
  4: 'ชีวิตเด่นเรื่องสติปัญญาและการเรียนรู้', 5: 'ชีวิตเด่นเรื่องผู้ใหญ่อุปถัมภ์', 6: 'ชีวิตเด่นเรื่องการเงินและความสุข',
  7: 'ชีวิตต้องฝ่าฟัน แต่เข้มแข็งกว่าคนทั่วไป', 8: 'ชีวิตมีขึ้นลง ปรับตัวเก่ง', 9: 'ชีวิตมีโชคและสิ่งศักดิ์สิทธิ์คุ้มครอง'
};

function pairList(src) {
  const out = [];
  for (let i = 0; i < src.length - 1; i++) {
    const a = +src[i], b = +src[i + 1];
    const bad = [7, 8].includes(a) || [7, 8].includes(b);
    const neutral = !bad && (a === 0 || b === 0);
    out.push({ n: src[i] + src[i + 1], bad, neutral, meaning: DIGITS[a] + ' + ' + DIGITS[b] });
  }
  return out;
}
function score(pairs, red) {
  if (!pairs.length) return null;
  const good = pairs.filter((p) => !p.bad && !p.neutral).length, mid = pairs.filter((p) => p.neutral).length;
  let s = Math.round(((good + mid * 0.5) / pairs.length) * 85 + ([7, 8].includes(red) ? 0 : 15));
  return Math.max(5, Math.min(100, s));
}
export const gradeOf = (s) => s >= 85 ? ['ดีมาก', 'A'] : s >= 70 ? ['ดี', 'B'] : s >= 50 ? ['ปานกลาง', 'C'] : ['ควรพิจารณา', 'D'];

// Thai national ID check digit: sum of first 12 digits times weights 13..2, then (11 - sum mod 11) mod 10.
export function idValid(d) {
  if (d.length !== 13) return false;
  let s = 0;
  for (let i = 0; i < 12; i++) s += +d[i] * (13 - i);
  return (11 - (s % 11)) % 10 === +d[12];
}

export function analyzeNumber(tool, raw) {
  if (tool === 'hex') return analyzeHex(raw);
  const d = onlyDigits(raw);
  if (!d) return null;
  const sum = d.split('').reduce((a, b) => a + +b, 0), red = reduceTo9(sum);
  const src = tool === 'phone' ? d.slice(-7) : tool === 'id' ? d.slice(-4) : d;
  const pairs = pairList(src);
  const sc = tool === 'id' ? null : score(pairs, red);
  const meaning = tool === 'house' ? HOUSE_MEANING[red] : tool === 'bank' ? BANK_MEANING[red] : tool === 'plate' ? PLATE_MEANING[red] : tool === 'id' ? ID_MEANING[red] : SUM_MEANING[red];
  const notes = [];
  if (tool === 'phone' && d.length !== 10) notes.push('เบอร์มือถือไทยปกติมี 10 หลัก');
  if (tool === 'id') notes.push(d.length !== 13 ? `ใส่แล้ว ${d.length} หลัก (ต้องมี 13 หลัก)` : idValid(d) ? 'เลขตรวจสอบหลักสุดท้ายถูกต้องตามรูปแบบบัตรประชาชนไทย' : 'หลักสุดท้ายไม่ตรงกับสูตรตรวจสอบ ลองเช็กว่าพิมพ์ครบถูกต้องหรือไม่');
  return { digits: d, sum, red, meaning, pairs, score: sc, pairNote: tool === 'phone' ? '7 หลักท้าย' : tool === 'id' ? '4 หลักท้าย' : '', notes };
}

const HEX = '0123456789ABCDEF';
export function analyzeHex(raw) {
  const h = (raw || '').toUpperCase().replace(/^0X/, '').replace(/[^0-9A-F]/g, '');
  if (!h) return null;
  const vals = h.split('').map((c) => HEX.indexOf(c));
  const sum = vals.reduce((a, b) => a + b, 0), red = reduceTo9(sum);
  const color = h.length === 6 ? '#' + h : h.length === 3 ? '#' + h.split('').map((c) => c + c).join('') : null;
  const decimal = h.length <= 12 ? parseInt(h, 16).toLocaleString('en-US') : null;
  return { hex: h, vals, sum, red, meaning: SUM_MEANING[red], color, decimal };
}

// The birth date written as DD MM YY reads as a six-digit hex colour.
export const birthHexColor = (p) => '#' + String(p.day).padStart(2, '0') + String(p.month).padStart(2, '0') + String((p.yearBE - 543) % 100).padStart(2, '0');

// ---------- เลขศาสตร์ชื่อ (Thai name numerology, Cheiro system as adapted by อ.พลูหลวง) ----------
// Letter values, checked against three Thai references that agree.
const LETTER_GROUPS = {
  1: 'กดถทภฤฦาุำ่', 2: 'ขชงบปเแู้', 3: 'ฆตฑฒฃ๋', 4: 'คธญรษะโิั',
  5: 'ฉฌณนมหฎฮฬึ', 6: 'จลวอใ', 7: 'ซศสีื๊', 8: 'ผฝพฟย็', 9: 'ฏฐไ์'
};
const EN_GROUPS = { 1: 'AIJQY', 2: 'BKR', 3: 'CGLS', 4: 'DMT', 5: 'EHNX', 6: 'UVW', 7: 'OZ', 8: 'FP' };
const LETTER_VAL = {};
for (const [v, chars] of Object.entries(LETTER_GROUPS)) for (const c of chars) LETTER_VAL[c] = +v;
for (const [v, chars] of Object.entries(EN_GROUPS)) for (const c of chars) LETTER_VAL[c] = +v;

// Totals from the โหราเลขศาสตร์ grouping (mahamongkol.com).
const BEST = [2, 4, 5, 6, 9, 14, 15, 19, 23, 24, 36, 41, 42, 45, 50, 51, 54, 55, 56, 59, 63, 65, 90, 95, 99, 100, 104, 105];
const MID = [32, 40, 44, 46, 64, 79, 89, 97, 98];
const NOT_WOMEN = [16, 17, 18, 19, 20, 109];
const NOT_MEN = [13, 23, 31, 32, 46, 64, 68, 86];
const DANGER = [27, 29, 30];
export const NUM_PLANET = { 1: 'อาทิตย์', 2: 'จันทร์', 3: 'อังคาร', 4: 'พุธ', 5: 'พฤหัสบดี', 6: 'ศุกร์', 7: 'เสาร์', 8: 'ราหู', 9: 'เกตุ' };

// Totals of 101–109 drop the middle zero; 110 and above keep the last two digits.
const normTotal = (n) => n > 100 && n < 110 ? 10 + (n - 100) : n >= 110 ? n % 100 : n;

export function nameValue(str) {
  const parts = [];
  for (const ch of (str || '').toUpperCase()) { if (LETTER_VAL[ch]) parts.push({ ch, v: LETTER_VAL[ch] }); }
  const total = parts.reduce((a, p) => a + p.v, 0);
  return { parts, total };
}
export function rateTotal(raw, gender) {
  const n = normTotal(raw), rev = +String(n).split('').reverse().join('');
  let level = BEST.includes(n) || BEST.includes(raw) ? 'best' : MID.includes(n) ? 'mid' : DANGER.includes(n) ? 'bad' : 'weak';
  const notes = [];
  if (gender === 'f' && NOT_WOMEN.includes(n)) { notes.push('ไม่เหมาะกับสุภาพสตรี เรื่องความรักและชีวิตคู่'); if (level === 'best') level = 'mid'; else level = 'weak'; }
  if (gender === 'm' && NOT_MEN.includes(n)) { notes.push('ไม่เหมาะกับสุภาพบุรุษ เรื่องชู้สาวและความมั่นคงของครอบครัว'); if (level === 'best') level = 'mid'; else level = 'weak'; }
  if (rev !== n && ((gender === 'f' && NOT_WOMEN.includes(rev)) || (gender === 'm' && NOT_MEN.includes(rev)))) notes.push(`เลขกลับ ${rev} อยู่ในกลุ่มที่ควรระวัง`);
  const root = reduceTo9(n);
  return { n, level, root, planet: NUM_PLANET[root], notes };
}
export const LEVEL_TH = { best: 'ให้คุณสูง', mid: 'ระดับกลาง', weak: 'ควรพิจารณา', bad: 'ไม่ส่งเสริม' };
const LEVEL_PTS = { best: 100, mid: 65, weak: 35, bad: 15 };

// อักษรประจำวัน (ทักษา): letters belong to the planet of their group.
const VOWELS = 'ะาำิีึืุูเแโใไัฤฦ';
const TAKSA_LETTERS = { 1: VOWELS, 2: 'กขฃคฅฆง', 3: 'จฉชซฌญ', 4: 'ฎฏฐฑฒณ', 8: 'ยรลว', 5: 'บปผฝพฟภม', 6: 'ศษสหฬอฮ', 7: 'ดตถทธน' };
export const taksaOf = (ch) => { for (const [p, s] of Object.entries(TAKSA_LETTERS)) if (s.includes(ch)) return +p; return null; };

export function analyzeName(first, last, { gender = '', avoidPlanet = null, goodPlanets = [] } = {}) {
  const f = nameValue(first), l = nameValue(last);
  if (!f.parts.length) return null;
  const full = { parts: [...f.parts, ...l.parts], total: f.total + l.total };
  const rows = [
    { th: 'ชื่อ', w: 0.4, ...f, rate: rateTotal(f.total, gender) },
    l.parts.length ? { th: 'นามสกุล', w: 0.2, ...l, rate: rateTotal(l.total, gender) } : null,
    l.parts.length ? { th: 'ชื่อ + นามสกุล', w: 0.4, ...full, rate: rateTotal(full.total, gender) } : null
  ].filter(Boolean);
  const wsum = rows.reduce((a, r) => a + r.w, 0);
  const score = Math.round(rows.reduce((a, r) => a + LEVEL_PTS[r.rate.level] * r.w, 0) / wsum);
  const kalakini = avoidPlanet ? [...new Set([...(first || ''), ...(last || '')].filter((c) => taksaOf(c) === avoidPlanet))] : [];
  const kalakiniFirst = avoidPlanet ? [...new Set([...(first || '')].filter((c) => taksaOf(c) === avoidPlanet))] : [];
  const lucky = [...new Set([...(first || '')].filter((c) => goodPlanets.includes(taksaOf(c))))];
  return { rows, score: kalakiniFirst.length ? Math.min(score, 45) : score, kalakini, kalakiniFirst, lucky };
}
