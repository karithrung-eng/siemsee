import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CARDS } from '../src/data/cards';
import { Deck } from '../src/logic/deck';
import { amountLabel, doersLine as doersLineRaw, renderText as renderTextRaw } from '../src/logic/format';
import { chooseRecipient, groupSeats, resolveRound } from '../src/logic/resolve';
import { leftOf, oppositeCandidates, oppositeOf, randomOther, rightOf } from '../src/logic/seats';
import type { Card } from '../src/logic/types';
import { Game, TIMING } from '../src/state/game';

const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const sp = (x: string) => x.replace(/\u00a0/g, ' ');
const renderText = (...a: Parameters<typeof renderTextRaw>) => sp(renderTextRaw(...a));
const doersLine = (...a: Parameters<typeof doersLineRaw>) => sp(doersLineRaw(...a));
const card = (over: Partial<Card>): Card => ({ id: 'x', title: 't', category: 'drink', target: 'player', text: '{player} ดื่ม', kind: 'k', ...over });

describe('ที่นั่ง: ซ้าย ขวา ตรงข้าม (2–24 คน)', () => {
  it('ซ้าย = +1 ขวา = −1 และวนรอบ', () => {
    for (let n = 2; n <= 24; n++) {
      for (let s = 1; s <= n; s++) {
        const l = leftOf(s, n);
        const r = rightOf(s, n);
        expect(l).toBe(s === n ? 1 : s + 1);
        expect(r).toBe(s === 1 ? n : s - 1);
        expect(rightOf(l, n)).toBe(s);
        expect(leftOf(r, n)).toBe(s);
      }
    }
  });
  it('ตรงข้าม: เลขคู่ได้ตำแหน่งเดียว เลขคี่เลือกจาก 2 ตำแหน่งไกลสุด', () => {
    for (let n = 2; n <= 24; n++) {
      for (let s = 1; s <= n; s++) {
        const c = oppositeCandidates(s, n);
        const dist = (a: number) => Math.min(Math.abs(a - s), n - Math.abs(a - s));
        if (n % 2 === 0) {
          expect(c).toHaveLength(1);
          expect(dist(c[0])).toBe(n / 2);
        } else {
          expect(c).toHaveLength(n === 3 ? 2 : 2);
          c.forEach((x) => expect(dist(x)).toBe(Math.floor(n / 2)));
        }
        for (let i = 0; i < 20; i++) expect(c).toContain(oppositeOf(s, n, Math.random));
      }
    }
  });
  it('คู่สุ่มไม่ใช่คนเดียวกัน และสุ่มได้ทุกคนที่เหลือ', () => {
    for (let n = 2; n <= 24; n++) {
      for (let s = 1; s <= n; s++) {
        const seen = new Set<number>();
        const rng = seeded(s * 31 + n);
        for (let i = 0; i < 400; i++) {
          const o = randomOther(s, n, rng);
          expect(o).not.toBe(s);
          expect(o).toBeGreaterThanOrEqual(1);
          expect(o).toBeLessThanOrEqual(n);
          seen.add(o);
        }
        expect(seen.size).toBe(n - 1);
      }
    }
  });
  it('เลขคู่ / เลขคี่ / คู่คี่เหมือนคนที่สุ่มได้', () => {
    expect(groupSeats('even', 7, 1)).toEqual([2, 4, 6]);
    expect(groupSeats('odd', 7, 1)).toEqual([1, 3, 5, 7]);
    expect(groupSeats('sameParity', 6, 3)).toEqual([1, 3, 5]);
    expect(groupSeats('sameParity', 6, 4)).toEqual([2, 4, 6]);
    expect(groupSeats('all', 3, 1)).toEqual([1, 2, 3]);
  });
});

describe('ผู้เกี่ยวข้องตรงกับคำสั่ง', () => {
  it('ทุกการ์ดเริ่มต้น × ทุกขนาดวง: ข้อความกับไฮไลต์ตรงกัน', () => {
    for (let n = 2; n <= 24; n++) {
      for (const c of DEFAULT_CARDS) {
        for (let drawn = 1; drawn <= n; drawn++) {
          const r = resolveRound(c, n, drawn, 1, seeded(drawn + n));
          const text = renderText(r);
          expect(text).not.toMatch(/[{}]/);
          const seatsInText = [...text.matchAll(/เบอร์ (\d+)/g)].map((m) => +m[1]);
          const highlighted = r.participants.map((p) => p.seat);
          for (const s of seatsInText) expect(highlighted).toContain(s);
          for (const p of r.participants) {
            expect(p.seat).toBeGreaterThanOrEqual(1);
            expect(p.seat).toBeLessThanOrEqual(n);
          }
          expect(new Set(highlighted).size).toBe(highlighted.length);
          if (c.target === 'random') expect(r.seats.random).not.toBe(drawn);
          if (c.target === 'even') expect(highlighted.every((s) => s % 2 === 0)).toBe(true);
          if (c.target === 'odd') expect(highlighted.every((s) => s % 2 === 1)).toBe(true);
          if (c.target === 'all') expect(highlighted).toHaveLength(n);
        }
      }
    }
  });
  it('ป้อน: เห็นทั้งคนป้อนและคนรับ', () => {
    const feed = DEFAULT_CARDS.find((c) => c.id === 'd09')!;
    const r = resolveRound(feed, 6, 4, 1);
    expect(renderText(r)).toBe('เบอร์ 4 ป้อน เบอร์ 5');
    expect(r.participants).toEqual([
      { seat: 4, role: 'main' },
      { seat: 5, role: 'partner' },
    ]);
  });
  it('เลขคู่ทั้งหมด: เลขที่สุ่มได้ (คี่) ไม่ถูกไฮไลต์ว่าต้องทำ', () => {
    const c = DEFAULT_CARDS.find((x) => x.id === 'd23')!;
    const r = resolveRound(c, 6, 3, 1);
    expect(r.drawn).toBe(3);
    expect(r.participants.map((p) => p.seat)).toEqual([2, 4, 6]);
    expect(doersLine(r, 6)).toBe('ผู้เล่นเลขคู่: 2, 4, 6');
  });
  it('ตรงข้ามในวงเลขคี่: แสดงเลขที่เลือกจริงในคำสั่ง', () => {
    const c = DEFAULT_CARDS.find((x) => x.id === 'd06')!;
    for (let i = 0; i < 30; i++) {
      const r = resolveRound(c, 7, 1, 1);
      expect([4, 5]).toContain(r.seats.opposite);
      expect(renderText(r)).toBe(`เบอร์ 1 ชนแก้วกับ เบอร์ ${r.seats.opposite}`);
    }
  });
  it('เลือกผู้รับเอง: เลือกตัวเองได้ เปลี่ยนแล้วแทนที่ ไม่สะสม', () => {
    const c = DEFAULT_CARDS.find((x) => x.id === 'd17')!;
    let r = resolveRound(c, 6, 2, 1);
    expect(r.participants).toEqual([{ seat: 2, role: 'main' }]);
    r = chooseRecipient(r, 5, 6);
    r = chooseRecipient(r, 3, 6);
    r = chooseRecipient(r, 6, 6);
    expect(r.participants).toEqual([
      { seat: 2, role: 'main' },
      { seat: 6, role: 'partner' },
    ]);
    expect(amountLabel(r.card.amount)).toBe('2 ช็อต');
    r = chooseRecipient(r, 2, 6);
    expect(r.participants).toEqual([{ seat: 2, role: 'main' }]);
    expect(doersLine(r, 6)).toBe('เบอร์ 2 (เลือกตัวเอง)');
    expect(amountLabel(r.card.amount)).toBe('2 ช็อต');
  });
  it('เลขผู้เล่นกับจำนวนเป็นคนละช่อง ไม่มีตัวเลขจำนวนในบรรทัดคน', () => {
    const c = DEFAULT_CARDS.find((x) => x.id === 'd01')!;
    const r = resolveRound(c, 6, 3, 1);
    expect(doersLine(r, 6)).toBe('เบอร์ 3');
    expect(amountLabel(c.amount)).toBe('1 ช็อต');
    expect(c.text).not.toMatch(/ช็อต|จิบ/);
  });
  it('ตัวแทนที่ไม่ได้อยู่ในเป้าหมาย (เช่น {left} ในคำสั่งแบบคนเดียว) ก็ถูกไฮไลต์', () => {
    const r = resolveRound(card({ text: '{player} ชน {left} และ {right}' }), 5, 1, 1);
    expect(r.participants.map((p) => p.seat).sort()).toEqual([1, 2, 5]);
  });
});

describe('คลังคำสั่งเริ่มต้น', () => {
  it('อย่างน้อย 64 ใบ id ไม่ซ้ำ ไม่ซ้ำแบบเปลี่ยนแค่ id', () => {
    expect(DEFAULT_CARDS.length).toBeGreaterThanOrEqual(64);
    expect(new Set(DEFAULT_CARDS.map((c) => c.id)).size).toBe(DEFAULT_CARDS.length);
    const sig = DEFAULT_CARDS.map((c) => `${c.target}|${c.text}|${amountLabel(c.amount)}`);
    expect(new Set(sig).size).toBe(sig.length);
  });
  it('ช็อตมากกว่าจิบ มีพักน้ำแทรก ทุกหมวดมีครบ', () => {
    const drink = DEFAULT_CARDS.filter((c) => c.category === 'drink');
    const shots = drink.filter((c) => c.amount?.unit === 'ช็อต').length;
    const sips = drink.filter((c) => c.amount?.unit === 'จิบ').length;
    expect(shots).toBeGreaterThan(sips * 4);
    expect(drink.some((c) => c.amount?.value === 2)).toBe(true);
    expect(DEFAULT_CARDS.filter((c) => c.category === 'water').length).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_CARDS.filter((c) => c.category === 'close').length).toBeGreaterThanOrEqual(15);
    const targets = new Set(DEFAULT_CARDS.map((c) => c.target));
    for (const t of ['player', 'left', 'right', 'opposite', 'random', 'even', 'odd', 'sameParity', 'all', 'choose']) expect(targets).toContain(t);
  });
});

describe('สำรับ', () => {
  it('ไม่ออกใบซ้ำจนกว่าจะครบสำรับ และไม่ออกลักษณะเดียวกันติดกันเมื่อเลี่ยงได้', () => {
    const d = new Deck(DEFAULT_CARDS, seeded(7));
    for (let round = 0; round < 3; round++) {
      const seen = new Set<string>();
      let prevKind = '';
      for (let i = 0; i < DEFAULT_CARDS.length; i++) {
        const c = d.drawCard()!;
        expect(seen.has(c.id)).toBe(false);
        seen.add(c.id);
        if (i < DEFAULT_CARDS.length - 8) expect(c.kind).not.toBe(prevKind);
        prevKind = c.kind;
      }
      expect(seen.size).toBe(DEFAULT_CARDS.length);
    }
  });
  it('เหลือใบเดียว / ใบลักษณะเดียวกันทั้งหมด ก็ยังเล่นต่อได้', () => {
    const one = new Deck([card({ id: 'a' })]);
    for (let i = 0; i < 5; i++) expect(one.drawCard()!.id).toBe('a');
    const same = new Deck([card({ id: 'a' }), card({ id: 'b' })]);
    for (let i = 0; i < 10; i++) expect(same.drawCard()).not.toBeNull();
    expect(new Deck([]).drawCard()).toBeNull();
  });
  it('เลขที่สุ่มได้ไม่ซ้ำคนเดิมติดกัน และทุกคนได้ครบก่อนวนใหม่', () => {
    for (let n = 2; n <= 24; n++) {
      const d = new Deck([card({})], seeded(n));
      let prev = 0;
      const firstLap = new Set<number>();
      for (let i = 0; i < n * 6; i++) {
        const s = d.drawSeat(n);
        expect(s).not.toBe(prev);
        if (i < n) firstLap.add(s);
        prev = s;
      }
      expect(firstLap.size).toBe(n);
    }
  });
});

describe('ตัวควบคุมรอบ', () => {
  it('กดซ้ำระหว่างสุ่มไม่สุ่มซ้อน และเปิดตามลำดับ', () => {
    vi.useFakeTimers();
    const g = new Game(seeded(3));
    const phases: string[] = [];
    g.onPhase = (p) => phases.push(p);
    g.start(6, DEFAULT_CARDS);
    expect(g.roll(TIMING.full)).toBe(true);
    for (let i = 0; i < 10; i++) expect(g.roll(TIMING.full)).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(phases).toEqual(['shaking', 'stick', 'number', 'result']);
    expect(g.round).toBe(1);
    expect(g.roll(TIMING.full)).toBe(false); // ต้องกดรอบต่อไปก่อน
    g.next(true);
    expect(g.history[0].skipped).toBe(true);
    expect(g.roll(TIMING.quick)).toBe(true);
    vi.useRealTimers();
  });
  it('เริ่มวงใหม่ระหว่างลุ้น: ยกเลิกแอนิเมชันเก่า ล้างรอบและประวัติ', () => {
    vi.useFakeTimers();
    const g = new Game();
    const phases: string[] = [];
    g.onPhase = (p) => phases.push(p);
    g.start(6, DEFAULT_CARDS);
    g.roll(TIMING.full);
    vi.advanceTimersByTime(500);
    g.start(8, DEFAULT_CARDS);
    vi.advanceTimersByTime(10000);
    expect(phases).toEqual(['shaking']);
    expect(g.round).toBe(0);
    expect(g.history).toEqual([]);
    expect(g.phase).toBe('idle');
    expect(g.roll(TIMING.full)).toBe(true);
    vi.useRealTimers();
  });
});
