import type { Card, CategoryId } from '../logic/types';

// บันทึกในเบราว์เซอร์ของแต่ละเครื่องเท่านั้น — แต่ละวงไม่ปะปนกัน
// ความยินยอมหมวดใกล้ชิด "ไม่" ถูกบันทึกที่นี่โดยตั้งใจ

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 24;

export type PlayMode = 'full' | 'quick';

export interface Saved {
  v: 1;
  playerCount: number;
  names: string[];
  categories: Record<CategoryId, boolean>;
  customCards: Card[];
  disabledIds: string[];
  muted: boolean;
  mode: PlayMode;
}

const KEY = 'siemsee:v1';

export const defaults = (): Saved => ({
  v: 1,
  playerCount: 6,
  names: [],
  categories: { drink: true, water: true, close: true },
  customCards: [],
  disabledIds: [],
  muted: false,
  mode: 'full',
});

export let storageOk = true;

function clampInt(v: unknown, lo: number, hi: number, fallback: number) {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(hi, Math.max(lo, n));
}

const CATS: CategoryId[] = ['drink', 'water', 'close'];

function sanitizeCard(c: any): Card | null {
  if (!c || typeof c !== 'object' || typeof c.id !== 'string' || typeof c.text !== 'string') return null;
  const category = CATS.includes(c.category) ? c.category : 'drink';
  const card: Card = {
    id: c.id,
    title: typeof c.title === 'string' && c.title.trim() ? c.title : 'คำสั่งของฉัน',
    category,
    target: typeof c.target === 'string' ? c.target : 'player',
    text: c.text,
    kind: typeof c.kind === 'string' ? c.kind : `custom-${c.id}`,
    custom: true,
  };
  if (c.amount && typeof c.amount.value === 'number' && typeof c.amount.unit === 'string') {
    card.amount = { value: c.amount.value, unit: c.amount.unit, each: !!c.amount.each };
  }
  if (typeof c.note === 'string' && c.note.trim()) card.note = c.note;
  if (Array.isArray(c.roles) && c.roles.length === 2) card.roles = [String(c.roles[0]), String(c.roles[1])];
  return card;
}

export function load(): Saved {
  const d = defaults();
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
    // ทดสอบว่าเขียนได้จริง (Safari โหมดส่วนตัวรุ่นเก่าอ่านได้แต่เขียนไม่ได้)
    window.localStorage.setItem(KEY + ':probe', '1');
    window.localStorage.removeItem(KEY + ':probe');
  } catch {
    storageOk = false;
  }
  if (!raw) return d;
  try {
    const s = JSON.parse(raw);
    return {
      v: 1,
      playerCount: clampInt(s.playerCount, MIN_PLAYERS, MAX_PLAYERS, d.playerCount),
      names: Array.isArray(s.names) ? s.names.slice(0, MAX_PLAYERS).map((x: unknown) => (typeof x === 'string' ? x.slice(0, 20) : '')) : [],
      categories: {
        drink: s.categories?.drink !== false,
        water: s.categories?.water !== false,
        close: s.categories?.close !== false,
      },
      customCards: Array.isArray(s.customCards) ? s.customCards.map(sanitizeCard).filter(Boolean) : [],
      disabledIds: Array.isArray(s.disabledIds) ? s.disabledIds.filter((x: unknown) => typeof x === 'string') : [],
      muted: !!s.muted,
      mode: s.mode === 'quick' ? 'quick' : 'full',
    };
  } catch {
    return d;
  }
}

export function save(s: Saved): boolean {
  if (!storageOk) return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    storageOk = false;
    return false;
  }
}
