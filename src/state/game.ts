import { Deck } from '../logic/deck';
import { chooseRecipient, resolveRound } from '../logic/resolve';
import type { Card, RoundResult } from '../logic/types';
import type { Rng } from '../logic/seats';

export type Phase = 'idle' | 'shaking' | 'stick' | 'number' | 'result';

export interface Timing {
  shake: number;
  stick: number;
  number: number;
}

export const TIMING: Record<'full' | 'quick' | 'reduced', Timing> = {
  full: { shake: 1400, stick: 900, number: 1200 },
  quick: { shake: 450, stick: 350, number: 650 },
  reduced: { shake: 200, stick: 250, number: 900 },
};

/**
 * ตัวควบคุมรอบเล่น — ล็อกไม่ให้สุ่มซ้อน และยกเลิกงานเก่าได้ทันที
 * ทุกตัวจับเวลาผูกกับ "รุ่น" (gen) เมื่อเริ่มวงใหม่ รุ่นเก่าจะถูกทิ้งทั้งหมด
 */
export class Game {
  n = 6;
  round = 0;
  history: { result: RoundResult; skipped: boolean }[] = [];
  current?: RoundResult;
  phase: Phase = 'idle';
  private deck: Deck;
  private gen = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  onPhase: (phase: Phase, r?: RoundResult) => void = () => {};

  constructor(private rng: Rng = Math.random) {
    this.deck = new Deck([], rng);
  }

  start(n: number, cards: Card[]) {
    this.cancel();
    this.n = n;
    this.round = 0;
    this.history = [];
    this.current = undefined;
    this.deck = new Deck(cards, this.rng);
  }

  /** ยกเลิกงานสุ่ม / แอนิเมชันที่ค้างอยู่ทั้งหมด */
  cancel() {
    this.gen++;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.phase = 'idle';
  }

  get busy() {
    return this.phase === 'shaking' || this.phase === 'stick' || this.phase === 'number';
  }

  private after(ms: number, gen: number, fn: () => void) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (gen === this.gen) fn();
    }, ms);
    this.timers.add(t);
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.onPhase(p, this.current);
  }

  /** เขย่า → ไม้โผล่ → เปิดเลข → เปิดคำสั่ง  คืน false ถ้ากำลังสุ่มอยู่ */
  roll(timing: Timing): boolean {
    if (this.phase !== 'idle') return false;
    const card = this.deck.drawCard();
    if (!card) return false;
    const drawn = this.deck.drawSeat(this.n);
    this.round += 1;
    this.current = resolveRound(card, this.n, drawn, this.round, this.rng);
    const gen = this.gen;
    this.setPhase('shaking');
    this.after(timing.shake, gen, () => {
      this.setPhase('stick');
      this.after(timing.stick, gen, () => {
        this.setPhase('number');
        this.after(timing.number, gen, () => this.setPhase('result'));
      });
    });
    return true;
  }

  /** ปิดผลลัพธ์แล้วพร้อมรอบใหม่ (ข้ามหรือทำเสร็จ) */
  next(skipped: boolean) {
    if (this.phase !== 'result' || !this.current) return;
    this.history.push({ result: this.current, skipped });
    this.current = undefined;
    this.setPhase('idle');
  }

  choose(seat: number | undefined) {
    if (!this.current || this.current.card.target !== 'choose') return;
    this.current = chooseRecipient(this.current, seat, this.n);
  }
}
