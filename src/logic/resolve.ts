import type { Card, Participant, RoundResult, TargetType } from './types';
import { isEven, leftOf, oppositeOf, randomOther, rightOf, seatsWhere, type Rng } from './seats';

export const PLACEHOLDERS = ['player', 'left', 'right', 'opposite', 'random'] as const;
export type SeatKey = (typeof PLACEHOLDERS)[number];

const PH_RE = /\{(player|left|right|opposite|random|parity)\}/g;

/** ตัวแทนที่ปรากฏในข้อความ เรียงตามลำดับที่เจอ */
export function placeholdersIn(text: string): string[] {
  const seen: string[] = [];
  for (const m of text.matchAll(PH_RE)) if (!seen.includes(m[1])) seen.push(m[1]);
  return seen;
}

const PAIR_TARGET: Partial<Record<TargetType, SeatKey>> = {
  left: 'left',
  right: 'right',
  opposite: 'opposite',
  random: 'random',
};

export const isGroupTarget = (t: TargetType) => t === 'even' || t === 'odd' || t === 'sameParity' || t === 'all';

export function groupSeats(t: TargetType, n: number, drawn: number): number[] {
  switch (t) {
    case 'even':
      return seatsWhere(n, isEven);
    case 'odd':
      return seatsWhere(n, (s) => !isEven(s));
    case 'sameParity':
      return seatsWhere(n, (s) => isEven(s) === isEven(drawn));
    case 'all':
      return seatsWhere(n, () => true);
    default:
      return [];
  }
}

/** สร้างผลรอบจากการ์ด + เลขที่สุ่มได้ ค่าตรงข้าม/สุ่ม ถูกล็อกไว้ในรอบนี้ ให้ข้อความกับผังตรงกันเสมอ */
export function resolveRound(card: Card, n: number, drawn: number, round: number, rng: Rng = Math.random): RoundResult {
  const used = placeholdersIn(card.text);
  const pairKey = PAIR_TARGET[card.target];
  const need = new Set<SeatKey>(['player']);
  for (const k of used) if (k !== 'parity') need.add(k as SeatKey);
  if (pairKey) need.add(pairKey);

  const seats: RoundResult['seats'] = { player: drawn };
  if (need.has('left')) seats.left = leftOf(drawn, n);
  if (need.has('right')) seats.right = rightOf(drawn, n);
  if (need.has('opposite')) seats.opposite = oppositeOf(drawn, n, rng);
  if (need.has('random')) seats.random = randomOther(drawn, n, rng);

  const result: RoundResult = { round, drawn, card, seats, participants: [] };
  result.participants = computeParticipants(result, n);
  return result;
}

export function computeParticipants(r: RoundResult, n: number): Participant[] {
  const { card, seats, drawn } = r;
  const out: Participant[] = [];
  const add = (seat: number | undefined, role: Participant['role']) => {
    if (seat === undefined) return;
    const existing = out.find((p) => p.seat === seat);
    if (existing) {
      // บทบาทหลักสำคัญกว่าเสมอ
      if (role === 'main' || (role === 'partner' && existing.role === 'group')) existing.role = role;
      return;
    }
    out.push({ seat, role });
  };

  const used = placeholdersIn(card.text);

  if (isGroupTarget(card.target)) {
    if (used.includes('player')) add(drawn, 'main');
    for (const s of groupSeats(card.target, n, drawn)) add(s, 'group');
    for (const k of used) if (k !== 'player' && k !== 'parity') add(seats[k as SeatKey], 'partner');
    return out;
  }

  add(drawn, 'main');
  const pairKey = PAIR_TARGET[card.target];
  if (pairKey) add(seats[pairKey], 'partner');
  for (const k of used) if (k !== 'player' && k !== 'parity') add(seats[k as SeatKey], 'partner');
  if (card.target === 'choose' && r.chosen !== undefined) add(r.chosen, 'partner');
  return out;
}

/** เปลี่ยนผู้รับของคำสั่ง "เลือกผู้รับเอง" — แทนที่คนเดิม ไม่สะสม */
export function chooseRecipient(r: RoundResult, seat: number | undefined, n: number): RoundResult {
  const next: RoundResult = { ...r, chosen: seat };
  next.participants = computeParticipants(next, n);
  return next;
}
