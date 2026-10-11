import type { Amount, Card, Participant, RoundResult } from './types';
import { isEven } from './seats';
import { isGroupTarget } from './resolve';

// ใช้ช่องว่างไม่ตัดบรรทัด ไม่ให้ “เบอร์” กับเลขแยกกันคนละบรรทัด
export const NBSP = '\u00A0';
export const seatLabel = (seat: number) => `เบอร์${NBSP}${seat}`;

export function amountValue(a: Amount): string {
  if (a.value === 0.5) return `ครึ่ง${a.unit}`;
  return `${a.value} ${a.unit}`;
}

/** ข้อความในแถบจำนวน เช่น "คนละ 1 ช็อต" — ไม่ขึ้นกับจำนวนคน จึงไม่สะสม */
export function amountLabel(a: Amount | undefined): string | null {
  if (!a || !(a.value > 0) || !a.unit.trim()) return null;
  return `${a.each ? 'คนละ ' : ''}${amountValue(a)}`;
}

export function renderText(r: RoundResult): string {
  return r.card.text.replace(/\{(player|left|right|opposite|random|parity)\}/g, (_m, k: string) => {
    if (k === 'parity') return isEven(r.drawn) ? 'คู่' : 'คี่';
    const s = r.seats[k as keyof RoundResult['seats']];
    return s === undefined ? '' : seatLabel(s);
  }).replace(/\s{2,}/g, ' ').trim();
}

const GROUP_LABEL: Record<string, string> = {
  even: 'ผู้เล่นเลขคู่',
  odd: 'ผู้เล่นเลขคี่',
  all: 'ทุกคนในวง',
};

const withName = (seat: number, names: string[]) => {
  const nm = names[seat - 1]?.trim();
  return nm ? `${seat}${NBSP}(${nm})` : `${seat}`;
};

/** บรรทัด "คนที่ต้องทำ" เช่น "เบอร์ 6 และ 5" */
export function doersLine(r: RoundResult, n: number, names: string[] = []): string {
  const ps = r.participants;
  if (isGroupTarget(r.card.target)) {
    const group = ps.filter((p) => p.role === 'group' || p.role === 'main').map((p) => p.seat).sort((a, b) => a - b);
    if (r.card.target === 'all') return `ทุกคนในวง (${n} คน)`;
    const label = r.card.target === 'sameParity' ? `เลข${isEven(r.drawn) ? 'คู่' : 'คี่'}ทั้งหมด` : GROUP_LABEL[r.card.target];
    return `${label}: ${group.join(', ')}`;
  }
  const ordered = orderParticipants(ps);
  const parts = ordered.map((p) => withName(p.seat, names));
  if (r.card.target === 'choose' && r.chosen === undefined) return `เบอร์${NBSP}${parts[0]} (เลือกผู้รับ)`;
  if (r.card.target === 'choose' && r.chosen === r.drawn) return `เบอร์${NBSP}${parts[0]} (เลือกตัวเอง)`;
  if (parts.length === 1) return `เบอร์${NBSP}${parts[0]}`;
  return `เบอร์${NBSP}${parts.slice(0, -1).join(', ')} และ${NBSP}${parts[parts.length - 1]}`;
}

export function orderParticipants(ps: Participant[]): Participant[] {
  const rank = { main: 0, partner: 1, group: 2 } as const;
  return [...ps].sort((a, b) => rank[a.role] - rank[b.role]);
}

export function roleLabels(card: Card): { main: string; partner: string; group: string } {
  if (card.roles) return { main: card.roles[0], partner: card.roles[1], group: 'ร่วมทำ' };
  if (card.target === 'choose') return { main: 'คนเลือก', partner: 'ผู้รับ', group: 'ร่วมทำ' };
  return { main: 'ต้องทำ', partner: 'ทำด้วยกัน', group: 'ร่วมทำ' };
}
