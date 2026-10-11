// เสียงประกอบสังเคราะห์ด้วย Web Audio — ไม่ต้องโหลดไฟล์เสียง

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** เรียกครั้งแรกจากการแตะของผู้ใช้ เพื่อปลดล็อกเสียงบน iOS */
export function unlockAudio() {
  ac();
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** เสียงไม้กระทบกันในกระบอก */
export function clack(delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * 0.05);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800 + Math.random() * 900;
  bp.Q.value = 3;
  const g = a.createGain();
  g.gain.value = 0.5;
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t);
}

export function rattle(ms: number) {
  const n = Math.max(3, Math.round(ms / 110));
  for (let i = 0; i < n; i++) clack((i * ms) / n / 1000 + Math.random() * 0.03);
}

export function pop() {
  tone(320, 0.18, 'triangle', 0.25, 0, 760);
}

export function ding() {
  tone(880, 0.35, 'sine', 0.22);
  tone(1320, 0.4, 'sine', 0.12, 0.06);
}

export function tap() {
  tone(520, 0.06, 'square', 0.05);
}
