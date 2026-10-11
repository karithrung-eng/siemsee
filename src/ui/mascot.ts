// มาสคอต "น้องซี้" — กระบอกเซียมซีหน้ากวน ตาปรือ แลบลิ้น มีแขนการ์ตูน
// ใช้ชุดเดียวกันทั้งโลโก้ หน้าเริ่มเกม และกระบอกที่เขย่าได้จริง

export const C = {
  ink: '#111111',
  red: '#E8202A',
  redDark: '#8E0F17',
  yellow: '#FFD23F',
  stick: '#F4C267',
  cream: '#FFF4DC',
  pink: '#FF3EA5',
  blush: '#FF8CC6',
  tongue: '#FF5C8A',
};

/** ลายขอบศาลเจ้า: แถบเหลืองมีฟันปลาแดงสลับ */
function shrineBand(y: number, h: number) {
  const x0 = 52;
  const x1 = 188;
  const teeth: string[] = [];
  const step = 17;
  for (let x = x0 + 2; x + step <= x1; x += step) {
    teeth.push(`M${x} ${y + h - 3} L${x + step / 2} ${y + 5} L${x + step} ${y + h - 3} Z`);
  }
  return `
    <rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="4"/>
    <path d="${teeth.join(' ')}" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
}

function sticks() {
  const list = [
    { x: 78, top: 34, rot: -9 },
    { x: 100, top: 22, rot: -4 },
    { x: 122, top: 30, rot: 2 },
    { x: 142, top: 18, rot: 6 },
    { x: 162, top: 38, rot: 11 },
  ];
  return list
    .map(
      (s) => `<g transform="rotate(${s.rot} ${s.x} 120)">
        <rect x="${s.x - 7}" y="${s.top}" width="14" height="110" rx="5" fill="${C.stick}" stroke="${C.ink}" stroke-width="4"/>
        <rect x="${s.x - 7}" y="${s.top}" width="14" height="14" rx="5" fill="${C.red}" stroke="${C.ink}" stroke-width="4"/>
      </g>`,
    )
    .join('');
}

export interface MascotOpts {
  /** แสดงไม้เซียมซีที่จะโผล่ (สำหรับกระบอกในหน้าเล่น) */
  pickStick?: boolean;
  title?: string;
  className?: string;
}

export function mascotSVG(opts: MascotOpts = {}): string {
  const title = opts.title ?? 'น้องซี้ กระบอกเซียมซีหน้ากวน';
  const pick = opts.pickStick
    ? `<g class="pick-stick">
        <rect x="111" y="112" width="26" height="150" rx="8" fill="${C.stick}" stroke="${C.ink}" stroke-width="5"/>
        <circle cx="124" cy="122" r="25" fill="${C.cream}" stroke="${C.ink}" stroke-width="5"/>
        <text class="pick-num" x="124" y="132" text-anchor="middle" font-size="28" font-weight="800" fill="${C.ink}" font-family="Kanit, system-ui, sans-serif">?</text>
      </g>`
    : '';
  return `<svg class="mascot ${opts.className ?? ''}" viewBox="-8 -52 262 362" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <g class="mascot-shake">
    <g class="sticks">${sticks()}</g>
    ${pick}
    <!-- เงาทึบแบบสติกเกอร์ -->
    <rect x="58" y="98" width="140" height="186" rx="24" fill="${C.ink}"/>
    <!-- ตัวกระบอก -->
    <rect x="50" y="90" width="140" height="186" rx="24" fill="${C.red}" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="120" cy="92" rx="70" ry="15" fill="${C.redDark}" stroke="${C.ink}" stroke-width="6"/>
    ${shrineBand(108, 24)}
    ${shrineBand(238, 22)}
    <!-- แขนซ้าย (โบกมือ) -->
    <path d="M54 196 C30 196 18 176 16 150" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="16" cy="140" r="15" fill="#fff" stroke="${C.ink}" stroke-width="5"/>
    <path d="M6 136 l-6 -8 M14 126 l-2 -10 M24 128 l4 -9" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
    <!-- แขนขวา (เท้าเอว) -->
    <path d="M186 186 C214 186 222 204 210 222" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="206" cy="226" r="14" fill="#fff" stroke="${C.ink}" stroke-width="5"/>
    <!-- หน้า: ตาปรือ คิ้วกวน -->
    <g class="face">
      <path d="M78 150 L104 144" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M134 140 L160 146" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M76 166 A16 14 0 0 0 108 166 Z" fill="#fff" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M132 166 A16 14 0 0 0 164 166 Z" fill="#fff" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="96" cy="171" r="5.5" fill="${C.ink}"/>
      <circle cx="152" cy="171" r="5.5" fill="${C.ink}"/>
      <path d="M73 166 H111 M129 166 H167" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="74" cy="192" rx="10" ry="6" fill="${C.blush}"/>
      <ellipse cx="166" cy="192" rx="10" ry="6" fill="${C.blush}"/>
      <!-- ยิ้มมุมปาก + แลบลิ้น -->
      <path d="M128 213 v9 a8 8 0 0 0 16 0 v-11" fill="${C.tongue}" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M136 214 v8" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M102 206 Q124 220 150 204" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
    </g>
    <!-- เท้า -->
    <ellipse cx="92" cy="284" rx="18" ry="8" fill="${C.ink}"/>
    <ellipse cx="152" cy="284" rx="18" ry="8" fill="${C.ink}"/>
  </g>
</svg>`;
}
