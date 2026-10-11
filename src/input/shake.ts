// ตรวจการเขย่า: ลากซ้าย–ขวาบนกระบอก และเขย่าเครื่องจริง (เมื่อรองรับและอนุญาต)

export interface DragShakeHandlers {
  onTilt: (deg: number) => void;
  onReverse: () => void;
  onShake: () => void;
  canShake: () => boolean;
}

/** ลากกลับไปกลับมาครบ 3 ครั้ง (หรือลากรวมไกลพอ) = เขย่า */
export function attachDragShake(el: HTMLElement, h: DragShakeHandlers): () => void {
  let active = false;
  let lastX = 0;
  let startX = 0;
  let dir = 0;
  let extreme = 0;
  let reversals = 0;
  let travel = 0;
  let pid = -1;

  const down = (e: PointerEvent) => {
    if (!h.canShake()) return;
    active = true;
    pid = e.pointerId;
    startX = lastX = extreme = e.clientX;
    dir = 0;
    reversals = 0;
    travel = 0;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* บางเบราว์เซอร์ไม่รองรับ */
    }
  };
  const move = (e: PointerEvent) => {
    if (!active || e.pointerId !== pid) return;
    const x = e.clientX;
    const dx = x - lastX;
    travel += Math.abs(dx);
    lastX = x;
    h.onTilt(Math.max(-16, Math.min(16, (x - startX) * 0.18)));
    const d = Math.sign(dx);
    if (d === 0) return;
    if (dir === 0) {
      dir = d;
      extreme = x;
    } else if (d === dir) {
      extreme = x;
    } else if (Math.abs(x - extreme) > 14) {
      dir = d;
      extreme = x;
      reversals++;
      h.onReverse();
    }
    if (reversals >= 3 || travel > 420) {
      active = false;
      h.onTilt(0);
      h.onShake();
    }
  };
  const up = () => {
    if (!active) return;
    active = false;
    h.onTilt(0);
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
  };
}

export const motionSupported = () => typeof window !== 'undefined' && 'DeviceMotionEvent' in window;

/** ขออนุญาต (iOS 13+) — ต้องเรียกจากการแตะของผู้ใช้ */
export async function requestMotionPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!motionSupported()) return 'unsupported';
  const DME = (window as any).DeviceMotionEvent;
  if (typeof DME.requestPermission === 'function') {
    try {
      const r = await DME.requestPermission();
      return r === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
  return 'granted';
}

/** ฟังการเขย่าเครื่อง: แรงเปลี่ยนเร็ว 3 ครั้งใน 1 วินาที */
export function listenDeviceShake(onShake: () => void, onActivity?: () => void): () => void {
  let last: { x: number; y: number; z: number } | null = null;
  let peaks: number[] = [];
  let cooldown = 0;
  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const cur = { x: a.x, y: a.y, z: a.z };
    if (last) {
      const delta = Math.abs(cur.x - last.x) + Math.abs(cur.y - last.y) + Math.abs(cur.z - last.z);
      const now = performance.now();
      if (delta > 22 && now > cooldown) {
        peaks = peaks.filter((t) => now - t < 1000);
        peaks.push(now);
        onActivity?.();
        if (peaks.length >= 3) {
          peaks = [];
          cooldown = now + 1500;
          onShake();
        }
      }
    }
    last = cur;
  };
  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
