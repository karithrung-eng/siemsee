import { clack, ding, pop, rattle, setMuted, tap, unlockAudio } from '../audio/sound';
import { attachDragShake, listenDeviceShake, motionSupported, requestMotionPermission } from '../input/shake';
import { amountLabel, doersLine, renderText, roleLabels } from '../logic/format';
import { CATEGORIES, type Role, type RoundResult } from '../logic/types';
import { TIMING, type Game, type Phase } from '../state/game';
import { store } from '../state/store';
import { MARK, circleSVG } from './circle';
import { h, svg, toast } from './dom';
import { mascotSVG } from './mascot';

let motionOn = false; // ไม่บันทึก — ต้องขออนุญาตใหม่ทุกครั้งที่เปิดหน้า

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function playScreen(game: Game, onBack: () => void): { el: HTMLElement; destroy: () => void } {
  const cleanups: (() => void)[] = [];
  const n = game.n;

  // ---------- แถบบน
  const back = h('button', { class: 'icon-btn back-btn', type: 'button', 'aria-label': 'กลับไปตั้งวงใหม่' }, '←');
  const roundEl = h('span', { class: 'round' });
  const catChip = h('span', { class: 'chip' });
  const mute = h('button', { class: 'icon-btn', type: 'button' });
  const paintMute = () => {
    mute.textContent = store.data.muted ? '🔇' : '🔊';
    mute.setAttribute('aria-label', store.data.muted ? 'เปิดเสียง' : 'ปิดเสียง');
    mute.setAttribute('aria-pressed', String(store.data.muted));
  };
  paintMute();
  mute.addEventListener('click', () => {
    store.update((s) => (s.muted = !s.muted));
    setMuted(store.data.muted);
    unlockAudio();
    tap();
    paintMute();
  });
  back.addEventListener('click', onBack);
  const topbar = h('header', { class: 'topbar' }, back, h('div', { class: 'topbar-mid' }, roundEl, catChip), mute);

  // ---------- เวที (กระบอก)
  const mascot = svg(mascotSVG({ pickStick: true, title: 'กระบอกเซียมซี ลากซ้ายขวาเพื่อเขย่า' }));
  const shaker = h('div', { class: 'shaker', 'aria-hidden': 'false' }, h('div', { class: 'shaker-tilt' }, mascot));
  const bubble = h('div', { class: 'bubble', role: 'status', 'aria-live': 'assertive' });
  const shakeBtn = h('button', { class: 'btn btn-primary btn-xl shake-btn', type: 'button' }, 'เขย่าเลย!');
  const motionBtn = h('button', { class: 'link-btn motion-btn', type: 'button', 'aria-pressed': String(motionOn) });
  const paintMotion = () => {
    motionBtn.textContent = motionOn ? '📳 เขย่าเครื่องจริง: เปิด' : '📳 เปิดเขย่าเครื่องจริง';
    motionBtn.setAttribute('aria-pressed', String(motionOn));
  };
  paintMotion();
  const hint = h('p', { class: 'hint' }, 'ลากกระบอกซ้าย–ขวา กดปุ่ม หรือกด Space');
  const stage = h('section', { class: 'stage', 'aria-label': 'กระบอกเซียมซี' }, shaker, bubble, h('div', { class: 'stage-actions' }, shakeBtn, hint, motionSupported() ? motionBtn : null));

  // ---------- ผลลัพธ์
  const doers = h('p', { class: 'doers' });
  const command = h('h2', { class: 'command', tabindex: '-1' });
  const amountWrap = h('div', { class: 'amount', role: 'group', 'aria-label': 'จำนวน' });
  const note = h('p', { class: 'note' });
  const card = h(
    'article',
    { class: 'card', 'aria-live': 'polite' },
    h('p', { class: 'card-label' }, 'คนที่ต้องทำ'),
    doers,
    command,
    amountWrap,
    note,
  );
  const circleBox = h('div', { class: 'circle-box' });
  const legend = h('div', { class: 'legend', 'aria-hidden': 'true' });
  const circleWrap = h('div', { class: 'circle-wrap' }, circleBox, legend);
  const scroll = h('div', { class: 'result-scroll' }, card, circleWrap);
  const skipBtn = h('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'ข้ามคำสั่งนี้' }, 'ข้าม ♡');
  const nextBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'รอบต่อไป →');
  const result = h('section', { class: 'result', 'aria-label': 'ผลเซียมซี' }, scroll, h('footer', { class: 'result-actions' }, skipBtn, nextBtn));

  const root = h('div', { class: 'screen play', 'data-phase': 'idle' }, topbar, stage, result);
  // วงใหญ่ต้องการพื้นที่ผังมากขึ้น
  root.dataset.ring = n > 16 ? 'l' : n > 10 ? 'm' : 's';

  const pickNum = mascot.querySelector('.pick-num') as SVGTextElement;
  const tilt = mascot.closest('.shaker-tilt') as HTMLElement;

  // ---------- การวาดผล
  const paintTop = (phase: Phase, r?: RoundResult) => {
    const showing = phase === 'idle' ? game.round + 1 : game.round;
    roundEl.textContent = `รอบ ${showing}`;
    if (r && phase === 'result') {
      const cat = CATEGORIES.find((c) => c.id === r.card.category)!;
      catChip.textContent = `${cat.emoji} ${cat.short}`;
      catChip.className = `chip chip-${cat.id}`;
    } else {
      catChip.textContent = phase === 'idle' ? 'พร้อมเขย่า' : 'กำลังลุ้น…';
      catChip.className = 'chip';
    }
  };

  const paintResult = (r: RoundResult) => {
    const names = store.data.names;
    doers.textContent = doersLine(r, n, names);
    command.textContent = renderText(r);
    const amt = amountLabel(r.card.amount);
    amountWrap.replaceChildren();
    amountWrap.hidden = !amt;
    if (amt) amountWrap.append(h('span', { class: 'amount-k' }, 'จำนวน'), h('span', { class: 'amount-v' }, amt));
    note.textContent = r.card.note ?? '';
    note.hidden = !r.card.note;

    const roles = roleLabels(r.card);
    const isChoose = r.card.target === 'choose';
    circleBox.replaceChildren(
      circleSVG({
        n,
        participants: r.participants,
        drawn: r.drawn,
        names,
        roleText: roles,
        label: `ผังวง ${n} คน ผู้เกี่ยวข้อง: ${doers.textContent}`,
        onSeat: (seat) => {
          if (isChoose) {
            tap();
            game.choose(game.current?.chosen === seat ? undefined : seat);
            if (game.current) paintResult(game.current);
            return;
          }
          const nm = store.name(seat);
          toast(nm ? `เบอร์ ${seat} · ${nm}` : `เบอร์ ${seat}`);
        },
      }),
    );
    const present = new Set(r.participants.map((p) => p.role));
    const items: HTMLElement[] = (['main', 'partner', 'group'] as Role[])
      .filter((k) => present.has(k))
      .map((k) => h('span', { class: `lg lg-${k}` }, h('b', {}, MARK[k]), ' ', roles[k]));
    if (!r.participants.some((p) => p.seat === r.drawn)) items.push(h('span', { class: 'lg lg-drawn' }, h('b', {}, '◌'), ` สุ่มได้ ${r.drawn}`));
    if (isChoose) items.push(h('span', { class: 'lg lg-tip' }, r.chosen === undefined ? 'แตะเลขเพื่อเลือก' : 'แตะอีกครั้งเพื่อเปลี่ยน'));
    legend.replaceChildren(...items);
  };

  game.onPhase = (phase, r) => {
    root.dataset.phase = phase;
    paintTop(phase, r);
    switch (phase) {
      case 'shaking':
        if (r) pickNum.textContent = String(r.drawn);
        bubble.textContent = '';
        root.style.setProperty('--stick-dur', `${Math.round(TIMING[timingKey()].stick * 0.85)}ms`);
        rattle(TIMING[timingKey()].shake);
        break;
      case 'stick':
        pop();
        break;
      case 'number':
        if (r) bubble.textContent = `สุ่มได้เบอร์ ${r.drawn}`;
        ding();
        break;
      case 'result':
        if (r) paintResult(r);
        scroll.scrollTop = 0;
        command.focus({ preventScroll: true });
        break;
      case 'idle':
        bubble.textContent = '';
        pickNum.textContent = '?';
        break;
    }
  };

  const timingKey = () => (reducedMotion() ? 'reduced' : store.data.mode);

  const doRoll = () => {
    unlockAudio();
    if (game.phase !== 'idle') return;
    game.roll(TIMING[timingKey()]);
  };
  const doNext = (skipped: boolean) => {
    if (game.phase !== 'result') return;
    tap();
    game.next(skipped);
    // เล่นเร็ว: พร้อมเขย่าทันที โฟกัสปุ่มเขย่า
    shakeBtn.focus({ preventScroll: true });
  };

  shakeBtn.addEventListener('click', doRoll);
  nextBtn.addEventListener('click', () => doNext(false));
  skipBtn.addEventListener('click', () => doNext(true));

  cleanups.push(
    attachDragShake(shaker, {
      canShake: () => game.phase === 'idle',
      onTilt: (deg) => tilt.style.setProperty('--tilt', `${deg}deg`),
      onReverse: () => clack(),
      onShake: doRoll,
    }),
  );

  let stopMotion: (() => void) | null = null;
  const startMotion = () => {
    stopMotion?.();
    stopMotion = listenDeviceShake(() => {
      if (game.phase === 'idle') doRoll();
    });
  };
  if (motionOn) startMotion();
  motionBtn.addEventListener('click', async () => {
    if (motionOn) {
      motionOn = false;
      stopMotion?.();
      stopMotion = null;
      paintMotion();
      return;
    }
    const res = await requestMotionPermission();
    if (res === 'granted') {
      motionOn = true;
      startMotion();
      toast('เขย่ามือถือได้เลย (ปุ่มยังใช้ได้เสมอ)');
    } else if (res === 'denied') {
      toast('ไม่ได้รับอนุญาตให้ใช้การเขย่าเครื่อง ใช้ปุ่มหรือการลากแทนได้');
    } else {
      toast('อุปกรณ์นี้ไม่รองรับการเขย่าเครื่อง ใช้ปุ่มแทนได้');
    }
    paintMotion();
  });
  cleanups.push(() => stopMotion?.());

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
      return;
    }
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, button, [role="button"], a')) return;
    if (game.phase === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      doRoll();
    } else if (game.phase === 'result' && (e.key === 'Enter' || e.key === 'ArrowRight')) {
      e.preventDefault();
      doNext(false);
    }
  };
  document.addEventListener('keydown', onKey);
  cleanups.push(() => document.removeEventListener('keydown', onKey));

  paintTop('idle');
  return {
    el: root,
    destroy: () => {
      game.onPhase = () => {};
      cleanups.forEach((f) => f());
    },
  };
}
