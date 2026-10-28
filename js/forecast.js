// Unified daily forecast: one score per day that every screen shares (home card, opening sheet, 7-day strip).
// It weighs five readings of the same day:
//   สากล 40%   Western transits to the natal chart (aspects of the fast planets + the four life areas)
//   ไทย 25%    Thai sidereal transits counted from the Thai ลัคนา (ภพตนุ … วินาศ): Moon, Jupiter, Saturn, Mars
//   ทักษา 20%  the day planet's ทักษา position from the person's birth-day planet
//   เลข 10%    numerology "personal day" (birth day + month + today's date)
//   จันทรคติ 5% the Thai lunar day (ข้างขึ้น/แรม, วันพระ, ฤกษ์ใหญ่, อุปราคา)
// It also turns the reading into plain-language advice that links to other rooms of the app.
import { lonOf, signOf, SIGNS, HOUSES } from './astro.js';
import { TH_PLANETS, posOf, dayPlanet, birthPlanet, thaiLagna, ayanamsa, luckOf } from './thai.js';
import { thaiLunar } from './lunar.js';
import { reduceTo9 } from './numerology.js';
import { TEMPLES } from './remedy.js';
import { MU_PLACES } from './places.js';

export const FC_WEIGHTS = { west: 0.4, thai: 0.25, thaksa: 0.2, num: 0.1, lunar: 0.05 };
export const TH_HOUSE = ['ตนุ', 'กดุมภะ', 'สหัชชะ', 'พันธุ', 'ปุตตะ', 'อริ', 'ปัตนิ', 'มรณะ', 'ศุภะ', 'กัมมะ', 'ลาภะ', 'วินาศ'];
const TH_HOUSE_USE = ['ตัวเอง', 'เงินทอง', 'พี่น้อง การติดต่อ', 'บ้าน ครอบครัว', 'ความรัก ลูก', 'ศัตรู สุขภาพ', 'คู่ครอง หุ้นส่วน', 'เรื่องไม่คาดคิด', 'โชค ผู้ใหญ่', 'การงาน', 'ลาภ รายได้', 'ความสูญเสีย'];
// Moon's sidereal house from the Thai ลัคนา: the classic good (ศุภะ ลาภะ ปุตตะ กดุมภะ กัมมะ) and hard (อริ มรณะ วินาศ) houses.
const MOON_TH = [60, 70, 60, 60, 72, 38, 62, 35, 75, 70, 80, 40];
const PDAY_TH = ['', 'เริ่มต้นสิ่งใหม่', 'ร่วมมือ ประสานงาน', 'พบปะ สื่อสาร สร้างสรรค์', 'ลงแรง จัดระเบียบ', 'เปลี่ยนแปลง เดินทาง', 'ครอบครัว ความรัก ดูแลคนอื่น', 'พักใจ ทบทวน ภาวนา', 'เงิน อำนาจ ผลงาน', 'ปิดงานเก่า ให้อภัย ทำบุญ'];
const PDAY_SC = [0, 70, 55, 68, 58, 65, 66, 50, 72, 56];
const CAT_KEY = ['love', 'work', 'money', 'health'];

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const digitSum = (n) => String(n).split('').reduce((a, b) => a + +b, 0);
const sid = (id, d) => ((lonOf(id, d) - ayanamsa(d)) % 360 + 360) % 360;
// House (1–12) of a sidereal longitude counted whole-sign from a sign index.
const houseFrom = (lon, sign) => ((Math.floor(lon / 30) - sign + 12) % 12) + 1;

// Base sign for Thai transits: ลัคนา if the birth time is known, otherwise the natal Sun's sidereal sign.
function thaiBase(chart) {
  const lg = thaiLagna(chart);
  if (lg) return { sign: lg.sign, by: 'ลัคนา' };
  const sun = chart.planets.find((p) => p.id === 'sun');
  return { sign: Math.floor((((sun.lon - ayanamsa(chart.utc)) % 360) + 360) % 360 / 30), by: 'ราศีเกิด' };
}

export function personalDay(profile, date) {
  const n = reduceTo9(digitSum(profile.day) + digitSum(profile.month) + digitSum(date.getFullYear()) + digitSum(date.getMonth() + 1) + digitSum(date.getDate()));
  return { n, th: PDAY_TH[n], score: PDAY_SC[n] };
}

// w is one entry of weekAhead(): { date, scores, tone, top, moonHouse, ... }.
export function forecastDay(chart, profile, w) {
  const d = w.date;
  // 1. Western
  const catAvg = w.scores.reduce((a, s) => a + s.score, 0) / w.scores.length;
  const west = Math.round(0.55 * ((catAvg - 1) / 4) * 100 + 0.45 * (50 + 40 * Math.tanh((w.tone || 0) / 4)));
  const lead = w.top && w.top[0];
  // 2. Thai sidereal transits from the ลัคนา
  const base = thaiBase(chart);
  const mH = houseFrom(sid('moon', d), base.sign), jH = houseFrom(sid('jupiter', d), base.sign);
  const sH = houseFrom(sid('saturn', d), base.sign), maH = houseFrom(sid('mars', d), base.sign);
  let thai = MOON_TH[mH - 1];
  const thaiNotes = [`จันทร์จรภพ${TH_HOUSE[mH - 1]} (${TH_HOUSE_USE[mH - 1]})`];
  if ([2, 5, 7, 9, 11].includes(jH)) { thai += 6; thaiNotes.push(`พฤหัสจรภพ${TH_HOUSE[jH - 1]}หนุน`); }
  if ([1, 4, 8, 12].includes(sH)) { thai -= 8; thaiNotes.push(sH === 1 ? 'เสาร์จรทับลัคนา' : `เสาร์จรภพ${TH_HOUSE[sH - 1]}`); }
  if ([1, 8].includes(maH)) { thai -= 4; thaiNotes.push(`อังคารจรภพ${TH_HOUSE[maH - 1]}`); }
  thai = clamp(thai, 15, 95);
  // 3. ทักษา of the day
  const bp = birthPlanet(profile), dp = dayPlanet(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, false);
  const pos = posOf(bp, dp);
  const thaksa = pos.id === 'kalakini' ? 28 : pos.tone === 2 ? 82 : 62;
  // 4. Numerology personal day
  const pd = personalDay(profile, d);
  // 5. Thai lunar day
  const lun = thaiLunar(d);
  let lunar = 55;
  const lunNotes = [];
  if (lun) {
    if (lun.waxing) lunar += 6;
    if (lun.newMoon) { lunar -= 6; lunNotes.push('จันทร์ดับ'); }
    if (lun.holy) lunNotes.push('วันพระ');
    for (const e of lun.events) { lunNotes.push(e.th); lunar += e.k === 'sky' ? -8 : 10; }
  }
  lunar = clamp(lunar, 20, 90);
  const total = Math.round(west * FC_WEIGHTS.west + thai * FC_WEIGHTS.thai + thaksa * FC_WEIGHTS.thaksa + pd.score * FC_WEIGHTS.num + lunar * FC_WEIGHTS.lunar);
  const rating = total >= 72 ? 5 : total >= 61 ? 4 : total >= 49 ? 3 : total >= 39 ? 2 : 1;

  // Life areas: Western scores, nudged by the ทักษา position and the Thai Moon house.
  const bump = { love: 0, work: 0, money: 0, health: 0 };
  ({ sri: () => bump.money++, mula: () => bump.money++, det: () => bump.work++, montri: () => bump.work++, utsaha: () => bump.work++, ayu: () => bump.health++, boriwan: () => bump.love++ }[pos.id] || (() => {}))();
  if (pos.id === 'kalakini') for (const k of CAT_KEY) bump[k]--;
  if ([2, 11].includes(mH)) bump.money++;
  if (mH === 10) bump.work++;
  if ([5, 7].includes(mH)) bump.love++;
  if ([6, 8, 12].includes(mH)) bump.health--;
  const scores = w.scores.map((s, k) => ({ name: s.name, key: CAT_KEY[k], score: clamp(s.score + clamp(bump[CAT_KEY[k]], -1, 1), 1, 5) }));

  const sources = [
    { k: 'west', th: 'โหราศาสตร์สากล', score: west, w: FC_WEIGHTS.west, note: lead ? `${lead.mover.th === 'อาทิตย์' ? 'ดวงอาทิตย์' : lead.mover.th === 'จันทร์' ? 'ดวงจันทร์' : 'ดาว' + lead.mover.th}จร${lead.asp.th}${lead.target.id === 'asc' ? 'ลัคนา' : lead.target.th === 'อาทิตย์' ? 'ดวงอาทิตย์' : lead.target.th === 'จันทร์' ? 'ดวงจันทร์' : 'ดาว' + lead.target.th}กำเนิด` : 'ดาวเร็วไม่ทำมุมสำคัญ' },
    { k: 'thai', th: 'โหราศาสตร์ไทย', score: thai, w: FC_WEIGHTS.thai, note: `${thaiNotes.join(' · ')} นับจาก${base.by}${SIGNS[base.sign].th}` },
    { k: 'thaksa', th: 'ทักษา', score: thaksa, w: FC_WEIGHTS.thaksa, note: `${TH_PLANETS[dp].day}เป็นวัน${pos.th}ของคนเกิด${TH_PLANETS[bp].day}` },
    { k: 'num', th: 'เลขศาสตร์', score: pd.score, w: FC_WEIGHTS.num, note: `เลขวันส่วนตัว ${pd.n} · ${pd.th}` },
    { k: 'lunar', th: 'จันทรคติ', score: lunar, w: FC_WEIGHTS.lunar, note: lun ? `${lun.full}${lunNotes.length ? ' · ' + lunNotes.join(' · ') : ''}` : '' }
  ];
  const fc = { date: d, total, rating, scores, sources, lunar: lun, pos, dayPlanet: dp, birthPlanet: bp, pday: pd, thaiMoonHouse: mH, westMoonHouse: w.moonHouse, lead };
  fc.advice = adviceFor(fc, w);
  return fc;
}

// ---------- plain-language advice ----------
const advPick = (arr, seed) => arr[seed % arr.length];
const ADV_GOOD = {
  love: [
    ['วันนี้เหมาะบอกความในใจ หรือชวนคนสำคัญไปกินข้าวเย็นด้วยกัน', '#/match', 'ดูดวงคู่'],
    ['เสน่ห์แรงกว่าปกติ ใครโสดลองเปิดใจคุยกับคนใหม่ ใครมีคู่ลองเซอร์ไพรส์เล็ก ๆ', '#/match', 'ดูดวงคู่']
  ],
  work: [
    ['งานที่ค้างไว้ลงมือวันนี้คืบหน้าเร็ว ลองเสนอไอเดียกับหัวหน้าหรือลูกค้าได้เลย', '#/auspice', 'หายามดีวันนี้'],
    ['มีคนเห็นฝีมือ เหมาะนัดคุยงาน สัมภาษณ์ หรือส่งงานสำคัญ', '#/auspice', 'หายามดีวันนี้']
  ],
  money: [
    ['มีจังหวะเงินเข้า เหมาะเจรจาซื้อขาย ปิดการขาย หรือทวงเงินที่ค้างอยู่', '#/luck', 'ดูเลขนำโชค'],
    ['โชคเรื่องเงินมาแบบเล็ก ๆ น่ารัก ๆ ลองเสี่ยงโชคพอสนุก แต่อย่าลงเกินตัว', '#/luck', 'ดูเลขนำโชค']
  ],
  health: [
    ['ร่างกายสดชื่น เหมาะออกกำลังกาย เดินเล่น หรือเริ่มกินอาหารดี ๆ', '', ''],
    ['พลังกายดี เหมาะทำธุระนอกบ้านหรือไปเที่ยวใกล้ ๆ', '', '']
  ]
};
const ADV_BAD = {
  love: [['อารมณ์ปะทะกันง่าย ฟังให้จบก่อนตอบ เลี่ยงทะเลาะเรื่องเล็ก', 'prayer:metta-all', 'สวดแผ่เมตตา']],
  work: [['ยังไม่ควรเซ็นสัญญาหรือตัดสินใจเรื่องใหญ่ ตรวจงานซ้ำอีกรอบก่อนส่ง', 'prayer:khama', 'สวดขอขมา ตั้งสติ']],
  money: [['ระวังเงินออกไม่รู้ตัว งดช้อปของไม่จำเป็น และอย่าให้ใครยืมเงินวันนี้', 'prayer:ts-trade', 'คาถาค้าขาย']],
  health: [['วันนี้ไม่ควรเดินทางไกล ถ้าต้องออกไปทำงานก็ขับรถช้า ๆ ระวังตัว และพักผ่อนให้พอ', 'prayer:ts-safe', 'คาถาแคล้วคลาด']]
};
const linkOf = (href, label) => (href ? { href, label } : null);

function adviceFor(fc, w) {
  const seed = fc.date.getDate() + fc.date.getMonth() * 31;
  const out = [];
  const lun = fc.lunar;
  // Special days first: they are what people plan around.
  if (lun) {
    const big = lun.events.find((e) => e.k === 'big' || e.k === 'merit');
    const luck = lun.events.find((e) => e.k === 'luck');
    const sky = lun.events.find((e) => e.k === 'sky');
    if (sky) out.push({ tone: -1, text: `วันนี้มี${sky.th} ${sky.note}`, link: { href: 'prayer:itipiso', label: 'สวดอิติปิโส' } });
    if (luck) out.push({ tone: 1, text: `วันนี้${luck.th} ${luck.note}`, link: { href: '#/prayer', label: 'ไปห้องบทสวด' } });
    if (big) out.push({ tone: 1, text: `วันนี้${big.th} ชวนครอบครัวไปทำบุญ เวียนเทียน หรือสวดมนต์ที่บ้านก็ได้บุญเต็มที่`, link: { href: '#/prayer', label: 'บทสวดวันพระ' } });
    else if (lun.holy) out.push({ tone: 1, text: `วันนี้วันพระ (${lun.th}) ใส่บาตรตอนเช้า หรือสวดมนต์ก่อนนอน บุญส่งผลเต็มที่`, link: { href: '#/prayer', label: 'บทสวดวันพระ' } });
  }
  const sorted = [...fc.scores].sort((a, b) => b.score - a.score);
  const best = sorted[0], worst = sorted[sorted.length - 1];
  if (best.score >= 4) { const g = advPick(ADV_GOOD[best.key], seed); out.push({ tone: 1, text: g[0], link: linkOf(g[1], g[2]) }); }
  // Family focus: the Moon in the 4th (Western or Thai) or a บริวาร day.
  if (fc.westMoonHouse === 4 || fc.thaiMoonHouse === 4 || fc.pos.id === 'boriwan') {
    const t = TEMPLES[seed % TEMPLES.length];
    const pl = MU_PLACES.find((x) => x.th.includes(t.th.replace(/^วัด/, '')));
    out.push({ tone: 1, text: `วันนี้ควรใช้เวลากับครอบครัว ลองชวนที่บ้านไปไหว้พระที่${t.th} ขอพรเรื่อง${t.wish}`, link: pl ? { href: 'map:' + pl.id, label: 'ดูในแผนที่มู' } : { href: '#/prayer', label: 'บทสวดก่อนไปวัด' } });
  }
  if (fc.pos.id === 'kalakini') {
    const av = luckOf(fc.birthPlanet).avoid;
    out.push({ tone: -1, text: `วันนี้ตรงกับวันกาลกิณีของคุณ เลี่ยงใส่สี${TH_PLANETS[av].color.split(' ')[0]} และยังไม่ควรเริ่มเรื่องใหม่`, link: { href: '#/auspice', label: 'ดูวันดีถัดไป' } });
  }
  if (worst.score <= 2) { const b = advPick(ADV_BAD[worst.key], seed); out.push({ tone: -1, text: b[0], link: linkOf(b[1], b[2]) }); }
  if (fc.total < 45 && out.filter((x) => x.tone < 0).length < 2) out.push({ tone: -1, text: 'พลังวันนี้ต่ำ เหมาะพักเก็บแรง อยู่บ้านดูหนังสนุก ๆ หรือทำงานที่ถนัด ยังไม่ต้องรีบตัดสินใจ', link: null });
  if (!out.length) out.push({ tone: 0, text: `วันเรียบ ๆ ทำงานประจำให้เสร็จ เลขวันนี้เน้น${fc.pday.th}`, link: null });
  return out.slice(0, 3);
}

// ---------- effects of aspects and sign changes, in everyday words ----------
const FX_AREA = {
  sun: 'ตัวเองและเป้าหมาย', moon: 'อารมณ์และคนในบ้าน', mercury: 'การพูด การเรียน เอกสาร', venus: 'ความรักและเรื่องเงิน',
  mars: 'พลังกายและความกล้า', jupiter: 'โชคและผู้ใหญ่', saturn: 'งานและความรับผิดชอบ', asc: 'สุขภาพและภาพลักษณ์',
  uranus: 'ความอิสระ', neptune: 'ความฝันและสัญชาตญาณ', pluto: 'เรื่องที่ฝังลึกในใจ'
};
const FX_TEXT = {
  moon: ['อารมณ์ดี ใจเย็น คุยเรื่อง{a}ได้ราบรื่น', 'อารมณ์แกว่งง่าย อ่อนไหวเรื่อง{a} อย่าเก็บคำพูดใครมาคิดมาก', 'ความรู้สึกเรื่อง{a}เด่นขึ้นมา ทำตามใจได้แต่พอดี'],
  sun: ['มีคนเห็นความสามารถ เรื่อง{a}เด่นและมั่นใจขึ้น', 'อีโก้ชนกันง่าย เรื่อง{a}อาจมีคนขัด ใจเย็นแล้วค่อยพูด', 'เรื่อง{a}ได้รับความสนใจเต็มที่ เหมาะเริ่มอะไรใหม่'],
  mercury: ['พูดอะไรคนก็เข้าใจ เหมาะเจรจาและคุยเรื่อง{a}', 'สื่อสารผิดพลาดง่าย เรื่อง{a}อาจเข้าใจกันผิด อ่านข้อความให้ดีก่อนส่ง', 'ความคิดเรื่อง{a}แล่นเร็ว จดไอเดียไว้'],
  venus: ['มีเสน่ห์ คนรอบข้างใจดีด้วย เรื่อง{a}ราบรื่น อาจมีของขวัญหรือเงินเข้า', 'อยากได้อยากมีจนใช้เงินเกินตัว หรืองอนกันเรื่องเล็กในเรื่อง{a}', 'ความสุขและความรักเข้ามาที่เรื่อง{a}'],
  mars: ['มีพลังลุย ทำเรื่อง{a}เสร็จไว', 'ใจร้อน หงุดหงิดง่าย ระวังทะเลาะหรืออุบัติเหตุเล็ก ๆ ในเรื่อง{a}', 'พลังพุ่งแรงที่เรื่อง{a} ใช้ทำงานหนักได้แต่อย่าวู่วาม'],
  jupiter: ['โชคเข้าข้าง มีผู้ใหญ่ช่วยเรื่อง{a}', 'มองโลกดีเกินไป ระวังรับปากเกินตัวในเรื่อง{a}', 'โอกาสใหญ่เข้ามาที่เรื่อง{a} รีบรับไว้'],
  saturn: ['ทำอะไรมั่นคง ผู้ใหญ่ไว้ใจ เรื่อง{a}ค่อย ๆ เป็นรูปเป็นร่าง', 'รู้สึกหนัก เหนื่อย ติดขัดเรื่อง{a} ต้องอดทนและทำทีละขั้น', 'เรื่อง{a}ถูกทดสอบ ต้องจริงจังและรับผิดชอบ'],
  uranus: ['มีเรื่องใหม่ ๆ น่าตื่นเต้นเข้ามาในเรื่อง{a}', 'มีเรื่องเปลี่ยนกะทันหันในเรื่อง{a} เผื่อแผนสำรองไว้', 'เรื่อง{a}เปลี่ยนแบบไม่ทันตั้งตัว'],
  neptune: ['สัญชาตญาณดี รู้สึกอะไรมักแม่นในเรื่อง{a}', 'สับสน หลงเชื่อง่ายเรื่อง{a} ระวังถูกหลอก', 'เรื่อง{a}คลุมเครือ ใช้ใจมากกว่าเหตุผล'],
  pluto: ['มีพลังเปลี่ยนตัวเองเรื่อง{a}ให้ดีขึ้น', 'มีแรงกดดันหรือการชิงอำนาจในเรื่อง{a}', 'เรื่อง{a}กำลังเปลี่ยนจากข้างใน']
};
const BENEFIC = ['sun', 'moon', 'mercury', 'venus', 'jupiter'];
export function aspectEffect(x) {
  const m = x.mover.id, n = x.asp.nature;
  const i = n > 0 ? 0 : n < 0 ? 1 : 2;
  const tone = n !== 0 ? n : BENEFIC.includes(m) ? 1 : ['uranus', 'neptune'].includes(m) ? 0 : -1;
  const text = (FX_TEXT[m] || FX_TEXT.moon)[i].replace('{a}', FX_AREA[x.target.id] || 'ชีวิต');
  return { tone, badge: tone > 0 ? 'ดี' : tone < 0 ? 'ท้าทาย' : 'ผสม', text };
}
const SIGN_STYLE = ['กล้า ใจร้อน อยากเริ่มก่อนใคร', 'ใจเย็น ชอบความสบาย ของกินของใช้ดี ๆ', 'ช่างพูด อยากรู้ ติดต่อคนเยอะ', 'อ่อนโยน คิดถึงบ้านและครอบครัว',
  'มั่นใจ อยากเด่น ใจกว้าง', 'ละเอียด จัดระเบียบ ใส่ใจสุขภาพ', 'อ่อนหวาน รักความสวยงาม อยากมีคู่', 'ลึกซึ้ง เก็บความรู้สึก จริงจัง',
  'ร่าเริง อยากเที่ยว อยากเรียนรู้', 'จริงจัง ขยันทำงาน มองระยะยาว', 'คิดต่าง เป็นตัวของตัวเอง เข้าสังคมเก่ง', 'อ่อนไหว ใจบุญ ช่างฝัน'];
const ING_DOMAIN = { moon: 'อารมณ์ของคนช่วง 2 วันนี้', sun: 'บรรยากาศทั้งเดือน', mercury: 'วิธีพูดและคิดช่วงนี้', venus: 'ความรักและการใช้เงินช่วงนี้', mars: 'พลังและการลงมือช่วงนี้', jupiter: 'โชคช่วงปีนี้', saturn: 'บทเรียนช่วงหลายปีนี้' };
export function ingressEffect(e) {
  const good = [1, 2, 5, 9, 10, 11].includes(e.house), hard = [6, 8, 12].includes(e.house);
  let tone = good ? 1 : hard ? -1 : 0;
  if (['mars', 'saturn'].includes(e.id) && [1, 7, 8, 12].includes(e.house)) tone = -1;
  const text = `${ING_DOMAIN[e.id] || 'พลังช่วงนี้'}จะออกแนว${SIGN_STYLE[e.sign]} และส่งผลกับเรื่อง${HOUSES[e.house - 1]}ของคุณ`;
  return { tone, badge: tone > 0 ? 'ดี' : tone < 0 ? 'ระวัง' : 'กลาง', text };
}
