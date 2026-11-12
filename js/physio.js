// โหงวเฮ้ง (面相) และลายมือ: วัดสัดส่วนจากจุด landmark ของ MediaPipe แล้วอ่านตามหลักตำรา
// ใบหน้า: Face Landmarker 478 จุด · มือ: Hand Landmarker 21 จุด (+ พิกัดจริงหน่วยเมตร)
// หลักที่ใช้: สามส่วนของใบหน้า (三停), 12 ตำแหน่ง (十二宮), รูปหน้าห้าธาตุ (五行面相),
// สัดส่วนอุดมคติ เช่น ระยะหว่างตาเท่าความยาวตา และปีกจมูกเท่าระยะหว่างหัวตา
// มือ: รูปมือสี่ธาตุ (ดิน ลม ไฟ น้ำ) และความยาวนิ้วตามตำราลายมือสากล
// ผลเป็นแนวทางเพื่อความบันเทิงและรู้จักตัวเอง ไม่ใช่การตัดสินคน

// ---------- เครื่องมือเรขาคณิต ----------
const phD2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const phD3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
const phMid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 });
const phClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const phR2 = (v) => Math.round(v * 100) / 100;

// แปลงพิกัด 0–1 เป็นพิกเซล แล้วหมุนให้ตาอยู่แนวระนาบ (แก้หน้าเอียง)
function levelFace(lm, W, H) {
  const P = lm.map((p) => ({ x: p.x * W, y: p.y * H, z: (p.z || 0) * W }));
  const eR = phMid(P[33], P[133]), eL = phMid(P[263], P[362]); // ตาขวาของเจ้าของหน้า (ซ้ายภาพ) / ตาซ้าย
  const roll = Math.atan2(eL.y - eR.y, eL.x - eR.x);
  const c = phMid(eR, eL), cs = Math.cos(-roll), sn = Math.sin(-roll);
  return { P: P.map((p) => ({ x: c.x + (p.x - c.x) * cs - (p.y - c.y) * sn, y: c.y + (p.x - c.x) * sn + (p.y - c.y) * cs, z: p.z })), roll: roll * 180 / Math.PI };
}

// ---------- จัดหน้าให้ตรงแบบ 3 มิติ ----------
// เทียบจุดที่ไม่ขยับตามสีหน้า (หัวตา หางตา สันจมูก หน้าผาก คาง แก้ม) กับใบหน้ามาตรฐานของ MediaPipe
// แล้วหมุนกลับให้หน้าตรง ทำให้สัดส่วนไม่เพี้ยนเวลาหน้าเอียงหรือหันเล็กน้อย (วิธีของ Horn, 1987)
const PH_CANON = {"33":[-4.446,-2.664,-3.173],"133":[-1.856,-2.585,-3.758],"263":[4.446,-2.664,-3.173],"362":[1.856,-2.585,-3.758],"1":[0,1.127,-7.476],"4":[0,0.463,-7.587],"6":[0,-2.473,-5.789],"168":[0,-3.271,-5.236],"10":[0,-8.262,-4.482],"152":[0,9.403,-4.264],"234":[-7.664,-0.673,2.436],"454":[7.664,-0.673,2.436],"2":[0,2.089,-6.058],"9":[0,-4.886,-5.385],"151":[0,-6.545,-5.027],"58":[-6.72,4.789,1.745],"288":[6.72,4.789,1.745],"197":[0,-1.728,-6.317],"195":[0,-1.059,-6.775],"5":[0,-0.366,-7.243],"8":[0,-4.019,-5.285]};
function phJacobi4(A) { // eigen-decomposition of a symmetric 4×4 matrix
  const a = A.map((r) => r.slice()), V = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) off += a[i][j] * a[i][j];
    if (off < 1e-18) break;
    for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) {
      if (Math.abs(a[p][q]) < 1e-15) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 4; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < 4; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < 4; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  return { val: [0, 1, 2, 3].map((i) => a[i][i]), vec: V };
}
function frontalize(P) {
  const ids = Object.keys(PH_CANON).map(Number), n = ids.length;
  const ca = [0, 0, 0], cb = [0, 0, 0];
  for (const i of ids) { const a = PH_CANON[i]; ca[0] += a[0] / n; ca[1] += a[1] / n; ca[2] += a[2] / n; cb[0] += P[i].x / n; cb[1] += P[i].y / n; cb[2] += P[i].z / n; }
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const i of ids) {
    const a = [PH_CANON[i][0] - ca[0], PH_CANON[i][1] - ca[1], PH_CANON[i][2] - ca[2]], b = [P[i].x - cb[0], P[i].y - cb[1], P[i].z - cb[2]];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) S[r][c] += a[r] * b[c];
  }
  const [[xx, xy, xz], [yx, yy, yz], [zx, zy, zz]] = S;
  const N = [[xx + yy + zz, yz - zy, zx - xz, xy - yx], [yz - zy, xx - yy - zz, xy + yx, zx + xz], [zx - xz, xy + yx, -xx + yy - zz, yz + zy], [xy - yx, zx + xz, yz + zy, -xx - yy + zz]];
  const { val, vec } = phJacobi4(N), k = val.indexOf(Math.max(...val));
  const [w, x, y, z] = [vec[0][k], vec[1][k], vec[2][k], vec[3][k]];
  const R = [[w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z]];
  // R maps canonical → observed; apply Rᵀ to bring the observed face back to frontal
  const out = P.map((p) => { const d = [p.x - cb[0], p.y - cb[1], p.z - cb[2]]; return { x: R[0][0] * d[0] + R[1][0] * d[1] + R[2][0] * d[2], y: R[0][1] * d[0] + R[1][1] * d[1] + R[2][1] * d[2], z: R[0][2] * d[0] + R[1][2] * d[1] + R[2][2] * d[2] }; });
  const yaw = Math.asin(Math.max(-1, Math.min(1, R[0][2]))) * 180 / Math.PI, pitch = Math.asin(Math.max(-1, Math.min(1, -R[1][2]))) * 180 / Math.PI, roll = Math.atan2(R[1][0], R[0][0]) * 180 / Math.PI;
  return { P: out, yaw, pitch, roll, extra: P.length > 478 };
}

// ---------- ใบหน้า: วัดค่า ----------
// ดัชนีจุดหลักของ Face Mesh
// ค่าเปรียบเทียบประชากร (เปอร์เซ็นไทล์ 10/25/50/75/90) วัดด้วยโค้ดนี้จากภาพหน้าตรง 628 ภาพ
// (ภาพทางการสาธารณสมบัติจาก github.com/unitedstates/images) ค่าปาก ตา คาง ใช้เฉพาะภาพที่ไม่ยิ้ม
// หมายเหตุ: กลุ่มตัวอย่างส่วนใหญ่เป็นชาวตะวันตก ค่าจมูกและระยะตาของคนเอเชียอาจต่างไปเล็กน้อย
export const PH_NORM = {"ratio":[1.139,1.172,1.205,1.244,1.282],"fore":[0.816,0.828,0.842,0.856,0.869],"jaw":[0.793,0.805,0.818,0.828,0.838],"chinW":[0.174,0.179,0.184,0.189,0.195],"up":[0.223,0.269,0.298,0.322,0.342],"md":[0.306,0.319,0.335,0.356,0.38],"lo":[0.341,0.353,0.368,0.384,0.404],"eyeGapR":[1.189,1.239,1.306,1.384,1.441],"eyeOpen":[0.251,0.278,0.298,0.321,0.342],"tilt":[0.481,1.81,2.972,4.225,5.499],"browLenR":[1.564,1.604,1.662,1.712,1.762],"browEye":[0.535,0.581,0.642,0.71,0.773],"browGap":[1.007,1.041,1.085,1.131,1.18],"noseWR":[1.108,1.164,1.215,1.269,1.317],"noseLR":[0.224,0.234,0.246,0.258,0.273],"mouthR":[1.263,1.328,1.393,1.43,1.467],"lipBal":[0.519,0.564,0.65,0.704,0.764],"lipThick":[0.145,0.177,0.217,0.255,0.289],"corner":[-0.015,0.003,0.017,0.033,0.055],"philR":[0.227,0.24,0.253,0.272,0.29],"chinLR":[0.513,0.535,0.563,0.596,0.614],"sym":[0.852,0.89,0.92,0.94,0.953]};
// หน้าผากที่วัดได้จริง ÷ ระยะคิ้วถึงจุด 10 (มัธยฐานจาก 611 ภาพที่ตรวจพบแนวไรผม)
export const PH_HAIRK = 1.77;
// ตำแหน่งเทียบคนทั่วไป 0–100 (ประมาณจากเปอร์เซ็นไทล์)
export function phPct(k, v) {
  const q = PH_NORM[k], P = [10, 25, 50, 75, 90];
  if (!q) return 50;
  if (v <= q[0]) return Math.max(2, 10 - (q[0] - v) / Math.max(1e-6, q[1] - q[0]) * 15);
  if (v >= q[4]) return Math.min(98, 90 + (v - q[4]) / Math.max(1e-6, q[4] - q[3]) * 15);
  for (let i = 0; i < 4; i++) if (v <= q[i + 1]) return P[i] + (v - q[i]) / Math.max(1e-6, q[i + 1] - q[i]) * (P[i + 1] - P[i]);
  return 50;
}
const phZ = (k, v) => { const q = PH_NORM[k]; return (v - q[2]) / Math.max(1e-6, (q[3] - q[1]) / 1.349); };
const nb = (k, v) => (v < PH_NORM[k][1] ? -1 : v > PH_NORM[k][3] ? 1 : 0); // ต่ำกว่า P25 / สูงกว่า P75
const pctTxt = (k, v) => { const p = Math.round(phPct(k, v)); return p >= 60 ? `มากกว่าคนทั่วไป ~${p}%` : p <= 40 ? `น้อยกว่าคนทั่วไป ~${100 - p}%` : 'ใกล้ค่ากลาง'; };
export const FI = {
  top: 10, glab: 9, nasion: 168, bridge: 6, tip: 4, sub: 2, lipTop: 0, lipIn1: 13, lipIn2: 14, lipBot: 17, chin: 152,
  eRo: 33, eRi: 133, eRt: 159, eRb: 145, eLo: 263, eLi: 362, eLt: 386, eLb: 374,
  bRo: 70, bRi: 107, bRt: 105, bLo: 300, bLi: 336, bLt: 334,
  noseR: 64, noseL: 294, mR: 61, mL: 291, cheekR: 234, cheekL: 454, jawR: 172, jawL: 397, foreR: 54, foreL: 284, chinR: 148, chinL: 377
};
// คู่จุดซ้าย-ขวา ใช้วัดความสมมาตร
const PH_SYM = [[33, 263], [133, 362], [70, 300], [107, 336], [105, 334], [64, 294], [61, 291], [234, 454], [172, 397], [54, 284], [148, 377], [159, 386], [145, 374]];

// hair = จุดแนวไรผมจริง {x, y} (0–1) จากตัวแยกเส้นผม ถ้ามี
export function faceMeasure(lm, W = 1, H = 1, hair = null) {
  const raw = lm.map((p) => ({ x: p.x * W, y: p.y * H, z: (p.z || 0) * W }));
  if (hair) raw.push({ x: hair.x * W, y: hair.y * H, z: raw[10].z });
  const fr = frontalize(raw), P = fr.P, lv = levelFace(lm, W, H), roll = lv.roll, g = (i) => P[i], q = (i) => lv.P[i];
  const faceW = phD2(g(FI.cheekR), g(FI.cheekL)), faceH = g(FI.chin).y - g(FI.top).y;
  const browY = (g(FI.bRt).y + g(FI.bLt).y) / 2;
  // หน้าผาก: ใช้แนวไรผมจริงถ้าหาได้ ไม่งั้นประมาณจากจุด 10 (อยู่ต่ำกว่าแนวไรผม) ด้วยตัวคูณ PH_HAIRK
  const hairY = hair ? P[P.length - 1].y : null;
  const up = hairY != null && browY - hairY > (browY - g(FI.top).y) ? browY - hairY : (browY - g(FI.top).y) * PH_HAIRK, md = g(FI.sub).y - browY, lo = g(FI.chin).y - g(FI.sub).y, th = up + md + lo;
  const eyeW = (phD2(g(FI.eRo), g(FI.eRi)) + phD2(g(FI.eLo), g(FI.eLi))) / 2;
  const eyeGap = phD2(g(FI.eRi), g(FI.eLi));
  const eyeOpen = ((g(FI.eRb).y - g(FI.eRt).y) + (g(FI.eLb).y - g(FI.eLt).y)) / 2 / eyeW;
  // หางตาสูงกว่าหัวตา = ค่าบวก (องศา)
  const tilt = ((Math.atan2(g(FI.eRi).y - g(FI.eRo).y, Math.abs(g(FI.eRi).x - g(FI.eRo).x)) + Math.atan2(g(FI.eLi).y - g(FI.eLo).y, Math.abs(g(FI.eLi).x - g(FI.eLo).x))) / 2) * 180 / Math.PI;
  const browLen = (phD2(g(FI.bRo), g(FI.bRi)) + phD2(g(FI.bLo), g(FI.bLi))) / 2;
  const browEye = ((g(FI.eRt).y - g(FI.bRt).y) + (g(FI.eLt).y - g(FI.bLt).y)) / 2 / eyeW;
  const browGap = phD2(g(FI.bRi), g(FI.bLi)) / eyeW;
  const noseW = phD2(g(FI.noseR), g(FI.noseL)), noseL = g(FI.sub).y - g(FI.nasion).y;
  const mouthW = phD2(g(FI.mR), g(FI.mL));
  const lipU = g(FI.lipIn1).y - g(FI.lipTop).y, lipL = g(FI.lipBot).y - g(FI.lipIn2).y;
  const lipMidY = (g(FI.lipIn1).y + g(FI.lipIn2).y) / 2, cornerY = (g(FI.mR).y + g(FI.mL).y) / 2;
  const philtrum = g(FI.lipTop).y - g(FI.sub).y, chinL = g(FI.chin).y - g(FI.lipBot).y;
  // ความหันข้าง: ระยะจมูกถึงแก้มสองข้างควรเท่ากัน
  // ท่าทาง (ใช้ภาพจริงก่อนจัดหน้าตรง)
  const yaw = (phD2(q(FI.tip), q(FI.cheekR)) - phD2(q(FI.tip), q(FI.cheekL))) / phD2(q(FI.cheekR), q(FI.cheekL));
  // ก้มเงย: ปลายจมูกเทียบเส้นกลางระหว่างตากับปาก
  const pitch = ((q(FI.tip).y - q(FI.nasion).y) / (q(FI.lipIn1).y - q(FI.nasion).y));
  const cx = (g(FI.cheekR).x + g(FI.cheekL).x) / 2;
  let asym = 0;
  for (const [a, b] of PH_SYM) asym += Math.abs((cx - g(a).x) - (g(b).x - cx)) / faceW + Math.abs(g(a).y - g(b).y) / faceW;
  asym /= PH_SYM.length;
  return {
    roll, yaw, pitch, faceW, faceH, hairOK: hairY != null ? 1 : 0, yaw3: fr.yaw, pitch3: fr.pitch,
    ratio: faceH / faceW,
    fore: phD2(g(FI.foreR), g(FI.foreL)) / faceW, jaw: phD2(g(FI.jawR), g(FI.jawL)) / faceW, chinW: phD2(g(FI.chinR), g(FI.chinL)) / faceW,
    up: up / th, md: md / th, lo: lo / th,
    eyeGapR: eyeGap / eyeW, eyeOpen, tilt, eyeW: eyeW / faceW,
    browLenR: browLen / eyeW, browEye, browGap,
    noseWR: noseW / eyeGap, noseLR: noseL / th,
    mouthR: mouthW / noseW, lipBal: lipU / Math.max(lipL, 1e-6), lipThick: (lipU + lipL) / mouthW,
    corner: (lipMidY - cornerY) / mouthW, philR: philtrum / lo, chinLR: chinL / lo,
    sym: phClamp(1 - asym * 6, 0, 1)
  };
}

// ตรวจท่าทางก่อนอ่าน: หน้าตรง ไม่เอียง ไม่ยิ้มกว้าง
export function facePoseOK(m, bs) {
  const issues = [];
  // หน้าถูกหมุนให้ตรงแบบ 3 มิติแล้ว จึงยอมให้เอียงได้ราว 12–14° โดยค่าไม่เพี้ยน
  if (Math.abs(m.yaw3) > 12) issues.push(m.yaw3 > 0 ? 'หันหน้าไปทางซ้ายอีกนิด' : 'หันหน้าไปทางขวาอีกนิด');
  if (Math.abs(m.roll) > 15) issues.push('ตั้งศีรษะให้ตรง');
  if (m.pitch3 < -14) issues.push('ก้มหน้าลงเล็กน้อย');
  else if (m.pitch3 > 14) issues.push('เงยหน้าขึ้นเล็กน้อย');
  const smile = bs ? Math.max(bs.mouthSmileLeft || 0, bs.mouthSmileRight || 0) : 0;
  if (smile > 0.45) issues.push('ทำหน้าปกติ ไม่ยิ้ม');
  if (bs && (bs.jawOpen || 0) > 0.25) issues.push('ปิดปาก');
  return { ok: !issues.length, issues, smile };
}

// เฉลี่ยค่าหลายเฟรม (ตัดค่าโด่งด้วยมัธยฐาน)
export function averageMeasures(list) {
  if (!list.length) return null;
  const out = {};
  for (const k of Object.keys(list[0])) { const v = list.map((x) => x[k]).sort((a, b) => a - b); out[k] = v[Math.floor(v.length / 2)]; }
  out.n = list.length;
  return out;
}

// ---------- ใบหน้า: รูปหน้าห้าธาตุ ----------
const FACE_EL = {
  wood: { th: 'ไม้', shape: 'หน้ายาว', cn: '木形', read: 'สูงโปร่ง ใจรักความก้าวหน้า มีอุดมการณ์ ชอบเรียนรู้และพัฒนาตัวเอง เหมาะงานความคิด การศึกษา งานสร้างสรรค์', boost: 'ทรงผมที่มีวอลุ่มด้านข้าง ช่วยให้หน้าดูสมดุล ใส่สีเขียวหรือฟ้าเสริมธาตุ' },
  fire: { th: 'ไฟ', shape: 'หน้าเรียวแหลม', cn: '火形', read: 'คิดไว ทำไว มีเสน่ห์ ช่างพูด กระตือรือร้น ชอบความท้าทาย แต่ใจร้อนและเบื่อง่าย ควรฝึกความต่อเนื่อง', boost: 'คอนทัวร์กรามให้ดูนุ่มขึ้นเล็กน้อย ใส่สีแดง ชมพู ม่วง เสริมธาตุ' },
  earth: { th: 'ดิน', shape: 'หน้าเหลี่ยมกรามกว้าง', cn: '土形', read: 'หนักแน่น อดทน ซื่อสัตย์ น่าไว้ใจ เก็บเงินเก่ง คนรอบตัวพึ่งพาได้ แต่บางครั้งดื้อและเปลี่ยนแปลงช้า', boost: 'ทรงผมยาวระดับคางหรือเลยลงมา ช่วยลดความเหลี่ยม ใส่สีเหลือง น้ำตาล ครีม เสริมธาตุ' },
  metal: { th: 'ทอง', shape: 'หน้าเหลี่ยมสมส่วน', cn: '金形', read: 'มีระเบียบ ตัดสินใจเด็ดขาด ยุติธรรม รักศักดิ์ศรี เหมาะงานบริหาร การเงิน กฎหมาย แต่ควรระวังความเข้มงวดเกินไป', boost: 'แต่งหน้าโทนอบอุ่นให้ดูเป็นมิตร ใส่สีขาว เงิน ทอง เสริมธาตุ' },
  water: { th: 'น้ำ', shape: 'หน้ากลม', cn: '水形', read: 'อ่อนโยน ปรับตัวเก่ง เข้ากับคนง่าย มีไหวพริบและเสน่ห์ เหมาะงานติดต่อผู้คน แต่ควรระวังความลังเล', boost: 'ทรงผมที่มีความสูงด้านบน หรือแสกข้าง ช่วยให้หน้าดูยาวขึ้น ใส่สีดำ น้ำเงิน เสริมธาตุ' }
};
export function faceElement(m) {
  const zr = phZ('ratio', m.ratio), zj = phZ('jaw', m.jaw), zf = phZ('fore', m.fore), zc = phZ('chinW', m.chinW);
  const P = (x) => Math.max(0, x);
  const s = {
    water: P(-zr) * 1.0 + P(zc) * 0.3 + P(-Math.abs(zj) + 0.5) * 0.2,
    wood: P(zr) * 1.0 + P(-zj) * 0.4,
    earth: P(zj) * 1.0 + P(zc) * 0.4 + P(-zr) * 0.2,
    metal: P(1 - (Math.abs(zr) + Math.abs(zj)) / 2) * 0.9 + P(zf) * 0.4,
    fire: P(-zc) * 0.9 + P(-zj) * 0.4 + P(zf) * 0.2
  };
  const rank = Object.entries(s).sort((a, b) => b[1] - a[1]);
  const [k1, v1] = rank[0], [k2, v2] = rank[1];
  return { key: k1, mix: v2 > v1 * 0.75 ? k2 : null, scores: s, ...FACE_EL[k1], mixTh: v2 > v1 * 0.75 ? FACE_EL[k2].th : null };
}
// ธาตุประจำปีเกิดจีน (เลขท้ายปี ค.ศ. จีน) เทียบกับธาตุใบหน้า
const YEAR_EL = ['metal', 'metal', 'water', 'water', 'wood', 'wood', 'fire', 'fire', 'earth', 'earth'];
export const yearElementTh = (sy) => FACE_EL[YEAR_EL[((sy % 10) + 10) % 10]].th;
const GEN = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CTRL = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
export function elementRelation(faceKey, solarYear) {
  const y = YEAR_EL[((solarYear % 10) + 10) % 10];
  const t = (k) => FACE_EL[k].th;
  if (y === faceKey) return { y, tone: 1, th: `ธาตุปีเกิด (${t(y)}) ตรงกับธาตุใบหน้า พลังไปทางเดียวกัน เป็นตัวของตัวเองชัด` };
  if (GEN[y] === faceKey) return { y, tone: 1, th: `ธาตุปีเกิด (${t(y)}) ให้กำเนิดธาตุใบหน้า (${t(faceKey)}) ได้แรงหนุนจากพื้นดวง ทำอะไรมักมีคนช่วย` };
  if (GEN[faceKey] === y) return { y, tone: 0, th: `ธาตุใบหน้า (${t(faceKey)}) ให้กำเนิดธาตุปีเกิด (${t(y)}) เป็นคนให้ ทุ่มเทเพื่อคนอื่น ควรเผื่อแรงให้ตัวเองบ้าง` };
  if (CTRL[y] === faceKey) return { y, tone: -1, th: `ธาตุปีเกิด (${t(y)}) ข่มธาตุใบหน้า (${t(faceKey)}) มักกดดันตัวเอง เสริมด้วยสีของธาตุ${t(Object.keys(GEN).find((k) => GEN[k] === faceKey))} ซึ่งช่วยหนุนธาตุใบหน้า` };
  return { y, tone: 0, th: `ธาตุใบหน้า (${t(faceKey)}) ข่มธาตุปีเกิด (${t(y)}) เป็นคนคุมเกม ชอบลงมือเอง ระวังรับภาระมากเกิน` };
}

// ---------- ใบหน้า: อ่านแต่ละส่วน ----------
// แต่ละข้อ: ค่า → ระดับ → คำอ่าน + วิธีเสริมแบบปัจจุบัน (แต่งหน้า ทรงผม แว่น นิสัย)
function phBand(v, lo, hi) { return v < lo ? -1 : v > hi ? 1 : 0; }
export function faceRead(m) {
  const out = [];
  const add = (o) => out.push(o);
  // สามส่วนของใบหน้า
  const thirds = [['up', 'ส่วนบน (หน้าผาก)', 'วัยต้น 15–30 ปี', 'สติปัญญา การเรียน ผู้ใหญ่อุปถัมภ์'], ['md', 'ส่วนกลาง (คิ้วถึงปลายจมูก)', 'วัยกลาง 31–50 ปี', 'การงาน ความมุ่งมั่น การสร้างฐานะ'], ['lo', 'ส่วนล่าง (ใต้จมูกถึงคาง)', 'วัยปลาย 51 ปีขึ้นไป', 'ความมั่นคง บริวาร ที่อยู่อาศัย']];
  // เทียบกับคนทั่วไป: ส่วนที่สูงกว่า P75 ถือว่าเด่น
  const big = thirds.reduce((a, t) => (phZ(t[0], m[t[0]]) > phZ(a[0], m[a[0]]) ? t : a));
  const even = thirds.every((t) => nb(t[0], m[t[0]]) === 0);
  add({ key: 'thirds', zone: 'thirds', title: 'สามส่วนของใบหน้า', cn: '三停', val: `บน ${Math.round(m.up * 100)}% · กลาง ${Math.round(m.md * 100)}% · ล่าง ${Math.round(m.lo * 100)}%${m.hairOK ? ' · วัดแนวไรผมจริง' : ' · แนวไรผมโดยประมาณ'}`, tone: even ? 1 : 0,
    read: even ? 'สามส่วนใกล้เคียงกัน ตำราถือว่าดวงสมดุล ชีวิตไปได้เรื่อย ๆ ทุกช่วงวัย' : `${big[1]}เด่นที่สุด ตำราให้ช่วง${big[2]}เป็นช่วงที่เด่น เรื่อง${big[3]}`,
    tip: nb('up', m.up) < 0 && !m.hairOK ? 'หน้าผากวัดได้แคบ ถ้ามีผมหน้าม้าหรือผมปิดหน้าผาก ให้เปิดผมขึ้นแล้ววัดใหม่ ทรงผมเปิดหน้าผากช่วยให้ดูเปิดกว้าง' : 'รักษาทั้งสามส่วนให้สะอาด สดใส ผิวที่ดูมีน้ำมีนวลตำราถือว่าเสริมดวงทุกช่วงวัย' });
  // หน้าผาก 官祿宮
  const fw = nb('fore', m.fore);
  add({ key: 'fore', zone: 'fore', title: 'หน้าผาก', cn: '官祿宮', val: `ความกว้าง${pctTxt('fore', m.fore)}`, tone: fw >= 0 ? 1 : 0,
    read: fw > 0 ? 'หน้าผากกว้าง มองการณ์ไกล คิดเป็นระบบ ตำราว่าได้ผู้ใหญ่และหัวหน้าเมตตา' : fw < 0 ? 'หน้าผากค่อนแคบ เป็นคนลงมือทำมากกว่าคิดนาน ประสบการณ์สอนได้ดีกว่าตำรา' : 'หน้าผากพอดี สมดุลระหว่างคิดกับลงมือ',
    tip: 'เปิดหน้าผากด้วยทรงผมเสยหรือแสกกลาง ดูแลผิวช่วงหน้าผากไม่ให้มีสิว ตำราว่าหน้าผากสว่างสดใสช่วยเรื่องงานและผู้ใหญ่' });
  // หว่างคิ้ว 命宮
  const bg = nb('browGap', m.browGap);
  add({ key: 'browGap', zone: 'yintang', title: 'หว่างคิ้ว', cn: '命宮 印堂', val: `ความกว้าง${pctTxt('browGap', m.browGap)}`, tone: bg >= 0 ? 1 : -1,
    read: bg > 0 ? 'หว่างคิ้วกว้าง ใจกว้าง มองโลกแง่ดี ให้อภัยง่าย ตำราถือเป็นตำแหน่งชะตาที่เปิดรับโชค' : bg < 0 ? 'หว่างคิ้วแคบ จริงจัง ละเอียด คิดมาก มีแนวโน้มเครียดง่าย' : 'หว่างคิ้วพอดี มีเหตุผล ไม่คิดมากเกินไป',
    tip: bg < 0 ? 'เล็มขนคิ้วส่วนหัวให้หว่างคิ้วโล่งขึ้นเล็กน้อย ฝึกคลายคิ้วเวลาคิด เพราะการขมวดคิ้วบ่อยทำให้เกิดริ้วรอยตรงจุดนี้' : 'รักษาหว่างคิ้วให้สะอาด ไม่มีขนรก ตำราว่าจุดนี้สว่างแล้วชีวิตราบรื่น' });
  // คิ้ว 兄弟宮
  const bl = nb('browLenR', m.browLenR);
  add({ key: 'brow', zone: 'brow', title: 'คิ้ว', cn: '兄弟宮', val: `ความยาวเทียบตา${pctTxt('browLenR', m.browLenR)}`, tone: bl >= 0 ? 1 : 0,
    read: bl > 0 ? 'คิ้วยาวเลยหางตาชัด ตำราว่ามีพี่น้อง เพื่อน และคนรอบตัวคอยช่วยเหลือ เป็นคนมีน้ำใจ' : bl < 0 ? 'คิ้วค่อนสั้นเมื่อเทียบกับตา พึ่งตัวเองเป็นหลัก ตัดสินใจเร็ว เป็นตัวของตัวเอง' : 'คิ้วยาวพอดีกับตา มีเพื่อนช่วยในยามจำเป็น และพึ่งตัวเองได้',
    tip: bl < 0 ? 'เขียนคิ้วต่อหางให้ยาวเลยหางตาเล็กน้อย ใช้สีใกล้สีผม' : 'แต่งคิ้วให้เรียบ เป็นระเบียบ ไม่ขาดเป็นช่วง' });
  // ระยะคิ้วกับตา 田宅宮
  const be = nb('browEye', m.browEye);
  add({ key: 'browEye', zone: 'lid', title: 'ระยะคิ้วกับตา', cn: '田宅宮', val: `ระยะห่าง${pctTxt('browEye', m.browEye)}`, tone: be >= 0 ? 1 : 0,
    read: be > 0 ? 'คิ้วอยู่ห่างตา ใจเย็น ใจกว้าง ตำราว่าเกี่ยวกับบ้านและที่ดิน มีโอกาสได้ทรัพย์สินมั่นคง' : be < 0 ? 'คิ้วชิดตา ใจร้อน ตัดสินใจไว มุ่งมั่นสูง ควรให้เวลาคิดก่อนตัดสินใจเรื่องใหญ่' : 'ระยะคิ้วกับตาพอดี สมดุลระหว่างความเร็วกับความรอบคอบ',
    tip: be < 0 ? 'ถอนขนคิ้วด้านล่างเล็กน้อย และใช้อายแชโดว์สีอ่อนบนเปลือกตา ช่วยให้ระยะดูกว้างขึ้น' : 'ใช้อายแชโดว์โทนสว่างบนเปลือกตา ช่วยให้ดวงตาดูสดใส' });
  // ตา
  const eg = nb('eyeGapR', m.eyeGapR);
  const tl = nb('tilt', m.tilt);
  add({ key: 'eye', zone: 'eye', title: 'ดวงตา', cn: '監察官', val: `ระยะหว่างตา${pctTxt('eyeGapR', m.eyeGapR)} · หางตา${tl > 0 ? 'ชี้ขึ้น' : tl < 0 ? 'ตก' : 'ระนาบ'}`, tone: eg === 0 ? 1 : 0,
    read: `${eg > 0 ? 'ตาห่าง ใจกว้าง ใจเย็น มองภาพรวมเก่ง แต่บางครั้งช้าไปนิด' : eg < 0 ? 'ตาชิด มีสมาธิ ทำงานละเอียด เก่งเรื่องเฉพาะทาง แต่เครียดง่าย' : 'ระยะหว่างตาพอดีตามสัดส่วนอุดมคติ คิดอ่านสมดุล'} ${tl > 0 ? 'หางตาชี้ขึ้น มั่นใจ มีความทะเยอทะยาน' : tl < 0 ? 'หางตาตก ใจดี อ่อนโยน ขี้สงสาร' : 'แนวตาระนาบ ตรงไปตรงมา'}`,
    tip: eg > 0 ? 'เขียนอายไลเนอร์เน้นหัวตา ช่วยให้ระยะดูพอดีขึ้น' : eg < 0 ? 'เน้นอายไลเนอร์และมาสคาร่าที่หางตา ช่วยให้ตาดูห่างขึ้น' : 'นอนให้พอ ตาที่สดใสมีประกาย ตำราว่าคือเครื่องหมายของพลังชีวิตดี' });
  // ใต้ตา 子女宮 (ความอวบใต้ตา ไม่วัดในภาพ 2D จึงให้คำแนะนำทั่วไป)
  // จมูก 財帛宮
  const nw = nb('noseWR', m.noseWR);
  add({ key: 'nose', zone: 'nose', title: 'จมูก', cn: '財帛宮', val: `ปีกจมูก${pctTxt('noseWR', m.noseWR)} · ความยาว${pctTxt('noseLR', m.noseLR)}`, tone: nw >= 0 ? 1 : 0,
    read: `${nw > 0 ? 'ปีกจมูกกว้าง ตำราว่าเก็บเงินเก่ง หาเงินได้และรักษาไว้ได้' : nw < 0 ? 'ปีกจมูกแคบ ใช้เงินคล่อง ควรมีระบบออมอัตโนมัติ' : 'ปีกจมูกพอดีกับระยะหัวตา การเงินสมดุล'} ${nb('noseLR', m.noseLR) > 0 ? 'จมูกยาว มีหลักการ รับผิดชอบสูง' : nb('noseLR', m.noseLR) < 0 ? 'จมูกสั้น ยืดหยุ่น ปรับตัวไว' : ''}`.trim(),
    tip: nw < 0 ? 'ตั้งโอนเงินเข้าบัญชีออมทันทีที่เงินเดือนออก ตำราว่าจมูกคือคลังเงิน ส่วนพฤติกรรมคือกุญแจ' : 'ดูแลผิวปลายจมูกไม่ให้มีสิวหรือรอยแดง ตำราว่าปลายจมูกสว่างช่วยเรื่องเงิน' });
  // ร่องใต้จมูก 人中
  const ph = nb('philR', m.philR);
  add({ key: 'phil', zone: 'phil', title: 'ร่องใต้จมูก', cn: '人中', val: `ความยาว${pctTxt('philR', m.philR)}`, tone: ph >= 0 ? 1 : 0,
    read: ph > 0 ? 'ร่องใต้จมูกยาว อดทน ใจเย็น ตำราว่าอายุยืน' : ph < 0 ? 'ร่องใต้จมูกสั้น กระตือรือร้น ใจร้อน ทำอะไรรวดเร็ว' : 'ร่องใต้จมูกพอดี สุขภาพและอารมณ์สมดุล',
    tip: 'ออกกำลังกายสม่ำเสมอ ตรวจสุขภาพประจำปี ตำราโยงจุดนี้กับสุขภาพและอายุ' });
  // ปาก 出納官
  const mw = nb('mouthR', m.mouthR), lb = nb('lipBal', m.lipBal), cn = nb('corner', m.corner);
  add({ key: 'mouth', zone: 'mouth', title: 'ปาก', cn: '出納官', val: `ความกว้าง${pctTxt('mouthR', m.mouthR)} · มุมปาก${cn > 0 ? 'ยก' : cn < 0 ? 'ตก' : 'ระนาบ'}`, tone: cn >= 0 ? 1 : 0,
    read: `${mw > 0 ? 'ปากกว้าง ช่างพูด เข้าสังคมเก่ง กล้าแสดงออก' : mw < 0 ? 'ปากเล็ก พูดน้อยแต่ตรงประเด็น เก็บความลับเก่ง' : 'ปากพอดี สื่อสารสมดุล'} ${lb > 0 ? 'ริมฝีปากบนหนา ให้ความรักและใส่ใจคนอื่นมาก' : lb < 0 ? 'ริมฝีปากล่างหนากว่า รักสนุก ชอบความสุขสบาย' : ''} ${cn > 0 ? 'มุมปากยก มองโลกแง่บวก คนอยากเข้าใกล้' : cn < 0 ? 'มุมปากตก ช่วงนี้อาจเหนื่อยหรือคิดมาก' : ''}`.replace(/\s+/g, ' ').trim(),
    tip: cn < 0 ? 'ใช้ลิปไลเนอร์ยกมุมปากขึ้นเล็กน้อย และฝึกยิ้มบ่อย ๆ ตำราว่ามุมปากยกเรียกเสน่ห์และโชค' : 'บำรุงริมฝีปากให้ชุ่มชื้น ใช้ลิปสีสุขภาพดี ตำราว่าปากสีสดเกี่ยวกับเสน่ห์และการเจรจา' });
  // คาง 地閣
  const cw = nb('chinW', m.chinW), cl = nb('chinLR', m.chinLR);
  add({ key: 'chin', zone: 'chin', title: 'คางและกราม', cn: '地閣 奴僕宮', val: `คาง${pctTxt('chinW', m.chinW)} · กราม${pctTxt('jaw', m.jaw)}`, tone: cw >= 0 || cl >= 0 ? 1 : 0,
    read: `${cw > 0 || cl > 0 ? 'คางเต็มอิ่ม ตำราว่าบั้นปลายมั่นคง มีบ้าน มีลูกน้องและบริวารคอยช่วย' : cw < 0 && cl < 0 ? 'คางเรียว ความคิดคล่องตัว ชอบอิสระ ควรวางแผนการเงินระยะยาวตั้งแต่เนิ่น ๆ' : 'คางได้รูปพอดี ชีวิตช่วงปลายค่อย ๆ มั่นคงตามที่สร้างไว้'} ${nb('jaw', m.jaw) > 0 ? 'กรามกว้าง มีพลัง อดทน ไม่ยอมแพ้' : ''}`.trim(),
    tip: cw < 0 && cl < 0 ? 'ไว้ผมยาวระดับคางหรือไหล่ ช่วยให้ส่วนล่างของหน้าดูเต็มขึ้น และเริ่มออมเพื่อเกษียณตั้งแต่วันนี้' : 'ทำคอนทัวร์ใต้กรามบาง ๆ ให้กรอบหน้าชัด และดูแลความสัมพันธ์กับทีมงาน' });
  // สมมาตร
  add({ key: 'sym', zone: 'all', title: 'ความสมดุลซ้าย-ขวา', cn: '', val: `${Math.round(m.sym * 100)}% · ${pctTxt('sym', m.sym)}`, tone: m.sym >= PH_NORM.sym[1] ? 1 : 0,
    read: m.sym >= PH_NORM.sym[1] ? 'ใบหน้าซ้ายขวาสมดุล ตำราว่าชีวิตราบรื่น ไม่ค่อยมีเรื่องขึ้นลงแรง' : 'ใบหน้าซ้ายขวาต่างกันพอสมควร เป็นเรื่องปกติของคนทั่วไป และอาจมาจากมุมกล้องหรือแสง',
    tip: 'เคี้ยวอาหารสองข้างเท่า ๆ กัน และไม่นอนตะแคงข้างเดียวตลอด ช่วยให้กล้ามเนื้อหน้าสมดุล' });
  return out;
}

// ตำแหน่งบนใบหน้าสำหรับวาด AR (ดัชนี landmark ของแต่ละโซน)
export const FACE_ZONES = {
  fore: { at: 151, th: 'หน้าผาก', cn: '官祿' }, yintang: { at: 9, th: 'หว่างคิ้ว', cn: '命宮' }, brow: { at: 105, th: 'คิ้ว', cn: '兄弟' },
  lid: { at: 159, th: 'เปลือกตา', cn: '田宅' }, eye: { at: 263, th: 'ตา', cn: '監察' }, nose: { at: 4, th: 'จมูก', cn: '財帛' },
  phil: { at: 164, th: 'ร่องจมูก', cn: '人中' }, mouth: { at: 291, th: 'ปาก', cn: '出納' }, chin: { at: 152, th: 'คาง', cn: '地閣' },
  under: { at: 230, th: 'ใต้ตา', cn: '子女' }, temple: { at: 127, th: 'หางตา', cn: '夫妻' }, cheek: { at: 425, th: 'โหนกแก้ม', cn: '顴' }
};
// เส้นแบ่งสามส่วนของใบหน้า: ใช้คู่จุดแนวคิ้วและใต้จมูก
export const FACE_LINES = { brow: [70, 300], sub: [2, 2], top: [10, 10], chin: [152, 152] };

// ---------- มือ: วัดค่า ----------
// 0 ข้อมือ · 1–4 นิ้วโป้ง · 5–8 ชี้ · 9–12 กลาง · 13–16 นาง · 17–20 ก้อย
const phSeg = (P, a, b, c, d) => phD3(P[a], P[b]) + phD3(P[b], P[c]) + phD3(P[c], P[d]);
export function handMeasure(world, img) {
  const P = world; // หน่วยเมตร ไม่ขึ้นกับระยะกล้อง
  const palmL = phD3(P[0], P[9]), palmW = phD3(P[5], P[17]);
  const fing = { index: phSeg(P, 5, 6, 7, 8), middle: phSeg(P, 9, 10, 11, 12), ring: phSeg(P, 13, 14, 15, 16), little: phSeg(P, 17, 18, 19, 20), thumb: phSeg(P, 1, 2, 3, 4) };
  // ก้อยถึงข้อนิ้วนางไหม: ฉายลงแกนมือ (ข้อมือ → โคนนิ้วกลาง)
  const ax = { x: P[9].x - P[0].x, y: P[9].y - P[0].y, z: P[9].z - P[0].z }, al = Math.hypot(ax.x, ax.y, ax.z);
  const proj = (i) => ((P[i].x - P[0].x) * ax.x + (P[i].y - P[0].y) * ax.y + (P[i].z - P[0].z) * ax.z) / al;
  // มุมกางนิ้วโป้ง: ระหว่างแนวโป้ง (2→4) กับแนวนิ้วชี้ (5→8)
  const v1 = { x: P[4].x - P[2].x, y: P[4].y - P[2].y, z: P[4].z - P[2].z }, v2 = { x: P[8].x - P[5].x, y: P[8].y - P[5].y, z: P[8].z - P[5].z };
  const thumbAng = Math.acos(phClamp((v1.x * v2.x + v1.y * v2.y + v1.z * v2.z) / (Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z)), -1, 1)) * 180 / Math.PI;
  // นิ้วเหยียดตรงไหม (ใช้ตรวจท่า): ปลายนิ้วต้องห่างข้อมือกว่าข้อกลางนิ้ว
  const straight = [8, 12, 16, 20].every((t) => phD3(P[0], P[t]) > phD3(P[0], P[t - 2]) * 1.05);
  // ฝ่ามือหันเข้ากล้องหรือหลังมือ: ใช้พิกัดภาพ (z ของโคนนิ้วชี้กับก้อย) ร่วมกับว่าเป็นมือซ้ายหรือขวา
  return {
    palmL, palmW, palmRatio: palmL / palmW,
    fingerRatio: fing.middle / palmL, idxRing: fing.index / fing.ring, thumbR: fing.thumb / palmL, littleR: fing.little / fing.ring,
    littleReach: proj(20) - proj(15), thumbAng, straight, palmMM: Math.round(palmL * 1000), widthMM: Math.round(palmW * 1000)
  };
}

// ตรวจท่ามือจากพิกัดภาพ: ฝ่ามือหันเข้ากล้องไหม (ใช้ทิศการหมุนของข้อมือ→โคนนิ้วชี้→โคนนิ้วก้อย)
// side = 'R' | 'L' (มือที่ผู้ใช้เลือก), mirrored = ภาพจากกล้องหน้าที่กลับซ้ายขวา
export function handPoseOK(lm, h, side, mirrored) {
  const issues = [];
  const v5 = { x: lm[5].x - lm[0].x, y: lm[5].y - lm[0].y }, v17 = { x: lm[17].x - lm[0].x, y: lm[17].y - lm[0].y };
  const cross = v5.x * v17.y - v5.y * v17.x;
  const palmIn = side ? ((cross < 0) === (side === 'R')) !== !!mirrored : true;
  const area = Math.abs(cross), size = Math.hypot(v5.x, v5.y);
  if (!palmIn) issues.push('หงายฝ่ามือเข้าหากล้อง');
  else if (area < size * size * 0.25) issues.push('หันฝ่ามือตรงเข้ากล้อง อย่าตะแคงมือ');
  if (!h.straight) issues.push('เหยียดนิ้วให้ตรง');
  if (size < 0.12) issues.push('ยื่นมือเข้าใกล้กล้องอีกนิด');
  if (h.palmRatio < 1.05 || h.palmRatio > 1.9) issues.push('วางมือให้ราบ ขนานกับกล้อง');
  return { ok: !issues.length, issues, palmIn };
}
const HAND_EL = {
  earth: { th: 'มือธาตุดิน', shape: 'ฝ่ามือเหลี่ยม นิ้วสั้น', read: 'ติดดิน ขยัน ซื่อตรง ชอบทำงานด้วยมือและเห็นผลจริง มั่นคง เชื่อถือได้ ไม่ชอบความเปลี่ยนแปลงเร็ว ๆ', work: 'งานช่าง เกษตร การเงินที่ต้องละเอียด ธุรกิจของตัวเอง' },
  air: { th: 'มือธาตุลม', shape: 'ฝ่ามือเหลี่ยม นิ้วยาว', read: 'ช่างคิด ช่างสื่อสาร อยากรู้อยากเห็น มีเหตุผล ชอบแลกเปลี่ยนความคิด แต่บางครั้งคิดมากจนไม่ลงมือ', work: 'งานสื่อสาร การสอน การตลาด ไอที งานเขียน' },
  fire: { th: 'มือธาตุไฟ', shape: 'ฝ่ามือยาว นิ้วสั้น', read: 'กระตือรือร้น กล้าตัดสินใจ มีพลังและความเป็นผู้นำ ชอบความท้าทาย แต่ใจร้อนและเบื่อง่าย', work: 'งานขาย ผู้ประกอบการ กีฬา งานที่ต้องตัดสินใจเร็ว' },
  water: { th: 'มือธาตุน้ำ', shape: 'ฝ่ามือยาว นิ้วยาว', read: 'อ่อนไหว มีจินตนาการ เข้าใจความรู้สึกคนอื่น มีศิลปะ แต่รับอารมณ์คนรอบตัวง่าย ต้องรู้จักพักใจ', work: 'งานศิลปะ ดนตรี งานดูแลคน จิตวิทยา งานออกแบบ' }
};
export function handElement(h) {
  const longPalm = h.palmRatio > 1.42, longFing = h.fingerRatio > 0.95;
  const key = longPalm ? (longFing ? 'water' : 'fire') : (longFing ? 'air' : 'earth');
  return { key, ...HAND_EL[key], longPalm, longFing };
}
export function handRead(h) {
  const out = [], el = handElement(h);
  out.push({ key: 'shape', title: 'รูปมือ', val: `${el.shape} · ฝ่ามือยาว ${h.palmMM} มม. กว้าง ${h.widthMM} มม.`, tone: 1, read: el.read, tip: `เหมาะกับ${el.work}` });
  const ir = h.idxRing > 1.0 ? 1 : h.idxRing < 0.93 ? -1 : 0;
  out.push({ key: 'idxRing', title: 'นิ้วชี้เทียบนิ้วนาง', val: `นิ้วชี้ ${phR2(h.idxRing)} เท่าของนิ้วนาง`, tone: 1,
    read: ir > 0 ? 'นิ้วชี้ยาวกว่านิ้วนาง มั่นใจ ชอบเป็นผู้นำ มีความรับผิดชอบสูง' : ir < 0 ? 'นิ้วนางยาวกว่านิ้วชี้ กล้าเสี่ยง มีศิลปะ ชอบความแปลกใหม่และการแข่งขัน' : 'นิ้วชี้กับนิ้วนางใกล้เคียงกัน สมดุลระหว่างความมั่นคงกับความกล้า',
    tip: ir > 0 ? 'ฝึกรับฟังความเห็นทีม จะเป็นผู้นำที่คนรัก' : ir < 0 ? 'วางแผนความเสี่ยงไว้ก่อน แล้วความกล้าจะกลายเป็นจุดแข็ง' : 'ใช้ความสมดุลนี้เป็นตัวกลางประสานงาน' });
  out.push({ key: 'little', title: 'นิ้วก้อย', val: h.littleReach >= -0.008 ? 'ยาวถึงข้อบนของนิ้วนาง' : 'สั้นกว่าข้อบนของนิ้วนาง', tone: 1,
    read: h.littleReach >= -0.008 ? 'นิ้วก้อยยาว ตำราว่าสื่อสารเก่ง เจรจาต่อรองดี มีหัวการค้า' : 'นิ้วก้อยสั้น พูดตรง จริงใจ อาจต้องฝึกการนำเสนอให้นุ่มนวลขึ้น',
    tip: 'นิ้วก้อยในตำราโยงกับดาวพุธ เรื่องการพูด การค้า และการเรียนรู้' });
  const ta = h.thumbAng > 52 ? 1 : h.thumbAng < 32 ? -1 : 0, tl = h.thumbR > 1.08 ? 1 : h.thumbR < 0.95 ? -1 : 0;
  out.push({ key: 'thumb', title: 'นิ้วโป้ง', val: `กาง ${Math.round(h.thumbAng)}° · ยาว ${Math.round(h.thumbR * 100)}% ของฝ่ามือ`, tone: 1,
    read: `${tl > 0 ? 'นิ้วโป้งยาว มีความตั้งใจแรง ตั้งเป้าแล้วทำให้ถึง' : tl < 0 ? 'นิ้วโป้งสั้น ยืดหยุ่น ใช้ความรู้สึกนำ' : 'นิ้วโป้งยาวพอดี เหตุผลกับความรู้สึกสมดุล'} ${ta > 0 ? 'กางได้กว้าง ใจกว้าง เปิดรับคนและความคิดใหม่' : ta < 0 ? 'กางแคบ ระมัดระวัง เก็บตัว ไว้ใจคนยาก' : ''}`.trim(),
    tip: 'ตำราลายมือถือว่านิ้วโป้งบอกพลังใจและความมุ่งมั่น' });
  return out;
}

// ---------- ลายมือ: เส้นหลักให้ผู้ใช้เลือกลักษณะที่เห็น ----------
export const PALM_LINES = [
  { id: 'heart', th: 'เส้นใจ (เส้นหัวใจ)', color: '#E5675A', where: 'เส้นบนสุด ใต้โคนนิ้ว เริ่มจากขอบมือฝั่งนิ้วก้อย', about: 'อารมณ์ ความรัก ความสัมพันธ์',
    opts: [
      { id: 'curve', th: 'โค้งขึ้นไปจบระหว่างนิ้วชี้กับนิ้วกลาง', read: 'แสดงความรักเปิดเผย อบอุ่น พร้อมดูแลคนรัก', tip: 'บอกความรู้สึกออกไปตรง ๆ คือเสน่ห์ของคุณ' },
      { id: 'straight', th: 'ตรงยาวเกือบข้ามมือ', read: 'รักใครรักจริง มีเหตุผลในความรัก อาจไม่หวานแต่มั่นคง', tip: 'เติมคำหวานหรือของขวัญเล็ก ๆ ให้คนรักบ้าง' },
      { id: 'short', th: 'สั้น จบใต้นิ้วกลาง', read: 'เป็นตัวของตัวเองสูง ให้ความสำคัญกับเป้าหมายส่วนตัว', tip: 'แบ่งเวลาให้คนใกล้ตัวอย่างสม่ำเสมอ' },
      { id: 'fork', th: 'ปลายแตกเป็นแฉก', read: 'เข้าใจคนอื่น ใจกว้าง มีหลายมุมในการรัก', tip: 'จุดแข็งคือความเข้าใจ ใช้มันประคองความสัมพันธ์' },
      { id: 'chain', th: 'เป็นข้อ ๆ หรือขาดเป็นช่วง', read: 'อารมณ์อ่อนไหว ความรักเคยมีช่วงขึ้นลง', tip: 'ฝึกสื่อสารความรู้สึกตอนใจเย็น ไม่ใช่ตอนโกรธ' }] },
  { id: 'head', th: 'เส้นสมอง', color: '#D4AF63', where: 'เส้นกลาง เริ่มระหว่างนิ้วโป้งกับนิ้วชี้ ลากผ่านกลางฝ่ามือ', about: 'วิธีคิด การเรียนรู้ การตัดสินใจ',
    opts: [
      { id: 'straight', th: 'ตรงและยาว', read: 'คิดเป็นระบบ มีเหตุผล เก่งวิเคราะห์ ตัวเลข การวางแผน', tip: 'เปิดใจให้ไอเดียแปลกใหม่บ้าง จะคิดได้รอบด้านขึ้น' },
      { id: 'curve', th: 'โค้งลงไปทางฐานมือ', read: 'จินตนาการดี สร้างสรรค์ มีศิลปะ คิดนอกกรอบ', tip: 'จดไอเดียไว้แล้วทำทีละขั้น จะเปลี่ยนจินตนาการเป็นผลงาน' },
      { id: 'short', th: 'สั้น จบกลางฝ่ามือ', read: 'คิดเร็ว ตัดสินใจไว ชอบลงมือมากกว่าวางแผนนาน', tip: 'ก่อนตัดสินใจเรื่องใหญ่ ให้นอนคิดอีกหนึ่งคืน' },
      { id: 'fork', th: 'ปลายแยกเป็นสองแฉก (ส้อมนักเขียน)', read: 'มองได้หลายมุม เขียนและพูดเก่ง เข้าใจทั้งเหตุผลและความรู้สึก', tip: 'งานเขียน งานสื่อ หรือการสอน เหมาะกับคุณมาก' },
      { id: 'joined', th: 'ต้นเส้นติดกับเส้นชีวิตยาว', read: 'รอบคอบ ระมัดระวัง คิดก่อนทำ ผูกพันกับครอบครัว', tip: 'เชื่อมั่นในตัวเองให้มากขึ้น กล้าตัดสินใจเองบ้าง' },
      { id: 'apart', th: 'ต้นเส้นแยกห่างจากเส้นชีวิต', read: 'กล้าคิด กล้าทำ รักอิสระ เป็นตัวของตัวเอง', tip: 'ฟังคำแนะนำคนรอบตัวก่อนพุ่งไปข้างหน้า' }] },
  { id: 'life', th: 'เส้นชีวิต', color: '#6FC3B2', where: 'เส้นโค้งรอบเนินนิ้วโป้ง เริ่มระหว่างนิ้วโป้งกับนิ้วชี้ ลงไปทางข้อมือ', about: 'พลังชีวิต สุขภาพ ความกระตือรือร้น (ไม่ได้บอกอายุ)',
    opts: [
      { id: 'wide', th: 'โค้งกว้าง ลึก ชัด', read: 'พลังเหลือล้น กระตือรือร้น ชอบกิจกรรม ฟื้นตัวเร็ว', tip: 'ใช้พลังกับการออกกำลังกายที่ชอบ จะยิ่งสดชื่น' },
      { id: 'close', th: 'โค้งแคบ ชิดนิ้วโป้ง', read: 'ระมัดระวัง ชอบความสงบ เหนื่อยง่ายกว่าคนอื่น', tip: 'นอนให้พอ เดินวันละ 30 นาที เติมพลังได้ดี' },
      { id: 'double', th: 'มีเส้นคู่ขนานด้านใน', read: 'มีคนคอยดูแลปกป้อง ฟื้นตัวจากเรื่องยากได้ดี', tip: 'ตอบแทนคนที่คอยหนุนคุณบ้าง' },
      { id: 'break', th: 'ขาดเป็นช่วง หรือเปลี่ยนทิศ', read: 'ชีวิตเคยหรือจะมีจุดเปลี่ยนสำคัญ เช่น ย้ายที่อยู่ เปลี่ยนงาน', tip: 'จุดเปลี่ยนไม่ใช่เรื่องร้าย เตรียมเงินสำรองไว้ แล้วมองเป็นโอกาส' },
      { id: 'faint', th: 'จาง บาง', read: 'เป็นคนใช้ความคิดมากกว่าแรงกาย ควรดูแลร่างกายสม่ำเสมอ', tip: 'ตรวจสุขภาพประจำปี และหากิจกรรมขยับร่างกายที่สนุก' }] },
  { id: 'fate', th: 'เส้นวาสนา (เส้นโชคชะตา)', color: '#A99BD9', where: 'เส้นแนวตั้งกลางฝ่ามือ จากข้อมือขึ้นไปทางนิ้วกลาง (บางคนไม่มี)', about: 'เส้นทางการงาน ความมั่นคงของอาชีพ',
    opts: [
      { id: 'clear', th: 'ชัด ยาวถึงใต้นิ้วกลาง', read: 'รู้ว่าตัวเองต้องการอะไร เส้นทางอาชีพชัด มั่นคง', tip: 'ตั้งเป้าระยะยาวแล้วเดินต่อ คุณทำได้' },
      { id: 'late', th: 'เริ่มจากกลางฝ่ามือ', read: 'งานจะชัดเจนและก้าวหน้าตอนวัยกลางคน ประสบความสำเร็จด้วยตัวเอง', tip: 'ช่วงแรกลองหลายอย่างได้ ประสบการณ์จะรวมเป็นจุดแข็ง' },
      { id: 'broken', th: 'จาง หรือขาดเป็นช่วง', read: 'เปลี่ยนงานหรือสายงานหลายครั้ง ปรับตัวเก่ง มีหลายทักษะ', tip: 'เก็บพอร์ตผลงานและเครือข่ายไว้ การเปลี่ยนงานจะง่ายขึ้น' },
      { id: 'none', th: 'มองไม่เห็นเส้นนี้', read: 'ไม่ยึดติดกรอบ สร้างทางของตัวเอง ใช้ชีวิตอิสระ', tip: 'ไม่มีเส้นไม่ได้แปลว่าไม่มีวาสนา แค่คุณเขียนเส้นทางเองได้' }] }
];

// เส้นนำทาง AR: ประมาณตำแหน่งเส้นหลักจากจุดบนมือ (พิกัดภาพ 0–1)
export function palmGuides(lm) {
  const L = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const w = lm[0], i5 = lm[5], m9 = lm[9], r13 = lm[13], p17 = lm[17], t2 = lm[2], t1 = lm[1];
  const heartS = L(p17, w, 0.22), heartE = L(i5, m9, 0.45), heartC = L(L(r13, w, 0.2), L(m9, w, 0.22), 0.5);
  const headS = L(t2, i5, 0.55), headE = L(L(p17, w, 0.55), headS, 0.08), headC = L(L(m9, w, 0.47), L(r13, w, 0.47), 0.5);
  const lifeS = L(t2, i5, 0.6), lifeE = L(w, t1, 0.25), lifeC = L(t2, w, 0.3); // โค้งออกรอบเนินนิ้วโป้ง
  return { heart: [heartS, heartC, heartE], head: [headS, headC, headE], life: [lifeS, lifeC, lifeE], fate: [L(w, m9, 0.08), L(w, m9, 0.5), L(w, m9, 0.95)] };
}

// สรุปเป็นประโยคเดียวสำหรับการ์ดแชร์
export function faceSummary(el, reads) {
  const good = reads.filter((r) => r.tone > 0 && r.key !== 'sym').map((r) => r.title);
  return `ใบหน้าธาตุ${el.th}${el.mixTh ? `ผสม${el.mixTh}` : ''} (${el.shape}) · จุดเด่น: ${good.slice(0, 3).join(' ') || 'สมดุลทุกส่วน'}`;
}

// ---------- ลายมือ: หาเส้นจริงจากภาพ ----------
// resp = ค่ารอยพับ (ยิ่งมากยิ่งเป็นร่องเข้ม) ขนาด W×H, mask = 1 ในฝ่ามือ, lm = จุดมือ 0–1 ของภาพเดียวกัน
// ไล่หาเส้นทางที่รอยพับเข้มที่สุดในแนวของเส้นนำแต่ละเส้น ด้วย dynamic programming (Viterbi)
export function palmTrace(resp, mask, W, H, lm) {
  const G = palmGuides(lm), P = (i) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const palmW = Math.hypot(P(5).x - P(17).x, P(5).y - P(17).y), palmL = Math.hypot(P(9).x - P(0).x, P(9).y - P(0).y);
  // ค่าเฉลี่ยรอยพับในฝ่ามือ ใช้เป็นเกณฑ์
  // เกณฑ์จากการกระจายค่ารอยพับในฝ่ามือ: รอยเส้นหลักควรเข้มกว่า 85% ของพื้นที่ฝ่ามือ
  const smp = [];
  for (let i = 0; i < W * H; i += 5) if (mask[i]) smp.push(resp[i]);
  smp.sort((a, b) => a - b);
  const pq = (q) => smp.length ? smp[Math.min(smp.length - 1, Math.floor(q * smp.length))] : 1;
  const mean = Math.max(1e-3, pq(0.5) > 0 ? pq(0.5) : pq(0.7)), p85 = Math.max(mean * 1.2, pq(0.85));
  const at = (x, y) => { const xi = Math.round(x), yi = Math.round(y); if (xi < 0 || yi < 0 || xi >= W || yi >= H) return -1; const i = yi * W + xi; return mask[i] ? resp[i] : -1; };
  const quad = (pts, t) => { const [a, c, b] = pts.map((p) => ({ x: p.x * W, y: p.y * H })); const cp = { x: 2 * c.x - (a.x + b.x) / 2, y: 2 * c.y - (a.y + b.y) / 2 }; const u = 1 - t; return { x: u * u * a.x + 2 * u * t * cp.x + t * t * b.x, y: u * u * a.y + 2 * u * t * cp.y + t * t * b.y }; };
  const T = 48, K = 12, step = palmW * 0.013, t0 = -0.12, t1 = 1.12;
  const out = {};
  for (const id of ['heart', 'head', 'life', 'fate']) {
    const ts = Array.from({ length: T }, (_, i) => t0 + (t1 - t0) * i / (T - 1));
    const base = ts.map((t) => quad(G[id], t));
    const nrm = base.map((p, i) => { const q = base[Math.min(T - 1, i + 1)], r = base[Math.max(0, i - 1)], dx = q.x - r.x, dy = q.y - r.y, l = Math.hypot(dx, dy) || 1; return { x: -dy / l, y: dx / l }; });
    // คะแนนแต่ละจุด: เฉลี่ย 3 จุดตามแนวเส้น ลดผลของจุดรบกวน
    const sc = base.map((p, i) => Array.from({ length: 2 * K + 1 }, (_, j) => { const o = (j - K) * step, q = { x: p.x + nrm[i].x * o, y: p.y + nrm[i].y * o }; const v = at(q.x, q.y); return v < 0 ? -mean : v; }));
    const lam = mean * 0.35, D = sc.map(() => new Float32Array(2 * K + 1)), B = sc.map(() => new Int16Array(2 * K + 1));
    for (let j = 0; j <= 2 * K; j++) D[0][j] = sc[0][j] - Math.abs(j - K) * lam * 0.2;
    for (let i = 1; i < T; i++) for (let j = 0; j <= 2 * K; j++) {
      let best = -1e9, bj = j;
      for (let dj = -2; dj <= 2; dj++) { const k = j + dj; if (k < 0 || k > 2 * K) continue; const v = D[i - 1][k] - Math.abs(dj) * lam; if (v > best) { best = v; bj = k; } }
      D[i][j] = best + sc[i][j]; B[i][j] = bj;
    }
    let j = 0; for (let k = 1; k <= 2 * K; k++) if (D[T - 1][k] > D[T - 1][j]) j = k;
    const path = new Array(T);
    for (let i = T - 1; i >= 0; i--) { const o = (j - K) * step; path[i] = { x: base[i].x + nrm[i].x * o, y: base[i].y + nrm[i].y * o, r: sc[i][j], t: ts[i] }; j = B[i][j]; }
    // ช่วงที่เป็นรอยจริง: เกินเกณฑ์ 1.5 เท่าของค่าเฉลี่ย (ทำให้เรียบด้วยค่าเฉลี่ยเคลื่อนที่ 3 จุด)
    const sm = path.map((p, i) => (path[Math.max(0, i - 1)].r + p.r + path[Math.min(T - 1, i + 1)].r) / 3);
    const thr = p85, on0 = sm.map((v) => v > thr);
    // เติมช่องว่างสั้น ๆ (≤2 จุด) และตัดเศษที่ยาวไม่ถึง 3 จุด
    const on = on0.slice();
    for (let i = 1; i < T - 1; i++) if (!on[i]) { let a = i - 1, b = i; while (b < T && !on0[b]) b++; if (b < T && a >= 0 && on0[a] && b - i <= 2) for (let k = i; k < b; k++) on[k] = true; }
    for (let i = 0; i < T;) { if (!on[i]) { i++; continue; } let b = i; while (b < T && on[b]) b++; if (b - i < 3) for (let k = i; k < b; k++) on[k] = false; i = b; }
    const inRange = path.map((p) => p.t >= 0 && p.t <= 1);
    const cov = on.filter((v, i) => v && inRange[i]).length / inRange.filter(Boolean).length;
    let first = -1, last = -1, gaps = 0, run = 0;
    on.forEach((v, i) => { if (v) { if (first < 0) first = i; if (last >= 0 && run >= 4 && inRange[i]) gaps++; last = i; run = 0; } else if (first >= 0) run++; });
    const strength = on.some(Boolean) ? sm.filter((_, i) => on[i]).reduce((a, b) => a + b, 0) / on.filter(Boolean).length / p85 : 0;
    // ปลายเส้นแตกแฉก: จากปลายเส้น ลองไล่ 2 แนวที่แยกออก ±28° ถ้าเจอรอยเข้มทั้งสองแนว ถือว่าแตกแฉก
    let fork = false;
    if (last >= 3) {
      const a = path[last - 3], b = path[last], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, L = palmW * 0.1;
      const ray = (deg) => { const r = deg * Math.PI / 180, ux = (dx * Math.cos(r) - dy * Math.sin(r)) / l, uy = (dx * Math.sin(r) + dy * Math.cos(r)) / l; let hit = 0; for (let k = 1; k <= 8; k++) { const v = at(b.x + ux * L * k / 8, b.y + uy * L * k / 8); if (v > p85) hit++; } return hit / 8; };
      fork = ray(28) >= 0.5 && ray(-28) >= 0.5;
    }
    out[id] = { path, on, cov, first: first >= 0 ? path[first] : null, last: last >= 0 ? path[last] : null, gaps, strength, fork };
  }
  // พิกัดแกนมือ: u = ตามแนวข้อมือ→โคนนิ้วกลาง (หารความยาวฝ่ามือ), v = ขวางมือไปทางนิ้วโป้ง (หารความกว้าง)
  const o = P(0), ax = { x: (P(9).x - o.x) / palmL, y: (P(9).y - o.y) / palmL };
  let ac = { x: -ax.y, y: ax.x };
  if ((P(1).x - o.x) * ac.x + (P(1).y - o.y) * ac.y < 0) ac = { x: -ac.x, y: -ac.y };
  const uv = (p) => ({ u: ((p.x - o.x) * ax.x + (p.y - o.y) * ax.y) / palmL, v: ((p.x - o.x) * ac.x + (p.y - o.y) * ac.y) / palmW });
  const sag = (L) => { // ระยะโค้งมากสุดจากเส้นตรงเชื่อมหัวท้าย (หารความกว้างฝ่ามือ) ใช้เฉพาะช่วงที่เห็นรอย
    if (!L.first || !L.last) return 0;
    const a = L.first, b = L.last, dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    let m = 0; L.path.forEach((p, i) => { if (L.on[i]) m = Math.max(m, Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / l); });
    return m / palmW;
  };
  const sug = {}, conf = {};
  const h = out.heart, hd = out.head, lf = out.life, ft = out.fate;
  const gUV = (id, t) => uv(quad(G[id], t)); // ตำแหน่งเส้นนำ (แบบมาตรฐาน) ที่ t เดียวกัน ใช้เทียบว่าเส้นจริงสูง/ต่ำกว่าปกติ
  const cf = (L) => Math.max(0, Math.min(1, (L.strength - 1.1) * 0.9 * L.cov));
  // เส้นใจ: จบสูงระหว่างนิ้วชี้-กลาง = โค้ง, จบต่ำกว่าแนวมาตรฐาน = ตรงยาว
  if (h.cov < 0.2) { sug.heart = null; conf.heart = 0; }
  else {
    const du = uv(h.last).u - gUV('heart', h.last.t).u;
    sug.heart = h.fork && h.last.t > 0.6 ? 'fork' : h.gaps >= 2 && h.cov < 0.75 ? 'chain' : h.last.t < 0.62 ? 'short' : du > -0.03 ? 'curve' : 'straight';
    conf.heart = cf(h);
  }
  // เส้นสมอง: ปลายต่ำกว่าแนวมาตรฐาน = โค้งลง, ต้นติดเส้นชีวิต = ติด
  if (hd.cov < 0.2) { sug.head = null; conf.head = 0; }
  else {
    const du = uv(hd.last).u - gUV('head', hd.last.t).u;
    const gap0 = lf.first && hd.first ? Math.hypot(hd.first.x - lf.first.x, hd.first.y - lf.first.y) / palmW : 1;
    sug.head = hd.last.t < 0.6 ? 'short' : hd.fork ? 'fork' : du < -0.06 || sag(hd) > 0.16 ? 'curve' : gap0 < 0.06 ? 'joined' : gap0 > 0.14 ? 'apart' : 'straight';
    conf.head = cf(hd);
  }
  // เส้นชีวิต: โค้งออกกว้างเทียบแนวมาตรฐาน
  if (lf.cov < 0.2) { sug.life = 'faint'; conf.life = 0.3; }
  else {
    const dv = Math.max(...lf.path.map((p, i) => (lf.on[i] ? uv(p).v - gUV('life', p.t).v : -9)));
    sug.life = lf.gaps >= 1 && lf.cov < 0.8 ? 'break' : lf.strength < 1.25 ? 'faint' : dv < -0.06 ? 'close' : 'wide';
    conf.life = cf(lf);
  }
  // เส้นวาสนา
  if (ft.cov < 0.3 || ft.strength < 1.2) { sug.fate = 'none'; conf.fate = 0.35; }
  else { sug.fate = ft.gaps >= 1 || ft.cov < 0.55 ? 'broken' : ft.first.t > 0.38 ? 'late' : 'clear'; conf.fate = cf(ft); }
  return { lines: out, sug, conf, mean };
}

// ---------- โหงวเฮ้งตามอายุ (流年部位) ----------
// ตำราจีนไล่ตำแหน่งบนหน้าตามอายุ: หน้าผาก (15–30) คิ้ว (31–34) ตา (35–40) จมูก (41–50) ปาก (51–60) คางและกราม (61–75)
// ช่วง 1–14 อยู่ที่ใบหู ซึ่งกล้องหน้าตรงเห็นไม่ชัด จึงแสดงเป็นคำอธิบาย
export const AGE_ZONES = [
  [1, 14, 'ใบหู', '金星 木星', [234, 454], null, 'ช่วงวัยเด็ก ตำราดูจากใบหู ใบหูหนาเต็ม ติดแนบศีรษะ ถือว่าเลี้ยงง่าย มีคนดูแล'],
  [15, 24, 'หน้าผากส่วนบน', '天中 天庭', [10, 151], 'fore', 'ช่วงเรียนและเริ่มต้นชีวิต ดูหน้าผากส่วนบน ตำราว่าได้ผู้ใหญ่และครูอุปถัมภ์'],
  [25, 27, 'กลางหน้าผาก', '中正', [151], 'fore', 'ช่วงตั้งหลักการงาน ดูกลางหน้าผาก'],
  [28, 28, 'หว่างคิ้ว', '印堂', [9], 'browGap', 'อายุ 28 ดูที่หว่างคิ้ว ตำแหน่งชะตา หว่างคิ้วสว่างโล่งถือว่าปีนี้เปิดรับโอกาส'],
  [29, 30, 'เหนือคิ้ว', '山林', [105, 334], 'browEye', 'ดูเหนือคิ้ว เกี่ยวกับบ้าน ที่ดิน และความมั่นคง'],
  [31, 34, 'คิ้ว', '凌雲 紫氣', [105, 334, 70, 300], 'brow', 'ดูคิ้ว ช่วงนี้เพื่อนและพี่น้องมีผลต่อชีวิตมาก'],
  [35, 40, 'ดวงตา', '太陽 太陰', [159, 386, 33, 263], 'eye', 'ดูดวงตา ช่วงนี้ความคิด การตัดสินใจ และความรักเด่น'],
  [41, 43, 'โคนจมูก', '山根', [168, 6], 'nose', 'ดูโคนจมูก ช่วงเปลี่ยนผ่านของวัยกลางคน สุขภาพและครอบครัวสำคัญ'],
  [44, 45, 'สันจมูก', '年上 壽上', [197, 195], 'nose', 'ดูสันจมูก เกี่ยวกับสุขภาพและพลังในการทำงาน'],
  [46, 47, 'โหนกแก้ม', '顴骨', [425, 205], 'chin', 'ดูโหนกแก้ม เกี่ยวกับอำนาจ ลูกน้อง และการได้รับการยอมรับ'],
  [48, 50, 'ปลายจมูกและปีกจมูก', '準頭 蘭台 廷尉', [4, 64, 294], 'nose', 'ดูปลายจมูก ช่วงเก็บเกี่ยวทรัพย์ ตำราว่าการเงินเด่นที่สุดในชีวิต'],
  [51, 55, 'ร่องใต้จมูก', '人中', [164], 'phil', 'ดูร่องใต้จมูก เกี่ยวกับสุขภาพและลูกหลาน'],
  [56, 59, 'ร่องแก้ม', '法令', [206, 426], 'mouth', 'ดูร่องข้างจมูกถึงมุมปาก ตำราว่าเป็นช่วงของอำนาจและคำพูดที่คนเชื่อถือ'],
  [60, 60, 'ปาก', '水星', [13], 'mouth', 'อายุ 60 ดูที่ปาก การกินดีอยู่ดีและวาจา'],
  [61, 70, 'ใต้ริมฝีปากและกราม', '承漿 地庫', [17, 172, 397], 'chin', 'ดูใต้ริมฝีปากถึงกราม เกี่ยวกับบ้าน บริวาร และความสุขช่วงเกษียณ'],
  [71, 120, 'คาง', '地閣', [152], 'chin', 'ดูคาง ความมั่นคงในบั้นปลาย ลูกหลานและบ้าน']
];
export function ageZone(age) {
  const z = AGE_ZONES.find((r) => age >= r[0] && age <= r[1]) || AGE_ZONES[AGE_ZONES.length - 1];
  return { from: z[0], to: z[1], th: z[2], cn: z[3], at: z[4], key: z[5], about: z[6] };
}
export function ageTimeline(age, n = 4) {
  const out = []; let a = age;
  for (let k = 0; k < n; k++) { const z = ageZone(a); if (!out.length || out[out.length - 1].th !== z.th) out.push({ ...z, age: a }); a = z.to + 1; if (a > 100) break; }
  return out;
}

// ---------- ตรวจจุดคล้ายไฝ ----------
// หาจุดเข้มเล็ก ๆ บนผิวหน้า (ไม่นับตา คิ้ว ปาก รูจมูก) ด้วยการเทียบความสว่างกับผิวรอบ ๆ
// img = { data (RGBA), W, H } ของภาพเดียวกับ lm (0–1)
const PH_EYE_R = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const PH_EYE_L = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];
const PH_BROW_R = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const PH_BROW_L = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const PH_LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const PH_NOSTR = [64, 98, 97, 2, 326, 327, 294, 278, 344, 440, 275, 4, 45, 220, 115, 48];
export const PH_OVAL_IDX = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
function phInPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
export function moleDetect(img, lm) {
  const { data, W, H } = img, P = (i) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const oval = PH_OVAL_IDX.map(P), excl = [PH_EYE_R, PH_EYE_L, PH_BROW_R, PH_BROW_L, PH_LIPS, PH_NOSTR].map((s) => s.map(P));
  const grow = (poly, k) => { const cx = poly.reduce((a, p) => a + p.x, 0) / poly.length, cy = poly.reduce((a, p) => a + p.y, 0) / poly.length; return poly.map((p) => ({ x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k })); };
  const ex = excl.map((p, i) => grow(p, i < 2 ? 2.0 : i < 4 ? 1.5 : 1.35));
  // ร่องหัวตาข้างสันจมูกมักเป็นเงา จึงตัดออกด้วย
  ex.push([133, 168, 362, 197].map(P));
  const faceW = Math.hypot(P(234).x - P(454).x, P(234).y - P(454).y);
  const top = Math.max(0, Math.min(...oval.map((p) => p.y))), bot = Math.min(H, Math.max(...oval.map((p) => p.y)));
  const lef = Math.max(0, Math.min(...oval.map((p) => p.x))), rig = Math.min(W, Math.max(...oval.map((p) => p.x)));
  const g = new Float32Array(W * H), m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11;
  const shrink = grow(oval, 0.9);
  for (let y = Math.floor(top); y < bot; y++) for (let x = Math.floor(lef); x < rig; x++) if (phInPoly(x, y, shrink) && !ex.some((p) => phInPoly(x, y, p))) m[y * W + x] = 1;
  // ความสว่างเฉลี่ยรอบ ๆ (หน้าต่างกว้าง ~ faceW/14) เทียบกับจุดเล็ก (เฉลี่ย 3×3)
  const r = Math.max(4, Math.round(faceW / 14)), I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) { s += g[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + s; } }
  const box = (x0, y0, x1, y1) => { x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1); const n = (x1 - x0) * (y1 - y0) || 1; return (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / n; };
  const dark = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (!m[i]) continue;
    const loc = box(x - r, y - r, x + r + 1, y + r + 1), c = box(x - 1, y - 1, x + 2, y + 2);
    if (c < loc * 0.66 && loc - c > 24) dark[i] = 1;
  }
  // รวมจุดติดกัน แล้วกรองขนาดและความกลม
  const seen = new Uint8Array(W * H), out = [], minA = Math.max(3, (faceW / 120) ** 2), maxA = (faceW / 18) ** 2;
  for (let i = 0; i < W * H; i++) {
    if (!dark[i] || seen[i]) continue;
    const st = [i]; seen[i] = 1; let n = 0, sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; n++; sx += x; sy += y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const k of [j - 1, j + 1, j - W, j + W]) if (k >= 0 && k < W * H && dark[k] && !seen[k]) { seen[k] = 1; st.push(k); } }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, fill = n / (bw * bh), asp = Math.max(bw, bh) / Math.min(bw, bh);
    if (n >= minA && n <= maxA && asp < 2.2 && fill > 0.45) out.push({ x: sx / n / W, y: sy / n / H, size: Math.sqrt(n) / faceW });
  }
  return out.sort((a, b) => b.size - a.size).slice(0, 8).map((p) => ({ ...p, ...moleMeaning(p, lm) }));
}
// ความหมายไฝตามตำแหน่ง (ตำราโหงวเฮ้งจีน แบบย่อ) เทียบกับจุดอ้างอิงที่ใกล้ที่สุด
const MOLE_SPOTS = [
  [151, 'กลางหน้าผาก', 1, 'ตำราว่ามีผู้ใหญ่สนับสนุน งานราชการหรือองค์กรใหญ่ไปได้ดี'],
  [9, 'หว่างคิ้ว', -1, 'ตำราว่ามีอุปสรรคต้องฝ่าฟัน แต่เป็นคนมุ่งมั่น'],
  [105, 'ในคิ้วขวา', 1, 'ไฝซ่อนในคิ้ว ตำราว่าฉลาด มีทรัพย์เก็บ'],
  [334, 'ในคิ้วซ้าย', 1, 'ไฝซ่อนในคิ้ว ตำราว่าฉลาด มีทรัพย์เก็บ'],
  [230, 'ใต้ตาขวา', 0, 'ตำราว่าอ่อนไหว ใจดี ห่วงลูกหลาน'],
  [450, 'ใต้ตาซ้าย', 0, 'ตำราว่าอ่อนไหว ใจดี ห่วงลูกหลาน'],
  [127, 'หางตาขวา', 0, 'ตำราว่ามีเสน่ห์ เรื่องรักมีสีสัน'],
  [356, 'หางตาซ้าย', 0, 'ตำราว่ามีเสน่ห์ เรื่องรักมีสีสัน'],
  [6, 'สันจมูก', -1, 'ตำราว่าช่วงวัยกลางคนต้องดูแลสุขภาพและการงานเป็นพิเศษ'],
  [4, 'ปลายจมูก', 0, 'ตำราว่าหาเงินเก่ง แต่ใช้เงินคล่อง ควรมีระบบออม'],
  [64, 'ปีกจมูกขวา', 0, 'ตำราว่าเงินเข้าแล้วออกเร็ว ระวังการให้ยืม'],
  [294, 'ปีกจมูกซ้าย', 0, 'ตำราว่าเงินเข้าแล้วออกเร็ว ระวังการให้ยืม'],
  [116, 'โหนกแก้มขวา', 0, 'ตำราว่ามีอำนาจ แต่ระวังคนอิจฉา'],
  [345, 'โหนกแก้มซ้าย', 0, 'ตำราว่ามีอำนาจ แต่ระวังคนอิจฉา'],
  [164, 'ร่องใต้จมูก', 0, 'ตำราว่าเกี่ยวกับลูกหลาน ควรใส่ใจสุขภาพ'],
  [61, 'มุมปากขวา', 1, 'ตำราว่ามีโชคเรื่องอาหาร ช่างพูด มีเสน่ห์'],
  [291, 'มุมปากซ้าย', 1, 'ตำราว่ามีโชคเรื่องอาหาร ช่างพูด มีเสน่ห์'],
  [200, 'ใต้ริมฝีปาก', 1, 'ตำราว่ามีบ้าน มีที่ดิน ชอบเดินทาง'],
  [152, 'คาง', 1, 'ตำราว่าบั้นปลายมั่นคง มีบ้านและบริวาร'],
  [172, 'กรามขวา', 0, 'ตำราว่าดื้อ มุ่งมั่น ทำงานหนัก'],
  [397, 'กรามซ้าย', 0, 'ตำราว่าดื้อ มุ่งมั่น ทำงานหนัก']
];
function moleMeaning(p, lm) {
  let best = null, bd = 1e9;
  for (const s of MOLE_SPOTS) { const q = lm[s[0]], d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = s; } }
  return { where: best[1], tone: best[2], read: best[3] };
}

// ---------- เทียบโหงวเฮ้งสองคน ----------
export function coupleRead(a, b) {
  const ea = faceElement(a), eb = faceElement(b), out = [];
  let score = 60;
  if (ea.key === eb.key) { score += 10; out.push([1, `ธาตุใบหน้าเหมือนกัน (${ea.th}) คิดคล้ายกัน เข้าใจกันง่าย แต่ระวังติดนิสัยเดียวกัน`]); }
  else if (GEN[ea.key] === eb.key || GEN[eb.key] === ea.key) { score += 18; const g = GEN[ea.key] === eb.key ? [ea, eb] : [eb, ea]; out.push([1, `ธาตุ${g[0].th}ให้กำเนิดธาตุ${g[1].th} คนหนึ่งคอยหนุน อีกคนเติบโต เป็นคู่ที่ส่งเสริมกัน`]); }
  else if (CTRL[ea.key] === eb.key || CTRL[eb.key] === ea.key) { score -= 6; const c = CTRL[ea.key] === eb.key ? [ea, eb] : [eb, ea]; out.push([-1, `ธาตุ${c[0].th}ข่มธาตุ${c[1].th} คนหนึ่งมักเป็นฝ่ายนำ ควรเปิดพื้นที่ให้อีกฝ่ายตัดสินใจบ้าง`]); }
  const mA = nb('mouthR', a.mouthR), mB = nb('mouthR', b.mouthR);
  if (mA !== mB && (mA > 0 || mB > 0)) { score += 6; out.push([1, 'คนหนึ่งปากกว้างช่างพูด อีกคนเป็นผู้ฟัง คุยกันลงตัว']); }
  else if (mA > 0 && mB > 0) out.push([0, 'ช่างพูดทั้งคู่ บ้านไม่เงียบ แต่ต้องผลัดกันฟัง']);
  const bA = nb('browEye', a.browEye), bB = nb('browEye', b.browEye);
  if (bA < 0 && bB < 0) { score -= 6; out.push([-1, 'คิ้วชิดตาทั้งคู่ ใจร้อนเหมือนกัน เวลาเถียงให้พักก่อนค่อยคุย']); }
  else if (bA > 0 || bB > 0) { score += 4; out.push([1, 'มีคนหนึ่งใจเย็น ช่วยคุมอารมณ์ของบ้านได้']); }
  const gA = nb('browGap', a.browGap), gB = nb('browGap', b.browGap);
  if (gA > 0 && gB > 0) { score += 5; out.push([1, 'หว่างคิ้วกว้างทั้งคู่ ให้อภัยง่าย ไม่เก็บเรื่องเล็กมาคิด']); }
  const nA = nb('noseWR', a.noseWR), nB = nb('noseWR', b.noseWR);
  if (nA > 0 || nB > 0) { score += 4; out.push([1, 'มีคนจมูกปีกกว้าง ตำราว่าช่วยเก็บเงินให้ครอบครัว']); }
  else if (nA < 0 && nB < 0) out.push([0, 'ใช้เงินคล่องทั้งคู่ ควรมีบัญชีออมร่วมกัน']);
  const sim = 1 - (Math.abs(a.up - b.up) + Math.abs(a.md - b.md) + Math.abs(a.lo - b.lo)) * 4;
  if (sim > 0.7) { score += 4; out.push([1, 'สัดส่วนหน้าคล้ายกัน ช่วงชีวิตที่ดีมาพร้อมกัน วางแผนอนาคตง่าย']); }
  return { score: Math.max(35, Math.min(96, Math.round(score))), ea, eb, out };
}
