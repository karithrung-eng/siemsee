import { DEFAULT_CARDS } from '../data/cards';
import type { Card, CategoryId } from '../logic/types';
import { load, save, storageOk, type Saved } from './storage';

type Listener = () => void;

/** สถานะการตั้งค่าที่บันทึกได้ + ความยินยอม (อยู่ในหน่วยความจำเท่านั้น) */
class Store {
  data: Saved = load();
  /** ยืนยันอายุ 20+ และยินยอมหมวดใกล้ชิด — ไม่บันทึกข้ามเซสชัน */
  closeConsent = false;
  private listeners = new Set<Listener>();
  saveFailedNotified = false;

  get storageOk() {
    return storageOk;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  update(mut: (d: Saved) => void) {
    mut(this.data);
    save(this.data);
    this.listeners.forEach((l) => l());
  }

  allCards(): Card[] {
    return [...DEFAULT_CARDS, ...this.data.customCards];
  }

  isEnabled(card: Card) {
    return !this.data.disabledIds.includes(card.id);
  }

  /** การ์ดที่จะใช้จริงในวงนี้ */
  playableCards(): Card[] {
    const cats = this.data.categories;
    return this.allCards().filter((c) => cats[c.category] && this.isEnabled(c) && !(c.category === 'close' && !this.closeConsent));
  }

  /** เหตุผลที่ยังเริ่มไม่ได้ (null = เริ่มได้) */
  startBlocker(): string | null {
    const cats = this.data.categories;
    const on = (Object.keys(cats) as CategoryId[]).filter((k) => cats[k]);
    if (on.length === 0) return 'เลือกหมวดคำสั่งอย่างน้อย 1 หมวด';
    if (cats.close && !this.closeConsent) return 'ติ๊กยืนยันว่าทุกคนอายุ 20+ และตกลงเล่นหมวดใกล้ชิด หรือปิดหมวดนี้';
    if (this.playableCards().length === 0) return 'หมวดที่เลือกไม่มีคำสั่งที่เปิดอยู่ ไปเปิดในคลังคำสั่งก่อน';
    return null;
  }

  name(seat: number) {
    return this.data.names[seat - 1]?.trim() ?? '';
  }
}

export const store = new Store();
