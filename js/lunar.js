// ปฏิทินจันทรคติไทย (ขึ้น/แรม ค่ำ เดือน, วันพระ, วันสำคัญ) for 2024–2040.
// The table was generated with the Suriyayatra (สุริยยาตร์) rules as implemented by the open-source
// pythaidate library (github.com/hmmbug/pythaidate) and checked against official Buddhist holidays:
// อาสาฬหบูชา 1 ส.ค. 2566 (เดือน 8 หลัง), มาฆบูชา 12 ก.พ. 2568, วิสาขบูชา 11 พ.ค. 2568, ออกพรรษา 7 ต.ค. 2568,
// มาฆบูชา 3 มี.ค. 2569, วิสาขบูชา 31 พ.ค. 2569, ออกพรรษา 26 ต.ค. 2569.
// Months are letters a–l (เดือนอ้าย … เดือนสิบสอง), L = เดือนแปดหลัง (อธิกมาส). LUN_LEN: 9 = 29 วัน, 0 = 30 วัน.
const LUN_START = 10; // days after 2024-01-01 of the first month start
const LUN_MONTHS = 'bcdefghijklabcdefghijklabcdefghLijklabcdefghijklabcdefghijklabcdefghLijklabcdefghijklabcdefghLijklabcdefghijklabcdefghijklabcdefghLijklabcdefghijklabcdefghijklabcdefghLijklabcdefghijklabcdefghijklabcdefghLijkla';
const LUN_LEN = '09090909090909090009090909090900909090909090909090909090909090909090090909090900090909090909009090909090909090909090909090909090900909090909000909090909090909090909090090909090909090909090900090909090909009090';
const LUN_BASE = Date.UTC(2024, 0, 1);
export const LUN_MONTH_TH = ['', 'อ้าย', 'ยี่', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const monthNo = (c) => (c === 'L' ? 88 : c.charCodeAt(0) - 96);
const lunMonthName = (m) => (m === 88 ? 'เดือน 8 หลัง' : m <= 2 ? 'เดือน' + LUN_MONTH_TH[m] : 'เดือน ' + m);

// Solar & lunar eclipses visible from Thailand (time.now, Nakhon Nayok).
export const ECLIPSES = [
  ['2026-03-03', 'จันทรุปราคา'], ['2027-08-02', 'สุริยุปราคาบางส่วน'], ['2028-07-07', 'จันทรุปราคาเงามัว'],
  ['2028-07-22', 'สุริยุปราคาบางส่วน'], ['2028-12-31', 'จันทรุปราคาบางส่วน'], ['2029-12-21', 'จันทรุปราคาเงามัว'],
  ['2030-06-16', 'จันทรุปราคาเต็มดวง'], ['2030-12-10', 'จันทรุปราคาเงามัว'], ['2031-05-21', 'สุริยุปราคาบางส่วน'],
  ['2032-04-25', 'จันทรุปราคาบางส่วน'], ['2032-10-19', 'จันทรุปราคาบางส่วน'], ['2032-11-03', 'สุริยุปราคาบางส่วน'],
  ['2033-04-15', 'จันทรุปราคาเต็มดวง'], ['2033-10-08', 'จันทรุปราคาเงามัว'], ['2034-04-04', 'จันทรุปราคาบางส่วน'],
  ['2034-08-29', 'จันทรุปราคาเงามัว'], ['2035-02-22', 'จันทรุปราคาเงามัว'], ['2035-03-24', 'จันทรุปราคาเงามัว'],
  ['2035-08-19', 'จันทรุปราคาเงามัว'], ['2035-09-02', 'สุริยุปราคาบางส่วน'], ['2036-02-12', 'จันทรุปราคาเงามัว']
];
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Month index containing day number n (days after 2024-01-01), via the cumulative month starts.
let LUN_STARTS = null;
function lunStarts() {
  if (LUN_STARTS) return LUN_STARTS;
  LUN_STARTS = [LUN_START];
  for (let i = 0; i < LUN_LEN.length; i++) LUN_STARTS.push(LUN_STARTS[i] + (LUN_LEN[i] === '0' ? 30 : 29));
  return LUN_STARTS;
}
// Does a เดือน 8 หลัง come before the next เดือนอ้าย, scanning from month index i?
function leapAhead(i) {
  for (let k = i; k < LUN_MONTHS.length; k++) { if (LUN_MONTHS[k] === 'L') return true; if (k > i && LUN_MONTHS[k] === 'a') return false; }
  return false;
}

// Thai lunar date for a local calendar day. Returns null outside the table.
export function thaiLunar(date) {
  const n = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - LUN_BASE) / 86400000);
  const st = lunStarts();
  if (n < st[0] || n >= st[st.length - 1]) return null;
  let i = 0;
  while (st[i + 1] <= n) i++;
  const len = st[i + 1] - st[i], d = n - st[i] + 1, m = monthNo(LUN_MONTHS[i]);
  const waxing = d <= 15, day = waxing ? d : d - 15;
  const holy = d === 8 || d === 15 || d === 23 || d === len;
  const kon = !holy && (d === 7 || d === 14 || d === 22 || d === len - 1);
  const wd = date.getDay();
  const ev = [];
  const fm = d === 15;
  // วันพระใหญ่ (Buddhist holy days). In a leap-month year the Visakha and Asalha days move one month later,
  // and Makha moves to เดือน 4 when the coming year has a เดือน 8 หลัง.
  if (fm && ((m === 3 && !leapAhead(i)) || (m === 4 && leapAhead(i)))) ev.push({ k: 'big', th: 'วันมาฆบูชา' });
  if (fm && ((m === 6 && !leapAhead(i)) || (m === 7 && leapAhead(i - 1)))) ev.push({ k: 'big', th: 'วันวิสาขบูชา' });
  if (d === 23 && ((m === 6 && !leapAhead(i)) || (m === 7 && leapAhead(i - 1)))) ev.push({ k: 'big', th: 'วันอัฏฐมีบูชา' });
  const asalhaMonth = (m === 8 && LUN_MONTHS[i + 1] !== 'L') || m === 88;
  if (fm && asalhaMonth) ev.push({ k: 'big', th: 'วันอาสาฬหบูชา' });
  if (d === 16 && asalhaMonth) ev.push({ k: 'big', th: 'วันเข้าพรรษา' });
  if (fm && m === 11) ev.push({ k: 'big', th: 'วันออกพรรษา' });
  if (d === 16 && m === 11) ev.push({ k: 'merit', th: 'ตักบาตรเทโว' });
  if (fm && m === 12) ev.push({ k: 'merit', th: 'วันลอยกระทง' });
  if (d === len && m === 10) ev.push({ k: 'merit', th: 'วันสารทไทย' });
  // ฤกษ์ใหญ่ตามความเชื่อ
  if (wd === 6 && m === 5 && d === 5) ev.push({ k: 'luck', th: 'เสาร์ 5', note: 'วันเสาร์ ขึ้น 5 ค่ำ เดือน 5 ฤกษ์ใหญ่ที่นิยมปลุกเสกและเสริมดวง' });
  if (wd === 1 && fm) ev.push({ k: 'luck', th: 'จันทร์ซ้อนจันทร์', note: 'วันจันทร์ตรงกับจันทร์เพ็ญ นิยมไหว้พระจันทร์ ขอพรเรื่องเสน่ห์ เมตตา และความสงบใจ' });
  const ecl = ECLIPSES.find((e) => e[0] === isoOf(date));
  if (ecl) ev.push({ k: 'sky', th: ecl[1], note: 'ปรากฏการณ์บนฟ้า คนไทยนิยมสวดมนต์ ทำบุญ และงดเริ่มเรื่องใหญ่ในวันนี้' });
  const mn = date.getMonth() + 1, dn = date.getDate();
  if (mn === 4 && dn >= 13 && dn <= 15) ev.push({ k: 'merit', th: 'สงกรานต์' });
  return {
    month: m, day, waxing, d, len, holy, kon, events: ev, monthTh: lunMonthName(m),
    th: `${waxing ? 'ขึ้น' : 'แรม'} ${day} ค่ำ`, full: `${waxing ? 'ขึ้น' : 'แรม'} ${day} ค่ำ ${lunMonthName(m)}`,
    newMoon: d === len, fullMoon: fm
  };
}

// The next วันพระ on or after a date (within 16 days).
export function nextHolyDay(from = new Date()) {
  for (let i = 0; i < 17; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const l = thaiLunar(d);
    if (l && l.holy) return { date: d, lunar: l, inDays: i };
  }
  return null;
}
// Upcoming special days (วันพระใหญ่, ฤกษ์ใหญ่, อุปราคา) within `days`.
export function upcomingSpecial(from = new Date(), days = 60) {
  const out = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const l = thaiLunar(d);
    if (l) for (const e of l.events) out.push({ date: d, inDays: i, ...e, lunar: l });
  }
  return out;
}
