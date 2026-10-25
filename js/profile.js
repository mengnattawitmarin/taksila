// Natal profile: symbols, personality, career, cautions and talents, all derived from the birth chart.
import { SIGNS, ELEMENTS, PLANETS, HOUSES, elementOf, signOf, angDist, meanNode, findAspect } from './astro.js';
import { TH_PLANETS, birthPlanet } from './thai.js';

// ---------- symbols by sign (Western tradition) ----------
const SIGN_SYMBOLS = [
  { flower: 'สายน้ำผึ้ง', stone: 'เพชร', stoneEn: 'Diamond', color: 'แดงสด', hex: '#D0493D' },
  { flower: 'กุหลาบ', stone: 'มรกต', stoneEn: 'Emerald', color: 'เขียวมรกต', hex: '#3F9E6E' },
  { flower: 'ลาเวนเดอร์', stone: 'ไข่มุก', stoneEn: 'Pearl', color: 'เหลืองสว่าง', hex: '#E9CF6B' },
  { flower: 'ลิลลี่ขาว', stone: 'มุกดาหาร', stoneEn: 'Moonstone', color: 'ขาวเงิน', hex: '#D9DCE3' },
  { flower: 'ทานตะวัน', stone: 'เพอริดอต', stoneEn: 'Peridot', color: 'ทอง', hex: '#D4AF63' },
  { flower: 'เบญจมาศ', stone: 'ไพลิน', stoneEn: 'Sapphire', color: 'น้ำตาลอ่อน เขียวหม่น', hex: '#9C8B66' },
  { flower: 'ไฮเดรนเยีย', stone: 'โอปอล', stoneEn: 'Opal', color: 'ชมพูพาสเทล ฟ้าอ่อน', hex: '#E7A9C0' },
  { flower: 'โบตั๋น', stone: 'บุษราคัม', stoneEn: 'Topaz', color: 'แดงเลือดหมู', hex: '#8E2F3A' },
  { flower: 'คาร์เนชั่น', stone: 'เทอร์ควอยซ์', stoneEn: 'Turquoise', color: 'ม่วงคราม', hex: '#5F4FA3' },
  { flower: 'แพนซี', stone: 'โกเมน', stoneEn: 'Garnet', color: 'เทาเข้ม น้ำตาลเข้ม', hex: '#5A4C3E' },
  { flower: 'กล้วยไม้', stone: 'อเมทิสต์', stoneEn: 'Amethyst', color: 'ฟ้าไฟฟ้า', hex: '#3FA7D6' },
  { flower: 'บัว', stone: 'อความารีน', stoneEn: 'Aquamarine', color: 'เขียวน้ำทะเล', hex: '#58B3A8' }
];
// Western sign rulers (modern) and planetary numbers used in Western numerology.
const RULER = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune'];
const TRAD_RULER = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
const EXALT = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 };
const PLANET_NUMBER = { sun: 1, moon: 2, jupiter: 3, uranus: 4, mercury: 5, venus: 6, neptune: 7, saturn: 8, mars: 9, pluto: 9 };

// Thai: animal mount of the birth-day deity, and the 12-year นักษัตร.
const DAY_MOUNT = { 1: 'ราชสีห์', 2: 'ม้า', 3: 'กระบือ', 4: 'ช้าง', 5: 'กวาง', 6: 'โค', 7: 'เสือ', 8: 'ช้างดำ' };
const NAKSAT = [['ชวด', 'หนู'], ['ฉลู', 'วัว'], ['ขาล', 'เสือ'], ['เถาะ', 'กระต่าย'], ['มะโรง', 'งูใหญ่'], ['มะเส็ง', 'งูเล็ก'], ['มะเมีย', 'ม้า'], ['มะแม', 'แพะ'], ['วอก', 'ลิง'], ['ระกา', 'ไก่'], ['จอ', 'สุนัข'], ['กุน', 'หมู']];

// ---------- personality ----------
const ELEMENT_TEXT = [
  { th: 'ไฟ', core: 'กระตือรือร้น กล้าเริ่มก่อน มีพลังดึงดูดคนรอบตัว', lack: 'อาจขาดแรงผลักดันหรือความกล้าเริ่ม ลองตั้งเป้าเล็ก ๆ แล้วลงมือทันที' },
  { th: 'ดิน', core: 'ติดดิน ทำจริง ไว้ใจได้ ชอบผลลัพธ์ที่จับต้องได้', lack: 'อาจไม่ถนัดเรื่องเงินและกิจวัตร ควรมีระบบออมและตารางชีวิต' },
  { th: 'ลม', core: 'ช่างคิด ช่างคุย เข้าสังคมเก่ง มองเห็นหลายมุม', lack: 'อาจเก็บความคิดไว้คนเดียว ฝึกพูดและเขียนสิ่งที่คิดออกมา' },
  { th: 'น้ำ', core: 'อ่อนโยน เข้าใจความรู้สึกคน หยั่งรู้สูง', lack: 'อาจเข้าใจอารมณ์ตัวเองยาก ลองจดบันทึกความรู้สึก' }
];
const MODE_TEXT = [
  { th: 'จร (Cardinal)', text: 'ชอบเริ่มต้นสิ่งใหม่ เป็นผู้บุกเบิก' },
  { th: 'สถิร (Fixed)', text: 'หนักแน่น ทำอะไรทำจริงจนสำเร็จ' },
  { th: 'ทวิ (Mutable)', text: 'ยืดหยุ่น ปรับตัวเก่ง ทำได้หลายอย่าง' }
];
const MOON_NEED = ['ต้องการอิสระและความตื่นเต้น', 'ต้องการความมั่นคงและความสบายใจ', 'ต้องการคนคุยและเรื่องใหม่ ๆ', 'ต้องการครอบครัวและความอบอุ่น', 'ต้องการการยอมรับและคำชม', 'ต้องการความเป็นระเบียบและการได้ช่วยเหลือ', 'ต้องการความสงบและความสัมพันธ์ที่ดี', 'ต้องการความจริงใจลึกซึ้ง', 'ต้องการพื้นที่และการผจญภัย', 'ต้องการความสำเร็จที่มั่นคง', 'ต้องการเพื่อนและอิสระทางความคิด', 'ต้องการความเข้าใจและเวลาพักใจ'];
const VENUS_LOVE = ['รักเร็ว ตรงไปตรงมา ชอบไล่ตาม', 'รักมั่นคง ช้าแต่ชัวร์ แสดงความรักผ่านการดูแล', 'รักคนคุยสนุก ต้องมีเรื่องคุยกันได้ไม่รู้จบ', 'รักแบบครอบครัว ทุ่มเทและหวงแหน', 'รักแบบโรแมนติก ชอบให้และชอบได้รับความสนใจ', 'รักผ่านการกระทำเล็ก ๆ ใส่ใจรายละเอียด', 'รักความสวยงามและความเท่าเทียม ไม่ชอบความขัดแย้ง', 'รักลึก เข้มข้น ซื่อสัตย์ แต่หึงหวง', 'รักอิสระ ชอบคู่ที่ไปเที่ยวและเรียนรู้ด้วยกัน', 'รักจริงจัง มองระยะยาว ต้องการคู่ที่พึ่งพาได้', 'รักแบบเพื่อน ต้องมีพื้นที่ส่วนตัว', 'รักแบบเสียสละ อ่อนโยน โรแมนติก'];

// ---------- career ----------
const PLANET_CAREER = {
  sun: ['ผู้บริหาร', 'ราชการ', 'ผู้ประกอบการ', 'วงการบันเทิง'],
  moon: ['งานบริการ', 'อาหาร', 'พยาบาล ดูแลคน', 'อสังหาริมทรัพย์'],
  mercury: ['สื่อสาร การตลาด', 'นักเขียน', 'งานขาย', 'ไอที โปรแกรมเมอร์'],
  venus: ['ศิลปะ ออกแบบ', 'ความงาม แฟชั่น', 'การเงิน ธนาคาร', 'ประชาสัมพันธ์'],
  mars: ['วิศวกร', 'ทหาร ตำรวจ', 'กีฬา', 'ศัลยแพทย์'],
  jupiter: ['ครู อาจารย์', 'กฎหมาย', 'ที่ปรึกษา', 'ท่องเที่ยว ต่างประเทศ'],
  saturn: ['บัญชี ตรวจสอบ', 'บริหารองค์กร', 'วิศวกรรมโยธา', 'งานราชการระยะยาว'],
  uranus: ['เทคโนโลยี นวัตกรรม', 'สตาร์ทอัพ', 'วิทยาศาสตร์', 'การบิน'],
  neptune: ['ดนตรี ภาพยนตร์', 'การบำบัด', 'จิตวิญญาณ', 'ถ่ายภาพ'],
  pluto: ['วิจัย สืบสวน', 'จิตวิทยา', 'การลงทุน', 'แพทย์']
};
const SIGN_CAREER = ['งานที่ต้องเป็นผู้นำและตัดสินใจเร็ว', 'งานที่สร้างความมั่นคงและมูลค่า', 'งานที่ใช้ความคิดและการสื่อสาร', 'งานที่ดูแลผู้คน', 'งานที่ได้แสดงออกและเป็นที่รู้จัก', 'งานที่ต้องละเอียดและแก้ปัญหา', 'งานที่ใช้รสนิยมและการเจรจา', 'งานที่ต้องเจาะลึกและจัดการวิกฤต', 'งานที่ได้เดินทางและสอน', 'งานที่ไต่เต้าเป็นขั้นตอน', 'งานที่แหวกแนวและเพื่อส่วนรวม', 'งานที่ใช้จินตนาการและความเมตตา'];

// ---------- health (body areas ruled by signs) ----------
const SIGN_BODY = ['ศีรษะ ไมเกรน', 'คอ ต่อมไทรอยด์', 'แขน ไหล่ ปอด', 'กระเพาะ หน้าอก', 'หัวใจ หลัง', 'ลำไส้ ระบบย่อย', 'ไต ผิวพรรณ', 'ระบบสืบพันธุ์ ขับถ่าย', 'สะโพก ตับ', 'กระดูก ข้อเข่า ฟัน', 'ข้อเท้า การไหลเวียนโลหิต', 'เท้า ระบบน้ำเหลือง'];

// ---------- talents & cautions from aspects ----------
// key = two planet ids sorted by PLANETS order. good: harmonious (and conj with benefics), hard: square/opposition.
const PAIRS = {
  'moon-neptune': { good: ['มีเซนส์', 'สัญชาตญาณแรง จับความรู้สึกคนได้ก่อนเขาพูด'], hard: ['อ่อนไหวง่าย', 'รับอารมณ์คนอื่นมาเป็นของตัวเอง ควรมีเวลาอยู่เงียบ ๆ'] },
  'moon-pluto': { good: ['อ่านใจคนเก่ง', 'มองทะลุเจตนาคนได้ลึก'], hard: ['อารมณ์เข้มข้น', 'หึงหวงและเก็บความรู้สึกลึก'] },
  'mercury-jupiter': { good: ['พูดเก่ง', 'โน้มน้าวคนเก่ง เหมาะกับการสอนและการขาย'], hard: ['พูดเกินจริง', 'สัญญามากกว่าที่ทำได้'] },
  'mercury-venus': { good: ['พูดจาน่าฟัง', 'มีศิลปะในการพูดและการเขียน'], hard: ['เกรงใจเกินไป', 'พูดเพื่อเอาใจจนไม่กล้าบอกความจริง'] },
  'mercury-mars': { good: ['ถกเถียงเก่ง', 'คิดไวพูดไว ตอบโต้ฉับพลัน'], hard: ['ปากไว', 'พูดแรงเวลาโกรธ ระวังคำพูด'] },
  'mercury-uranus': { good: ['หัวไว ไอเดียใหม่', 'คิดนอกกรอบ เรียนรู้เทคโนโลยีเร็ว'], hard: ['ใจลอย', 'คิดกระโดดจนคนตามไม่ทัน'] },
  'mercury-saturn': { good: ['คิดเป็นระบบ', 'ละเอียด วางแผนเก่ง ความจำแม่น'], hard: ['คิดมาก', 'กังวลและวิจารณ์ตัวเองหนัก'] },
  'mercury-neptune': { good: ['เล่าเรื่องเก่ง', 'จินตนาการสูง เหมาะกับงานสร้างสรรค์'], hard: ['สับสนง่าย', 'หลงเชื่อคำพูดคนอื่น ควรตรวจสอบข้อมูล'] },
  'sun-saturn': { good: ['ขยัน อดทน', 'รับผิดชอบสูง ยิ่งโตยิ่งประสบความสำเร็จ'], hard: ['กดดันตัวเอง', 'รู้สึกว่าต้องพิสูจน์ตัวเองตลอด'] },
  'mars-saturn': { good: ['ขยัน ทำงานหนักได้', 'มีวินัยและความอึดสูง'], hard: ['หงุดหงิดเมื่อถูกขวาง', 'อัดอั้นจนระเบิด ควรออกกำลังกายระบาย'] },
  'mars-jupiter': { good: ['พลังเหลือล้น', 'กล้าเสี่ยงและมักได้ผลดี'], hard: ['ทำเกินตัว', 'รับงานมากเกินกำลัง'] },
  'venus-jupiter': { good: ['มีเสน่ห์ โชคดีเรื่องเงิน', 'คนเอ็นดู มีผู้ใหญ่อุปถัมภ์'], hard: ['ใช้เงินเกินตัว', 'ชอบความสุขสบายจนเกินพอดี'] },
  'venus-neptune': { good: ['หัวศิลปะ', 'มีพรสวรรค์ด้านดนตรี ศิลปะ ความงาม'], hard: ['รักแบบอุดมคติ', 'มองคนรักดีเกินจริง ระวังผิดหวัง'] },
  'venus-mars': { good: ['เสน่ห์แรง', 'ดึงดูดเพศตรงข้ามได้ง่าย'], hard: ['รักร้อนแรง', 'ความรักมีทั้งหวานและทะเลาะ'] },
  'venus-saturn': { good: ['รักมั่นคง', 'ซื่อสัตย์ รักยาว'], hard: ['รักช้า', 'กลัวผิดหวังจนไม่กล้าเปิดใจ'] },
  'venus-uranus': { good: ['สไตล์โดดเด่น', 'รสนิยมแปลกใหม่ ไม่เหมือนใคร'], hard: ['รักไม่แน่นอน', 'เบื่อง่ายในความสัมพันธ์'] },
  'sun-jupiter': { good: ['มองโลกในแง่ดี', 'มีผู้อุปถัมภ์และโอกาสเข้ามาเสมอ'], hard: ['มั่นใจเกินไป', 'ประเมินตัวเองสูงเกินจริง'] },
  'sun-moon': { good: ['ใจกับเป้าหมายไปทางเดียวกัน', 'มีความสุขกับสิ่งที่ทำ'], hard: ['ขัดแย้งในใจ', 'อยากได้สองอย่างพร้อมกัน'] },
  'sun-mars': { good: ['ใจสู้ ลงมือทันที', 'พลังกายดี เป็นผู้นำโดยธรรมชาติ'], hard: ['ใจร้อน', 'ปะทะกับคนง่าย ระวังอุบัติเหตุ'] },
  'sun-uranus': { good: ['เป็นตัวของตัวเอง', 'กล้าแตกต่าง มีความคิดริเริ่ม'], hard: ['ดื้อ ไม่ชอบกฎ', 'ชีวิตเปลี่ยนแปลงกะทันหันบ่อย'] },
  'sun-neptune': { good: ['มีแรงบันดาลใจ', 'ใจเมตตา มีพรสวรรค์ด้านศิลปะ'], hard: ['หลงทางง่าย', 'ขาดขอบเขต ถูกเอาเปรียบง่าย'] },
  'sun-pluto': { good: ['พลังใจแข็งแกร่ง', 'ฟื้นตัวจากวิกฤตได้ทุกครั้ง'], hard: ['ชอบควบคุม', 'ต่อสู้เรื่องอำนาจกับคนรอบตัว'] },
  'moon-jupiter': { good: ['ใจบุญ', 'มีคนเมตตา ชีวิตครอบครัวอบอุ่น'], hard: ['ตามใจตัวเอง', 'กินหรือใช้จ่ายตามอารมณ์'] },
  'moon-venus': { good: ['อ่อนโยน เข้าใจคน', 'เป็นที่รักของคนรอบตัว'], hard: ['ต้องการความรักมาก', 'อ่อนไหวเรื่องความสัมพันธ์'] },
  'moon-mercury': { good: ['ความจำดี', 'สื่อสารความรู้สึกเก่ง เข้าใจคนง่าย'], hard: ['คิดตามอารมณ์', 'ตัดสินใจตามความรู้สึก'] },
  'moon-saturn': { good: ['อารมณ์มั่นคง', 'เป็นที่พึ่งของคนอื่นได้'], hard: ['เก็บกด', 'กังวลง่าย รู้สึกว่าต้องรับผิดชอบทุกอย่าง'] },
  'moon-mars': { good: ['กล้าแสดงความรู้สึก', 'ปกป้องคนที่รัก'], hard: ['อารมณ์ขึ้นลงเร็ว', 'โกรธง่ายหายเร็ว'] },
  'moon-uranus': { good: ['ไม่ยึดติด', 'ปรับตัวกับการเปลี่ยนแปลงเก่ง'], hard: ['อารมณ์แปรปรวน', 'ต้องการอิสระจนคนใกล้ชิดไม่เข้าใจ'] },
  'mars-pluto': { good: ['ใจเหล็ก', 'มุ่งมั่นแบบไม่ยอมแพ้'], hard: ['ดุดัน', 'ระวังการใช้กำลังและความรุนแรง'] },
  'mars-uranus': { good: ['กล้าคิดกล้าทำ', 'ตอบสนองฉับไว เหมาะกับงานเร่งด่วน'], hard: ['บุ่มบ่าม', 'ระวังอุบัติเหตุจากความรีบ'] },
  'mars-neptune': { good: ['ทำเพื่ออุดมการณ์', 'ทุ่มเทให้งานศิลปะหรือการช่วยเหลือ'], hard: ['หมดแรงง่าย', 'ทำอะไรไม่ค่อยสุด'] },
  'jupiter-saturn': { good: ['วางแผนระยะยาวเก่ง', 'สร้างฐานะได้มั่นคง'], hard: ['ลังเล', 'ชั่งใจระหว่างเสี่ยงกับปลอดภัย'] },
  'jupiter-neptune': { good: ['ศรัทธาและเมตตา', 'สนใจธรรมะหรือจิตวิญญาณ'], hard: ['ฝันกลางวัน', 'ระวังการลงทุนที่ฟังดูดีเกินจริง'] },
  'jupiter-uranus': { good: ['โชคแบบฉับพลัน', 'มีโอกาสใหม่เข้ามาแบบไม่คาดคิด'], hard: ['ใจร้อนอยากรวย', 'เปลี่ยนทิศทางบ่อย'] },
  'saturn-pluto': { good: ['อดทนต่อแรงกดดัน', 'สร้างสิ่งยิ่งใหญ่จากศูนย์ได้'], hard: ['แบกภาระหนัก', 'ช่วงชีวิตมีบททดสอบใหญ่'] },
  'mercury-pluto': { good: ['คิดลึก ค้นคว้าเก่ง', 'เหมาะกับงานวิจัยและสืบสวน'], hard: ['คิดหมกมุ่น', 'สงสัยคนอื่นง่าย'] },
  'venus-pluto': { good: ['รักลึกซึ้ง', 'มีพลังดึงดูดแบบลึกลับ'], hard: ['รักแบบครอบครอง', 'ระวังความสัมพันธ์ที่เป็นพิษ'] },
  'moon-sun': null
};
const pairKey = (a, b) => {
  const ia = PLANETS.findIndex((p) => p.id === a), ib = PLANETS.findIndex((p) => p.id === b);
  return ia < ib ? `${a}-${b}` : `${b}-${a}`;
};
const MALEFIC = ['mars', 'saturn', 'uranus', 'pluto'];
const pnm = (p) => p.id === 'sun' ? 'ดวงอาทิตย์' : p.id === 'moon' ? 'ดวงจันทร์' : 'ดาว' + p.th;

// Planet strength: dignity, angular houses, chart ruler, aspect count.
function dominance(ch) {
  const ascSign = ch.timeKnown ? signOf(ch.asc) : null;
  return ch.planets.map((p) => {
    let s = p.id === 'sun' || p.id === 'moon' ? 2 : 0;
    if (RULER[p.sign] === p.id || TRAD_RULER[p.sign] === p.id) s += 3;
    if (EXALT[p.id] === p.sign) s += 2;
    if (ch.timeKnown && [1, 10].includes(p.house)) s += 3;
    if (ch.timeKnown && [4, 7].includes(p.house)) s += 1.5;
    if (ascSign != null && (RULER[ascSign] === p.id || TRAD_RULER[ascSign] === p.id)) s += 3;
    if (RULER[ch.planets[0].sign] === p.id) s += 1;
    for (const a of ch.aspects) if (a.a.id === p.id || a.b.id === p.id) s += Math.max(0, 1 - a.off / 8);
    if (['uranus', 'neptune', 'pluto'].includes(p.id)) s *= 0.7;
    return { p, s };
  }).sort((x, y) => y.s - x.s);
}

export function natalProfile(ch, profile) {
  const sun = ch.planets.find((p) => p.id === 'sun'), moon = ch.planets.find((p) => p.id === 'moon');
  const venus = ch.planets.find((p) => p.id === 'venus'), saturn = ch.planets.find((p) => p.id === 'saturn');
  const jupiter = ch.planets.find((p) => p.id === 'jupiter');
  const ascSign = ch.timeKnown ? signOf(ch.asc) : null;
  const dom = dominance(ch);
  const ruler = dom[0].p;
  const sym = SIGN_SYMBOLS[sun.sign];
  const ascSym = ascSign != null ? SIGN_SYMBOLS[ascSign] : null;

  // Element and mode balance (planets plus ASC counted double).
  const el = [...ch.elementCount]; if (ascSign != null) el[elementOf(ascSign)] += 2;
  el[elementOf(sun.sign)] += 1; el[elementOf(moon.sign)] += 1;
  const mode = [0, 0, 0]; ch.planets.forEach((p) => { mode[p.sign % 3] += 1; });
  const elOrder = [0, 1, 2, 3].sort((a, b) => el[b] - el[a]);
  const topMode = [0, 1, 2].sort((a, b) => mode[b] - mode[a])[0];

  // Thai side
  const bp = birthPlanet(profile);
  const yCE = profile.yearBE - 543;
  const beforeNewYear = profile.month < 4 || (profile.month === 4 && profile.day < 16);
  const nk = NAKSAT[(((beforeNewYear ? yCE - 1 : yCE) - 4) % 12 + 12) % 12];

  // Symbols
  const symbols = [
    { k: 'flower', label: 'ดอกไม้ประจำดวง', value: sym.flower, basis: `ดวงอาทิตย์ราศี${SIGNS[sun.sign].th}`, extra: ascSym && ascSign !== sun.sign ? `ดอกไม้เสริมลัคนา: ${ascSym.flower}` : '' },
    { k: 'stone', label: 'อัญมณีประจำดวง', value: sym.stone, en: sym.stoneEn, basis: `ดวงอาทิตย์ราศี${SIGNS[sun.sign].th}`, extra: ascSym && ascSign !== sun.sign ? `หินเสริมลัคนา: ${ascSym.stone}` : '' },
    { k: 'color', label: 'สีประจำดวง', value: sym.color, hex: sym.hex, basis: `ดวงอาทิตย์ราศี${SIGNS[sun.sign].th}`, extra: ascSym ? `สีเสริมลัคนา: ${ascSym.color}` : '', hex2: ascSym && ascSym.hex },
    { k: 'number', label: 'เลขประจำดวง', value: String(PLANET_NUMBER[ruler.id]), basis: `ดาวเด่นในดวงคือ${pnm(ruler)}`, extra: `เลขดาวเจ้าราศีเกิด: ${PLANET_NUMBER[RULER[sun.sign]]}` },
    { k: 'animal', label: 'สัตว์ประจำดวง', value: `ปี${nk[0]} (${nk[1]})`, basis: 'ปีนักษัตรตามปีเกิด นับเปลี่ยนปีที่สงกรานต์', extra: `สัตว์พาหนะเทพประจำวันเกิด: ${DAY_MOUNT[bp]} (${TH_PLANETS[bp].day})` },
    { k: 'planet', label: 'ดาวเด่นในดวง', value: pnm(ruler), glyph: ruler.glyph, basis: `อยู่ราศี${SIGNS[ruler.sign].th}${ch.timeKnown ? ' ภพ ' + ruler.house : ''} มีกำลังมากที่สุด`, extra: `รองลงมา: ${pnm(dom[1].p)} · ${pnm(dom[2].p)}` }
  ];

  // Highlights
  const highlights = [];
  const stellium = ch.signCount.map((n, i) => ({ n, i })).filter((x) => x.n >= 3).sort((a, b) => b.n - a.n)[0];
  if (stellium) {
    const ps = ch.planets.filter((p) => p.sign === stellium.i);
    const h = ch.timeKnown ? ps[0].house : null;
    highlights.push({ title: `ดาวรวมกลุ่ม ${stellium.n} ดวงในราศี${SIGNS[stellium.i].th}`, body: `${ps.map(pnm).join(' ')} อยู่ด้วยกัน พลังชีวิตจึงเทไปที่${h ? 'เรื่อง' + HOUSES[h - 1] + ' (ภพ ' + h + ')' : 'คุณสมบัติของราศีนี้'} อย่างชัดเจน: ${SIGNS[stellium.i].trait}` });
  }
  highlights.push({ title: `${pnm(ruler)}คือดาวเด่นของดวง`, body: `พลังของ${pnm(ruler)} (${ruler.kw || PLANETS.find((x) => x.id === ruler.id).kw}) โดดเด่นกว่าดาวอื่น ส่งผลต่อบุคลิกและเส้นทางชีวิตมากที่สุด` });
  highlights.push({ title: `ธาตุ${ELEMENT_TEXT[elOrder[0]].th}เด่น · ${MODE_TEXT[topMode].th}`, body: `${ELEMENT_TEXT[elOrder[0]].core} และ${MODE_TEXT[topMode].text}` });
  if (ch.timeKnown) {
    const angular = ch.planets.filter((p) => p.house === 1 || p.house === 10).filter((p) => p.id !== ruler.id);
    if (angular.length) highlights.push({ title: `${angular.map(pnm).join(' ')} อยู่มุมเด่นของดวง`, body: angular.map((p) => `${pnm(p)}ในภพ ${p.house} ทำให้${p.house === 1 ? 'บุคลิกมีพลังของ' : 'การงานได้รับพลังของ'}${(PLANETS.find((x) => x.id === p.id).kw)}`).join(' ') });
  }

  // Personality
  const personality = [
    { label: 'ตัวตนแท้', sign: sun.sign, text: `ดวงอาทิตย์ราศี${SIGNS[sun.sign].th}: ${SIGNS[sun.sign].trait}` },
    { label: 'จิตใจ', sign: moon.sign, text: `ดวงจันทร์ราศี${SIGNS[moon.sign].th}: ${MOON_NEED[moon.sign]}` },
    ascSign != null ? { label: 'ภาพที่คนเห็น', sign: ascSign, text: `ลัคนาราศี${SIGNS[ascSign].th}: ${SIGNS[ascSign].trait}` } : null,
    { label: 'ความรัก', sign: venus.sign, text: `ดาวศุกร์ราศี${SIGNS[venus.sign].th}: ${VENUS_LOVE[venus.sign]}` }
  ].filter(Boolean);

  // Career: 10th sign (whole sign) or Sun sign, planets in 10th, dominant planet.
  const tenth = ch.timeKnown ? (ascSign + 9) % 12 : null;
  const inTenth = ch.timeKnown ? ch.planets.filter((p) => p.house === 10) : [];
  const careerSet = new Set();
  inTenth.forEach((p) => PLANET_CAREER[p.id].slice(0, 2).forEach((c) => careerSet.add(c)));
  PLANET_CAREER[ruler.id].forEach((c) => careerSet.add(c));
  if (tenth != null) PLANET_CAREER[RULER[tenth]].slice(0, 2).forEach((c) => careerSet.add(c));
  PLANET_CAREER[dom[1].p.id].slice(0, 1).forEach((c) => careerSet.add(c));
  const career = {
    style: tenth != null ? `ภพการงาน (ภพ 10) เป็นราศี${SIGNS[tenth].th}: เหมาะกับ${SIGN_CAREER[tenth]}` : `ดวงอาทิตย์ราศี${SIGNS[sun.sign].th}: เหมาะกับ${SIGN_CAREER[sun.sign]}`,
    list: [...careerSet].slice(0, 8),
    basis: [inTenth.length ? `${inTenth.map(pnm).join(' ')}ในภพ 10` : null, `ดาวเด่น ${pnm(ruler)}`, tenth != null ? `เจ้าภพ 10 คือ${pnm(PLANETS.find((x) => x.id === RULER[tenth]))}` : null].filter(Boolean).join(' · ')
  };

  // Talents and cautions from aspects
  const talents = [], cautions = [];
  for (const a of ch.aspects) {
    const def = PAIRS[pairKey(a.a.id, a.b.id)];
    if (!def) continue;
    const slow = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const tight = Math.max(0, 1 - a.off / 8) * (slow.includes(a.a.id) && slow.includes(a.b.id) ? 0.55 : 1);
    const mal = MALEFIC.includes(a.a.id) || MALEFIC.includes(a.b.id);
    const src = `${pnm(a.a)}${a.th}${pnm(a.b)} (${a.off.toFixed(1)}°)`;
    if (a.nature > 0 || (a.nature === 0 && !mal)) talents.push({ title: def.good[0], body: def.good[1], src, w: tight, glyphs: [a.a.glyph, a.b.glyph], asp: a.id });
    else if (a.nature < 0) cautions.push({ title: def.hard[0], body: def.hard[1], src, w: tight, glyphs: [a.a.glyph, a.b.glyph], asp: a.id });
    else { talents.push({ title: def.good[0], body: def.good[1], src, w: tight * 0.8, glyphs: [a.a.glyph, a.b.glyph], asp: a.id }); cautions.push({ title: def.hard[0], body: def.hard[1], src, w: tight * 0.6, glyphs: [a.a.glyph, a.b.glyph], asp: a.id }); }
  }
  // Talents from placement
  const neptune = ch.planets.find((p) => p.id === 'neptune');
  if (ch.timeKnown && [8, 12].includes(neptune.house) || el[3] >= 6) talents.push({ title: 'มีเซนส์', body: el[3] >= 6 ? 'ธาตุน้ำในดวงสูง รับรู้บรรยากาศและความรู้สึกได้ไว' : `ดาวเนปจูนในภพ ${neptune.house} ทำให้สัมผัสพิเศษไว`, src: el[3] >= 6 ? 'ธาตุน้ำเด่น' : `เนปจูนภพ ${neptune.house}`, w: 0.5, glyphs: ['♆'] });
  if (el[1] >= 6) talents.push({ title: 'ขยัน ทำจริง', body: 'ธาตุดินในดวงสูง ทำงานต่อเนื่องจนเห็นผล', src: 'ธาตุดินเด่น', w: 0.45, glyphs: ['⊕'] });
  if (el[2] >= 6) talents.push({ title: 'เข้าสังคมเก่ง', body: 'ธาตุลมในดวงสูง คุยกับคนได้ทุกแบบ', src: 'ธาตุลมเด่น', w: 0.45, glyphs: ['≋'] });
  if (el[0] >= 6) talents.push({ title: 'มีภาวะผู้นำ', body: 'ธาตุไฟในดวงสูง กล้าเริ่มและนำคนอื่น', src: 'ธาตุไฟเด่น', w: 0.45, glyphs: ['△'] });
  // dedupe by title, strongest first
  const uniq = (arr) => { const seen = new Set(); return arr.sort((a, b) => b.w - a.w).filter((x) => !seen.has(x.title) && seen.add(x.title)); };

  // Cautions from placement
  const low = elOrder[3];
  if (el[low] <= 1) cautions.push({ title: `ขาดธาตุ${ELEMENT_TEXT[low].th}`, body: ELEMENT_TEXT[low].lack, src: `ธาตุ${ELEMENT_TEXT[low].th} ${el[low]} จุด`, w: 0.5, glyphs: [] });
  if (ch.timeKnown) cautions.push({ title: `บทเรียนเรื่อง${HOUSES[saturn.house - 1].split(' ')[0]}`, body: `ดาวเสาร์ในภพ ${saturn.house} บอกว่าเรื่อง${HOUSES[saturn.house - 1]}จะมาช้าและต้องใช้ความอดทน แต่เมื่อสำเร็จจะมั่นคงมาก`, src: `เสาร์ภพ ${saturn.house}`, w: 0.35, glyphs: ['♄'] });

  // Luck and health
  const luck = ch.timeKnown ? `ดาวพฤหัสในภพ ${jupiter.house} โชคและผู้อุปถัมภ์มักมาทางเรื่อง${HOUSES[jupiter.house - 1]}` : `ดาวพฤหัสในราศี${SIGNS[jupiter.sign].th} โชคมาเมื่อ${SIGNS[jupiter.sign].trait.split(' ')[0]}`;
  const health = [ascSign != null ? `ลัคนาราศี${SIGNS[ascSign].th}: ${SIGN_BODY[ascSign]}` : null, ch.timeKnown ? `ภพ 6 ราศี${SIGNS[(ascSign + 5) % 12].th}: ${SIGN_BODY[(ascSign + 5) % 12]}` : `ดวงอาทิตย์ราศี${SIGNS[sun.sign].th}: ${SIGN_BODY[sun.sign]}`].filter(Boolean);

  return { symbols, highlights, personality, career, talents: uniq(talents).slice(0, 6), cautions: uniq(cautions).slice(0, 5), luck, health, ruler, elements: el };
}

// ---------- sixth sense: intuition, spirit sensitivity, premonition, reading people, astrologer talent ----------
// Signatures collected from common Western psychic-astrology practice (Neptune, Moon, Pluto, Uranus,
// the 8th and 12th houses, water emphasis) plus the south node (เกตุ, Ketu), which Thai and Indian
// astrology treat as the planet of ญาณ and the unseen.
const SENSES = [
  { id: 'intuition', th: 'สัญชาตญาณ เซนส์แรง', icon: '\u263D', desc: 'รู้สึกได้ก่อนคนอื่นว่าอะไรจะเกิด อ่านบรรยากาศเก่ง' },
  { id: 'spirit', th: 'สัมผัสสิ่งลึกลับ โลกวิญญาณ', icon: '\u2646', desc: 'ไวต่อพลังงานที่มองไม่เห็น รับรู้สิ่งเร้นลับ บางคนเห็นหรือรู้สึกถึงวิญญาณ' },
  { id: 'dream', th: 'ฝันเป็นลาง', icon: '\u2727', desc: 'ความฝันมักมีความหมาย ฝันแล้วเป็นจริง' },
  { id: 'flash', th: 'ลางสังหรณ์ฉับพลัน', icon: '\u2645', desc: 'ได้ยินเสียงในใจหรือไอเดียผุดขึ้นมาแบบไม่รู้ที่มา' },
  { id: 'people', th: 'หยั่งรู้ใจคน', icon: '\u2647', desc: 'มองทะลุเจตนาและความลับของคนได้ลึก' },
  { id: 'seer', th: 'พรสวรรค์ด้านการดูดวง', icon: '\u263F', desc: 'มีแววเป็นหมอดู โหร หรือผู้ให้คำปรึกษาด้านจิตวิญญาณ' }
];
const LEVEL = (s) => s >= 70 ? 'เด่นมาก' : s >= 45 ? 'เด่น' : s >= 22 ? 'มีบ้าง' : 'น้อย';

export function sixthSense(ch) {
  const P = Object.fromEntries(ch.planets.map((p) => [p.id, p]));
  const known = ch.timeKnown;
  const asp = (a, b) => ch.aspects.find((x) => (x.a.id === a && x.b.id === b) || (x.a.id === b && x.b.id === a));
  const ketuLon = rev360(meanNode(ch.utc) + 180), ketuSign = signOf(ketuLon), ketuHouse = ch.houseOf(ketuLon);
  const near = (lon, id, orb = 8) => angDist(lon, P[id].lon) <= orb;
  const water = ch.planets.filter((p) => [3, 7, 11].includes(p.sign)).length + (known && [3, 7, 11].includes(signOf(ch.asc)) ? 2 : 0);
  const inHouse = (h) => known ? ch.planets.filter((p) => p.house === h) : [];
  const res = Object.fromEntries(SENSES.map((x) => [x.id, { ...x, score: 0, why: [] }]));
  const add = (id, pts, why) => { res[id].score += pts; res[id].why.push(why); };
  const aspW = (a) => Math.max(0.35, 1 - a.off / 8);
  const aspTxt = (a) => `${pnm(a.a)}${a.th}${pnm(a.b)} (${a.off.toFixed(1)}°)`;

  // Moon–Neptune: the classic medium/empath signature.
  const mn = asp('moon', 'neptune');
  if (mn) { const w = aspW(mn); add('intuition', 30 * w, aspTxt(mn)); add('spirit', 34 * w, aspTxt(mn)); add('dream', 30 * w, aspTxt(mn)); }
  const sn = asp('sun', 'neptune'); if (sn) { const w = aspW(sn); add('spirit', 16 * w, aspTxt(sn)); add('dream', 14 * w, aspTxt(sn)); }
  const men = asp('mercury', 'neptune'); if (men) { const w = aspW(men); add('spirit', 14 * w, aspTxt(men)); add('seer', 16 * w, aspTxt(men)); add('intuition', 10 * w, aspTxt(men)); }
  const mm = asp('moon', 'mercury'); if (mm && mm.id === 'conj') add('intuition', 10, `ดวงจันทร์ร่วมดาวพุธ ความคิดกับความรู้สึกเชื่อมกัน`);
  // Uranus with Moon or Mercury: sudden knowing, clairaudience; Mercury–Uranus is the astrologer's mind.
  const mu = asp('moon', 'uranus'); if (mu) { const w = aspW(mu); add('flash', 30 * w, aspTxt(mu)); add('intuition', 8 * w, aspTxt(mu)); }
  const meu = asp('mercury', 'uranus'); if (meu) { const w = aspW(meu); add('flash', 26 * w, aspTxt(meu)); add('seer', 26 * w, aspTxt(meu)); }
  // Pluto with personal planets: x-ray insight into people and hidden matters.
  for (const id of ['moon', 'sun', 'mercury', 'venus', 'mars']) {
    const a = asp(id, 'pluto'); if (!a) continue;
    const w = aspW(a);
    add('people', (id === 'moon' || id === 'mercury' ? 26 : 16) * w, aspTxt(a));
    if (id === 'moon') add('spirit', 10 * w, aspTxt(a));
    if (id === 'mercury') add('seer', 12 * w, aspTxt(a));
  }
  const jn = asp('jupiter', 'neptune'); if (jn) add('seer', 8 * aspW(jn), `${aspTxt(jn)} ความศรัทธาและความสนใจด้านจิตวิญญาณ`);
  const mj = asp('mercury', 'jupiter'); if (mj && mj.nature >= 0) add('seer', 8 * aspW(mj), `${aspTxt(mj)} อธิบายและแนะนำคนเก่ง`);

  // Houses (need birth time).
  if (known) {
    const h12 = inHouse(12), h8 = inHouse(8), h9 = inHouse(9);
    if (P.moon.house === 12) { add('intuition', 18, 'ดวงจันทร์ในภพ 12 (ภพแห่งจิตใต้สำนึก)'); add('dream', 26, 'ดวงจันทร์ในภพ 12'); add('spirit', 14, 'ดวงจันทร์ในภพ 12'); }
    if (P.moon.house === 8) { add('spirit', 18, 'ดวงจันทร์ในภพ 8 (ภพแห่งความลึกลับ)'); add('people', 14, 'ดวงจันทร์ในภพ 8'); add('intuition', 10, 'ดวงจันทร์ในภพ 8'); }
    if (P.neptune.house === 12) { add('spirit', 24, 'ดาวเนปจูนในภพ 12'); add('dream', 18, 'ดาวเนปจูนในภพ 12'); }
    if (P.neptune.house === 8) { add('spirit', 22, 'ดาวเนปจูนในภพ 8'); add('intuition', 8, 'ดาวเนปจูนในภพ 8'); }
    if (P.neptune.house === 1 || angDist(P.neptune.lon, ch.asc) <= 8) add('spirit', 18, 'ดาวเนปจูนอยู่ใกล้ลัคนา ร่างกายเป็นเหมือนเสาอากาศรับพลัง');
    if (P.pluto.house === 8) add('people', 16, 'ดาวพลูโตในภพ 8');
    if (P.pluto.house === 1) add('people', 12, 'ดาวพลูโตในภพ 1');
    if (P.uranus.house === 12 || P.uranus.house === 8) add('flash', 14, `ดาวมฤตยูในภพ ${P.uranus.house}`);
    if ([8, 9, 12].includes(P.mercury.house)) add('seer', 16, `ดาวพุธในภพ ${P.mercury.house} ความคิดสนใจเรื่องลึกลับและปรัชญา`);
    if (P.uranus.house === 1 || P.uranus.house === 10 || P.uranus.house === 9) add('seer', 14, `ดาวมฤตยู (ดาวแห่งโหราศาสตร์) เด่นในภพ ${P.uranus.house}`);
    if (h12.length >= 3) { add('spirit', 14, `ดาว ${h12.length} ดวงในภพ 12`); add('dream', 12, `ดาว ${h12.length} ดวงในภพ 12`); }
    if (h8.length >= 3) { add('spirit', 10, `ดาว ${h8.length} ดวงในภพ 8`); add('seer', 10, `ดาว ${h8.length} ดวงในภพ 8`); }
    if (h9.length >= 2) add('seer', 8, `ดาว ${h9.length} ดวงในภพ 9 (ภพแห่งปรัชญาและศาสตร์ชั้นสูง)`);
    // Ketu (เกตุ)
    if (ketuHouse === 12) { add('spirit', 18, 'ดาวเกตุในภพ 12 ญาณและบุญเก่าด้านจิตวิญญาณ'); add('seer', 10, 'ดาวเกตุในภพ 12'); }
    if (ketuHouse === 8) { add('spirit', 14, 'ดาวเกตุในภพ 8 รับรู้เรื่องลี้ลับ'); add('seer', 8, 'ดาวเกตุในภพ 8'); }
    if (P.saturn.house === 12 || P.saturn.house === 8) add('spirit', 6, `ดาวเสาร์ในภพ ${P.saturn.house} สนใจเรื่องชีวิตหลังความตาย`);
  }
  if (near(ketuLon, 'moon')) { add('intuition', 16, 'ดาวเกตุกุมดวงจันทร์ ญาณหยั่งรู้แรง'); add('spirit', 12, 'ดาวเกตุกุมดวงจันทร์'); }
  if (near(ketuLon, 'mercury')) add('seer', 12, 'ดาวเกตุกุมดาวพุธ ความคิดเชื่อมกับญาณ');
  if (near(ketuLon, 'neptune')) add('spirit', 12, 'ดาวเกตุกุมดาวเนปจูน');

  // Signs.
  if ([3, 7, 11].includes(P.moon.sign)) { add('intuition', 14, `ดวงจันทร์ราศี${SIGNS[P.moon.sign].th} (ธาตุน้ำ)`); if (P.moon.sign === 11) add('dream', 14, 'ดวงจันทร์ราศีมีน'); if (P.moon.sign === 7) add('people', 12, 'ดวงจันทร์ราศีพิจิก'); }
  if (P.sun.sign === 11) { add('intuition', 8, 'ดวงอาทิตย์ราศีมีน'); add('dream', 8, 'ดวงอาทิตย์ราศีมีน'); }
  if (P.sun.sign === 7 || P.mercury.sign === 7) add('people', 8, `${P.sun.sign === 7 ? 'ดวงอาทิตย์' : 'ดาวพุธ'}ราศีพิจิก`);
  if (P.mercury.sign === 11) add('spirit', 6, 'ดาวพุธราศีมีน รับข้อมูลจากความรู้สึก');
  if (P.sun.sign === 10 || P.mercury.sign === 10 || (known && signOf(ch.asc) === 10)) add('seer', 8, 'ราศีกุมภ์เด่น (ราศีของโหราศาสตร์)');
  if (known && signOf(ch.asc) === 11) { add('spirit', 10, 'ลัคนาราศีมีน'); add('intuition', 8, 'ลัคนาราศีมีน'); }
  if (known && signOf(ch.asc) === 7) add('people', 10, 'ลัคนาราศีพิจิก');
  if (water >= 5) add('intuition', 14, `ธาตุน้ำในดวงสูง (${water} จุด)`);

  // Astrologer talent also grows with overall sensitivity.
  const base = (res.intuition.score + res.spirit.score + res.people.score) / 3;
  if (base > 25) add('seer', Math.min(16, base * 0.3), 'เซนส์โดยรวมดี ช่วยให้อ่านดวงได้ลึกกว่าตำรา');

  const list = SENSES.map((x) => {
    const r = res[x.id];
    const score = Math.round(Math.min(100, r.score));
    return { ...r, score, level: LEVEL(score), why: [...new Set(r.why)].slice(0, 4) };
  });
  const overall = Math.round(list.reduce((a, x) => a + x.score, 0) / list.length * 1.25);
  const top = [...list].sort((a, b) => b.score - a.score)[0];
  return { list, overall: Math.min(100, overall), top, ketu: { lon: ketuLon, sign: ketuSign, house: known ? ketuHouse : null } };
}
const rev360 = (x) => ((x % 360) + 360) % 360;
