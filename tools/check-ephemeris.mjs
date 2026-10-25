// Sanity check for the astro engine against known astronomical events.
// Run: node tools/check-ephemeris.mjs
import { planetPositions } from '../js/astro.js';

const cases = [
  ['ดวงอาทิตย์ 1 ม.ค. 2000 12:00 UT', new Date(Date.UTC(2000, 0, 1, 12)), 'sun', 280.37],
  ['วสันตวิษุวัต 20 มี.ค. 2026 14:46 UT', new Date(Date.UTC(2026, 2, 20, 14, 46)), 'sun', 0],
  ['จันทรุปราคา 7 ก.ย. 2025 18:11 UT (ดวงจันทร์)', new Date(Date.UTC(2025, 8, 7, 18, 11)), 'moon', 345.3],
  ['ดาวพฤหัสเข้าราศีกรกฎ 9 มิ.ย. 2025', new Date(Date.UTC(2025, 5, 10)), 'jupiter', 90],
  ['ดาวเนปจูนเข้าราศีเมษ 30 มี.ค. 2025', new Date(Date.UTC(2025, 2, 31)), 'neptune', 0],
  ['ดาวมฤตยูเข้าราศีเมถุน 7 ก.ค. 2025', new Date(Date.UTC(2025, 6, 8)), 'uranus', 60],
  ['ดาวพลูโตเข้าราศีกุมภ์ 19 พ.ย. 2024', new Date(Date.UTC(2024, 10, 20)), 'pluto', 300]
];
let worst = 0;
for (const [label, date, id, expected] of cases) {
  const got = planetPositions(date)[id].lon;
  let diff = Math.abs(got - expected); if (diff > 180) diff = 360 - diff;
  worst = Math.max(worst, diff);
  console.log(`${diff < 0.5 ? 'OK  ' : 'FAIL'} ${label}: ${got.toFixed(2)}° (คาด ~${expected}°)`);
}
console.log('คลาดเคลื่อนมากสุด', worst.toFixed(2), 'องศา');
