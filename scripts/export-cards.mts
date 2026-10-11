// สร้างไฟล์รายการคำสั่งเริ่มต้น docs/คลังคำสั่ง.md
import { writeFileSync } from 'node:fs';
import { DEFAULT_CARDS } from '../src/data/cards.ts';
const CAT = { drink: '🥃 ชนแก้ว / ช็อต', water: '💧 พักน้ำ', close: '💗 ใกล้ชิด' };
const TGT = { player: 'คนที่สุ่มได้', left: '+ คนซ้าย', right: '+ คนขวา', opposite: '+ คนตรงข้าม', random: '+ คู่สุ่ม', even: 'เลขคู่ทั้งหมด', odd: 'เลขคี่ทั้งหมด', sameParity: 'คู่/คี่เหมือนคนที่สุ่มได้', all: 'ทุกคน', choose: 'เลือกผู้รับเอง' };
const PH = { player: '[สุ่มได้]', left: '[ซ้าย]', right: '[ขวา]', opposite: '[ตรงข้าม]', random: '[คนสุ่ม]', parity: '[คู่/คี่]' };
const amt = (a) => (a ? `${a.each ? 'คนละ ' : ''}${a.value === 0.5 ? 'ครึ่ง' + a.unit : a.value + ' ' + a.unit}` : '—');
let md = `# คลังคำสั่งเริ่มต้น เซียมซี้! (${DEFAULT_CARDS.length} ใบ)\n\nทุกใบข้ามได้โดยไม่มีบทลงโทษ เลือกน้ำเปล่าแทนได้ กิจกรรมสัมผัสตัวต้องตกลงกันทั้งคู่ในรอบนั้น\n`;
for (const c of Object.keys(CAT)) {
  const list = DEFAULT_CARDS.filter((x) => x.category === c);
  md += `\n## ${CAT[c]} (${list.length} ใบ)\n\n| ID | ชื่อ | เป้าหมาย | คำสั่ง | จำนวน | หมายเหตุ |\n|---|---|---|---|---|---|\n`;
  for (const x of list) md += `| ${x.id} | ${x.title} | ${TGT[x.target]} | ${x.text.replace(/\{(\w+)\}/g, (_, k) => PH[k])} | ${amt(x.amount)} | ${x.note ?? ''} |\n`;
}
writeFileSync('docs/คลังคำสั่ง.md', md);
console.log('ok', DEFAULT_CARDS.length);
