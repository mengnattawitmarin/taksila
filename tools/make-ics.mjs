// สร้างปฏิทินวันพระ วันพระใหญ่ และฤกษ์ใหญ่ เป็นไฟล์ .ics ให้ผู้ใช้สมัครรับ (subscribe) ในปฏิทินมือถือ
// รัน: node tools/make-ics.mjs  → calendar/wanphra.ics
import fs from 'fs';
import { thaiLunar } from '../js/lunar.js';
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const esc = (s) => s.replace(/[,;\\]/g, (c) => '\\' + c);
const fold = (line) => { const out = []; let b = Buffer.from(line); while (b.length > 74) { let n = 74; while ((b[n] & 0xc0) === 0x80) n--; out.push(b.slice(0, n).toString()); b = Buffer.concat([Buffer.from(' '), b.slice(n)]); } out.push(b.toString()); return out.join('\r\n'); };
const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Taksila//Wan Phra//TH', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'X-WR-CALNAME:วันพระ · ตักศิลา', 'X-WR-CALDESC:วันพระ วันพระใหญ่ และฤกษ์ใหญ่ตามปฏิทินจันทรคติไทย จากแอปตักศิลา', 'X-WR-TIMEZONE:Asia/Bangkok', 'REFRESH-INTERVAL;VALUE=DURATION:P7D'];
const stamp = '20261112T000000Z';
let n = 0;
for (let y = 2026; y <= 2030; y++) for (let i = 0; i < 366; i++) {
  const d = new Date(y, 0, 1 + i); if (d.getFullYear() !== y) break;
  const l = thaiLunar(d); if (!l) continue;
  const names = l.events.filter((e) => e.k === 'big' || e.k === 'luck' || e.k === 'merit').map((e) => e.th);
  if (!l.holy && !names.length) continue;
  const title = names.length ? `${names.join(' · ')}${l.holy ? ' (วันพระ)' : ''}` : `วันพระ ${l.th}`;
  const desc = `${l.full}${l.events.find((e) => e.note) ? '\\n' + l.events.find((e) => e.note).note : ''}\\nดูบทสวดและที่ทำบุญในแอปตักศิลา: https://mengnattawitmarin.github.io/taksila/`;
  const e = new Date(d); e.setDate(e.getDate() + 1);
  L.push('BEGIN:VEVENT', `UID:taksila-${ymd(d)}@mengnattawitmarin.github.io`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(e)}`,
    fold(`SUMMARY:🙏 ${esc(title)}`), fold(`DESCRIPTION:${esc(desc).replace(/\\\\n/g, '\\n')}`), 'TRANSP:TRANSPARENT',
    'BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:พรุ่งนี้${esc(title)}`), 'TRIGGER:-PT6H', 'END:VALARM', 'END:VEVENT');
  n++;
}
L.push('END:VCALENDAR');
fs.writeFileSync(new URL('../calendar/wanphra.ics', import.meta.url), L.join('\r\n') + '\r\n');
console.log('events', n);
