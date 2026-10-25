// Number readings: phone, plate, Thai ID card, house number, bank account, hexadecimal.
// Pair rules follow common Thai numerology: digits 7 and 8 are "heavy", 0 is "empty".
import { DIGITS, SUM_MEANING } from './data.js';

export const reduceTo9 = (n) => { while (n > 9) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };
const onlyDigits = (s) => (s || '').replace(/[^0-9]/g, '');

export const NUM_TOOLS = [
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
