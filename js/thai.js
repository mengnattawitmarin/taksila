// Thai auspice system: ทักษา (lucky colours and numbers), ลัคนาแบบไทย and ยามอัฏฐกาล.
// Everything here follows the traditional Thai rules; it complements the Western chart in astro.js.
import { rev } from './astro.js';

// Planets in the Thai numbering: 1 อาทิตย์ ... 7 เสาร์, 8 ราหู
export const TH_PLANETS = {
  1: { th: 'อาทิตย์', day: 'วันอาทิตย์', color: 'แดง', hex: '#D0493D' },
  2: { th: 'จันทร์', day: 'วันจันทร์', color: 'เหลือง ครีม', hex: '#E9CF6B' },
  3: { th: 'อังคาร', day: 'วันอังคาร', color: 'ชมพู', hex: '#E592B2' },
  4: { th: 'พุธ', day: 'วันพุธ', color: 'เขียว', hex: '#53A56F' },
  5: { th: 'พฤหัสบดี', day: 'วันพฤหัสบดี', color: 'ส้ม แสด', hex: '#E58A3A' },
  6: { th: 'ศุกร์', day: 'วันศุกร์', color: 'ฟ้า น้ำเงิน', hex: '#5E92DA' },
  7: { th: 'เสาร์', day: 'วันเสาร์', color: 'ม่วง', hex: '#8660BF' },
  8: { th: 'ราหู', day: 'วันพุธกลางคืน', color: 'เทา ดำ น้ำตาล', hex: '#7D766C' }
};

// Clockwise order of the ทักษา wheel, and the eight positions counted from the owner.
const WHEEL = [1, 2, 3, 4, 7, 5, 8, 6];
export const POSITIONS = [
  { id: 'boriwan', th: 'บริวาร', use: 'คนรอบตัว ครอบครัว ลูกน้อง', tone: 1 },
  { id: 'ayu', th: 'อายุ', use: 'สุขภาพ ความเป็นอยู่', tone: 1 },
  { id: 'det', th: 'เดช', use: 'การงาน อำนาจ ชื่อเสียง', tone: 2 },
  { id: 'sri', th: 'ศรี', use: 'การเงิน โชคลาภ เสน่ห์', tone: 2 },
  { id: 'mula', th: 'มูละ', use: 'ทรัพย์สิน เงินเก็บ', tone: 1 },
  { id: 'utsaha', th: 'อุตสาหะ', use: 'ความขยัน การเรียน', tone: 1 },
  { id: 'montri', th: 'มนตรี', use: 'ผู้ใหญ่อุปถัมภ์ คนช่วยเหลือ', tone: 2 },
  { id: 'kalakini', th: 'กาลกิณี', use: 'สิ่งที่ควรเลี่ยง', tone: -1 }
];

// Returns the eight positions with the planet that sits in each, starting from `owner`.
export function thaksa(owner) {
  const start = WHEEL.indexOf(owner);
  return POSITIONS.map((pos, i) => ({ ...pos, planet: WHEEL[(start + i) % 8] }));
}
export const posOf = (owner, planet) => thaksa(owner).find((x) => x.planet === planet);
const at = (owner, id) => thaksa(owner).find((x) => x.id === id).planet;

// Thai day planet. The Thai day starts at sunrise (taken as 06:00), so 00:00–05:59 still belongs
// to the previous day; Wednesday from 18:00 is ราหู (พุธกลางคืน).
const JS_TO_TH = [1, 2, 3, 4, 5, 6, 7];
export function dayPlanet(y, m, d, hour = 12, rahu = true) {
  let wd = new Date(y, m - 1, d).getDay();
  if (hour < 6) wd = (wd + 6) % 7;
  const p = JS_TO_TH[wd];
  return rahu && p === 4 && (hour >= 18 || hour < 6) ? 8 : p;
}
export function birthPlanet(profile) {
  const h = profile.timeKnown ? profile.hour : 12;
  return dayPlanet(profile.yearBE - 543, profile.month, profile.day, h);
}

// Thai astrology uses the sidereal zodiac. Lahiri ayanamsa: 23.853° at J2000, +50.29″ per year.
export const ayanamsa = (date) => 23.853 + ((date.getTime() - Date.UTC(2000, 0, 1, 12)) / 31557600000) * (50.29 / 3600);
// Traditional Thai sign lords (กุมภ์ uses เสาร์; ราหู is its co-lord).
const SIGN_LORD = [3, 6, 4, 2, 1, 4, 6, 3, 5, 7, 7, 5];
export function thaiLagna(chart) {
  if (chart.asc == null || !chart.timeKnown) return null;
  const lon = rev(chart.asc - ayanamsa(chart.utc));
  const sign = Math.floor(lon / 30);
  return { lon, sign, deg: lon - sign * 30, lord: SIGN_LORD[sign] };
}

// Lucky colours and numbers for an owner planet.
export function luckOf(owner) {
  const t = thaksa(owner);
  const pick = (id) => t.find((x) => x.id === id).planet;
  return {
    owner,
    wheel: t,
    money: pick('sri'), work: pick('det'), patron: pick('montri'), health: pick('ayu'), people: pick('boriwan'),
    avoid: pick('kalakini'),
    numbers: [pick('sri'), pick('det'), pick('montri'), owner].filter((n, i, a) => a.indexOf(n) === i)
  };
}

// The shirt-colour table for a given day: owner is the day's planet.
export function dayColors(date = new Date()) {
  const owner = dayPlanet(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), false);
  return { owner, ...luckOf(owner) };
}

// ยามอัฏฐกาล: 8 watches by day (06:00–18:00) and 8 by night (18:00–06:00), 1 ชั่วโมงครึ่ง each.
// Day watches start with the day planet and step +5; night watches step +4 (wrap at 7).
export function yams(date, person) {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (date.getHours() < 6) base.setDate(base.getDate() - 1);
  const p = JS_TO_TH[base.getDay()];
  const step = (x, k) => ((x - 1 + k) % 7) + 1;
  const out = [];
  for (const [night, k, h0] of [[false, 5, 6], [true, 4, 18]]) {
    let planet = p;
    for (let i = 0; i < 8; i++) {
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h0, 0);
      start.setMinutes(start.getMinutes() + i * 90);
      const end = new Date(start.getTime() + 90 * 60000);
      const pos = posOf(person, planet);
      out.push({ night, i, planet, start, end, pos });
      planet = step(planet, k);
    }
  }
  return out;
}

const YAM_USE = {
  sri: 'เหมาะกับเรื่องเงิน เปิดร้าน โอนเงิน ซื้อขาย เจรจาความรัก',
  det: 'เหมาะกับงาน สัมภาษณ์ ยื่นเอกสาร ประชุมสำคัญ',
  montri: 'เหมาะกับขอความช่วยเหลือ พบผู้ใหญ่ ขอพร',
  boriwan: 'เหมาะกับพบปะครอบครัว ทีมงาน ลูกค้า',
  ayu: 'เหมาะกับดูแลสุขภาพ ไปหาหมอ ออกกำลังกาย',
  mula: 'เหมาะกับออม ลงทุนระยะยาว เรื่องบ้านที่ดิน',
  utsaha: 'เหมาะกับเรียน ฝึกฝน งานที่ใช้ความพยายาม',
  kalakini: 'เลี่ยงเริ่มเรื่องใหม่ เซ็นสัญญา หรือเดินทางไกล'
};
export const yamUse = (pos) => YAM_USE[pos.id];
