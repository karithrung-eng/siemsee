import type { Amount, Card, CategoryId, TargetType } from '../logic/types';

// คลังคำสั่งเริ่มต้น — ทุกใบข้ามได้โดยไม่มีบทลงโทษ และเลือกน้ำเปล่าแทนได้เสมอ

const shot = (value = 1, each = false): Amount => ({ value, unit: 'ช็อต', each });
const sip = (value = 1, each = false): Amount => ({ value, unit: 'จิบ', each });

const FEED = 'ใช้แก้วของคนดื่ม ให้คนดื่มคุมจังหวะ';
const TOUCH = 'ทั้งคู่ต้องตกลงในรอบนี้ ไม่ตกลงก็ข้ามได้';
const WATER_OK = 'ไม่ไหวเปลี่ยนเป็นน้ำเปล่าได้';

type Def = [
  id: string,
  title: string,
  target: TargetType,
  text: string,
  kind: string,
  amount?: Amount,
  note?: string,
  roles?: [string, string],
];

const make = (category: CategoryId, defs: Def[]): Card[] =>
  defs.map(([id, title, target, text, kind, amount, note, roles]) => ({
    id,
    title,
    category,
    target,
    text,
    kind,
    ...(amount ? { amount } : {}),
    ...(note ? { note } : {}),
    ...(roles ? { roles } : {}),
  }));

const DRINK: Def[] = [
  ['d01', 'ดื่มเดี่ยว', 'player', '{player} ดื่ม', 'solo', shot(1), WATER_OK],
  ['d02', 'ดื่มเดี่ยว 2 ช็อต', 'player', '{player} ดื่ม', 'solo2', shot(2), WATER_OK],
  ['d03', 'จิบเบา ๆ', 'player', '{player} จิบ', 'sip', sip(1)],
  ['d04', 'ชนแก้วคนซ้าย', 'left', '{player} ชนแก้วกับ {left}', 'cheers', shot(1, true)],
  ['d05', 'ชนแก้วคนขวา', 'right', '{player} ชนแก้วกับ {right}', 'cheers', shot(1, true)],
  ['d06', 'ชนแก้วคนตรงข้าม', 'opposite', '{player} ชนแก้วกับ {opposite}', 'cheers', shot(1, true)],
  ['d07', 'ชนแก้วคู่สุ่ม', 'random', '{player} ชนแก้วกับ {random}', 'cheers', shot(1, true)],
  ['d08', 'ชนแก้ว 2 ช็อต', 'random', '{player} และ {random} ชนแก้ว 2 รอบ', 'cheers2', shot(2, true), WATER_OK],
  ['d09', 'ป้อนคนซ้าย', 'left', '{player} ป้อน {left}', 'feed', shot(1), FEED, ['ป้อน', 'รับ']],
  ['d10', 'ป้อนคนขวา', 'right', '{player} ป้อน {right}', 'feed', shot(1), FEED, ['ป้อน', 'รับ']],
  ['d11', 'ป้อนคนตรงข้าม', 'opposite', '{player} ป้อน {opposite}', 'feed', shot(1), FEED, ['ป้อน', 'รับ']],
  ['d12', 'ป้อนคู่สุ่ม', 'random', '{player} ป้อน {random}', 'feed', shot(1), FEED, ['ป้อน', 'รับ']],
  ['d13', 'โดนคนซ้ายป้อน', 'left', '{left} ป้อน {player}', 'fed', shot(1), FEED, ['รับ', 'ป้อน']],
  ['d14', 'โดนคนตรงข้ามป้อน', 'opposite', '{opposite} ป้อน {player}', 'fed', shot(1), FEED, ['รับ', 'ป้อน']],
  ['d15', 'โดนคนขวาป้อน', 'right', '{right} ป้อน {player}', 'fed', shot(1), FEED, ['รับ', 'ป้อน']],
  ['d16', 'เลือกคนรับ', 'choose', '{player} เลือกคนรับ', 'choose', shot(1), 'แตะเลขในผังวงเพื่อเลือก เลือกตัวเองก็ได้'],
  ['d17', 'เลือกคนรับ 2 ช็อต', 'choose', '{player} เลือกคนรับ', 'choose2', shot(2), 'แตะเลขในผังวงเพื่อเลือก เลือกตัวเองก็ได้'],
  ['d18', 'เลือกคู่ชนแก้ว', 'choose', '{player} เลือกคนมาชนแก้ว', 'chooseCheers', shot(1, true), 'แตะเลขในผังวงเพื่อเลือก'],
  ['d19', 'ป้อนคนที่เลือก', 'choose', '{player} เลือกคนแล้วป้อน', 'chooseFeed', shot(1), FEED, ['ป้อน', 'รับ']],
  ['d20', 'รินให้คนตรงข้าม', 'opposite', '{player} รินให้ {opposite}', 'pour', shot(1), 'คนรับดื่มเองตามจังหวะตัวเอง', ['ริน', 'ดื่ม']],
  ['d21', 'รินให้คนซ้าย', 'left', '{player} รินให้ {left}', 'pour', shot(1), 'คนรับดื่มเองตามจังหวะตัวเอง', ['ริน', 'ดื่ม']],
  ['d22', 'ชนแก้วสองข้าง', 'player', '{player} ชนแก้วกับ {left} และ {right}', 'cheers3', shot(1, true)],
  ['d23', 'เลขคู่ดื่ม', 'even', 'ผู้เล่นเลขคู่ดื่ม', 'groupDrink', shot(1, true)],
  ['d24', 'เลขคี่ดื่ม', 'odd', 'ผู้เล่นเลขคี่ดื่ม', 'groupDrink', shot(1, true)],
  ['d25', 'เลขคู่ชนแก้วกัน', 'even', 'เลขคู่ชนแก้วกันกลางวง', 'groupCheers', shot(1, true)],
  ['d26', 'เลขคี่ชนแก้วกัน', 'odd', 'เลขคี่ชนแก้วกันกลางวง', 'groupCheers', shot(1, true)],
  ['d27', 'พวกเดียวกัน', 'sameParity', 'เลข{parity}ทั้งหมดดื่ม', 'parity', shot(1, true)],
  ['d28', 'พวกเดียวกันชนแก้ว', 'sameParity', 'เลข{parity}ยกแก้วชนกัน', 'parityCheers', sip(1, true)],
  ['d29', 'หมดวง', 'all', 'ทุกคนชนแก้ว', 'allCheers', shot(1, true)],
  ['d30', 'คนนำชน', 'all', '{player} นับ 1-2-3 แล้วทุกคนชนแก้ว', 'allCount', sip(1, true)],
  ['d31', 'ดื่มแล้วชวน', 'choose', '{player} ดื่ม แล้วเลือกคนดื่มตาม', 'drinkInvite', shot(1, true), 'แตะเลขในผังวงเพื่อเลือก'],
  ['d32', 'ป้อนกันไปกลับ', 'left', '{player} กับ {left} ป้อนกันคนละที', 'feedSwap', shot(1, true), FEED],
  ['d33', 'จิบพร้อมกัน', 'opposite', '{player} และ {opposite} จิบพร้อมกัน', 'sipPair', sip(1, true)],
  ['d34', 'ป้อนสองข้าง', 'player', '{player} ป้อน {left} แล้วป้อน {right}', 'feedBoth', shot(1, true), FEED, ['ป้อน', 'รับ']],
];

const WATER: Def[] = [
  ['w01', 'เลขคู่พักน้ำ', 'even', 'ผู้เล่นเลขคู่ดื่มน้ำเปล่า', 'groupWater', sip(1, true)],
  ['w02', 'เลขคี่พักน้ำ', 'odd', 'ผู้เล่นเลขคี่ดื่มน้ำเปล่า', 'groupWater', sip(1, true)],
  ['w03', 'ทั้งวงพักน้ำ', 'all', 'ทุกคนดื่มน้ำเปล่า', 'allWater', sip(2, true)],
  ['w04', 'ป้อนน้ำคนซ้าย', 'left', '{player} ป้อนน้ำเปล่าให้ {left}', 'feedWater', sip(1), FEED, ['ป้อน', 'รับ']],
  ['w05', 'ป้อนน้ำคนขวา', 'right', '{player} ป้อนน้ำเปล่าให้ {right}', 'feedWater', sip(1), FEED, ['ป้อน', 'รับ']],
  ['w06', 'ป้อนน้ำคนตรงข้าม', 'opposite', '{player} ป้อนน้ำเปล่าให้ {opposite}', 'feedWater', sip(1), FEED, ['ป้อน', 'รับ']],
  ['w07', 'รินน้ำให้ทั้งวง', 'all', '{player} รินน้ำเปล่าให้ทุกคน', 'pourWater', sip(1, true), undefined, ['ริน', 'ดื่ม']],
  ['w08', 'ครึ่งแก้ว', 'player', '{player} ดื่มน้ำเปล่า', 'soloWater', { value: 0.5, unit: 'แก้ว', each: false }],
  ['w09', 'เลือกคนพัก', 'choose', '{player} เลือกคนพักดื่มน้ำ', 'chooseWater', sip(2), 'แตะเลขในผังวงเพื่อเลือก เลือกตัวเองก็ได้'],
  ['w10', 'พวกเดียวกันพักน้ำ', 'sameParity', 'เลข{parity}ทั้งหมดดื่มน้ำเปล่า', 'parityWater', sip(1, true)],
  ['w11', 'ชนแก้วน้ำเปล่า', 'random', '{player} ชนแก้วน้ำเปล่ากับ {random}', 'cheersWater', sip(1, true)],
  ['w12', 'ส่งน้ำสองข้าง', 'player', '{player} ส่งน้ำเปล่าให้ {left} และ {right}', 'passWater', sip(1, true), undefined, ['ส่ง', 'ดื่ม']],
  ['w13', 'พักกินกับแกล้ม', 'all', 'ทุกคนกินกับแกล้ม', 'snack', { value: 1, unit: 'คำ', each: true }],
  ['w14', 'โดนป้อนน้ำ', 'opposite', '{opposite} ป้อนน้ำเปล่าให้ {player}', 'fedWater', sip(1), FEED, ['รับ', 'ป้อน']],
];

const CLOSE: Def[] = [
  ['c01', 'แก้มชนแก้ม', 'left', '{player} และ {left} เอาแก้มชนกัน', 'cheek', undefined, TOUCH],
  ['c02', 'หอมแก้ม', 'right', '{player} หอมแก้ม {right}', 'kissCheek', undefined, TOUCH, ['หอม', 'รับ']],
  ['c03', 'จุ๊บ', 'random', '{player} และ {random} จุ๊บกัน', 'kiss', undefined, 'ทำเมื่อทั้งคู่ตอบตกลงเท่านั้น'],
  ['c04', 'กอด 5 วิ', 'left', '{player} กอด {left} นับ 1–5', 'hug', undefined, TOUCH],
  ['c05', 'ดื่มคล้องแขน', 'opposite', '{player} และ {opposite} ดื่มคล้องแขน', 'armLink', shot(1, true), TOUCH],
  ['c06', 'จับมือ', 'right', '{player} จับมือ {right} นับ 1–10', 'holdHands', undefined, TOUCH],
  ['c07', 'ซบไหล่', 'left', '{player} ซบไหล่ {left} นับ 1–10', 'shoulder', undefined, TOUCH, ['ซบ', 'ให้ซบ']],
  ['c08', 'เกี่ยวก้อย', 'opposite', '{player} เกี่ยวก้อยกับ {opposite}', 'pinky', undefined, TOUCH],
  ['c09', 'ป้อนกับแกล้ม', 'random', '{player} ป้อนกับแกล้มให้ {random}', 'feedSnack', { value: 1, unit: 'คำ', each: false }, TOUCH, ['ป้อน', 'รับ']],
  ['c10', 'หน้าผากชนกัน', 'right', '{player} และ {right} หน้าผากชนกัน นับ 1–5', 'forehead', undefined, TOUCH],
  ['c11', 'เลือกคนกอด', 'choose', '{player} เลือกคนกอด', 'chooseHug', undefined, 'แตะเลขในผังวงเพื่อเลือก คนถูกเลือกต้องตกลงด้วย'],
  ['c12', 'เลือกคนหอมแก้ม', 'choose', '{player} เลือกคนหอมแก้ม', 'chooseKiss', undefined, 'แตะเลขในผังวงเพื่อเลือก คนถูกเลือกต้องตกลงด้วย'],
  ['c13', 'นวดไหล่', 'left', '{player} นวดไหล่ให้ {left} นับ 1–10', 'massage', undefined, TOUCH, ['นวด', 'รับ']],
  ['c14', 'จับมือทั้งวง', 'all', 'ทุกคนจับมือกันเป็นวง นับ 1–5', 'circleHands', undefined, 'ใครไม่สะดวก ยกมือแตะไหล่แทนได้'],
  ['c15', 'กอดแล้วชน', 'right', '{player} กอด {right} แล้วชนแก้ว', 'hugCheers', shot(1, true), TOUCH],
  ['c16', 'จุ๊บหลังมือ', 'opposite', '{player} จุ๊บหลังมือ {opposite}', 'kissHand', undefined, TOUCH, ['จุ๊บ', 'ยื่นมือ']],
  ['c17', 'เซลฟี่แก้มชิด', 'random', '{player} และ {random} เซลฟี่แก้มชิดกัน', 'selfie', undefined, TOUCH],
  ['c18', 'หอมหน้าผาก', 'left', '{player} หอมหน้าผาก {left}', 'kissForehead', undefined, TOUCH, ['หอม', 'รับ']],
  ['c19', 'พิงหลัง', 'opposite', '{player} นั่งพิงหลังกับ {opposite} นับ 1–10', 'backToBack', undefined, TOUCH],
  ['c20', 'ป้อนแบบใกล้ชิด', 'random', '{player} ป้อน {random} แบบคล้องแขน', 'armFeed', shot(1), `${FEED} · ${TOUCH}`, ['ป้อน', 'รับ']],
];

export const DEFAULT_CARDS: Card[] = [...make('drink', DRINK), ...make('water', WATER), ...make('close', CLOSE)];
