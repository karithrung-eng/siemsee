import type { Participant, Role } from '../logic/types';
import { seatAngle } from '../logic/seats';

// ผังวง: เลข 1 อยู่ด้านบน เรียงตามเข็มนาฬิกา (กติกาเดียวกับ logic/seats.ts)

export const MARK: Record<Role, string> = { main: '★', partner: '◆', group: '✓' };

export interface CircleOpts {
  n: number;
  participants?: Participant[];
  drawn?: number;
  names?: string[];
  roleText?: Record<Role, string>;
  /** แสดงลูกศรทิศตามเข็มนาฬิกา + ป้ายซ้าย/ขวา (ใช้ในหน้าตั้งวง) */
  guide?: boolean;
  onSeat?: (seat: number) => void;
  label?: string;
}

const NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export function seatGeometry(n: number) {
  // วงใหญ่ขยายรัศมีออก ให้การ์ดเลขใหญ่ที่สุดเท่าที่ไม่ชนกันและไม่ล้นกรอบ
  let ring = 78;
  let size = 23;
  for (let i = 0; i < 4; i++) {
    size = Math.min(23, ring * Math.sin(Math.PI / n) * 0.92);
    ring = Math.min(92, 105 - size * 1.3);
  }
  return { ring, size };
}

export function circleSVG(o: CircleOpts): SVGSVGElement {
  const { n } = o;
  const s = el('svg', { viewBox: '-9 -9 218 218', class: 'seat-circle', role: 'group', 'aria-label': o.label ?? `ผังวง ${n} คน` });
  const { ring, size } = seatGeometry(n);
  s.append(el('circle', { cx: 100, cy: 100, r: ring, fill: 'none', stroke: '#3a3a3a', 'stroke-width': 2, 'stroke-dasharray': '3 5' }));

  if (o.guide) {
    // ลูกศรตามเข็มนาฬิกาตรงกลาง
    const r = Math.max(26, ring - size - 16);
    const a0 = -70;
    const a1 = 60;
    const pt = (a: number) => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)];
    const [x0, y0] = pt(a0);
    const [x1, y1] = pt(a1);
    s.append(el('path', { d: `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`, fill: 'none', stroke: '#FFD23F', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    const ah = pt(a1 + 1);
    const ang = a1 + 90;
    s.append(
      el('path', {
        d: 'M-6 -5 L4 0 L-6 5 Z',
        fill: '#FFD23F',
        transform: `translate(${ah[0]} ${ah[1]}) rotate(${ang - 90})`,
      }),
    );
    const t = el('text', { x: 100, y: 104, 'text-anchor': 'middle', 'font-size': 10, fill: '#FFF4DC', 'font-weight': 600 });
    t.textContent = 'ตามเข็มนาฬิกา';
    s.append(t);
  }

  const parts = new Map((o.participants ?? []).map((p) => [p.seat, p.role]));
  for (let seat = 1; seat <= n; seat++) {
    const a = (seatAngle(seat, n) * Math.PI) / 180;
    const cx = 100 + ring * Math.sin(a);
    const cy = 100 - ring * Math.cos(a);
    const role = parts.get(seat);
    const nm = o.names?.[seat - 1]?.trim();
    const g = el('g', { class: `seat${role ? ' on ' + role : ''}${o.drawn === seat ? ' drawn' : ''}`, 'data-seat': seat });
    const desc = [`เบอร์ ${seat}`, nm, role ? (o.roleText?.[role] ?? 'ต้องทำ') : null, o.drawn === seat ? 'เลขที่สุ่มได้' : null].filter(Boolean).join(' · ');
    if (o.onSeat) {
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      const fire = () => o.onSeat!(seat);
      g.addEventListener('click', fire);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fire();
        }
      });
    } else {
      g.setAttribute('role', 'img');
    }
    g.setAttribute('aria-label', desc);
    const w = size * 1.75;
    if (o.drawn === seat && !role) {
      g.append(el('rect', { x: cx - w / 2 - 4, y: cy - w / 2 - 4, width: w + 8, height: w + 8, rx: 9, fill: 'none', stroke: '#FF3EA5', 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }));
    }
    g.append(el('rect', { class: 'seat-shadow', x: cx - w / 2 + 2.5, y: cy - w / 2 + 2.5, width: w, height: w, rx: 7 }));
    g.append(el('rect', { class: 'seat-card', x: cx - w / 2, y: cy - w / 2, width: w, height: w, rx: 7 }));
    const t = el('text', { class: 'seat-num', x: cx, y: cy + size * 0.36, 'text-anchor': 'middle', 'font-size': (size * (seat >= 10 ? 0.98 : 1.12)).toFixed(1) });
    t.textContent = String(seat);
    g.append(t);
    if (role) {
      const bx = cx + w / 2 - 1;
      const by = cy - w / 2 + 1;
      const br = Math.max(5.5, size * 0.42);
      g.append(el('circle', { class: 'seat-badge', cx: bx, cy: by, r: br }));
      const m = el('text', { class: 'seat-mark', x: bx, y: by + br * 0.4, 'text-anchor': 'middle', 'font-size': (br * 1.2).toFixed(1) });
      m.textContent = MARK[role];
      g.append(m);
    }
    if (nm) {
      // จุดเล็กบอกว่ามีชื่อ แตะเพื่อดู
      g.append(el('circle', { class: 'seat-named', cx: cx - w / 2 + 4, cy: cy + w / 2 - 4, r: 2.2 }));
    }
    s.append(g);
  }
  return s;
}
