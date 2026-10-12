// มาสคอต "น้องซี้" — กระบอกเซียมซีตุ๊กตาขนฟูแบบ 3D หน้ากวน ตาปรือ คิ้วยัก ยิ้มมุมปากแลบลิ้น
// มือ/เท้าเป็นปอมปอม เต้นดุ๊กดิ๊กตอนว่าง
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

// รูปทรงกระบอก: ขอบซ้าย/ขวา ปากกระบอกเป็นวงรี
const X0 = 44;
const X1 = 196;
const CX = (X0 + X1) / 2;
const RX = (X1 - X0) / 2;
const RY = 18;
const TOP = 96;
const BOTTOM = 276;

/** ความโค้งของผิวกระบอกที่ตำแหน่ง x (0 ที่ขอบ, RY ตรงกลาง) */
const sag = (x: number) => RY * Math.sqrt(Math.max(0, 1 - ((x - CX) / RX) ** 2));

const BODY_PATH = `M${X0} ${TOP} L${X0} ${BOTTOM - 44} Q${X0} ${BOTTOM} ${X0 + 44} ${BOTTOM} L${X1 - 44} ${BOTTOM} Q${X1} ${BOTTOM} ${X1} ${BOTTOM - 44} L${X1} ${TOP} A${RX} ${RY} 0 0 1 ${X0} ${TOP} Z`;

/** ลายขอบศาลเจ้าแบบโค้งตามผิวกระบอก: แถบเหลืองมีฟันปลาแดง */
function shrineBand(y: number, h: number) {
  const band = `M${X0} ${y} A${RX} ${RY} 0 0 0 ${X1} ${y} L${X1} ${y + h} A${RX} ${RY} 0 0 1 ${X0} ${y + h} Z`;
  const teeth: string[] = [];
  const step = 16;
  for (let x = X0 - 4; x < X1; x += step) {
    const xm = x + step / 2;
    const xe = x + step;
    teeth.push(
      `M${x} ${(y + h - 3 + sag(x)).toFixed(1)} L${xm} ${(y + 5 + sag(xm)).toFixed(1)} L${xe} ${(y + h - 3 + sag(xe)).toFixed(1)} Z`,
    );
  }
  return `<path d="${band}" fill="${C.yellow}"/>
    <path d="${teeth.join(' ')}" fill="${C.red}"/>
    <path d="M${X0} ${y} A${RX} ${RY} 0 0 0 ${X1} ${y} M${X0} ${y + h} A${RX} ${RY} 0 0 0 ${X1} ${y + h}" fill="none" stroke="#7a0b12" stroke-width="2.5" opacity=".55"/>`;
}

function sticks(grad: string) {
  const list = [
    { x: 82, top: 40, rot: -10 },
    { x: 104, top: 26, rot: -4 },
    { x: 124, top: 34, rot: 2 },
    { x: 144, top: 22, rot: 7 },
    { x: 162, top: 42, rot: 12 },
  ];
  return list
    .map(
      (s) => `<g transform="rotate(${s.rot} ${s.x} 120)">
        <rect x="${s.x - 7}" y="${s.top}" width="14" height="96" rx="6" fill="url(#${grad})"/>
        <rect x="${s.x - 7}" y="${s.top}" width="14" height="15" rx="6" fill="${C.red}"/>
        <rect x="${s.x - 4}" y="${s.top + 3}" width="3" height="9" rx="1.5" fill="#fff" opacity=".5"/>
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

let uid = 0;

/** สีอ่อน/เข้มลงจากสีหลัก (hex 6 หลัก) */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  const r = ch(n >> 16);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function mascotSVG(opts: MascotOpts = {}): string {
  const title = opts.title ?? 'น้องซี้ กระบอกเซียมซีขนฟู';
  // id ไม่ซ้ำ เผื่อมีมาสคอตหลายตัวในหน้าเดียว
  const id = `m${++uid}`;
  const fur = `${id}-fur`;
  const shag = `${id}-shag`;
  const fuzz = `${id}-fuzz`;
  const soft = `${id}-soft`;
  const clip = `${id}-clip`;
  const g = (name: string) => `${id}-${name}`;

  // ปอมปอมทรงกลม 3D: ไล่เฉดจากจุดสว่างมุมซ้ายบน
  const pomGrads: string[] = [];
  const pom = (cx: number, cy: number, r: number, color: string) => {
    const gid = g(`pom${pomGrads.length}`);
    pomGrads.push(`<radialGradient id="${gid}" cx="42%" cy="38%" r="65%" fx="34%" fy="28%">
        <stop offset="0" stop-color="${shade(color, 0.55)}"/>
        <stop offset=".45" stop-color="${color}"/>
        <stop offset="1" stop-color="${shade(color, -0.45)}"/>
      </radialGradient>`);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid})" filter="url(#${shag})"/>`;
  };

  const pick = opts.pickStick
    ? `<g class="pick-stick">
        <rect x="111" y="140" width="26" height="130" rx="9" fill="url(#${g('stick')})"/>
        <circle cx="124" cy="150" r="25" fill="url(#${g('badge')})" stroke="#c98a2b" stroke-width="3"/>
        <text class="pick-num" x="124" y="160" text-anchor="middle" font-size="28" font-weight="800" fill="${C.ink}" font-family="Kanit, system-ui, sans-serif">?</text>
      </g>`
    : '';

  const handL = pom(18, 150, 24, C.yellow);
  const handR = pom(222, 196, 23, C.pink);
  const footL = pom(92, 280, 20, C.cream);
  const footR = pom(148, 280, 20, C.cream);

  return `<svg class="mascot ${opts.className ?? ''}" viewBox="-30 -52 296 372" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <defs>
    <!-- ขอบขนฟู: สุ่มเลื่อนพิกเซลรอบขอบให้เป็นเส้นขนเล็ก ๆ -->
    <filter id="${fur}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- ขนยาวสำหรับปอมปอม -->
    <filter id="${shag}" x="-35%" y="-35%" width="170%" height="170%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- ลายขนบนผิว: จุดสว่างละเอียด -->
    <filter id="${fuzz}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6 1.5" numOctaves="3" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2 -1"/>
    </filter>
    <filter id="${soft}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    <clipPath id="${clip}"><path d="${BODY_PATH}"/></clipPath>
    <!-- แสงเงาทรงกระบอก: มืดที่ขอบ สว่างเป็นแถบด้านซ้าย -->
    <linearGradient id="${g('cyl')}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#3a0006" stop-opacity=".6"/>
      <stop offset=".14" stop-color="#3a0006" stop-opacity=".12"/>
      <stop offset=".3" stop-color="#fff" stop-opacity=".32"/>
      <stop offset=".42" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".72" stop-color="#3a0006" stop-opacity=".08"/>
      <stop offset="1" stop-color="#3a0006" stop-opacity=".7"/>
    </linearGradient>
    <linearGradient id="${g('cylv')}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".75" stop-color="#3a0006" stop-opacity="0"/>
      <stop offset="1" stop-color="#3a0006" stop-opacity=".45"/>
    </linearGradient>
    <radialGradient id="${g('hole')}" cx="50%" cy="65%" r="60%">
      <stop offset="0" stop-color="#2a0306"/>
      <stop offset="1" stop-color="#6e0a11"/>
    </radialGradient>
    <linearGradient id="${g('stick')}" x1="0" x2="1">
      <stop offset="0" stop-color="#c98a2b"/>
      <stop offset=".35" stop-color="#ffe0a0"/>
      <stop offset="1" stop-color="#b8792a"/>
    </linearGradient>
    <radialGradient id="${g('badge')}" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#f3dfb6"/>
    </radialGradient>
    <radialGradient id="${g('eye')}" cx="45%" cy="40%" r="65%">
      <stop offset="0" stop-color="#3b2a4a"/>
      <stop offset="1" stop-color="#0b0710"/>
    </radialGradient>
    <radialGradient id="${g('arm')}" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ff5a60"/>
      <stop offset="1" stop-color="#9e1018"/>
    </radialGradient>
    <clipPath id="${g('eyeclipL')}"><ellipse cx="95" cy="175" rx="15.5" ry="18.5"/></clipPath>
    <clipPath id="${g('eyeclipR')}"><ellipse cx="145" cy="175" rx="15.5" ry="18.5"/></clipPath>
    <linearGradient id="${g('lid')}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#ff5a60"/>
      <stop offset="1" stop-color="#c8141d"/>
    </linearGradient>
    POMGRADS
  </defs>
  <!-- เงาบนพื้น -->
  <ellipse class="ground" cx="120" cy="300" rx="78" ry="11" fill="#000" opacity=".45" filter="url(#${soft})"/>
  <g class="mascot-dance">
  <g class="mascot-shake">
    <!-- ปากกระบอก (ด้านใน) อยู่หลังไม้ -->
    <ellipse cx="${CX}" cy="${TOP}" rx="${RX}" ry="${RY}" fill="url(#${g('hole')})" filter="url(#${fur})"/>
    <g class="sticks">${sticks(g('stick'))}</g>
    ${pick}
    <!-- เท้าปอมปอม -->
    <g class="foot foot-l">${footL}</g>
    <g class="foot foot-r">${footR}</g>
    <!-- แขนซ้าย (โบกมือ) -->
    <g class="arm arm-l">
      <path d="M52 186 C32 184 22 172 20 160" fill="none" stroke="url(#${g('arm')})" stroke-width="15" stroke-linecap="round" filter="url(#${fur})"/>
      ${handL}
    </g>
    <!-- แขนขวา -->
    <g class="arm arm-r">
      <path d="M188 192 C202 194 210 196 216 196" fill="none" stroke="url(#${g('arm')})" stroke-width="15" stroke-linecap="round" filter="url(#${fur})"/>
      ${handR}
    </g>
    <!-- ตัวกระบอกตุ๊กตาขนฟู -->
    <g class="body">
      <g filter="url(#${fur})">
        <path d="${BODY_PATH}" fill="${C.red}"/>
        <g clip-path="url(#${clip})">
          ${shrineBand(104, 22)}
          ${shrineBand(236, 22)}
          <rect x="${X0}" y="70" width="${X1 - X0}" height="${BOTTOM - 70}" fill="url(#${g('cyl')})"/>
          <rect x="${X0}" y="70" width="${X1 - X0}" height="${BOTTOM - 70}" fill="url(#${g('cylv')})"/>
          <rect x="${X0}" y="70" width="${X1 - X0}" height="${BOTTOM - 70}" filter="url(#${fuzz})" opacity=".28"/>
        </g>
      </g>
      <!-- ขอบปากกระบอกด้านหน้า -->
      <path d="M${X0} ${TOP} A${RX} ${RY} 0 0 0 ${X1} ${TOP}" fill="none" stroke="#ff6d72" stroke-width="5" stroke-linecap="round" opacity=".8" filter="url(#${fur})"/>
    </g>
    <!-- หน้า: ตากลมโตเป็นประกาย แก้มแดง ยิ้มแลบลิ้น -->
    <g class="face" transform="translate(0 6)">
      <ellipse cx="82" cy="196" rx="14" ry="8" fill="${C.blush}" opacity=".85" filter="url(#${soft})"/>
      <ellipse cx="158" cy="196" rx="14" ry="8" fill="${C.blush}" opacity=".85" filter="url(#${soft})"/>
      <!-- คิ้วกวน: ซ้ายยักขึ้น ขวากดลง -->
      <g class="brows" fill="none" stroke="#4a0309" stroke-width="5" stroke-linecap="round">
        <path d="M80 146 Q94 136 108 146"/>
        <path d="M132 155 Q146 151 160 152"/>
      </g>
      <g class="eyes">
        <ellipse cx="95" cy="175" rx="15" ry="18" fill="url(#${g('eye')})"/>
        <ellipse cx="145" cy="175" rx="15" ry="18" fill="url(#${g('eye')})"/>
        <!-- ตาปรือ: เปลือกตาบนปิดครึ่ง -->
        <g clip-path="url(#${g('eyeclipL')})"><path d="M76 150 H114 V170 Q95 166 76 171 Z" fill="url(#${g('lid')})"/></g>
        <g clip-path="url(#${g('eyeclipR')})"><path d="M126 150 H164 V172 Q145 170 126 173 Z" fill="url(#${g('lid')})"/></g>
        <path d="M78 171 Q95 166 112 170" fill="none" stroke="#2a0207" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M128 173 Q145 170 162 172" fill="none" stroke="#2a0207" stroke-width="3.5" stroke-linecap="round"/>
        <!-- แววตาเหล่ไปด้านข้าง -->
        <circle cx="102" cy="178" r="4.5" fill="#fff"/>
        <circle cx="152" cy="180" r="4.5" fill="#fff"/>
        <circle cx="90" cy="186" r="2" fill="#fff" opacity=".8"/>
        <circle cx="140" cy="187" r="2" fill="#fff" opacity=".8"/>
      </g>
      <!-- ยิ้มมุมปากเบี้ยว + แลบลิ้นข้างขวา -->
      <g class="tongue">
        <path d="M128 205 l1 8 a6.5 6.5 0 0 0 13 -1 l-2 -10" fill="${C.tongue}"/>
        <path d="M134.5 207 v6" stroke="#c42d5a" stroke-width="2" stroke-linecap="round"/>
      </g>
      <path d="M104 202 Q122 212 144 199" fill="none" stroke="#3a0006" stroke-width="4" stroke-linecap="round"/>
      <path d="M141 196 q5 1 6 5" fill="none" stroke="#3a0006" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g>
  </g>
</svg>`.replace('POMGRADS', pomGrads.join(''));
}
