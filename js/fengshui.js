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
export function flyingStars(facingDeg, period = FS_PERIOD) {
  const f = mountainOf(facingDeg), s = mountainOf(facingDeg + 180);
  const base = fly(period, 1);
  const starFor = (palaceStar, sub) => {
    const home = palaceStar === 5 ? HOME[period] : HOME[palaceStar];
    return fly(palaceStar, polarity(home, sub));
  };
  const water = starFor(base[f.palace], f.sub); // ดาวน้ำ (向星) → ทรัพย์
  const mount = starFor(base[s.palace], s.sub); // ดาวภูเขา (山星) → คน สุขภาพ
  const pattern =
    mount[s.palace] === period && water[f.palace] === period ? { k: 'best', th: 'ภูเขาดี น้ำดี (旺山旺向)', d: 'ดาวภูเขาประจำยุคอยู่ด้านหลังบ้าน ดาวน้ำประจำยุคอยู่หน้าบ้าน เป็นผังที่ดีที่สุด ทั้งคนและทรัพย์รุ่งเรือง' }
      : mount[f.palace] === period && water[s.palace] === period ? { k: 'worst', th: 'ภูเขาตกน้ำ (上山下水)', d: 'ดาวประจำยุคสลับที่กัน ตามตำราควรวางของสูงหรือภูเขาไว้หน้าบ้าน และน้ำหรือที่โล่งไว้หลังบ้านเพื่อแก้' }
        : mount[s.palace] === period && water[s.palace] === period ? { k: 'sit', th: 'ดาวคู่อยู่หลังบ้าน (雙星到坐)', d: 'ดาวประจำยุคทั้งสองอยู่ด้านหลัง ควรมีที่โล่งหรือน้ำด้านหลังบ้านเพื่อรับทรัพย์' }
          : mount[f.palace] === period && water[f.palace] === period ? { k: 'face', th: 'ดาวคู่อยู่หน้าบ้าน (雙星到向)', d: 'ดาวประจำยุคทั้งสองอยู่ด้านหน้า ควรมีของสูงหรือกำแพงไกล ๆ หน้าบ้านเพื่อรักษาสุขภาพและคน' }
            : null;
  return { facing: f, sitting: s, base, water, mount, pattern };
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
export function sectorRead(w, m) {
  const sw = STAR[w], sm = STAR[m];
  const score = sw.tone * 2 + sm.tone; // water star weighs more for wealth
  const tips = [];
  if (w === 9 || w === 1 || w === 8) tips.push('ดาวน้ำดี เหมาะเป็นประตู ทางเดิน หรือมุมที่มีคนเดินบ่อย วางน้ำไหลหรือตู้ปลาได้');
  if (m === 9 || m === 1 || m === 8) tips.push('ดาวภูเขาดี เหมาะวางเตียง โต๊ะทำงาน หรือของสูงหนักที่มั่นคง');
  for (const n of new Set([w, m])) if (STAR_FIX[n]) tips.push(`แก้${STAR[n].th}: ${STAR_FIX[n]}`);
  return { score, tone: score >= 3 ? 1 : score <= -2 ? -1 : 0, tips };
}
