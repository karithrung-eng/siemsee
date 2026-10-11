// โครงสร้างข้อมูลหลักของเกม — แยกคำสั่ง / จำนวน / เป้าหมาย ออกจากกันชัดเจน

export type CategoryId = 'drink' | 'water' | 'close';

export const CATEGORIES: { id: CategoryId; label: string; short: string; emoji: string }[] = [
  { id: 'drink', label: 'ชนแก้ว / ช็อต', short: 'ช็อต', emoji: '🥃' },
  { id: 'water', label: 'พักน้ำ', short: 'พักน้ำ', emoji: '💧' },
  { id: 'close', label: 'ใกล้ชิด', short: 'ใกล้ชิด', emoji: '💗' },
];

/** ใครเกี่ยวข้องกับคำสั่ง (นอกเหนือจากตัวแทนในข้อความ) */
export type TargetType =
  | 'player' // คนที่สุ่มได้
  | 'left' // คนที่สุ่มได้ + คนข้างซ้าย
  | 'right' // คนที่สุ่มได้ + คนข้างขวา
  | 'opposite' // คนที่สุ่มได้ + คนตรงข้าม
  | 'random' // คนที่สุ่มได้ + คู่สุ่ม (ไม่ซ้ำตัวเอง)
  | 'even' // ผู้เล่นเลขคู่ทั้งหมด
  | 'odd' // ผู้เล่นเลขคี่ทั้งหมด
  | 'sameParity' // ผู้เล่นที่คู่/คี่เหมือนคนที่สุ่มได้
  | 'all' // ทุกคนในวง
  | 'choose'; // คนที่สุ่มได้เลือกผู้รับเอง (เลือกตัวเองได้)

export const TARGETS: { id: TargetType; label: string }[] = [
  { id: 'player', label: 'คนที่สุ่มได้' },
  { id: 'left', label: 'คนที่สุ่มได้ + คนข้างซ้าย' },
  { id: 'right', label: 'คนที่สุ่มได้ + คนข้างขวา' },
  { id: 'opposite', label: 'คนที่สุ่มได้ + คนตรงข้าม' },
  { id: 'random', label: 'คนที่สุ่มได้ + คู่แบบสุ่ม' },
  { id: 'even', label: 'ผู้เล่นเลขคู่ทั้งหมด' },
  { id: 'odd', label: 'ผู้เล่นเลขคี่ทั้งหมด' },
  { id: 'sameParity', label: 'เลขคู่/คี่เหมือนคนที่สุ่มได้' },
  { id: 'all', label: 'ทุกคนในวง' },
  { id: 'choose', label: 'คนที่สุ่มได้เลือกผู้รับเอง' },
];

export interface Amount {
  value: number;
  unit: string; // ช็อต, จิบ, แก้ว, คำ ...
  each: boolean; // true = "คนละ"
}

export interface Card {
  id: string;
  title: string; // ชื่อคำสั่ง (ใช้ในคลัง)
  category: CategoryId;
  target: TargetType;
  /** ข้อความคำสั่ง รองรับ {player} {left} {right} {opposite} {random} {parity} */
  text: string;
  amount?: Amount;
  note?: string;
  /** ลักษณะกิจกรรม ใช้กันไม่ให้ออกแบบเดียวกันติดกัน */
  kind: string;
  /** ป้ายบทบาท [คนหลัก, คู่] เช่น ['ป้อน', 'รับ'] */
  roles?: [string, string];
  custom?: boolean;
}

export type Role = 'main' | 'partner' | 'group';

export interface Participant {
  seat: number; // 1..n
  role: Role;
}

/** ผลของหนึ่งรอบ — เลขที่สุ่มได้ กับ คนที่ต้องทำ เป็นข้อมูลคนละส่วน */
export interface RoundResult {
  round: number;
  drawn: number; // เลขที่สุ่มได้
  card: Card;
  seats: Partial<Record<'player' | 'left' | 'right' | 'opposite' | 'random', number>>;
  participants: Participant[];
  /** สำหรับคำสั่ง 'choose' — ผู้รับที่เลือก (แทนที่ ไม่สะสม) */
  chosen?: number;
}
