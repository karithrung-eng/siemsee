// กติกาที่นั่ง: เลขเรียงตามเข็มนาฬิกา (มองจากด้านบน) ทุกคนหันหน้าเข้ากลางวง
// เมื่อหันหน้าเข้ากลางวง มือซ้ายจะชี้ไปทางเลขถัดไป (+1) มือขวาชี้ไปทางเลขก่อนหน้า (−1)
// ใช้กติกานี้ที่เดียว ทุกหน้าเรียกจากไฟล์นี้

export type Rng = () => number;

const wrap = (seat: number, n: number) => ((((seat - 1) % n) + n) % n) + 1;

export function leftOf(seat: number, n: number): number {
  return wrap(seat + 1, n);
}

export function rightOf(seat: number, n: number): number {
  return wrap(seat - 1, n);
}

/** ตำแหน่งตรงข้ามที่เป็นไปได้ (เลขคู่ = 1 ตำแหน่ง, เลขคี่ = 2 ตำแหน่งที่ไกลที่สุด) */
export function oppositeCandidates(seat: number, n: number): number[] {
  if (n < 2) return [seat];
  if (n % 2 === 0) return [wrap(seat + n / 2, n)];
  const a = wrap(seat + Math.floor(n / 2), n);
  const b = wrap(seat + Math.ceil(n / 2), n);
  return a === b ? [a] : [a, b];
}

export function oppositeOf(seat: number, n: number, rng: Rng = Math.random): number {
  const c = oppositeCandidates(seat, n);
  return c[Math.floor(rng() * c.length) % c.length];
}

/** คู่สุ่ม — ไม่ใช่คนเดียวกับ seat */
export function randomOther(seat: number, n: number, rng: Rng = Math.random): number {
  if (n < 2) return seat;
  const k = Math.floor(rng() * (n - 1)) % (n - 1); // 0..n-2
  const other = k + 1 >= seat ? k + 2 : k + 1;
  return other;
}

export const isEven = (seat: number) => seat % 2 === 0;

export function seatsWhere(n: number, pred: (s: number) => boolean): number[] {
  const out: number[] = [];
  for (let s = 1; s <= n; s++) if (pred(s)) out.push(s);
  return out;
}

/** มุมของที่นั่งบนผังวง (องศา, 0 = ด้านบน, เพิ่มตามเข็มนาฬิกา) */
export function seatAngle(seat: number, n: number): number {
  return ((seat - 1) * 360) / n;
}
