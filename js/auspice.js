// ฤกษ์ finder: ranks the coming days for an event, then picks the best ยาม inside each day.
// It combines Thai rules (ทักษา of the person, day of week, ข้างขึ้น/ข้างแรม, วันพระ)
// with the real sky (Moon's house and aspects, retrograde Mercury and Venus).
import { planetPositions, liveAspects, signOf, SIGNS } from './astro.js';
import { TH_PLANETS, posOf, yams, dayPlanet } from './thai.js';
import { lunarPhase } from './astro.js';

// For each event: which ทักษา positions of the day planet help, which weekdays tradition avoids,
// which natal houses the Moon should light up, which planets should be direct, and natal targets the Moon should touch kindly.
export const EVENTS = [
  { id: 'wedding', th: 'แต่งงาน', note: 'ฤกษ์มงคลสมรส ยกขันหมาก จดทะเบียน', pos: ['sri', 'montri', 'boriwan'], avoidDays: [3, 7], houses: [7, 5, 1], direct: ['venus'], targets: ['venus', 'moon', 'sun', 'asc'], waxing: 2, noHolyDay: true, partner: true },
  { id: 'ordain', th: 'บวช', note: 'อุปสมบท บรรพชา ทำบุญใหญ่', pos: ['montri', 'ayu', 'det'], avoidDays: [], houses: [9, 12, 1], direct: ['jupiter'], targets: ['jupiter', 'sun', 'moon'], waxing: 1, noHolyDay: false, early: true },
  { id: 'house', th: 'ขึ้นบ้านใหม่', note: 'ขึ้นบ้าน ย้ายเข้าคอนโด ลงเสาเอก', pos: ['mula', 'sri', 'boriwan'], avoidDays: [3, 7], houses: [4, 2], direct: ['venus'], targets: ['moon', 'venus', 'jupiter'], waxing: 2, noHolyDay: false },
  { id: 'business', th: 'เปิดร้าน กิจการ', note: 'เปิดร้าน เปิดบริษัท เปิดตัวสินค้า', pos: ['sri', 'det', 'montri'], avoidDays: [3], houses: [2, 10, 11], direct: ['mercury'], targets: ['jupiter', 'venus', 'sun', 'mercury'], waxing: 2, noHolyDay: false },
  { id: 'car', th: 'ออกรถ', note: 'รับรถใหม่ ออกรถป้ายแดง', pos: ['det', 'sri', 'ayu'], avoidDays: [3, 7], houses: [3, 2, 1], direct: ['mercury'], targets: ['mercury', 'venus', 'moon'], waxing: 1, noHolyDay: false },
  { id: 'contract', th: 'เซ็นสัญญา', note: 'ทำสัญญา ซื้อขายที่ดิน ยื่นเอกสารสำคัญ', pos: ['det', 'montri', 'sri'], avoidDays: [], houses: [10, 3, 7], direct: ['mercury'], targets: ['mercury', 'jupiter', 'sun'], waxing: 1, noHolyDay: false },
  { id: 'job', th: 'เริ่มงานใหม่', note: 'วันเริ่มงาน สัมภาษณ์ ยื่นใบสมัคร', pos: ['det', 'utsaha', 'montri'], avoidDays: [], houses: [10, 6], direct: ['mercury'], targets: ['sun', 'jupiter', 'saturn'], waxing: 1, noHolyDay: false },
  { id: 'travel', th: 'เดินทางไกล', note: 'เดินทางต่างประเทศ ย้ายถิ่น', pos: ['ayu', 'boriwan', 'det'], avoidDays: [], houses: [9, 3], direct: ['mercury'], targets: ['moon', 'jupiter', 'mercury'], waxing: 0, noHolyDay: false, early: true }
];

const DAY_NAME = (n) => TH_PLANETS[n].day;
const nm = (id, th) => id === 'sun' ? 'ดวงอาทิตย์' : id === 'moon' ? 'ดวงจันทร์' : id === 'asc' ? 'ลัคนา' : 'ดาว' + th;

// Approximate วันพระ: ขึ้น/แรม 8 ค่ำ, ขึ้น 15 ค่ำ, and the last day of the waning half.
function holyDay(date) {
  const ph = lunarPhase(date);
  if (ph.day === 8) return true;
  if (ph.waxing && ph.day === 15) return true;
  if (!ph.waxing && ph.day >= 14) {
    const next = lunarPhase(new Date(date.getTime() + 86400000));
    return next.waxing;
  }
  return false;
}

export function findAuspicious(chart, person, eventId, { days = 60, start = new Date(), partner = null } = {}) {
  const ev = EVENTS.find((e) => e.id === eventId);
  const results = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 10, 0);
    const owner = dayPlanet(d.getFullYear(), d.getMonth() + 1, d.getDate(), 10, false);
    const pos = posOf(person, owner);
    const good = [], warn = [];
    let score = 42;
    let blocked = false;

    // 1. Thai: the day must not be the person's (or the partner's) กาลกิณี.
    if (pos.id === 'kalakini') { blocked = true; warn.push(`${DAY_NAME(owner)}เป็นวันกาลกิณีของคุณ`); }
    if (partner && posOf(partner, owner).id === 'kalakini') { blocked = true; warn.push(`${DAY_NAME(owner)}เป็นวันกาลกิณีของคู่`); }
    const rank = ev.pos.indexOf(pos.id);
    if (rank >= 0) { score += 18 - rank * 4; good.push(`${DAY_NAME(owner)}เป็นวัน${pos.th}ของคุณ เด่นเรื่อง${pos.use}`); }
    else if (pos.tone === 2) { score += 6; good.push(`${DAY_NAME(owner)}เป็นวัน${pos.th}ของคุณ`); }
    if (partner) {
      const pp = posOf(partner, owner);
      if (ev.pos.includes(pp.id)) { score += 8; good.push(`เป็นวัน${pp.th}ของคู่ด้วย`); }
    }
    if (ev.avoidDays.includes(owner)) { score -= 14; warn.push(`ตามธรรมเนียมไม่นิยม${ev.th}${DAY_NAME(owner)}`); }

    // 2. Thai lunar: auspicious beginnings favour ข้างขึ้น; avoid จันทร์ดับ and (for weddings) วันพระ.
    const ph = lunarPhase(d);
    if (ph.name === 'จันทร์ดับ') { score -= 12; warn.push('ตรงกับจันทร์ดับ'); }
    else if (ph.waxing) { score += 4 * ev.waxing; if (ev.waxing) good.push(`ข้างขึ้น (${ph.th}) พลังกำลังเติบโต`); }
    else if (ev.waxing >= 2) { score -= 4; warn.push(`ข้างแรม (${ph.th})`); }
    if (ev.noHolyDay && holyDay(d)) { score -= 10; warn.push('ตรงกับวันพระ ไม่นิยมจัดงานมงคลสมรส'); }

    // 3. Sky: retrograde planets that matter for this event.
    const sky = planetPositions(d);
    for (const id of ev.direct) {
      if (sky[id].retro) { score -= id === 'mercury' ? 12 : 10; warn.push(`ดาว${id === 'mercury' ? 'พุธ' : id === 'venus' ? 'ศุกร์' : 'พฤหัส'}ถอยหลัง`); }
    }
    // 4. Moon's natal house and the Moon's aspects to the planets that matter.
    const moonHouse = chart.houseOf(sky.moon.lon);
    const hRank = ev.houses.indexOf(moonHouse);
    if (hRank >= 0) { score += 10 - hRank * 3; good.push(`ดวงจันทร์ผ่านภพ ${moonHouse} ของคุณ (ราศี${SIGNS[signOf(sky.moon.lon)].th})`); }
    if ([8, 12].includes(moonHouse) && !ev.houses.includes(moonHouse)) { score -= 6; warn.push(`ดวงจันทร์ผ่านภพ ${moonHouse}`); }
    const asp = liveAspects(chart, d, { n: 20, exact: false, only: ['moon', 'venus', 'jupiter', 'sun', 'mars', 'saturn'] });
    for (const x of asp) {
      if (!ev.targets.includes(x.target.id)) continue;
      const benefic = ['venus', 'jupiter', 'moon', 'sun'].includes(x.mover.id);
      const w = Math.min(1, x.strength);
      if (x.asp.nature > 0 && benefic) { score += 7 * w; if (w > 0.4) good.push(`${nm(x.mover.id, x.mover.th)}จรทำมุม${x.asp.th}กับ${nm(x.target.id, x.target.th)}ของคุณ`); }
      else if (x.asp.nature < 0 && ['mars', 'saturn'].includes(x.mover.id)) { score -= 8 * w; if (w > 0.4) warn.push(`${nm(x.mover.id, x.mover.th)}จร${x.asp.th}${nm(x.target.id, x.target.th)}ของคุณ`); }
      else if (x.asp.nature < 0 && x.mover.id === 'moon') score -= 3 * w;
    }

    // 5. Best ยาม inside the day: daytime ceremonies only, preferring the event's positions.
    const slots = yams(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9), person)
      .filter((y) => !y.night && (ev.early || y.start.getHours() >= 7) && y.start.getHours() < 16)
      .filter((y) => y.pos.id !== 'kalakini' && !(partner && posOf(partner, y.planet).id === 'kalakini'))
      .map((y) => ({ ...y, r: ev.pos.includes(y.pos.id) ? ev.pos.indexOf(y.pos.id) : y.pos.tone === 2 ? 3 : 5 }))
      .sort((a, b) => a.r - b.r || a.start - b.start);
    const best = slots[0] || null;
    if (best && best.r <= 3) score += 4;

    if (blocked) continue;
    results.push({ date: d, owner, score: Math.round(Math.max(0, Math.min(100, score))), good, warn, phase: ph, best, alt: slots.slice(1, 3) });
  }
  results.sort((a, b) => b.score - a.score || a.date - b.date);
  return { event: ev, results };
}
