// มาสคอต "น้องซี้" — กระบอกเซียมซีสายเฟี้ยวประจำวงเหล้า ลายเส้นการ์ตูนตัดขอบดำ
// มีสองลุค: "แว่นดำ" (หน้าแรก/รอเขย่า) และ "ผ้าโพกหัวขยิบตา" (ระหว่างลุ้น) สลับด้วย CSS ตาม data-phase
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
  gold: '#FFC21A',
};

const INK = C.ink;
const OUT = 5; // ความหนาเส้นขอบ

// รูปทรงกระบอก: ขอบซ้าย/ขวา ปากกระบอกเป็นวงรี
const X0 = 46;
const X1 = 194;
const CX = (X0 + X1) / 2;
const RX = (X1 - X0) / 2;
const RY = 17;
const TOP = 96;
const BOTTOM = 272;

/** ความโค้งของผิวกระบอกที่ตำแหน่ง x (0 ที่ขอบ, RY ตรงกลาง) */
const sag = (x: number) => RY * Math.sqrt(Math.max(0, 1 - ((x - CX) / RX) ** 2));

const BODY_PATH = `M${X0} ${TOP} L${X0} ${BOTTOM - 30} Q${X0} ${BOTTOM} ${X0 + 30} ${BOTTOM} L${X1 - 30} ${BOTTOM} Q${X1} ${BOTTOM} ${X1} ${BOTTOM - 30} L${X1} ${TOP} A${RX} ${RY} 0 0 1 ${X0} ${TOP} Z`;

/** ลายขอบศาลเจ้าโค้งตามผิวกระบอก: แถบเหลืองมีฟันปลาแดง */
function shrineBand(y: number, h: number) {
  const band = `M${X0} ${y} A${RX} ${RY} 0 0 0 ${X1} ${y} L${X1} ${y + h} A${RX} ${RY} 0 0 1 ${X0} ${y + h} Z`;
  const teeth: string[] = [];
  const step = 15;
  for (let x = X0 - 4; x < X1; x += step) {
    const xm = x + step / 2;
    const xe = x + step;
    teeth.push(
      `M${x} ${(y + h - 3 + sag(x)).toFixed(1)} L${xm} ${(y + 5 + sag(xm)).toFixed(1)} L${xe} ${(y + h - 3 + sag(xe)).toFixed(1)} Z`,
    );
  }
  return `<path d="${band}" fill="${C.yellow}" stroke="${INK}" stroke-width="3"/>
    <path d="${teeth.join(' ')}" fill="${C.red}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

function sticks() {
  const list = [
    { x: 66, top: 44, rot: -16 },
    { x: 84, top: 26, rot: -10 },
    { x: 102, top: 16, rot: -5 },
    { x: 120, top: 24, rot: 0 },
    { x: 138, top: 12, rot: 5 },
    { x: 156, top: 26, rot: 10 },
    { x: 174, top: 42, rot: 16 },
  ];
  return list
    .map(
      (s) => `<g transform="rotate(${s.rot} ${s.x} 130)">
        <rect x="${s.x - 7}" y="${s.top}" width="14" height="100" rx="7" fill="${C.stick}" stroke="${INK}" stroke-width="3.5"/>
        <rect x="${s.x - 2.5}" y="${s.top + 18}" width="3" height="60" rx="1.5" fill="#fff" opacity=".45"/>
        <path d="M${s.x - 7} ${s.top + 15} V${s.top + 7} a7 7 0 0 1 14 0 V${s.top + 15} Z" fill="${C.red}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      </g>`,
    )
    .join('');
}

/** มือถุงมือการ์ตูนทำท่าร็อก 🤘 (จุดกลางฝ่ามืออยู่ที่ 0,0) */
const rockHand = `
  <rect x="-15" y="-34" width="10" height="28" rx="5" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
  <rect x="6" y="-36" width="10" height="30" rx="5" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
  <ellipse cx="0" cy="2" rx="17" ry="15" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
  <path d="M-6 -6 q3 -6 6 0 M0 -6 q3 -6 6 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="-12" cy="6" rx="8" ry="6" fill="#fff" stroke="${INK}" stroke-width="3" transform="rotate(-30 -12 6)"/>
  <rect x="-12" y="14" width="24" height="9" rx="4" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`;

/** มือถือของ (ฝ่ามือกำรอบวัตถุ) */
const gripHand = `
  <ellipse cx="0" cy="0" rx="15" ry="14" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
  <path d="M-10 -6 h18 M-10 0 h18 M-10 6 h16" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="12" cy="-9" rx="7" ry="5" fill="#fff" stroke="${INK}" stroke-width="3"/>`;

/** ขวดเบียร์สีเขียว (ฐานขวดอยู่ที่ 0,0 สูงขึ้นไปด้านบน) */
const bottle = `
  <path d="M-11 0 V-40 q0 -10 7 -16 V-72 h8 V-56 q7 6 7 16 V0 Z" fill="#2f9e44" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <rect x="-5" y="-78" width="10" height="8" rx="2" fill="${C.gold}" stroke="${INK}" stroke-width="3"/>
  <path d="M-6 -36 V-8" stroke="#bff5c9" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <rect x="-11" y="-30" width="22" height="13" fill="${C.cream}" stroke="${INK}" stroke-width="2.5"/>`;

/** แก้วช็อต */
const shot = `
  <path d="M-14 -34 L14 -34 L11 0 L-11 0 Z" fill="#dff3ff" fill-opacity=".55" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M-12.5 -20 L12.5 -20 L11 0 L-11 0 Z" fill="#f2a516" stroke="${INK}" stroke-width="2"/>
  <path d="M-8 -30 V-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;

/** รองเท้าผ้าใบ (ปลายเท้าชี้ออกตาม dir) */
function sneaker(x: number, dir: 1 | -1) {
  const s = dir;
  return `<g transform="translate(${x} 0) scale(${s} 1)">
    <rect x="-6" y="262" width="12" height="18" fill="#3a3a46" stroke="${INK}" stroke-width="2.5"/>
    <path d="M-16 280 q0 -12 12 -12 h8 q10 0 14 8 l14 6 q6 3 6 10 v2 H-16 Z" fill="${C.red}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-17 294 H38 v4 q0 5 -5 5 H-12 q-5 0 -5 -5 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-2 272 l8 6 M3 270 l8 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 286 q10 -2 18 4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

export interface MascotOpts {
  /** แสดงไม้เซียมซีที่จะโผล่ (สำหรับกระบอกในหน้าเล่น) */
  pickStick?: boolean;
  title?: string;
  className?: string;
}

let uid = 0;

export function mascotSVG(opts: MascotOpts = {}): string {
  const title = opts.title ?? 'น้องซี้ กระบอกเซียมซีสายเฟี้ยว';
  // id ไม่ซ้ำ เผื่อมีมาสคอตหลายตัวในหน้าเดียว
  const id = `m${++uid}`;
  const g = (name: string) => `${id}-${name}`;

  const pick = opts.pickStick
    ? `<g class="pick-stick">
        <rect x="111" y="140" width="26" height="130" rx="9" fill="${C.stick}" stroke="${INK}" stroke-width="4"/>
        <circle cx="124" cy="150" r="25" fill="${C.cream}" stroke="${INK}" stroke-width="4"/>
        <text class="pick-num" x="124" y="160" text-anchor="middle" font-size="28" font-weight="800" fill="${INK}" font-family="Kanit, system-ui, sans-serif">?</text>
      </g>`
    : '';

  return `<svg class="mascot ${opts.className ?? ''}" viewBox="-36 -52 308 372" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <defs>
    <clipPath id="${g('clip')}"><path d="${BODY_PATH}"/></clipPath>
    <!-- แรเงาแบบการ์ตูน: สว่างซ้าย เข้มขวา -->
    <linearGradient id="${g('cel')}" x1="0" x2="1">
      <stop offset="0" stop-color="#ff4a4f"/>
      <stop offset=".62" stop-color="${C.red}"/>
      <stop offset=".63" stop-color="#c3141d"/>
      <stop offset="1" stop-color="#a50f17"/>
    </linearGradient>
    <linearGradient id="${g('gold')}" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#fff2a8"/>
      <stop offset=".5" stop-color="${C.gold}"/>
      <stop offset="1" stop-color="#c98a00"/>
    </linearGradient>
    <linearGradient id="${g('lens')}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#3b3b4a"/>
      <stop offset="1" stop-color="#050507"/>
    </linearGradient>
  </defs>
  <ellipse class="ground" cx="120" cy="304" rx="96" ry="10" fill="#000" opacity=".5"/>
  <g class="mascot-dance">
  <g class="mascot-shake">
    <!-- ปากกระบอก (ด้านใน) อยู่หลังไม้ -->
    <ellipse cx="${CX}" cy="${TOP}" rx="${RX}" ry="${RY}" fill="#3a0508" stroke="${INK}" stroke-width="${OUT}"/>
    <g class="sticks">${sticks()}</g>
    ${pick}
    <!-- ขา + รองเท้าผ้าใบ -->
    <g class="foot foot-l">${sneaker(92, -1)}</g>
    <g class="foot foot-r">${sneaker(148, 1)}</g>
    <!-- แขนซ้าย: ชูมือร็อก -->
    <g class="arm arm-l">
      <path d="M52 192 C30 190 20 176 18 160" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
      <path d="M52 192 C30 190 20 176 18 160" fill="none" stroke="#c3141d" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(14 138) rotate(-12)">${rockHand}</g>
    </g>
    <!-- แขนขวา: ถือขวด (ลุคแว่น) / แก้วช็อต (ลุคขยิบตา) -->
    <g class="arm arm-r">
      <path d="M188 196 C206 198 214 196 222 190" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
      <path d="M188 196 C206 198 214 196 222 190" fill="none" stroke="#c3141d" stroke-width="6" stroke-linecap="round"/>
      <g class="look-cool" transform="translate(226 206) rotate(14)">${bottle}</g>
      <g transform="translate(226 186)">${gripHand}</g>
      <g class="look-wink" transform="translate(222 204) scale(1.15)">${shot}</g>
    </g>
    <!-- ตัวกระบอก -->
    <g class="body">
      <path d="${BODY_PATH}" fill="url(#${g('cel')})"/>
      <g clip-path="url(#${g('clip')})">
        ${shrineBand(104, 20)}
        ${shrineBand(234, 20)}
        <!-- ลายกราฟฟิตี้ -->
        <g fill="none" stroke="#5a0309" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".85">
          <path d="M60 158 l6 -8 l5 6 l5 -8 l4 10 Z"/>
          <path d="M162 214 q6 -10 12 0 q-6 8 -12 0 M164 222 l8 0"/>
          <path d="M58 226 q8 -6 14 2 q6 8 14 0"/>
        </g>
      </g>
      <path d="${BODY_PATH}" fill="none" stroke="${INK}" stroke-width="${OUT}" stroke-linejoin="round"/>
      <path d="M58 130 V200" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>
    </g>

    <!-- ===== ลุคแว่นดำ ===== -->
    <g class="face look-cool">
      <path d="M78 140 Q92 128 106 136" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M136 140 Q150 136 162 142" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <!-- แว่นกันแดด -->
      <path d="M62 150 H178" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M66 150 H112 q2 0 2 3 q-2 22 -22 22 h-6 q-18 0 -20 -22 q0 -3 2 -3 Z" fill="url(#${g('lens')})" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M128 150 H174 q2 0 2 3 q-2 22 -22 22 h-6 q-18 0 -20 -22 q0 -3 2 -3 Z" fill="url(#${g('lens')})" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M74 156 l10 -3 M134 156 l10 -3" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <path d="M76 162 l4 -1 M136 162 l4 -1" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>
      <!-- ยิ้มเยาะ เขี้ยว + แลบลิ้น -->
      <path d="M98 192 Q120 214 150 190" fill="#5a0309" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
      <g class="tongue"><path d="M118 200 q-2 18 10 20 q12 1 10 -20 Z" fill="${C.tongue}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M128 204 v8" stroke="#c42d5a" stroke-width="2" stroke-linecap="round"/></g>
      <path d="M140 194 l-3 8 l-4 -6 Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <!-- สร้อยทอง + เหรียญ "เฮ้" -->
      <path d="M58 202 Q120 250 182 202" fill="none" stroke="url(#${g('gold')})" stroke-width="6" stroke-dasharray="6 3" stroke-linecap="round"/>
      <path d="M58 202 Q120 250 182 202" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".5" stroke-dasharray="6 3"/>
      <circle cx="120" cy="238" r="16" fill="url(#${g('gold')})" stroke="${INK}" stroke-width="3.5"/>
      <text x="120" y="244" text-anchor="middle" font-size="15" font-weight="800" fill="${INK}" font-family="Kanit, system-ui, sans-serif">เฮ้</text>
    </g>

    <!-- ===== ลุคผ้าโพกหัวขยิบตา ===== -->
    <g class="face look-wink">
      <path d="M${X0 - 3} 104 A${RX + 3} ${RY} 0 0 0 ${X1 + 3} 104 L${X1 + 3} 128 A${RX + 3} ${RY} 0 0 1 ${X0 - 3} 128 Z" fill="#1b1b1f" stroke="${INK}" stroke-width="4"/>
      <g fill="#fff">
        <circle cx="66" cy="124" r="2.6"/><circle cx="84" cy="130" r="2.2"/><circle cx="104" cy="134" r="2.6"/>
        <circle cx="136" cy="134" r="2.2"/><circle cx="156" cy="130" r="2.6"/><circle cx="174" cy="124" r="2.2"/>
        <path d="M120 128 l3 -6 l3 6 l-3 6 Z M114 131 l6 -3 l0 6 Z M126 131 l-6 -3 l0 6 Z"/>
      </g>
      <path d="M196 116 q14 -6 22 4 q-10 0 -14 10 Z" fill="#1b1b1f" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- ตาซ้ายขยิบ ตาขวาโต -->
      <path d="M76 168 q12 -10 26 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M78 150 l20 6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <g class="eyes">
        <ellipse cx="148" cy="166" rx="17" ry="19" fill="#fff" stroke="${INK}" stroke-width="4"/>
        <circle cx="152" cy="168" r="9" fill="${INK}"/>
        <circle cx="155" cy="164" r="3" fill="#fff"/>
      </g>
      <path d="M132 144 q16 -8 32 2" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="78" cy="190" rx="10" ry="6" fill="${C.blush}" opacity=".8"/>
      <!-- ยิ้มกว้าง ฟันทอง แลบลิ้น -->
      <path d="M92 192 Q120 230 160 190 Q124 202 92 192 Z" fill="#5a0309" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M98 194 Q124 202 154 192 l-2 6 Q124 207 100 199 Z" fill="#fff"/>
      <rect x="134" y="194" width="8" height="7" rx="1.5" fill="url(#${g('gold')})" stroke="${INK}" stroke-width="1.5"/>
      <g class="tongue"><path d="M112 206 q0 20 14 20 q12 -2 10 -20 Z" fill="${C.tongue}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>
      <!-- หัวกะโหลกกราฟฟิตี้ -->
      <g fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".8">
        <circle cx="168" cy="222" r="7"/><path d="M164 230 h8 M160 236 l16 -8 M160 228 l16 8"/>
      </g>
    </g>
  </g>
  </g>
</svg>`;
}
