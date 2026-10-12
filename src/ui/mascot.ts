// มาสคอต "น้องซี้" — กระบอกเซียมซีขนฟูหน้ากวน ตาปรือ แลบลิ้น มือ/เท้าปอมปอม เต้นดุ๊กดิ๊กตอนว่าง
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

let uid = 0;

/** ปอมปอมขนฟู: วงกลมสี + เงา + ไฮไลต์ แล้วใส่ฟิลเตอร์ขนทั้งก้อน */
function pom(cx: number, cy: number, r: number, color: string, fur: string) {
  return `<g filter="url(#${fur})">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>
      <circle cx="${cx + r * 0.18}" cy="${cy + r * 0.22}" r="${r * 0.8}" fill="${C.ink}" opacity=".18"/>
      <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.32}" r="${r * 0.42}" fill="#fff" opacity=".45"/>
    </g>`;
}

export function mascotSVG(opts: MascotOpts = {}): string {
  const title = opts.title ?? 'น้องซี้ กระบอกเซียมซีหน้ากวน';
  // id ไม่ซ้ำ เผื่อมีมาสคอตหลายตัวในหน้าเดียว
  const id = `m${++uid}`;
  const fur = `${id}-fur`;
  const furSoft = `${id}-fur-soft`;
  const fuzz = `${id}-fuzz`;
  const shag = `${id}-shag`;
  const shape = `${id}-shape`;
  const pick = opts.pickStick
    ? `<g class="pick-stick">
        <rect x="111" y="112" width="26" height="150" rx="8" fill="${C.stick}" stroke="${C.ink}" stroke-width="5"/>
        <circle cx="124" cy="122" r="25" fill="${C.cream}" stroke="${C.ink}" stroke-width="5"/>
        <text class="pick-num" x="124" y="132" text-anchor="middle" font-size="28" font-weight="800" fill="${C.ink}" font-family="Kanit, system-ui, sans-serif">?</text>
      </g>`
    : '';
  return `<svg class="mascot ${opts.className ?? ''}" viewBox="-30 -52 296 372" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <defs>
    <!-- ขอบขนฟู: สุ่มเลื่อนพิกเซลรอบขอบให้เป็นเส้นขนเล็ก ๆ -->
    <filter id="${fur}" x="-25%" y="-25%" width="150%" height="150%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- ขนยาวสำหรับปอมปอม/ขอบนอก -->
    <filter id="${shag}" x="-35%" y="-35%" width="170%" height="170%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="${furSoft}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="8" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- ลายขนบนตัว: จุดสว่าง/มืดละเอียด วางทับแบบ soft-light -->
    <filter id="${fuzz}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.55 1.6" numOctaves="3" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.2 -1.05"/>
    </filter>
    <clipPath id="${shape}"><rect x="50" y="90" width="140" height="186" rx="26"/></clipPath>
  </defs>
  <g class="mascot-dance">
  <g class="mascot-shake">
    <g class="sticks">${sticks()}</g>
    ${pick}
    <!-- เท้าปอมปอม -->
    <g class="foot foot-l">${pom(88, 284, 20, C.cream, shag)}</g>
    <g class="foot foot-r">${pom(152, 284, 20, C.cream, shag)}</g>
    <!-- เงาทึบแบบสติกเกอร์ -->
    <g filter="url(#${furSoft})"><rect x="58" y="98" width="140" height="186" rx="26" fill="${C.ink}"/></g>
    <!-- ตัวกระบอกขนฟู -->
    <g class="body">
      <!-- ปุยขนยาวรอบตัว -->
      <g filter="url(#${shag})">
        <rect x="46" y="86" width="148" height="194" rx="30" fill="${C.ink}"/>
      </g>
      <g filter="url(#${shag})">
        <rect x="52" y="92" width="136" height="182" rx="24" fill="${C.red}"/>
      </g>
      <g filter="url(#${fur})">
        <rect x="56" y="96" width="128" height="174" rx="22" fill="${C.red}"/>
      </g>
      <g clip-path="url(#${shape})">
        <rect x="50" y="90" width="140" height="186" filter="url(#${fuzz})" opacity=".5" style="mix-blend-mode:soft-light"/>
        <ellipse cx="96" cy="140" rx="34" ry="60" fill="#fff" opacity=".12"/>
      </g>
      <g filter="url(#${furSoft})">
        <ellipse cx="120" cy="92" rx="70" ry="15" fill="${C.redDark}" stroke="${C.ink}" stroke-width="5"/>
        ${shrineBand(108, 24)}
        ${shrineBand(238, 22)}
      </g>
    </g>
    <!-- แขนซ้าย (โบกมือ) มือเป็นปอมปอม -->
    <g class="arm arm-l">
      <path d="M54 196 C30 196 18 176 16 150" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
      ${pom(16, 134, 25, C.yellow, shag)}
    </g>
    <!-- แขนขวา (เท้าเอว) -->
    <g class="arm arm-r">
      <path d="M186 186 C214 186 222 204 210 222" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
      ${pom(210, 230, 24, C.pink, shag)}
    </g>
    <!-- หน้า: ตาปรือ คิ้วกวน -->
    <g class="face">
      <g class="brows">
        <path d="M78 150 L104 144" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
        <path d="M134 140 L160 146" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      </g>
      <g class="eyes">
        <path d="M76 166 A16 14 0 0 0 108 166 Z" fill="#fff" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M132 166 A16 14 0 0 0 164 166 Z" fill="#fff" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="96" cy="171" r="5.5" fill="${C.ink}"/>
        <circle cx="152" cy="171" r="5.5" fill="${C.ink}"/>
        <path d="M73 166 H111 M129 166 H167" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
      </g>
      <ellipse cx="74" cy="192" rx="11" ry="7" fill="${C.blush}" filter="url(#${furSoft})"/>
      <ellipse cx="166" cy="192" rx="11" ry="7" fill="${C.blush}" filter="url(#${furSoft})"/>
      <!-- ยิ้มมุมปาก + แลบลิ้น -->
      <g class="tongue">
        <path d="M128 213 v9 a8 8 0 0 0 16 0 v-11" fill="${C.tongue}" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M136 214 v8" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
      </g>
      <path d="M102 206 Q124 220 150 204" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
    </g>
  </g>
  </g>
</svg>`;
}
