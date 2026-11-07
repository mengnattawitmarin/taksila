// ฮวงจุ้ย: เลขกัว (ปาจาย 八宅), ดาวเหินยุค 9 (玄空飛星 2024–2043), ดาวจรประจำปี, ไท่ส่วย/ซาซัว
// ต่อยอดจากต้นแบบที่ผู้ใช้ส่งมา (fengshui-app) โดยแทนผังดาวตัวอย่างด้วยการคำนวณจริงตามสูตรคลาสสิก
import { lonOf } from './astro.js';

export const FS_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const FS_DIR_TH = { N: 'เหนือ', NE: 'ตะวันออกเฉียงเหนือ', E: 'ตะวันออก', SE: 'ตะวันออกเฉียงใต้', S: 'ใต้', SW: 'ตะวันตกเฉียงใต้', W: 'ตะวันตก', NW: 'ตะวันตกเฉียงเหนือ', C: 'กลางบ้าน' };
export const FS_DIR_SHORT = { N: 'เหนือ', NE: 'อีสาน', E: 'ตะวันออก', SE: 'อาคเนย์', S: 'ใต้', SW: 'หรดี', W: 'ตะวันตก', NW: 'พายัพ', C: 'กลาง' };
export const FS_DIR_DEG = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const OPP = { N: 'S', NE: 'SW', E: 'W', SE: 'NW', S: 'N', SW: 'NE', W: 'E', NW: 'SE' };
// Lo Shu home palace of each number, and the flight path (center → NW → W → NE → S → N → SW → E → SE).
const HOME = { 1: 'N', 2: 'SW', 3: 'E', 4: 'SE', 5: 'C', 6: 'NW', 7: 'W', 8: 'NE', 9: 'S' };
const PATH = ['C', 'NW', 'W', 'NE', 'S', 'N', 'SW', 'E', 'SE'];
const CARDINAL = ['N', 'E', 'S', 'W'];
// 24 ภูเขา (二十四山) starting at 壬 337.5°, three per palace: ดิน (地元) · ฟ้า (天元) · คน (人元).
const M24 = ['壬', '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥'];
const M24_TH = ['เหริน', 'จื่อ', 'กุ่ย', 'โฉ่ว', 'เกิ้น', 'อิ๋น', 'เจี่ย', 'เหม่า', 'อี่', 'เฉิน', 'ซวิ่น', 'ซื่อ', 'ปิ่ง', 'อู่', 'ติง', 'เว่ย', 'คุน', 'เซิน', 'เกิง', 'โหย่ว', 'ซิน', 'ซวี', 'เฉียน', 'ไฮ่'];
const YUAN_TH = ['ดิน', 'ฟ้า', 'คน'];

export function mountainOf(deg) {
  const a = ((deg % 360) + 360) % 360;
  const idx = Math.floor(((a - 337.5 + 360) % 360) / 15);
  const palace = FS_DIRS[Math.floor(idx / 3)], sub = idx % 3;
  const off = ((a - 337.5 + 360) % 360) % 15; // degrees into the mountain
  return { idx, palace, sub, cn: M24[idx], th: M24_TH[idx], yuan: YUAN_TH[sub], edge: off < 3 || off > 12 };
}
// Polarity of a sub-mountain: cardinal palaces are + - -, corner palaces - + +.
const polarity = (palace, sub) => (CARDINAL.includes(palace) ? [1, -1, -1] : [-1, 1, 1])[sub];
function fly(center, dir) {
  const g = {};
  PATH.forEach((p, i) => { g[p] = ((center - 1 + dir * i) % 9 + 9) % 9 + 1; });
  return g;
}

export const FS_PERIOD = 9; // ยุค 9: 4 ก.พ. 2024 – 3 ก.พ. 2044
// Xuan Kong flying-star chart for a facing angle (degrees from true north).
// 替卦 replacement stars: the mountain in the star's home palace decides which star flies instead.
const REPL = { '子': 1, '癸': 1, '甲': 1, '申': 1, '壬': 2, '卯': 2, '乙': 2, '未': 2, '坤': 2, '戌': 6, '乾': 6, '亥': 6, '辰': 6, '巽': 6, '巳': 6, '酉': 7, '辛': 7, '丑': 7, '艮': 7, '丙': 7, '寅': 9, '午': 9, '庚': 9, '丁': 9 };
export function flyingStars(facingDeg, period = FS_PERIOD, replace = false) {
  const f = mountainOf(facingDeg), s = mountainOf(facingDeg + 180);
  const base = fly(period, 1);
  const starFor = (palaceStar, sub) => {
    const home = palaceStar === 5 ? HOME[period] : HOME[palaceStar];
    const dir = polarity(home, sub);
    if (!replace) return fly(palaceStar, dir);
    const mt = M24[FS_DIRS.indexOf(home) * 3 + sub];
    return fly(REPL[mt], dir);
  };
  const water = starFor(base[f.palace], f.sub); // ดาวน้ำ (向星) → ทรัพย์
  const mount = starFor(base[s.palace], s.sub); // ดาวภูเขา (山星) → คน สุขภาพ
  const pattern =
    mount[s.palace] === period && water[f.palace] === period ? { k: 'best', th: 'ภูเขาดี น้ำดี (旺山旺向)', d: 'ดาวภูเขาประจำยุคอยู่ด้านหลังบ้าน ดาวน้ำประจำยุคอยู่หน้าบ้าน เป็นผังที่ดีที่สุด ทั้งคนและทรัพย์รุ่งเรือง' }
      : mount[f.palace] === period && water[s.palace] === period ? { k: 'worst', th: 'ภูเขาตกน้ำ (上山下水)', d: 'ดาวประจำยุคสลับที่กัน ตามตำราควรวางของสูงหรือภูเขาไว้หน้าบ้าน และน้ำหรือที่โล่งไว้หลังบ้านเพื่อแก้' }
        : mount[s.palace] === period && water[s.palace] === period ? { k: 'sit', th: 'ดาวคู่อยู่หลังบ้าน (雙星到坐)', d: 'ดาวประจำยุคทั้งสองอยู่ด้านหลัง ควรมีที่โล่งหรือน้ำด้านหลังบ้านเพื่อรับทรัพย์' }
          : mount[f.palace] === period && water[f.palace] === period ? { k: 'face', th: 'ดาวคู่อยู่หน้าบ้าน (雙星到向)', d: 'ดาวประจำยุคทั้งสองอยู่ด้านหน้า ควรมีของสูงหรือกำแพงไกล ๆ หน้าบ้านเพื่อรักษาสุขภาพและคน' }
            : null;
  return { facing: f, sitting: s, base, water, mount, pattern, period, replace };
}

// Chinese solar year: changes at ลี่ชุน (立春, Sun at 315°) around 4 Feb.
export function solarYear(date) {
  const y = date.getFullYear(), m = date.getMonth() + 1;
  if (m > 2) return y;
  if (m === 1) return y - 1;
  const L = lonOf('sun', date);
  return L < 315 && L > 270 ? y - 1 : y;
}
export function annualStar(sy) { return ((3 - (sy - 2024)) % 9 + 9) % 9 || 9; }
export function annualChart(sy) { return fly(annualStar(sy), 1); }
const BRANCH_DIR = [['N', 1], ['NE', 0], ['NE', 2], ['E', 1], ['SE', 0], ['SE', 2], ['S', 1], ['SW', 0], ['SW', 2], ['W', 1], ['NW', 0], ['NW', 2]];
const BRANCH_TH = ['ชวด', 'ฉลู', 'ขาล', 'เถาะ', 'มะโรง', 'มะเส็ง', 'มะเมีย', 'มะแม', 'วอก', 'ระกา', 'จอ', 'กุน'];
export function yearAfflictions(sy) {
  const b = ((sy - 4) % 12 + 12) % 12;
  const ac = annualChart(sy);
  const five = PATH.find((p) => ac[p] === 5), two = PATH.find((p) => ac[p] === 2);
  const taisui = BRANCH_DIR[b][0], suipo = OPP[taisui];
  const sansha = [6, 2, 10].includes(b) ? 'N' : [8, 0, 4].includes(b) ? 'S' : [5, 9, 1].includes(b) ? 'E' : 'W';
  return { sy, star: annualStar(sy), chart: ac, five, two, taisui, suipo, sansha, animal: BRANCH_TH[b] };
}

// เลขกัว (Ba Zhai). Uses the Chinese solar year of birth.
const KUA_DIRS = {
  1: ['SE', 'E', 'S', 'N', 'W', 'NE', 'NW', 'SW'], 2: ['NE', 'W', 'NW', 'SW', 'E', 'SE', 'S', 'N'],
  3: ['S', 'N', 'SE', 'E', 'SW', 'NW', 'NE', 'W'], 4: ['N', 'S', 'E', 'SE', 'NW', 'SW', 'W', 'NE'],
  6: ['W', 'NE', 'SW', 'NW', 'SE', 'E', 'N', 'S'], 7: ['NW', 'SW', 'NE', 'W', 'N', 'S', 'SE', 'E'],
  8: ['SW', 'NW', 'W', 'NE', 'S', 'N', 'E', 'SE'], 9: ['E', 'SE', 'N', 'S', 'NE', 'W', 'SW', 'NW']
};
export const KUA_STAR = [
  { k: 'shengqi', cn: '生氣', th: 'เซิงชี่', use: 'ความสำเร็จ เงินทอง', tip: 'หันหน้าโต๊ะทำงานหรือหน้าร้านไปทางนี้', good: 1 },
  { k: 'tianyi', cn: '天醫', th: 'เทียนอี', use: 'สุขภาพ ผู้ใหญ่ช่วย', tip: 'เหมาะหันหัวนอน หรือวางห้องนอนของคนป่วย', good: 1 },
  { k: 'yannian', cn: '延年', th: 'เหยียนเหนียน', use: 'ความรัก ครอบครัว', tip: 'เหมาะกับห้องนอนคู่รัก หรือหันหัวนอนเพื่อความสัมพันธ์', good: 1 },
  { k: 'fuwei', cn: '伏位', th: 'ฝูเหว่ย', use: 'ความมั่นคง สมาธิ', tip: 'เหมาะกับมุมอ่านหนังสือ สวดมนต์ หรือนั่งสมาธิ', good: 1 },
  { k: 'huohai', cn: '禍害', th: 'ฮั่วไห่', use: 'เรื่องจุกจิก เสียเงินเล็ก ๆ', tip: 'เหมาะทำห้องน้ำหรือห้องเก็บของ', good: 0 },
  { k: 'wugui', cn: '五鬼', th: 'อู่กุ่ย', use: 'ทะเลาะ ไฟ ขโมย', tip: 'เลี่ยงหันประตูหลักหรือหัวนอน', good: 0 },
  { k: 'liusha', cn: '六煞', th: 'ลิ่วซา', use: 'เรื่องรักวุ่นวาย คดีความ', tip: 'เลี่ยงวางเตียงหรือโต๊ะทำงาน', good: 0 },
  { k: 'jueming', cn: '絕命', th: 'เจวี๋ยมิ่ง', use: 'ร้ายที่สุด สุขภาพและเงิน', tip: 'ห้ามหันหัวนอนหรือโต๊ะทำงาน ทำเป็นห้องน้ำหรือห้องเก็บของดีที่สุด', good: 0 }
];
const KUA_INFO = {
  1: ['กั้น 坎', 'น้ำ'], 2: ['คุน 坤', 'ดิน'], 3: ['เจิ้น 震', 'ไม้'], 4: ['ซวิ่น 巽', 'ไม้'],
  6: ['เฉียน 乾', 'ทอง'], 7: ['ตุ้ย 兌', 'ทอง'], 8: ['เกิ้น 艮', 'ดิน'], 9: ['หลี 離', 'ไฟ']
};
// Colours that feed (生) and match each element.
export const EL_COLOR = { 'น้ำ': 'น้ำเงิน ดำ ขาว เงิน', 'ไม้': 'เขียว น้ำเงิน ดำ', 'ไฟ': 'แดง ชมพู ม่วง เขียว', 'ดิน': 'เหลือง น้ำตาล ส้ม แดง', 'ทอง': 'ขาว เงิน ทอง เหลือง' };
export function kuaOf(date, gender) {
  const sy = solarYear(date);
  let s = String(sy % 100).split('').reduce((a, b) => a + +b, 0);
  while (s > 9) s = String(s).split('').reduce((a, b) => a + +b, 0);
  let k;
  if (gender === 'f') { k = sy < 2000 ? s + 5 : s + 6; while (k > 9) k -= 9; if (k === 5) k = 8; }
  else { k = sy < 2000 ? 10 - s : 9 - s; if (k <= 0) k += 9; if (k === 5) k = 2; }
  const d = KUA_DIRS[k];
  return { kua: k, sy, group: [1, 3, 4, 9].includes(k) ? 'east' : 'west', trigram: KUA_INFO[k][0], element: KUA_INFO[k][1], dirs: d.map((dir, i) => ({ dir, ...KUA_STAR[i] })) };
}

// Meanings of the nine stars in ยุค 9.
export const STAR = {
  1: { th: 'ดาวขาว 1', use: 'การงาน ข่าวดี ความก้าวหน้า', tone: 1, el: 'น้ำ' },
  2: { th: 'ดาวดำ 2', use: 'โรคภัย ความเจ็บป่วย', tone: -1, el: 'ดิน' },
  3: { th: 'ดาวเขียว 3', use: 'ทะเลาะ คดีความ', tone: -1, el: 'ไม้' },
  4: { th: 'ดาวเขียว 4', use: 'การเรียน ปัญญา ความรัก', tone: 0, el: 'ไม้' },
  5: { th: 'ดาวเหลือง 5', use: 'เคราะห์ร้าย อุบัติเหตุ', tone: -2, el: 'ดิน' },
  6: { th: 'ดาวขาว 6', use: 'อำนาจ ผู้ใหญ่อุปถัมภ์', tone: 0, el: 'ทอง' },
  7: { th: 'ดาวแดง 7', use: 'ขโมย ขัดแย้ง เสียทรัพย์', tone: -1, el: 'ทอง' },
  8: { th: 'ดาวขาว 8', use: 'ทรัพย์สิน ที่ดิน (เริ่มอ่อนแรง)', tone: 1, el: 'ดิน' },
  9: { th: 'ดาวม่วง 9', use: 'รุ่งเรือง ชื่อเสียง งานมงคล (ดาวประจำยุค)', tone: 2, el: 'ไฟ' }
};
// Classic remedies, written plainly.
export const STAR_FIX = {
  2: 'วางของโลหะ เช่น น้ำเต้าทองเหลือง หรือกระดิ่งลมโลหะ 6 ก้าน และเลี่ยงใช้สีแดงเหลือง',
  3: 'ใช้สีแดงหรือไฟสีแดงเล็ก ๆ ลดความขัดแย้ง เลี่ยงต้นไม้ใหญ่',
  5: 'วางกระดิ่งลมโลหะหรือน้ำเต้าทองเหลือง ไม่ต่อเติมหรือเจาะผนังโซนนี้ในปีนั้น เลี่ยงสีแดงเหลือง',
  7: 'วางน้ำนิ่งในภาชนะสีน้ำเงินหรือดำ เก็บของมีค่าให้มิดชิด'
};
export function sectorRead(w, m, period = 9) {
  const score = starTone(w, period) * 2 + starTone(m, period); // water star weighs more for wealth
  const tips = [];
  const cb = comboOf(m, w);
  if (cb) tips.push(`คู่ดาว ${m}-${w}: ${cb.th}`);
  if (starGood(w, period) > 0) tips.push('ดาวน้ำดี เหมาะเป็นประตู ทางเดิน หรือมุมที่มีคนเดินบ่อย วางน้ำไหลหรือตู้ปลาได้');
  if (starGood(m, period) > 0) tips.push('ดาวภูเขาดี เหมาะวางเตียง โต๊ะทำงาน หรือของสูงหนักที่มั่นคง');
  for (const n of new Set([w, m])) if (STAR_FIX[n]) tips.push(`แก้${STAR[n].th}: ${STAR_FIX[n]}`);
  const tone = score >= 3 ? 1 : score <= -2 ? -1 : 0;
  return { score, tone: cb && cb.tone < 0 && tone > 0 ? 0 : tone, tips };
}

// ยุคของบ้าน ตามปีที่เข้าอยู่หรือสร้างเสร็จ (นับจากลี่ชุน)
export const FS_PERIODS = [[7, 'ยุค 7 (1984–2003)'], [8, 'ยุค 8 (2004–2023)'], [9, 'ยุค 9 (2024–2043)']];
export const periodOfYear = (y) => (y >= 2024 ? 9 : y >= 2004 ? 8 : 7);

// ดาวจรประจำเดือน: เดือนจีนเริ่มที่ลี่ชุน (ดวงอาทิตย์ 315°) แล้วเปลี่ยนทุก 30°
const MONTH_TH = ['ขาล', 'เถาะ', 'มะโรง', 'มะเส็ง', 'มะเมีย', 'มะแม', 'วอก', 'ระกา', 'จอ', 'กุน', 'ชวด', 'ฉลู'];
export function monthInfo(date) {
  const L = lonOf('sun', date), sy = solarYear(date);
  const mi = Math.floor(((L - 315 + 360) % 360) / 30); // 0 = เดือนขาล (ราว 4 ก.พ.)
  const b = ((sy - 4) % 12 + 12) % 12;
  const first = [0, 3, 6, 9].includes(b) ? 8 : [4, 10, 1, 7].includes(b) ? 5 : 2; // ชวด มะเมีย เถาะ ระกา → 8 · มะโรง จอ ฉลู มะแม → 5 · อื่น ๆ → 2
  const star = ((first - 1 - mi) % 9 + 9) % 9 + 1;
  // วันเปลี่ยนเดือนถัดไป (ประมาณจากความเร็วดวงอาทิตย์)
  const next = 315 + (mi + 1) * 30, left = ((next - L) % 360 + 360) % 360;
  const change = new Date(date.getTime() + (left / 0.9856) * 86400000);
  return { sy, mi, star, chart: fly(star, 1), animal: MONTH_TH[mi], change };
}

// คู่ดาวภูเขา-น้ำที่ตำราพูดถึงบ่อย (อ่านได้ทั้งสองทาง)
const COMBO = {
  '1-4': [1, 'ดาวเรียนและความรัก หนุนการสอบ การเขียน ชื่อเสียงทางวิชาการ'],
  '1-6': [1, 'หนุนการงานและตำแหน่ง ผู้ใหญ่ให้การสนับสนุน'],
  '6-8': [1, 'ทรัพย์และอำนาจมาพร้อมกัน เงินมั่นคง'],
  '8-9': [1, 'งานมงคล ทรัพย์และความสุขในบ้าน'],
  '1-9': [1, 'น้ำกับไฟสมดุล ดีเรื่องงานมงคลและความก้าวหน้า'],
  '1-8': [1, 'หนุนทรัพย์และการงาน'],
  '4-9': [1, 'หนุนการเรียน การสอบ งานสร้างสรรค์'],
  '2-8': [0, 'เรื่องที่ดินและทรัพย์สิน แต่ต้องระวังสุขภาพผู้สูงวัย'],
  '2-5': [-2, 'คู่ร้ายที่สุด เสี่ยงโรคภัยและเคราะห์ ควรแก้ด้วยโลหะ และไม่ใช้เป็นห้องนอน'],
  '2-3': [-1, 'ทะเลาะ คดีความ ปากเสียง ใช้สีแดงหรือไฟแดงช่วยลด'],
  '3-7': [-1, 'ระวังโจรและบาดเจ็บ ใช้น้ำนิ่งช่วยแก้'],
  '6-7': [-1, 'ขัดแย้งรุนแรงแบบดาบปะทะดาบ ใช้น้ำช่วยลด'],
  '7-9': [-1, 'ระวังไฟและความขัดแย้งในครอบครัว ใช้ดินหรือสีเหลืองช่วย'],
  '5-9': [-1, 'ไฟหนุนดาว 5 ให้แรงขึ้น ระวังเคราะห์ ใช้โลหะแก้'],
  '2-9': [-1, 'ไฟหนุนดาว 2 ระวังโรคภัย ใช้โลหะแก้'],
  '3-5': [-1, 'ทะเลาะและเสียทรัพย์ ใช้สีแดงหรือโลหะช่วย'],
  '6-9': [-1, 'ไฟข่มทอง ระวังความขัดแย้งกับผู้ใหญ่และสุขภาพศีรษะ']
};
export function comboOf(m, w) {
  const k = [m, w].sort((a, b) => a - b).join('-');
  const c = COMBO[k];
  return c ? { tone: c[0], th: c[1], key: `${m}-${w}` } : null;
}

// ประเภทห้อง และกติกาประเมิน: ห้องที่ใช้ "ดาวน้ำ" (ประตู นั่งเล่น) ห้องที่ใช้ "ดาวภูเขา" (นอน ทำงาน พระ)
// ส่วนห้องน้ำ ห้องเก็บของ ครัว ตามตำราควรวางทับโซนดาวร้ายเพื่อกดไว้
export const ROOM_TYPES = [
  { id: 'door', th: 'ประตูหน้า', use: 'water' }, { id: 'living', th: 'ห้องนั่งเล่น', use: 'water' },
  { id: 'bed', th: 'ห้องนอน', use: 'mount', person: true }, { id: 'work', th: 'ห้องทำงาน', use: 'mount', person: true },
  { id: 'shrine', th: 'หิ้งพระ', use: 'mount' }, { id: 'kitchen', th: 'ครัว', use: 'press' },
  { id: 'toilet', th: 'ห้องน้ำ', use: 'press' }, { id: 'store', th: 'ห้องเก็บของ', use: 'press' }, { id: 'stair', th: 'บันได', use: 'water' }
];
const GOODS = { 9: [9, 1, 8], 8: [8, 9, 1], 7: [7, 8, 9] };
export function starGood(n, period = 9) { return GOODS[period].includes(n) ? 1 : [2, 3, 5, 7].includes(n) ? -1 : 0; }
// Weight of a star in a given period: the timely star +2, other good stars +1, ดาว 5 −2, other bad stars −1.
export function starTone(n, period = 9) { return n === period ? 2 : n === 5 ? -2 : starGood(n, period); }
export function roomRead(type, w, m, period = 9) {
  const t = ROOM_TYPES.find((r) => r.id === type);
  if (t.use === 'press') {
    const bad = starGood(w, period) < 0 || starGood(m, period) < 0, waste = starGood(w, period) > 0 && starGood(m, period) > 0;
    return bad ? { tone: 1, th: `${t.th}อยู่บนดาวร้าย ช่วยกดพลังร้ายไว้ ถือว่าวางถูก` } : waste ? { tone: -1, th: `${t.th}ทับดาวดี เสียโอกาส ถ้าทำได้ควรย้าย หรือเปิดไฟและรักษาความสะอาดเสมอ` } : { tone: 0, th: `${t.th}อยู่โซนกลาง ๆ ใช้ได้` };
  }
  const n = t.use === 'water' ? w : m, g = starGood(n, period);
  const what = t.use === 'water' ? 'ดาวน้ำ' : 'ดาวภูเขา';
  return g > 0 ? { tone: 1, th: `${t.th}ได้${what}ดี เลข ${n}` } : g < 0 ? { tone: -1, th: `${t.th}ทับ${what}ร้าย เลข ${n} ควรแก้: ${STAR_FIX[n] || 'จัดให้โล่ง สะอาด'}` } : { tone: 0, th: `${t.th}ได้${what}กลาง ๆ เลข ${n}` };
}
