import { amountLabel } from '../logic/format';
import { CATEGORIES, TARGETS, type Card, type CategoryId } from '../logic/types';
import { store } from '../state/store';
import { h, toast } from './dom';

const PH_LABEL: Record<string, string> = {
  player: '[คนที่สุ่มได้]',
  left: '[คนซ้าย]',
  right: '[คนขวา]',
  opposite: '[คนตรงข้าม]',
  random: '[คนสุ่ม]',
  parity: '[คู่/คี่]',
};

export const previewText = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => PH_LABEL[k] ?? m);

export function libraryScreen(): HTMLElement {
  let query = '';
  let cat = 'all' as CategoryId | 'all' | 'mine';

  const list = h('ul', { class: 'lib-list', 'aria-live': 'polite' });
  const countEl = h('p', { class: 'muted' });
  const search = h('input', { type: 'search', class: 'search', placeholder: 'ค้นหาคำสั่ง…', 'aria-label': 'ค้นหาคำสั่ง', enterkeyhint: 'search' }) as HTMLInputElement;
  search.addEventListener('input', () => {
    query = search.value.trim();
    render();
  });

  const filters = h('div', { class: 'filter-row', role: 'group', 'aria-label': 'กรองหมวด' });
  const filterDefs: { id: typeof cat; label: string }[] = [
    { id: 'all', label: 'ทั้งหมด' },
    ...CATEGORIES.map((c) => ({ id: c.id as typeof cat, label: `${c.emoji} ${c.short}` })),
    { id: 'mine', label: '✏️ ของฉัน' },
  ];
  for (const f of filterDefs) {
    const b = h('button', { type: 'button', class: 'filter', 'aria-pressed': String(f.id === cat) }, f.label);
    b.addEventListener('click', () => {
      cat = f.id;
      filters.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    filters.append(b);
  }

  const restore = h('button', { type: 'button', class: 'link-btn' }, '↺ เปิดคำสั่งเริ่มต้นทั้งหมด');
  restore.addEventListener('click', () => {
    const customIds = new Set(store.data.customCards.map((c) => c.id));
    store.update((s) => (s.disabledIds = s.disabledIds.filter((id) => customIds.has(id))));
    toast('เปิดคำสั่งเริ่มต้นครบแล้ว (คำสั่งของคุณไม่ถูกแตะ)');
    render();
  });

  const item = (c: Card) => {
    const on = store.isEnabled(c);
    const catInfo = CATEGORIES.find((x) => x.id === c.category)!;
    const target = TARGETS.find((t) => t.id === c.target)?.label ?? '';
    const sw = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(on), 'aria-label': `${on ? 'ปิด' : 'เปิด'}คำสั่ง ${c.title}` }, h('span', { class: 'knob' }));
    sw.addEventListener('click', () => {
      store.update((s) => {
        s.disabledIds = on ? [...s.disabledIds, c.id] : s.disabledIds.filter((x) => x !== c.id);
      });
      render();
    });
    const amt = amountLabel(c.amount);
    const actions = c.custom
      ? h(
          'div',
          { class: 'lib-actions' },
          h('a', { class: 'mini-btn', href: `#edit-${encodeURIComponent(c.id)}`, 'aria-label': `แก้ไข ${c.title}` }, 'แก้ไข'),
          (() => {
            const del = h('button', { type: 'button', class: 'mini-btn danger', 'aria-label': `ลบ ${c.title}` }, 'ลบ');
            // ยืนยันในหน้า (ไม่ใช้ confirm() ที่บางกรอบแสดงไม่ได้)
            let armed = false;
            del.addEventListener('click', () => {
              if (!armed) {
                armed = true;
                del.textContent = 'แตะอีกครั้งเพื่อลบ';
                setTimeout(() => {
                  armed = false;
                  del.textContent = 'ลบ';
                }, 3000);
                return;
              }
              store.update((s) => {
                s.customCards = s.customCards.filter((x) => x.id !== c.id);
                s.disabledIds = s.disabledIds.filter((x) => x !== c.id);
              });
              toast('ลบแล้ว');
              render();
            });
            return del;
          })(),
        )
      : null;
    return h(
      'li',
      { class: `lib-item${on ? '' : ' off'}` },
      h(
        'div',
        { class: 'lib-main' },
        h('div', { class: 'lib-head' }, h('b', {}, c.title), h('span', { class: `chip chip-${c.category}` }, `${catInfo.emoji} ${catInfo.short}`), c.custom && h('span', { class: 'chip chip-mine' }, 'ของฉัน')),
        h('p', { class: 'lib-text' }, previewText(c.text)),
        h('p', { class: 'lib-meta' }, target, amt ? ` · จำนวน ${amt}` : '', c.note ? ` · ${c.note}` : ''),
        actions,
      ),
      sw,
    );
  };

  const render = () => {
    const q = query.toLowerCase();
    const cards = store.allCards().filter((c) => {
      if (cat === 'mine' && !c.custom) return false;
      if (cat !== 'all' && cat !== 'mine' && c.category !== cat) return false;
      if (q && !`${c.title} ${previewText(c.text)} ${c.note ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const enabled = store.allCards().filter((c) => store.isEnabled(c)).length;
    countEl.textContent = `แสดง ${cards.length} ใบ · เปิดใช้ ${enabled}/${store.allCards().length} ใบ`;
    list.replaceChildren(...(cards.length ? cards.map(item) : [h('li', { class: 'empty' }, cat === 'mine' ? 'ยังไม่มีคำสั่งของคุณ กด “เพิ่มคำสั่ง” ได้เลย' : 'ไม่พบคำสั่งที่ค้นหา')]));
  };
  render();

  return h(
    'div',
    { class: 'screen page' },
    h('header', { class: 'topbar' }, h('a', { class: 'icon-btn back-btn', href: '#setup', 'aria-label': 'กลับหน้าตั้งวง' }, '←'), h('div', { class: 'topbar-mid' }, h('h1', { class: 'page-title' }, 'คลังคำสั่ง')), h('a', { class: 'icon-btn add-btn', href: '#edit-new', 'aria-label': 'เพิ่มคำสั่งเอง' }, '＋')),
    h(
      'main',
      { class: 'page-scroll' },
      search,
      filters,
      h('div', { class: 'lib-tools' }, countEl, restore),
      h('p', { class: 'muted small' }, 'คำสั่งที่เพิ่มหรือปิด บันทึกเฉพาะในเครื่องนี้ ไม่กระทบวงอื่น'),
      list,
      h('a', { class: 'btn btn-primary add-wide', href: '#edit-new' }, '＋ เพิ่มคำสั่งเอง'),
    ),
  );
}
