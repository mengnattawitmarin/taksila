// ทางแก้ดวง: merit, temples, rites and lucky windows that every reading in the app can point to.
// Sources are listed in docs/remedy-research.md. Everything here is tradition and belief, presented as such.
import { planetPositions, angDist, rev, SIGNS } from './astro.js';
import { MONTHS_SHORT } from './data.js';

// ---------- ทำบุญตามดาว (Thai planet number 1..8 = Sun..Sat, 8 = Rahu) ----------
// Source: GotoKnow ทำบุญตามวันเกิด (items, charity, Buddha posture); counts are the planet strengths used for chanting.
export const DAY_MERIT = {
  1: { day: 'อาทิตย์', give: 'ของให้แสงสว่าง เช่น ไฟฉาย เทียน หลอดไฟ', charity: 'ช่วยคนตาบอด หรือโรงพยาบาลโรคตาและหัวใจ', buddha: 'ปางถวายเนตร', count: 6, chant: 'day-sun' },
  2: { day: 'จันทร์', give: 'แก้วน้ำ แจกัน หรือของใส', charity: 'มูลนิธิช่วยเหลือสตรี', buddha: 'ปางห้ามญาติ', count: 15, chant: 'day-mon' },
  3: { day: 'อังคาร', give: 'ของใช้ทำจากเหล็ก กรรไกร แปรงสีฟัน พัดลม', charity: 'ผู้พิการทางการพูด หรือผู้ป่วยโรคลมชัก', buddha: 'ปางไสยาสน์', count: 8, chant: 'day-tue' },
  4: { day: 'พุธ', give: 'สมุด ปากกา ดินสอ', charity: 'ผู้พิการทางการได้ยิน โรงเรียนคนหูหนวก', buddha: 'ปางอุ้มบาตร', count: 17, chant: 'day-wed' },
  5: { day: 'พฤหัสบดี', give: 'ผ้าไตรจีวร หนังสือธรรมะ ตู้ยา', charity: 'โรงพยาบาลสงฆ์ บริจาคข้าวสาร เสื้อผ้า ผ้าห่ม', buddha: 'ปางสมาธิ', count: 19, chant: 'day-thu' },
  6: { day: 'ศุกร์', give: 'นาฬิกา ระฆัง ย่าม ดอกไม้หอม', charity: 'เด็กด้อยโอกาส', buddha: 'ปางรำพึง', count: 21, chant: 'day-fri' },
  7: { day: 'เสาร์', give: 'ร่ม ไม้กวาด กระเบื้องมุงหลังคา', charity: 'โรงพยาบาลจิตเวช', buddha: 'ปางนาคปรก', count: 10, chant: 'day-sat' },
  8: { day: 'พุธกลางคืน (ราหู)', give: 'พัดลม สื่อธรรมะ ยาหอม และทำบุญค่าไฟหรือหลอดไฟให้วัด', charity: 'มูลนิธิด้านบำบัดยาเสพติด', buddha: 'ปางป่าเลไลย์', count: 12, chant: 'day-rahu' }
};
export const PLANET_NO = { sun: 1, moon: 2, mars: 3, mercury: 4, jupiter: 5, venus: 6, saturn: 7, uranus: 8, neptune: 8, pluto: 8 };

// ---------- extra rites for heavy periods ----------
export const RITES = {
  rahu: { ic: '☊', th: 'ไหว้พระราหู สะเดาะเคราะห์', d: 'คืนวันพุธ ไหว้นอกบ้าน หันทิศตะวันตกเฉียงเหนือ ของดำ 8 อย่าง (ไก่ดำ กาแฟดำ เฉาก๊วย งาดำ ถั่วดำ ข้าวเหนียวดำ ปลาดุก ไข่เยี่ยวม้า) ธูป 8 ดอก แล้วทำบุญค่าไฟหรือหลอดไฟให้วัด', src: 'Wongnai: ไหว้พระราหู' },
  coffin: { ic: '⚱', th: 'ทำบุญโลงศพ', d: 'บริจาคโลงศพให้ผู้เสียชีวิตไร้ญาติ เชื่อว่าช่วยให้หนักเป็นเบา ต้านเคราะห์ใหญ่ ทำได้ที่มูลนิธิร่วมกตัญญู หน้าวัดหัวลำโพง ถ.พระราม 4 (เปิด 24 ชม. ใกล้ MRT สามย่าน) เขียนชื่อลงกระดาษสีชมพู บริจาคตามศรัทธา', src: 'TrueID: ทำบุญโลงศพ วัดหัวลำโพง' },
  release: { ic: '≋', th: 'ปล่อยปลา ปล่อยสัตว์', d: 'อภัยทานคือให้ชีวิต สวดคาถาปล่อยปลาแล้วปล่อยในแหล่งน้ำที่เหมาะกับชนิดสัตว์ ไม่ปล่อยสัตว์ต่างถิ่น', chant: 'release' },
  blood: { ic: '♥', th: 'บริจาคโลหิต', d: 'ทานที่ช่วยชีวิตคนได้จริง ตามความเชื่อถือเป็นการต่ออายุให้ทั้งผู้รับและผู้ให้ ทำได้ที่สภากาชาดไทยหรือโรงพยาบาลใกล้บ้าน' },
  suebchata: { ic: '✺', th: 'สืบชะตา', d: 'พิธีล้านนาเพื่อต่ออายุ เสริมบารมี ปัดเคราะห์และโรคภัย ใช้ต้นกล้วย ต้นอ้อย สายสิญจน์ ทำโดยพระ นิยมทำตอนวันเกิด หลังป่วยหนัก หรือดวงตก ติดต่อวัดใกล้บ้านได้ โดยเฉพาะวัดทางภาคเหนือ', src: 'GotoKnow: พิธีสืบชะตา' },
  sangkhathan: { ic: '◇', th: 'ถวายสังฆทาน', d: 'ถวายของใช้จำเป็นแด่พระสงฆ์ไม่เจาะจงรูป แล้วกรวดน้ำอุทิศบุญให้เจ้ากรรมนายเวร', chant: 'kruadnam' },
  khama: { ic: '☸', th: 'ขอขมาพระรัตนตรัย', d: 'ขอขมาสิ่งที่อาจล่วงเกินทั้งตั้งใจและไม่ตั้งใจ ทำได้ทุกวันก่อนนอน', chant: 'khama' }
};

// ---------- temples ----------
// ไหว้พระ 9 วัด กรุงเทพฯ and what each is known for (Wongnai, 2026).
export const TEMPLES = [
  { th: 'วัดพระแก้ว', full: 'วัดพระศรีรัตนศาสดาราม', for: ['work', 'any'], wish: 'ทุกเรื่อง โดยเฉพาะการงานและความมั่นคง' },
  { th: 'วัดบวรนิเวศ', full: 'วัดบวรนิเวศวิหาร', for: ['work', 'win'], wish: 'ความสำเร็จในชีวิต' },
  { th: 'วัดภูเขาทอง', full: 'วัดสระเกศ', for: ['study', 'work'], wish: 'การเรียน การงาน สติปัญญา' },
  { th: 'วัดกัลยาณมิตร', full: 'วัดกัลยาณมิตรวรมหาวิหาร (หลวงพ่อโต ซำปอฮุดกง)', for: ['money', 'luck'], wish: 'โชคลาภ การค้าขาย ธุรกิจ' },
  { th: 'วัดโพธิ์', full: 'วัดพระเชตุพนวิมลมังคลาราม', for: ['love', 'bad', 'health'], wish: 'ความรัก สะเดาะเคราะห์' },
  { th: 'วัดชนะสงคราม', full: 'วัดชนะสงครามราชวรมหาวิหาร', for: ['win', 'bad', 'travel'], wish: 'ชนะอุปสรรค ความปลอดภัย' },
  { th: 'วัดสุทัศน์', full: 'วัดสุทัศนเทพวราราม', for: ['study', 'work', 'win'], wish: 'การเรียน การงาน ขจัดอุปสรรค' },
  { th: 'วัดระฆัง', full: 'วัดระฆังโฆสิตาราม (สมเด็จพระพุฒาจารย์โต)', for: ['love', 'boss', 'fame'], wish: 'ชื่อเสียง ความรัก เมตตามหานิยม' },
  { th: 'ศาลหลักเมือง', full: 'ศาลหลักเมืองกรุงเทพฯ', for: ['luck', 'home', 'travel', 'money'], wish: 'เริ่มงานใหม่ ความเจริญ ความปลอดภัย โชคลาภ' }
];
export const templesFor = (topic) => TEMPLES.filter((t) => t.for.includes(topic)).slice(0, 3);

// พระธาตุประจำปีเกิด (KTC), index 0 = ชวด
export const NAKSHAT = ['ชวด', 'ฉลู', 'ขาล', 'เถาะ', 'มะโรง', 'มะเส็ง', 'มะเมีย', 'มะแม', 'วอก', 'ระกา', 'จอ', 'กุน'];
export const NAKSHAT_ANIMAL = ['หนู', 'วัว', 'เสือ', 'กระต่าย', 'งูใหญ่', 'งูเล็ก', 'ม้า', 'แพะ', 'ลิง', 'ไก่', 'สุนัข', 'หมู'];
export const PAGODA = [
  'พระธาตุศรีจอมทอง (เชียงใหม่)', 'พระธาตุลำปางหลวง (ลำปาง)', 'พระธาตุช่อแฮ (แพร่)', 'พระธาตุแช่แห้ง (น่าน)',
  'พระธาตุวัดพระสิงห์ (เชียงใหม่)', 'พระเจดีย์พุทธคยา หรือองค์จำลองที่วัดอนาลโยทิพยาราม (พะเยา)', 'พระธาตุชเวดากอง หรือพระบรมธาตุเมืองตาก (ตาก)', 'พระธาตุดอยสุเทพ (เชียงใหม่)',
  'พระธาตุพนม (นครพนม)', 'พระธาตุหริภุญชัย (ลำพูน)', 'พระธาตุเกตุแก้วจุฬามณี วัดเกตการาม (เชียงใหม่)', 'พระธาตุดอยตุง (เชียงราย)'
];

// ---------- Chinese New Year and ปีชง ----------
// Chinese New Year = the second new moon after the December solstice, in China time (UTC+8).
const elong = (t) => { const p = planetPositions(t); return rev(p.moon.lon - p.sun.lon); };
function nextNewMoon(t) {
  let a = new Date(t.getTime()), e0 = elong(a);
  for (let i = 0; i < 40; i++) {
    const b = new Date(a.getTime() + 86400000), e1 = elong(b);
    if (e1 < e0) { // wrapped past 360 → new moon between a and b
      let lo = a.getTime(), hi = b.getTime();
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (elong(new Date(m)) > 180) lo = m; else hi = m; }
      return new Date(hi);
    }
    a = b; e0 = e1;
  }
  return null;
}
const cnyCache = {};
export function chineseNewYear(yCE) {
  if (cnyCache[yCE]) return cnyCache[yCE];
  const t = new Date(Date.UTC(yCE - 1, 11, 21, 12)); // December solstice (±1 day)
  const nm1 = nextNewMoon(t), nm2 = nextNewMoon(new Date(nm1.getTime() + 2 * 86400000));
  const local = new Date(nm2.getTime() + 8 * 3600000); // China date
  return (cnyCache[yCE] = { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() });
}
const nakIdx = (yCE) => ((yCE - 4) % 12 + 12) % 12;
// Year animal counted from Chinese New Year (the convention used for ปีชง).
export function nakshatOf(profile) {
  const y = profile.yearBE - 543, c = chineseNewYear(y);
  const before = profile.month < c.m || (profile.month === c.m && profile.day < c.d);
  return nakIdx(before ? y - 1 : y);
}
export function currentNakshat(now = new Date()) {
  const y = now.getFullYear(), c = chineseNewYear(y);
  const before = now.getMonth() + 1 < c.m || (now.getMonth() + 1 === c.m && now.getDate() < c.d);
  return { idx: nakIdx(before ? y - 1 : y), yCE: before ? y - 1 : y };
}
// Shared clashes as published for ปีมะเมีย 2569 (กรุงศรี Plearn Plearn); other years use direct clash and self-clash only.
const SHARED = { 2026: { 3: 'ชงร่วม เรื่องเคราะห์กรรม', 9: 'ชงร่วม เรื่องสุขภาพ' } };
export function chongOf(profile, now = new Date()) {
  const me = nakshatOf(profile), cur = currentNakshat(now);
  const opp = (cur.idx + 6) % 12;
  let level = null;
  if (me === opp) level = 'ชงตรง (หนักที่สุด)';
  else if (me === cur.idx) level = 'ชงตัวเอง (ปีเกิดตรงกับปีนักษัตร)';
  else if (SHARED[cur.yCE] && SHARED[cur.yCE][me]) level = SHARED[cur.yCE][me];
  return { me, year: cur.idx, yCE: cur.yCE, level };
}
export const CHONG_FIX = 'ไหว้องค์ไท้ส่วยเอี๊ยแก้ชงที่วัดมังกรกมลาวาส (เล่งเน่ยยี่) วัดเล่งเน่ยยี่ 2 (นนทบุรี) วัดทิพยวารีวิหาร หรือศาลเจ้าพ่อเสือ เขียนใบฝากดวงแล้วปัดตัว 12 ครั้ง หรือทำบุญบริจาคโลหิต ปล่อยปลา แทนได้';

// ---------- ช่วงโชคลาภ / ช่วงระวัง (next 12 months) ----------
// Jupiter trine, sextile or conjunct natal Sun, Moon, Venus, Jupiter or the Ascendant → luck window.
// Jupiter entering houses 2, 5 or 11 → money window. Saturn square/opposite Sun, Moon or ASC → caution window.
const GOOD = [{ a: 0, th: 'ร่วม' }, { a: 60, th: 'หกสิบองศา' }, { a: 120, th: 'ตรีโกณ' }];
const HARD = [{ a: 90, th: 'ตั้งฉาก' }, { a: 180, th: 'เล็งกัน' }];
const winCache = {};
export function luckWindows(chart, from = new Date(), days = 365) {
  const key = chart.utc.getTime() + ':' + from.toDateString();
  if (winCache[key]) return winCache[key];
  const targets = chart.planets.filter((p) => ['sun', 'moon', 'venus', 'jupiter'].includes(p.id)).map((p) => ({ id: p.id, th: p.th, lon: p.lon }));
  if (chart.asc != null) targets.push({ id: 'asc', th: 'ลัคนา', lon: chart.asc });
  const open = {}, all = [];
  const mark = (k, t, info) => { const r = open[k]; if (r && t - r.end <= 4 * 86400000) r.end = t; else { const w = { ...info, start: t, end: t }; open[k] = w; all.push(w); } };
  for (let i = 0; i <= days; i += 3) {
    const t = from.getTime() + i * 86400000, pos = planetPositions(new Date(t));
    const ju = pos.jupiter.lon, sa = pos.saturn.lon;
    for (const tg of targets) {
      for (const g of GOOD) if (Math.abs(angDist(ju, tg.lon) - g.a) <= 3) mark('j' + tg.id + g.a, t, { kind: 'luck', planet: 'jupiter', target: tg.th, asp: g.th, area: { sun: 'งานและชื่อเสียง', moon: 'ครอบครัว ใจสบาย', venus: 'เงินทองและความรัก', jupiter: 'โอกาสใหญ่ รอบ 12 ปี', asc: 'ตัวเอง ภาพลักษณ์ โอกาสใหม่' }[tg.id] });
      if (['sun', 'moon', 'asc'].includes(tg.id)) for (const h of HARD) if (Math.abs(angDist(sa, tg.lon) - h.a) <= 2.5) mark('s' + tg.id + h.a, t, { kind: 'care', planet: 'saturn', target: tg.th, asp: h.th, area: { sun: 'งานและสุขภาพ', moon: 'อารมณ์และครอบครัว', asc: 'ตัวเองและสุขภาพ' }[tg.id] });
    }
    const hj = chart.houseOf(ju);
    if ([2, 5, 11].includes(hj)) mark('jh' + hj, t, { kind: 'money', planet: 'jupiter', target: 'ภพ ' + hj, asp: 'โคจรผ่าน', area: { 2: 'เงินได้ ทรัพย์สิน', 5: 'โชคลาภ ความรัก การลงทุน', 11: 'ลาภจากเพื่อนและเครือข่าย' }[hj] });
  }
  all.sort((a, b) => a.start - b.start);
  return (winCache[key] = all.map((w) => ({ ...w, start: new Date(w.start), end: new Date(w.end) })));
}
const dm = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}`;
export const windowRange = (w) => (w.start.getTime() === w.end.getTime() ? dm(w.start) : `${dm(w.start)} – ${dm(w.end)}`);

// ---------- one remedy plan for any bad reading ----------
// planetNo: the Thai planet causing trouble (or the person's birth planet when nothing specific);
// topic: work | money | love | health | study | travel | home | bad | luck | win; level: 1 light, 2 medium, 3 heavy.
const TOPIC_TH = { work: 'การงาน', money: 'การเงิน', love: 'ความรัก', health: 'สุขภาพ', study: 'การเรียน', travel: 'การเดินทาง', home: 'บ้านและครอบครัว', bad: 'เคราะห์', luck: 'โชคลาภ', win: 'อุปสรรค', boss: 'ผู้ใหญ่' };
export function remedyPlan({ planetNo = 1, topic = 'bad', level = 2, reason = '' } = {}) {
  const m = DAY_MERIT[planetNo] || DAY_MERIT[1];
  const steps = [
    { ic: '☸', k: 'สวด', t: `สวดบทประจำวัน${m.day} ${m.count} จบ`, d: 'สวดทุกวันจนกว่าช่วงนี้จะผ่าน จำนวนจบตามกำลังดาว', chant: m.chant },
    { ic: '◇', k: 'ทำบุญ', t: `ถวาย${m.give}`, d: `ของถวายประจำดาววัน${m.day} ตามตำราทำบุญตามวันเกิด` },
    { ic: '♡', k: 'ทำทาน', t: m.charity, d: 'ทานที่ตรงกับดาว ช่วยผ่อนเรื่องหนักให้เบาลง' },
    { ic: '⌂', k: 'ไหว้พระ', t: `พระพุทธรูป${m.buddha}`, d: `พระประจำวัน${m.day} ไหว้ได้ที่วัดใกล้บ้านที่มีพระประจำวันครบ 8 ปาง` }
  ];
  const tp = templesFor(topic).length ? templesFor(topic) : templesFor('any');
  steps.push({ ic: '⛩', k: 'วัดแนะนำ', map: 'temple', t: tp.map((x) => x.th).join(' · '), d: tp.map((x) => `${x.th}: ${x.wish}`).join(' / ') });
  if (level >= 2) steps.push({ ...RITES.release, k: 'เสริม', t: RITES.release.th, map: 'release' });
  if (planetNo === 8 || planetNo === 7) steps.push({ ...RITES.rahu, k: 'สะเดาะเคราะห์', t: RITES.rahu.th });
  if (level >= 3) { steps.push({ ...RITES.coffin, k: 'เคราะห์หนัก', t: RITES.coffin.th, map: 'found' }); steps.push({ ...RITES.suebchata, k: 'ต่ออายุ', t: RITES.suebchata.th }); }
  if (topic === 'health') steps.push({ ...RITES.blood, k: 'สุขภาพ', t: RITES.blood.th, map: 'blood' });
  steps.push({ ...RITES.khama, k: 'ทุกวัน', t: RITES.khama.th });
  return { title: `ทางแก้${TOPIC_TH[topic] ? 'เรื่อง' + TOPIC_TH[topic] : 'ดวง'}`, reason, level, steps };
}
export const topicTh = (k) => TOPIC_TH[k] || k;
