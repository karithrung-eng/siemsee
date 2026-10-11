import { amountLabel, doersLine, renderText } from '../logic/format';
import { resolveRound } from '../logic/resolve';
import { CATEGORIES, TARGETS, type Card, type CategoryId, type TargetType } from '../logic/types';
import { store } from '../state/store';
import { h, toast } from './dom';
import { navigate } from './router';

const UNITS = ['ช็อต', 'จิบ', 'แก้ว', 'คำ'];
const CHIPS: { ph: string; label: string }[] = [
  { ph: '{player}', label: 'คนที่สุ่มได้' },
  { ph: '{left}', label: 'คนซ้าย' },
  { ph: '{right}', label: 'คนขวา' },
  { ph: '{opposite}', label: 'คนตรงข้าม' },
  { ph: '{random}', label: 'คนสุ่ม' },
];

export function editorScreen(id: string): HTMLElement {
  const existing = id === 'new' ? undefined : store.data.customCards.find((c) => c.id === id);
  if (id !== 'new' && !existing) {
    queueMicrotask(() => {
      toast('ไม่พบคำสั่งนี้');
      navigate('library', true);
    });
  }
  const draft: Card = existing
    ? structuredClone(existing)
    : { id: '', title: '', category: 'drink', target: 'player', text: '{player} ', kind: '', custom: true, amount: { value: 1, unit: 'ช็อต', each: false } };

  const title = h('input', { id: 'f-title', type: 'text', maxlength: 40, value: draft.title, placeholder: 'เช่น ป้อนคนขวา' }) as HTMLInputElement;
  const text = h('textarea', { id: 'f-text', rows: 3, maxlength: 300, placeholder: '{player} ป้อน {right}' }) as HTMLTextAreaElement;
  text.value = draft.text;
  const target = h('select', { id: 'f-target' }, TARGETS.map((t) => h('option', { value: t.id, selected: t.id === draft.target }, t.label))) as HTMLSelectElement;
  const catRow = h(
    'div',
    { class: 'radio-row', role: 'radiogroup', 'aria-labelledby': 'l-cat' },
    CATEGORIES.map((c) =>
      h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'cat', value: c.id, checked: c.id === draft.category }), h('span', {}, `${c.emoji} ${c.short}`)),
    ),
  );
  const amtVal = h('input', { id: 'f-amt', type: 'number', inputmode: 'decimal', min: 0, max: 10, step: 0.5, value: draft.amount?.value ?? 0 }) as HTMLInputElement;
  const amtUnit = h('select', { id: 'f-unit', 'aria-label': 'หน่วย' }, UNITS.map((u) => h('option', { value: u, selected: u === (draft.amount?.unit ?? 'ช็อต') }, u))) as HTMLSelectElement;
  const each = h('input', { type: 'checkbox', id: 'f-each', checked: !!draft.amount?.each }) as HTMLInputElement;
  const note = h('input', { id: 'f-note', type: 'text', maxlength: 80, value: draft.note ?? '', placeholder: 'เช่น ใช้แก้วของคนดื่ม' }) as HTMLInputElement;
  const err = h('p', { class: 'form-error', role: 'alert' });
  const preview = h('div', { class: 'card preview-card', 'aria-live': 'polite' });

  const chips = h(
    'div',
    { class: 'ph-row', 'aria-label': 'แทรกตัวแทนผู้เล่น' },
    CHIPS.map((c) => {
      const b = h('button', { type: 'button', class: 'ph-chip' }, `${c.label} ${c.ph}`);
      b.addEventListener('click', () => {
        const s = text.selectionStart ?? text.value.length;
        const e = text.selectionEnd ?? s;
        text.value = text.value.slice(0, s) + c.ph + ' ' + text.value.slice(e);
        text.focus();
        text.selectionStart = text.selectionEnd = s + c.ph.length + 1;
        update();
      });
      return b;
    }),
  );

  const collect = (): Card => {
    const cat = (catRow.querySelector('input:checked') as HTMLInputElement | null)?.value as CategoryId;
    const v = parseFloat(amtVal.value);
    const card: Card = {
      id: draft.id,
      title: title.value.trim(),
      category: cat ?? 'drink',
      target: target.value as TargetType,
      text: text.value.trim(),
      kind: draft.kind || '',
      custom: true,
    };
    if (v > 0) card.amount = { value: Math.min(10, v), unit: amtUnit.value, each: each.checked };
    if (note.value.trim()) card.note = note.value.trim();
    return card;
  };

  const update = () => {
    const c = collect();
    const n = store.data.playerCount;
    const r = resolveRound({ ...c, text: c.text || '…' }, n, 1, 1, () => 0);
    if (c.target === 'choose') r.chosen = undefined;
    const amt = amountLabel(c.amount);
    preview.replaceChildren(
      h('p', { class: 'card-label' }, `ตัวอย่าง (วง ${n} คน สุ่มได้เบอร์ 1)`),
      h('p', { class: 'doers' }, doersLine(r, n)),
      h('h2', { class: 'command' }, renderText(r) || '…'),
      amt ? h('div', { class: 'amount' }, h('span', { class: 'amount-k' }, 'จำนวน'), h('span', { class: 'amount-v' }, amt)) : '',
      c.note ? h('p', { class: 'note' }, c.note) : '',
    );
  };
  [title, text, target, amtVal, amtUnit, each, note].forEach((el) => el.addEventListener('input', update));
  catRow.addEventListener('change', update);

  const saveBtn = h('button', { type: 'submit', class: 'btn btn-primary' }, existing ? 'บันทึก' : 'เพิ่มคำสั่ง');
  const form = h(
    'form',
    { class: 'editor', novalidate: true },
    h('label', { class: 'field', for: 'f-title' }, h('span', {}, 'ชื่อคำสั่ง'), title),
    h('div', { class: 'field' }, h('span', { id: 'l-cat' }, 'หมวด'), catRow),
    h('label', { class: 'field', for: 'f-target' }, h('span', {}, 'เป้าหมาย / ผู้เกี่ยวข้อง'), target),
    h('label', { class: 'field', for: 'f-text' }, h('span', {}, 'ข้อความคำสั่ง'), text),
    chips,
    h('p', { class: 'muted small' }, 'ตัวแทนจะกลายเป็น “เบอร์ …” และไฮไลต์ในผังวงให้อัตโนมัติ ใส่ตัวเลขจำนวนในช่องด้านล่าง ไม่ต้องใส่ในประโยค'),
    h(
      'div',
      { class: 'field' },
      h('span', {}, 'จำนวน (0 = ไม่มี)'),
      h('div', { class: 'amt-row' }, amtVal, amtUnit, h('label', { class: 'check', for: 'f-each' }, each, h('span', {}, 'คนละ'))),
    ),
    h('label', { class: 'field', for: 'f-note' }, h('span', {}, 'หมายเหตุ (ไม่บังคับ)'), note),
    preview,
    err,
    h('div', { class: 'form-actions' }, h('a', { class: 'btn btn-ghost', href: '#library' }, 'ยกเลิก'), saveBtn),
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = collect();
    if (!c.text) {
      err.textContent = 'ใส่ข้อความคำสั่งก่อน';
      text.focus();
      return;
    }
    if (!c.title) c.title = c.text.replace(/\{\w+\}/g, '').trim().slice(0, 24) || 'คำสั่งของฉัน';
    if (!c.id) c.id = `my-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    if (!c.kind) c.kind = `custom-${c.id}`;
    store.update((s) => {
      const i = s.customCards.findIndex((x) => x.id === c.id);
      if (i >= 0) s.customCards[i] = c;
      else s.customCards.push(c);
    });
    toast(existing ? 'บันทึกแล้ว' : 'เพิ่มคำสั่งแล้ว');
    navigate('library');
  });

  update();
  return h(
    'div',
    { class: 'screen page' },
    h('header', { class: 'topbar' }, h('a', { class: 'icon-btn back-btn', href: '#library', 'aria-label': 'กลับคลังคำสั่ง' }, '←'), h('div', { class: 'topbar-mid' }, h('h1', { class: 'page-title' }, existing ? 'แก้ไขคำสั่ง' : 'เพิ่มคำสั่งเอง')), h('span', { class: 'icon-btn ghost', 'aria-hidden': 'true' })),
    h('main', { class: 'page-scroll' }, form),
  );
}
