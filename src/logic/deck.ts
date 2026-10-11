import type { Card } from './types';
import type { Rng } from './seats';

const pick = <T>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length) % arr.length];

/**
 * สำรับแบบไม่คืนใบ: ไม่ออกใบเดิมซ้ำจนกว่าจะครบสำรับที่เปิดใช้
 * และพยายามไม่ให้ออก "ลักษณะเดียวกัน" หรือ "คนหลักเดิม" ติดกัน
 * เมื่อตัวเลือกเหลือน้อย จะผ่อนเงื่อนไขเอง ไม่ค้าง
 */
export class Deck {
  private cards: Card[] = [];
  private remaining: Card[] = [];
  private seatBag: number[] = [];
  private bagSize = 0;
  lastCard?: Card;
  lastSeat?: number;

  constructor(cards: Card[], private rng: Rng = Math.random) {
    this.setCards(cards);
  }

  setCards(cards: Card[]) {
    this.cards = [...cards];
    this.remaining = [];
  }

  get size() {
    return this.cards.length;
  }

  get remainingCount() {
    return this.remaining.length;
  }

  reset() {
    this.remaining = [];
    this.seatBag = [];
    this.lastCard = undefined;
    this.lastSeat = undefined;
  }

  drawCard(): Card | null {
    if (this.cards.length === 0) return null;
    if (this.remaining.length === 0) {
      this.remaining = [...this.cards];
      // สำรับใหม่: เลี่ยงใบล่าสุดเป็นใบแรก ถ้ามีใบอื่น
    }
    let pool = this.remaining;
    if (this.lastCard && pool.length > 1) {
      const notSame = pool.filter((c) => c.id !== this.lastCard!.id);
      if (notSame.length) pool = notSame;
      const otherKind = pool.filter((c) => c.kind !== this.lastCard!.kind);
      if (otherKind.length) pool = otherKind;
    }
    const card = pick(pool, this.rng);
    this.remaining = this.remaining.filter((c) => c !== card);
    this.lastCard = card;
    return card;
  }

  /** สุ่มเลขแบบถุง: ทุกคนได้ก่อนวนรอบใหม่ และไม่ออกคนเดิมติดกัน */
  drawSeat(n: number): number {
    if (n <= 1) return 1;
    if (this.bagSize !== n) {
      this.seatBag = [];
      this.bagSize = n;
    }
    if (this.seatBag.length === 0) this.seatBag = Array.from({ length: n }, (_, i) => i + 1);
    let pool = this.seatBag;
    if (this.lastSeat !== undefined && pool.length > 1) {
      const notLast = pool.filter((s) => s !== this.lastSeat);
      if (notLast.length) pool = notLast;
    } else if (this.lastSeat !== undefined && pool.length === 1 && pool[0] === this.lastSeat) {
      // เหลือคนเดียวและเป็นคนเดิม — เติมถุงใหม่แล้วเลือกคนอื่น
      this.seatBag = Array.from({ length: n }, (_, i) => i + 1);
      pool = this.seatBag.filter((s) => s !== this.lastSeat);
    }
    const seat = pick(pool, this.rng);
    this.seatBag = this.seatBag.filter((s) => s !== seat);
    this.lastSeat = seat;
    return seat;
  }
}
