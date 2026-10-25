// Taksila astro engine — dependency-free.
// Planet positions follow Paul Schlyter's "How to compute planetary positions"
// (accuracy around 1–2 arc-minutes for planets, a few arc-minutes for the Moon,
// valid roughly 1900–2100). Longitudes are tropical, geocentric, equinox of date.

const RAD = Math.PI / 180;
const sind = (x) => Math.sin(x * RAD);
const cosd = (x) => Math.cos(x * RAD);
const tand = (x) => Math.tan(x * RAD);
const atan2d = (y, x) => Math.atan2(y, x) / RAD;
export const rev = (x) => ((x % 360) + 360) % 360;

export const SIGNS = [
  { id: 'aries', th: 'เมษ', en: 'Aries', glyph: '♈', trait: 'กล้า ตัดสินใจเร็ว ชอบเป็นผู้นำ' },
  { id: 'taurus', th: 'พฤษภ', en: 'Taurus', glyph: '♉', trait: 'มั่นคง อดทน รักความสบาย' },
  { id: 'gemini', th: 'เมถุน', en: 'Gemini', glyph: '♊', trait: 'ช่างคิด ช่างพูด ปรับตัวเร็ว' },
  { id: 'cancer', th: 'กรกฎ', en: 'Cancer', glyph: '♋', trait: 'อ่อนโยน ผูกพันครอบครัว ใส่ใจความรู้สึก' },
  { id: 'leo', th: 'สิงห์', en: 'Leo', glyph: '♌', trait: 'มั่นใจ ใจกว้าง อยากเป็นที่ยอมรับ' },
  { id: 'virgo', th: 'กันย์', en: 'Virgo', glyph: '♍', trait: 'ละเอียด รอบคอบ ช่างวิเคราะห์' },
  { id: 'libra', th: 'ตุลย์', en: 'Libra', glyph: '♎', trait: 'รักความยุติธรรม ประนีประนอม มีรสนิยม' },
  { id: 'scorpio', th: 'พิจิก', en: 'Scorpio', glyph: '♏', trait: 'ลึกซึ้ง มุ่งมั่น หยั่งรู้คน' },
  { id: 'sagittarius', th: 'ธนู', en: 'Sagittarius', glyph: '♐', trait: 'รักอิสระ มองโลกกว้าง ชอบเรียนรู้' },
  { id: 'capricorn', th: 'มังกร', en: 'Capricorn', glyph: '♑', trait: 'มีวินัย ทะเยอทะยาน วางแผนระยะยาว' },
  { id: 'aquarius', th: 'กุมภ์', en: 'Aquarius', glyph: '♒', trait: 'คิดแหวกแนว รักอิสระ ใส่ใจส่วนรวม' },
  { id: 'pisces', th: 'มีน', en: 'Pisces', glyph: '♓', trait: 'เห็นอกเห็นใจ จินตนาการสูง อ่อนไหว' }
];
export const ELEMENTS = [
  { id: 'fire', th: 'ไฟ' }, { id: 'earth', th: 'ดิน' }, { id: 'air', th: 'ลม' }, { id: 'water', th: 'น้ำ' }
];
export const elementOf = (signIndex) => signIndex % 4;

export const PLANETS = [
  { id: 'sun', th: 'อาทิตย์', glyph: '☉', kw: 'ตัวตนและเป้าหมายชีวิต' },
  { id: 'moon', th: 'จันทร์', glyph: '☽', kw: 'อารมณ์และความต้องการลึก ๆ' },
  { id: 'mercury', th: 'พุธ', glyph: '☿', kw: 'ความคิดและการสื่อสาร' },
  { id: 'venus', th: 'ศุกร์', glyph: '♀', kw: 'ความรัก ความงาม และคุณค่า' },
  { id: 'mars', th: 'อังคาร', glyph: '♂', kw: 'แรงขับ ความกล้า และการลงมือ' },
  { id: 'jupiter', th: 'พฤหัส', glyph: '♃', kw: 'โชค การเติบโต และผู้ใหญ่' },
  { id: 'saturn', th: 'เสาร์', glyph: '♄', kw: 'บทเรียน วินัย และความรับผิดชอบ' },
  { id: 'uranus', th: 'มฤตยู', glyph: '♅', kw: 'ความเปลี่ยนแปลงฉับพลัน' },
  { id: 'neptune', th: 'เนปจูน', glyph: '♆', kw: 'ความฝันและแรงบันดาลใจ' },
  { id: 'pluto', th: 'พลูโต', glyph: '♇', kw: 'พลังเปลี่ยนแปลงระดับราก' }
];
export const planetById = (id) => PLANETS.find((p) => p.id === id);

export const HOUSES = [
  'ตัวตน บุคลิก ภาพลักษณ์',
  'การเงิน ทรัพย์สิน',
  'การสื่อสาร พี่น้อง การเรียนรู้',
  'บ้าน ครอบครัว',
  'ความรัก ความคิดสร้างสรรค์',
  'งานประจำ สุขภาพ',
  'คู่ครอง หุ้นส่วน',
  'ทรัพย์ร่วม การเปลี่ยนแปลงลึกซึ้ง',
  'การเดินทางไกล การศึกษา',
  'อาชีพ ชื่อเสียง',
  'เพื่อน เครือข่าย ความหวัง',
  'จิตใต้สำนึก เรื่องเบื้องหลัง'
];

export const ASPECTS = [
  { id: 'conj', angle: 0, orb: 8, th: 'ร่วม', nature: 0 },
  { id: 'sext', angle: 60, orb: 5, th: 'หกสิบองศา', nature: 1 },
  { id: 'square', angle: 90, orb: 7, th: 'ตั้งฉาก', nature: -1 },
  { id: 'trine', angle: 120, orb: 7, th: 'ตรีโกณ', nature: 1 },
  { id: 'opp', angle: 180, orb: 8, th: 'เล็งกัน', nature: -1 }
];

// ---------- time ----------
export function dayNumber(date) {
  // days since 2000 Jan 0.0 UT
  return date.getTime() / 86400000 - 10956;
}

function tzOffsetMinutes(tz, ms) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const p = {};
  for (const part of f.formatToParts(new Date(ms))) p[part.type] = part.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUtc - ms) / 60000);
}

// local wall-clock time at a place -> UTC Date
export function localToUtc(y, m, d, h, mi, place) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  if (place.tz) {
    let off = tzOffsetMinutes(place.tz, guess);
    let utc = guess - off * 60000;
    const off2 = tzOffsetMinutes(place.tz, utc);
    if (off2 !== off) utc = guess - off2 * 60000;
    return new Date(utc);
  }
  return new Date(guess - (place.offset || 0) * 60 * 60000);
}

// ---------- orbital mechanics ----------
function kepler(M, e) {
  let E = M + (180 / Math.PI) * e * sind(M) * (1 + e * cosd(M));
  for (let i = 0; i < 8; i++) {
    const dE = (E - (180 / Math.PI) * e * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

function elements(id, d) {
  switch (id) {
    case 'mercury': return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.0e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d };
    case 'venus': return { N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d };
    case 'mars': return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d };
    case 'jupiter': return { N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.895 + 0.0830853001 * d };
    case 'saturn': return { N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.967 + 0.0334442282 * d };
    case 'uranus': return { N: 74.0005 + 1.3978e-5 * d, i: 0.7733 + 1.9e-8 * d, w: 96.6612 + 3.0565e-5 * d, a: 19.18171 - 1.55e-8 * d, e: 0.047318 + 7.45e-9 * d, M: 142.5905 + 0.011725806 * d };
    case 'neptune': return { N: 131.7806 + 3.0173e-5 * d, i: 1.77 - 2.55e-7 * d, w: 272.8461 - 6.027e-6 * d, a: 30.05826 + 3.313e-8 * d, e: 0.008606 + 2.15e-9 * d, M: 260.2471 + 0.005995147 * d };
    default: return null;
  }
}

function orbitXYZ(el) {
  const M = rev(el.M);
  const E = kepler(M, el.e);
  const xv = el.a * (cosd(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + el.w;
  const x = r * (cosd(el.N) * cosd(vw) - sind(el.N) * sind(vw) * cosd(el.i));
  const y = r * (sind(el.N) * cosd(vw) + cosd(el.N) * sind(vw) * cosd(el.i));
  const z = r * (sind(vw) * sind(el.i));
  return { x, y, z, r };
}

function sunData(d) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = rev(356.047 + 0.9856002585 * d);
  const E = kepler(M, e);
  const xv = cosd(E) - e;
  const yv = Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = rev(v + w);
  return { lon, r, M, L: rev(M + w), x: r * cosd(lon), y: r * sind(lon) };
}

function moonLon(d, sun) {
  const el = { N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.0549, M: 115.3654 + 13.0649929509 * d };
  const p = orbitXYZ(el);
  let lon = atan2d(p.y, p.x);
  const Mm = rev(el.M), Ms = sun.M;
  const Lm = rev(el.N + el.w + el.M);
  const D = rev(Lm - sun.L);
  const F = rev(Lm - el.N);
  lon += -1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms)
    - 0.059 * sind(2 * Mm - 2 * D) - 0.057 * sind(Mm - 2 * D + Ms) + 0.053 * sind(Mm + 2 * D)
    + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms) - 0.035 * sind(D) - 0.031 * sind(Mm + Ms)
    - 0.015 * sind(2 * F - 2 * D) + 0.011 * sind(Mm - 4 * D);
  return rev(lon);
}

function plutoHelio(d) {
  const S = 50.03 + 0.033459652 * d;
  const P = 238.95 + 0.003968789 * d;
  let lon = 238.9508 + 0.00400703 * d
    - 19.799 * sind(P) + 19.848 * cosd(P) + 0.897 * sind(2 * P) - 4.956 * cosd(2 * P)
    + 0.61 * sind(3 * P) + 1.211 * cosd(3 * P) - 0.341 * sind(4 * P) - 0.19 * cosd(4 * P)
    + 0.128 * sind(5 * P) - 0.034 * cosd(5 * P) - 0.038 * sind(6 * P) + 0.031 * cosd(6 * P)
    + 0.02 * sind(S - P) - 0.01 * cosd(S - P);
  const lat = -3.9082 - 5.453 * sind(P) - 14.975 * cosd(P) + 3.527 * sind(2 * P) + 1.673 * cosd(2 * P)
    - 1.051 * sind(3 * P) + 0.328 * cosd(3 * P) + 0.179 * sind(4 * P) - 0.292 * cosd(4 * P)
    + 0.019 * sind(5 * P) + 0.1 * cosd(5 * P) - 0.031 * sind(6 * P) - 0.026 * cosd(6 * P)
    + 0.011 * cosd(S - P);
  const r = 40.72 + 6.68 * sind(P) + 6.9 * cosd(P) - 1.18 * sind(2 * P) - 0.03 * cosd(2 * P)
    + 0.15 * sind(3 * P) - 0.14 * cosd(3 * P);
  lon += 3.82394e-5 * d; // J2000 -> equinox of date
  return { x: r * cosd(lat) * cosd(lon), y: r * cosd(lat) * sind(lon), z: r * sind(lat) };
}

function helio(id, d) {
  if (id === 'pluto') return plutoHelio(d);
  const el = elements(id, d);
  const p = orbitXYZ(el);
  if (id === 'jupiter' || id === 'saturn' || id === 'uranus') {
    const Mj = rev(19.895 + 0.0830853001 * d);
    const Ms = rev(316.967 + 0.0334442282 * d);
    const Mu = rev(142.5905 + 0.011725806 * d);
    let lon = atan2d(p.y, p.x);
    let lat = atan2d(p.z, Math.sqrt(p.x * p.x + p.y * p.y));
    if (id === 'jupiter') {
      lon += -0.332 * sind(2 * Mj - 5 * Ms - 67.6) - 0.056 * sind(2 * Mj - 2 * Ms + 21) + 0.042 * sind(3 * Mj - 5 * Ms + 21)
        - 0.036 * sind(Mj - 2 * Ms) + 0.022 * cosd(Mj - Ms) + 0.023 * sind(2 * Mj - 3 * Ms + 52) - 0.016 * sind(Mj - 5 * Ms - 69);
    } else if (id === 'saturn') {
      lon += 0.812 * sind(2 * Mj - 5 * Ms - 67.6) - 0.229 * cosd(2 * Mj - 4 * Ms - 2) + 0.119 * sind(Mj - 2 * Ms - 3)
        + 0.046 * sind(2 * Mj - 6 * Ms - 69) + 0.014 * sind(Mj - 3 * Ms + 32);
      lat += -0.02 * cosd(2 * Mj - 4 * Ms - 2) + 0.018 * sind(2 * Mj - 6 * Ms - 49);
    } else {
      lon += 0.04 * sind(Ms - 2 * Mu + 6) + 0.035 * sind(Ms - 3 * Mu + 33) - 0.015 * sind(Mj - Mu + 20);
    }
    return { x: p.r * cosd(lat) * cosd(lon), y: p.r * cosd(lat) * sind(lon), z: p.r * sind(lat) };
  }
  return p;
}

function lonAt(id, d) {
  const sun = sunData(d);
  if (id === 'sun') return sun.lon;
  if (id === 'moon') return moonLon(d, sun);
  const h = helio(id, d);
  return rev(atan2d(h.y + sun.y, h.x + sun.x));
}

// All planet longitudes for a UTC date. Includes retrograde flags.
export function planetPositions(date) {
  const d = dayNumber(date);
  const out = {};
  for (const p of PLANETS) {
    const lon = lonAt(p.id, d);
    let retro = false;
    if (p.id !== 'sun' && p.id !== 'moon') {
      const a = lonAt(p.id, d - 0.5), b = lonAt(p.id, d + 0.5);
      let diff = b - a;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      retro = diff < 0;
    }
    out[p.id] = { lon, retro };
  }
  return out;
}

export function angles(date, latDeg, lonDeg) {
  const d = dayNumber(date);
  const sun = sunData(d);
  const ecl = 23.4393 - 3.563e-7 * d;
  const ut = (date.getTime() / 3600000) % 24;
  const ramc = rev(sun.L + 180 + ut * 15 + lonDeg);
  const asc = rev(atan2d(cosd(ramc), -(sind(ramc) * cosd(ecl) + tand(latDeg) * sind(ecl))));
  const mc = rev(atan2d(sind(ramc), cosd(ramc) * cosd(ecl)));
  return { asc, mc };
}

export const signOf = (lon) => Math.floor(rev(lon) / 30);
export function fmtDeg(lon) {
  const inSign = rev(lon) % 30;
  let deg = Math.floor(inSign);
  let min = Math.round((inSign - deg) * 60);
  if (min === 60) { deg += 1; min = 0; }
  return String(deg).padStart(2, '0') + '°' + String(min).padStart(2, '0') + '′';
}
export const angDist = (a, b) => { const x = Math.abs(rev(a) - rev(b)) % 360; return x > 180 ? 360 - x : x; };

export function findAspect(a, b, orbScale = 1) {
  const dist = angDist(a, b);
  for (const asp of ASPECTS) {
    const off = Math.abs(dist - asp.angle);
    if (off <= asp.orb * orbScale) return { ...asp, off };
  }
  return null;
}

// ---------- natal chart ----------
export function computeChart(profile) {
  const t = profile.timeKnown ? { h: profile.hour, m: profile.minute } : { h: 12, m: 0 };
  const yCE = profile.yearBE - 543;
  const utc = localToUtc(yCE, profile.month, profile.day, t.h, t.m, profile.place);
  const pos = planetPositions(utc);
  let asc = null, mc = null;
  if (profile.timeKnown) {
    const a = angles(utc, profile.place.lat, profile.place.lon);
    asc = a.asc; mc = a.mc;
  }
  // whole-sign houses from the rising sign (or the Sun sign when the time is unknown)
  const firstSign = asc != null ? signOf(asc) : signOf(pos.sun.lon);
  const houseOf = (lon) => ((signOf(lon) - firstSign + 12) % 12) + 1;
  const planets = PLANETS.map((p) => {
    const lon = pos[p.id].lon;
    return { ...p, lon, retro: pos[p.id].retro, sign: signOf(lon), house: houseOf(lon) };
  });
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const scale = (planets[i].id === 'sun' || planets[i].id === 'moon') ? 1.2 : 1;
      const a = findAspect(planets[i].lon, planets[j].lon, scale);
      if (a) aspects.push({ a: planets[i], b: planets[j], ...a });
    }
  }
  aspects.sort((x, y) => x.off - y.off);
  const elementCount = [0, 0, 0, 0];
  planets.forEach((p) => { elementCount[elementOf(p.sign)] += 1; });
  const signCount = new Array(12).fill(0);
  planets.forEach((p) => { signCount[p.sign] += 1; });
  return { utc, asc, mc, firstSign, houseOf, planets, aspects, elementCount, signCount, timeKnown: profile.timeKnown };
}

// When does a slow planet leave its current sign? (scan forward)
function signExit(id, date) {
  const d0 = dayNumber(date);
  const s0 = signOf(lonAt(id, d0));
  const step = id === 'jupiter' ? 3 : 7;
  for (let k = step; k < 365 * 25; k += step) {
    if (signOf(lonAt(id, d0 + k)) !== s0) {
      // make sure it is not a short retrograde dip back
      if (signOf(lonAt(id, d0 + k + 120)) !== s0) return new Date(date.getTime() + k * 86400000);
    }
  }
  return null;
}

const TRANSIT_TEXT = {
  jupiter: (h) => 'ขยายโอกาสเรื่อง' + h + ' มีคนสนับสนุน เหมาะเริ่มสิ่งใหม่',
  saturn: (h) => 'ต้องจัดระเบียบและรับผิดชอบเรื่อง' + h + ' ผลจะมั่นคงถ้าอดทน',
  uranus: (h) => 'เรื่อง' + h + ' มีความเปลี่ยนแปลงกะทันหัน เปิดรับวิธีใหม่',
  neptune: (h) => 'เรื่อง' + h + ' อาจคลุมเครือ ใช้สัญชาตญาณร่วมกับข้อเท็จจริง',
  pluto: (h) => 'การเปลี่ยนแปลงลึกซึ้งในเรื่อง' + h + ' ปล่อยสิ่งเก่าเพื่อเติบโต'
};

export function transits(chart, now = new Date()) {
  const pos = planetPositions(now);
  const out = [];
  for (const id of ['saturn', 'jupiter', 'uranus', 'neptune', 'pluto']) {
    const lon = pos[id].lon;
    const sign = signOf(lon);
    const house = chart.houseOf(lon);
    const natal = chart.planets.find((p) => p.id === id);
    const isReturn = (id === 'saturn' || id === 'jupiter') && angDist(lon, natal.lon) < 10;
    const hits = [];
    for (const target of chart.planets.filter((p) => ['sun', 'moon', 'venus', 'mars', 'mercury'].includes(p.id))) {
      const a = findAspect(lon, target.lon, 0.5);
      if (a) hits.push({ target, ...a });
    }
    if (chart.asc != null) {
      const a = findAspect(lon, chart.asc, 0.5);
      if (a) hits.push({ target: { th: 'ลัคนา', glyph: 'ASC' }, ...a });
    }
    const exit = signExit(id, now);
    let weight = { saturn: 5, jupiter: 4, uranus: 3, neptune: 2, pluto: 2 }[id] + hits.length * 2 + (isReturn ? 6 : 0);
    const p = planetById(id);
    let title = (isReturn ? (id === 'saturn' ? 'ดาวเสาร์คืนเรือน' : 'ดาวพฤหัสคืนเรือน') : 'ดาว' + p.th + 'จรราศี' + SIGNS[sign].th) + ' · ภพ ' + house;
    let body = TRANSIT_TEXT[id](HOUSES[house - 1]);
    if (isReturn) body = (id === 'saturn' ? 'รอบ 29 ปีของดาวเสาร์กลับมาทับตำแหน่งเดิม ช่วงทบทวนชีวิตครั้งใหญ่ ' : 'รอบ 12 ปีของดาวพฤหัสกลับมา เริ่มวงจรการเติบโตใหม่ ') + body;
    out.push({
      id, glyph: p.glyph, lon, sign, house, retro: pos[id].retro, hits, isReturn, exit, weight, title, body,
      level: weight >= 9 ? 'HIGH' : id === 'jupiter' ? 'SUPPORT' : 'SHIFT'
    });
  }
  out.sort((a, b) => b.weight - a.weight);
  return out;
}

// ---------- daily reading ----------
const AREA = {
  sun: 'งานและเป้าหมาย', moon: 'อารมณ์และครอบครัว', mercury: 'การสื่อสารและเอกสาร', venus: 'ความรักและการเงิน',
  mars: 'การลงมือทำ', jupiter: 'โอกาสใหม่', saturn: 'ความรับผิดชอบ'
};
const CATS = [
  { th: 'ความรัก', natal: ['venus', 'moon'], movers: ['venus', 'moon', 'mars', 'jupiter'] },
  { th: 'การงาน', natal: ['sun', 'saturn', 'mars'], movers: ['jupiter', 'saturn', 'mars', 'sun', 'mercury'] },
  { th: 'การเงิน', natal: ['venus', 'jupiter'], movers: ['venus', 'jupiter', 'moon', 'saturn'] },
  { th: 'สุขภาพ', natal: ['sun', 'mars', 'moon'], movers: ['mars', 'saturn', 'moon'] }
];

export function daily(chart, now = new Date()) {
  const pos = planetPositions(now);
  const natal = Object.fromEntries(chart.planets.map((p) => [p.id, p]));
  const scores = CATS.map((c) => {
    let s = 0;
    for (const m of c.movers) for (const n of c.natal) {
      const a = findAspect(pos[m].lon, natal[n].lon, m === 'moon' ? 0.8 : 0.6);
      if (a) s += a.nature === 0 ? (['saturn', 'mars'].includes(m) ? -0.5 : 0.5) : a.nature;
    }
    s = 3.2 + s * 0.55;
    return { name: c.th, score: Math.max(1, Math.min(5, Math.round(s))) };
  });
  // headline: tightest aspect from a fast mover to a personal natal planet
  let best = null;
  for (const m of ['moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter']) {
    for (const n of ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']) {
      const a = findAspect(pos[m].lon, natal[n].lon, 0.6);
      if (a && (!best || a.off < best.off)) best = { m, n, ...a };
    }
  }
  let headline, basis;
  if (best) {
    const area = AREA[best.n];
    headline = best.nature > 0 ? 'วันที่จังหวะลื่นไหล เหมาะกับเรื่อง' + area
      : best.nature < 0 ? 'มีแรงกดดันเรื่อง' + area + ' ใจเย็นแล้วจะผ่านไปได้ดี'
        : 'พลังงานรวมตัวที่เรื่อง' + area + ' เหมาะโฟกัสเรื่องนี้';
    basis = 'ดาว' + planetById(best.m).th + 'จร' + best.th + 'ดาว' + planetById(best.n).th + 'ในดวงกำเนิด';
  } else {
    const h = chart.houseOf(pos.sun.lon);
    headline = 'วันที่สงบ เหมาะใส่ใจเรื่อง' + HOUSES[h - 1];
    basis = 'ดวงอาทิตย์จรภพ ' + h;
  }
  return { scores, headline, basis, sunSign: signOf(pos.sun.lon), moonSign: signOf(pos.moon.lon), pos };
}

// ---------- live daily transits (recomputed every minute by the app) ----------
export const lonOf = (id, date) => lonAt(id, dayNumber(date));

const MOVER_ORB = { moon: 6, sun: 4, mercury: 3.5, venus: 3.5, mars: 3.5, jupiter: 3, saturn: 3, uranus: 2, neptune: 2, pluto: 2 };
const MOVER_W = { moon: 1, sun: 1.2, mercury: 0.9, venus: 1, mars: 1.1, jupiter: 1.3, saturn: 1.4, uranus: 1.2, neptune: 1, pluto: 1.2 };
const TARGET_W = { sun: 1.3, moon: 1.3, asc: 1.2, venus: 1.1, mars: 1, mercury: 1, jupiter: 0.9, saturn: 0.9, uranus: 0.7, neptune: 0.7, pluto: 0.7 };
export const MOVER_ACT = {
  moon: 'กระตุ้นอารมณ์และความรู้สึกเรื่อง', sun: 'ส่องสว่างและเติมพลังให้เรื่อง', mercury: 'นำความคิด ข่าวสาร และการพูดคุยมาสู่เรื่อง',
  venus: 'เติมเสน่ห์และความราบรื่นให้เรื่อง', mars: 'เร่งพลังและความใจร้อนในเรื่อง', jupiter: 'ขยายโอกาสและโชคให้เรื่อง',
  saturn: 'ทดสอบความอดทนและวางโครงสร้างให้เรื่อง', uranus: 'สร้างความเปลี่ยนแปลงไม่คาดคิดต่อเรื่อง',
  neptune: 'เพิ่มแรงบันดาลใจแต่ทำให้คลุมเครือในเรื่อง', pluto: 'เปลี่ยนแปลงอย่างลึกซึ้งต่อเรื่อง'
};
export const TARGET_AREA = {
  sun: 'ตัวตนและเป้าหมาย', moon: 'อารมณ์และครอบครัว', mercury: 'ความคิดและการสื่อสาร', venus: 'ความรักและการเงิน',
  mars: 'แรงขับและการลงมือ', jupiter: 'โอกาสและการเติบโต', saturn: 'ความรับผิดชอบและงานระยะยาว', uranus: 'ความต้องการอิสระ',
  neptune: 'ความฝันและจินตนาการ', pluto: 'พลังเปลี่ยนแปลงภายใน', asc: 'ภาพลักษณ์และสุขภาพ'
};
export const ASPECT_ADVICE = {
  conj: 'มุมร่วม พลังสองดวงรวมกันเข้มข้น ส่งผลชัดเจน',
  sext: 'มุมส่งเสริม เปิดโอกาสถ้าลงมือเอง',
  trine: 'มุมกลมกลืน เรื่องนี้ไหลลื่น ใช้จังหวะนี้ได้เต็มที่',
  square: 'มุมตั้งฉาก มีแรงเสียดทาน อย่าตัดสินใจตอนอารมณ์ร้อน',
  opp: 'มุมเล็งกัน ต้องประนีประนอมและฟังอีกฝ่าย'
};
export const ASPECT_GLYPH = { conj: '☌', sext: '⚹', square: '□', trine: '△', opp: '☍' };

function offAt(id, target, angle, ms) {
  return Math.abs(angDist(lonAt(id, dayNumber(new Date(ms))), target) - angle);
}
// When will this aspect be exact? Returns { applying, at } (at = Date or null).
function exactness(id, target, angle, now) {
  const t0 = now.getTime();
  const o0 = offAt(id, target, angle, t0);
  const probe = id === 'moon' ? 60e3 : 3600e3;
  if (offAt(id, target, angle, t0 + probe) > o0) return { applying: false, at: null };
  if (['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(id)) return { applying: true, at: null };
  const step = id === 'moon' ? 600e3 : 3 * 3600e3;
  const span = id === 'moon' ? 36 * 3600e3 : 12 * 86400e3;
  let prev = o0;
  for (let k = step; k <= span; k += step) {
    const o = offAt(id, target, angle, t0 + k);
    if (o > prev) {
      let a = Math.max(t0, t0 + k - 2 * step), b = t0 + k;
      for (let i = 0; i < 40; i++) {
        const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
        if (offAt(id, target, angle, m1) < offAt(id, target, angle, m2)) b = m2; else a = m1;
      }
      return { applying: true, at: new Date((a + b) / 2) };
    }
    prev = o;
  }
  return { applying: true, at: null };
}

// All transit-to-natal aspects active right now, strongest first, with reasons.
export function liveAspects(chart, now = new Date()) {
  const d = dayNumber(now);
  const targets = chart.planets.map((p) => ({ id: p.id, th: p.th, glyph: p.glyph, lon: p.lon, sign: p.sign }));
  if (chart.asc != null) targets.push({ id: 'asc', th: 'ลัคนา', glyph: 'ASC', lon: chart.asc, sign: signOf(chart.asc) });
  const out = [];
  for (const m of PLANETS) {
    const lon = lonAt(m.id, d);
    for (const t of targets) {
      const dist = angDist(lon, t.lon);
      for (const asp of ASPECTS) {
        const off = Math.abs(dist - asp.angle);
        const orb = MOVER_ORB[m.id];
        if (off > orb) continue;
        const strength = MOVER_W[m.id] * TARGET_W[t.id] * (1 - off / orb);
        out.push({ mover: { ...m, lon, sign: signOf(lon), house: chart.houseOf(lon) }, target: t, asp, off, strength });
      }
    }
  }
  out.sort((a, b) => b.strength - a.strength);
  const top = out.slice(0, 6);
  for (const x of top) {
    const ex = exactness(x.mover.id, x.target.lon, x.asp.angle, now);
    x.applying = ex.applying; x.exactAt = ex.at;
    x.reason = MOVER_ACT[x.mover.id] + TARGET_AREA[x.target.id];
    x.advice = ASPECT_ADVICE[x.asp.id];
  }
  return top;
}

function nextIngress(id, now, span, step) {
  const t0 = now.getTime();
  const s0 = signOf(lonOf(id, now));
  for (let k = step; k <= span; k += step) {
    if (signOf(lonOf(id, new Date(t0 + k))) !== s0) {
      let a = t0 + k - step, b = t0 + k;
      while (b - a > 30e3) { const m = (a + b) / 2; if (signOf(lonOf(id, new Date(m))) === s0) a = m; else b = m; }
      return { kind: 'ingress', id, at: new Date(b), sign: signOf(lonOf(id, new Date(b + 60e3))) };
    }
  }
  return null;
}
// Upcoming sign changes of the fast planets.
export function upcomingIngresses(chart, now = new Date()) {
  const ev = [nextIngress('moon', now, 3 * 86400e3, 15 * 60e3)];
  for (const id of ['sun', 'mercury', 'venus', 'mars']) ev.push(nextIngress(id, now, 45 * 86400e3, 6 * 3600e3));
  return ev.filter(Boolean).map((e) => ({ ...e, house: chart.houseOf(e.sign * 30 + 1) })).sort((a, b) => a.at - b.at);
}

// ---------- compatibility ----------
const PAIR_TABLE = [
  ['0° ร่วมราศี', 76, 'นิสัยคล้ายกันมาก เข้าใจกันง่าย แต่ระวังมองข้ามจุดอ่อนเดียวกัน'],
  ['30° เซมิเซ็กซ์ไทล์', 58, 'อยู่ใกล้กันแต่มองโลกต่างมุม ต้องอาศัยการเรียนรู้กัน'],
  ['60° เซ็กซ์ไทล์', 84, 'คุยกันถูกคอ ช่วยเปิดโอกาสใหม่ให้กันและกัน'],
  ['90° สแควร์', 52, 'แรงดึงดูดสูงแต่ปะทะกันง่าย ต้องตกลงกติกาให้ชัด'],
  ['120° ไทรน์', 91, 'จังหวะชีวิตสอดคล้อง อยู่ด้วยกันแล้วสบายใจ'],
  ['150° ควินคันซ์', 60, 'ความต้องการต่างกันแบบละเอียดอ่อน ต้องปรับจูนสม่ำเสมอ'],
  ['180° ออปโพสิชัน', 73, 'ขั้วตรงข้ามที่เติมเต็มกัน ดึงดูดแรงแต่ต้องหาจุดกึ่งกลาง']
];

export function compatibility(mySign, theirSign, myChart, theirPositions) {
  const diff = (theirSign - mySign + 12) % 12;
  const k = Math.min(diff, 12 - diff);
  const row = PAIR_TABLE[k];
  let score = row[1];
  const tags = [row[0]];
  const e1 = elementOf(mySign), e2 = elementOf(theirSign);
  const friendly = (e1 - e2 + 4) % 2 === 0;
  tags.push('ธาตุ' + ELEMENTS[e1].th + ' × ธาตุ' + ELEMENTS[e2].th + (friendly ? ' · ส่งเสริม' : ' · ต่างกัน'));
  const links = [];
  if (myChart && theirPositions) {
    score = Math.round(score * 0.6 + 30);
    const mine = ['sun', 'moon', 'venus', 'mars'];
    for (const a of mine) for (const b of mine) {
      const asp = findAspect(myChart.planets.find((p) => p.id === a).lon, theirPositions[b].lon, 0.7);
      if (asp) {
        score += asp.nature === 0 ? 3 : asp.nature * 4;
        links.push(planetById(a).glyph + ' ' + asp.th + ' ' + planetById(b).glyph);
      }
    }
    score = Math.max(35, Math.min(98, score));
  }
  return { score, reading: row[2], tags, links };
}
