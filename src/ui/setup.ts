import { CATEGORIES } from '../logic/types';
import { MAX_PLAYERS, MIN_PLAYERS } from '../state/storage';
import { store } from '../state/store';
import { setMuted, tap, unlockAudio } from '../audio/sound';
import { circleSVG } from './circle';
import { h, svg, toast } from './dom';
import { mascotSVG } from './mascot';

export function logo(): HTMLElement {
  return h(
    'div',
    { class: 'logo' },
    h('div', { class: 'logo-mascot' }, svg(mascotSVG({ title: 'น้องซี้ มาสคอตเกมเซียมซี้' }))),
    h('div', { class: 'logo-text' }, h('h1', { class: 'logo-title' }, 'เซียมซี้!'), h('p', { class: 'logo-sub' }, 'เขย่าดวง ป่วนวง')),
  );
}

export function setupScreen(onStart: () => void): HTMLElement {
  const d = store.data;
  const root = h('div', { class: 'screen setup' });

  // ---- จำนวนคน
  const countOut = h('output', { class: 'count-num', 'aria-live': 'polite', id: 'player-count' }, d.playerCount);
  const minus = h('button', { class: 'step-btn', type: 'button', 'aria-label': 'ลดจำนวนคน' }, '−');
  const plus = h('button', { class: 'step-btn', type: 'button', 'aria-label': 'เพิ่มจำนวนคน' }, '+');
  const diagram = h('div', { class: 'seat-diagram' });
  const namesGrid = h('div', { class: 'names-grid' });

  const setCount = (n: number) => {
    n = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, n));
    store.update((s) => (s.playerCount = n));
    countOut.textContent = String(n);
    minus.toggleAttribute('disabled', n <= MIN_PLAYERS);
    plus.toggleAttribute('disabled', n >= MAX_PLAYERS);
    renderDiagram();
    renderNames();
  };
  minus.addEventListener('click', () => (tap(), setCount(store.data.playerCount - 1)));
  plus.addEventListener('click', () => (tap(), setCount(store.data.playerCount + 1)));

  const renderDiagram = () => {
    const n = store.data.playerCount;
    diagram.replaceChildren(
      circleSVG({
        n,
        guide: true,
        names: store.data.names,
        label: `แผนผังที่นั่ง ${n} คน เลข 1 อยู่ด้านบน เรียงตามเข็มนาฬิกา`,
        onSeat: (seat) => {
          const nm = store.name(seat);
          toast(nm ? `เบอร์ ${seat} · ${nm}` : `เบอร์ ${seat} (ยังไม่ใส่ชื่อ)`);
        },
      }),
    );
  };

  const renderNames = () => {
    const n = store.data.playerCount;
    namesGrid.replaceChildren(
      ...Array.from({ length: n }, (_, i) => {
        const id = `name-${i + 1}`;
        const input = h('input', {
          id,
          type: 'text',
          maxlength: 20,
          autocomplete: 'off',
          enterkeyhint: 'next',
          placeholder: 'ไม่ใส่ก็ได้',
          value: store.data.names[i] ?? '',
        });
        input.addEventListener('input', () =>
          store.update((s) => {
            while (s.names.length < i + 1) s.names.push('');
            s.names[i] = input.value;
          }),
        );
        input.addEventListener('change', renderDiagram);
        return h('label', { class: 'name-field', for: id }, h('span', { class: 'name-num' }, `เบอร์ ${i + 1}`), input);
      }),
    );
  };

  // ---- หมวด
  const reason = h('p', { class: 'start-reason', id: 'start-reason', role: 'status', 'aria-live': 'polite' });
  const startBtn = h('button', { class: 'btn btn-primary btn-xl', type: 'button', 'aria-describedby': 'start-reason' }, 'เริ่มเขย่า!');
  const consentBox = h('input', { type: 'checkbox', id: 'consent' }) as HTMLInputElement;
  consentBox.checked = store.closeConsent;
  const consentWrap = h(
    'label',
    { class: 'consent', for: 'consent' },
    consentBox,
    h('span', {}, h('b', {}, 'ทุกคนในวงอายุ 20 ปีขึ้นไป'), ' และตกลงเล่นหมวดใกล้ชิด (ใครไม่สะดวกข้ามได้ทุกใบ)'),
  );
  consentBox.addEventListener('change', () => {
    store.closeConsent = consentBox.checked;
    refreshStart();
  });

  const catList = h(
    'div',
    { class: 'cat-list', role: 'group', 'aria-label': 'หมวดคำสั่ง' },
    CATEGORIES.map((c) => {
      const cb = h('input', { type: 'checkbox', id: `cat-${c.id}`, class: 'cat-cb' }) as HTMLInputElement;
      cb.checked = store.data.categories[c.id];
      cb.addEventListener('change', () => {
        tap();
        store.update((s) => (s.categories[c.id] = cb.checked));
        refreshStart();
      });
      const count = store.allCards().filter((x) => x.category === c.id && store.isEnabled(x)).length;
      return h(
        'label',
        { class: `cat cat-${c.id}`, for: `cat-${c.id}` },
        cb,
        h('span', { class: 'cat-emoji', 'aria-hidden': 'true' }, c.emoji),
        h('span', { class: 'cat-label' }, c.label),
        h('span', { class: 'cat-count' }, `${count} ใบ`),
      );
    }),
  );

  const refreshStart = () => {
    consentWrap.hidden = !store.data.categories.close;
    const why = store.startBlocker();
    reason.textContent = why ?? '';
    reason.hidden = !why;
    startBtn.setAttribute('aria-disabled', why ? 'true' : 'false');
    startBtn.classList.toggle('is-disabled', !!why);
  };

  startBtn.addEventListener('click', () => {
    unlockAudio();
    const why = store.startBlocker();
    if (why) {
      reason.classList.remove('shake-x');
      void reason.offsetWidth;
      reason.classList.add('shake-x');
      if (store.data.categories.close && !store.closeConsent) consentBox.focus();
      return;
    }
    onStart();
  });

  // ---- โหมด + เสียง
  const modeBtn = (mode: 'full' | 'quick', label: string, sub: string) => {
    const b = h('button', { type: 'button', class: 'seg', 'aria-pressed': String(store.data.mode === mode) }, h('b', {}, label), h('small', {}, sub));
    b.addEventListener('click', () => {
      tap();
      store.update((s) => (s.mode = mode));
      modeRow.querySelectorAll('.seg').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    return b;
  };
  const modeRow = h('div', { class: 'seg-row', role: 'group', 'aria-label': 'จังหวะการเปิด' });
  modeRow.append(modeBtn('full', 'ลุ้นเต็ม', 'เขย่า ไม้โผล่ เปิดเลข'), modeBtn('quick', 'เล่นเร็ว', 'เปิดไวสำหรับวงต่อเนื่อง'));

  const soundBtn = h('button', { type: 'button', class: 'toggle', 'aria-pressed': String(!store.data.muted) });
  const paintSound = () => {
    soundBtn.setAttribute('aria-pressed', String(!store.data.muted));
    soundBtn.textContent = store.data.muted ? '🔇 เสียง: ปิด' : '🔊 เสียง: เปิด';
  };
  paintSound();
  soundBtn.addEventListener('click', () => {
    store.update((s) => (s.muted = !s.muted));
    setMuted(store.data.muted);
    unlockAudio();
    tap();
    paintSound();
  });

  const total = store.allCards().length;

  root.append(
    h(
      'main',
      { class: 'setup-scroll' },
      h('header', { class: 'hero' }, logo(), h('p', { class: 'hero-note' }, 'เกมปาร์ตี้ 20+ ใช้มือถือเครื่องเดียว วางกลางวงแล้วผลัดกันเขย่า')),
      !store.storageOk && h('p', { class: 'warn', role: 'note' }, 'เบราว์เซอร์นี้บันทึกข้อมูลไม่ได้ เล่นได้ตามปกติ แต่รีโหลดแล้วค่าจะหาย'),

      h(
        'section',
        { class: 'panel', 'aria-labelledby': 'h-count' },
        h('h2', { id: 'h-count' }, 'จำนวนคนในวง'),
        h('div', { class: 'stepper' }, minus, h('div', { class: 'count-box' }, countOut, h('span', { class: 'count-unit' }, 'คน')), plus),
        h('p', { class: 'muted center' }, `${MIN_PLAYERS}–${MAX_PLAYERS} คน`),
      ),

      h(
        'section',
        { class: 'panel', 'aria-labelledby': 'h-seat' },
        h('h2', { id: 'h-seat' }, 'วิธีนั่ง'),
        h(
          'ol',
          { class: 'how' },
          h('li', {}, 'นั่งล้อมวง ', h('b', {}, 'หันหน้าเข้ากลางวง')),
          h('li', {}, 'เรียงเลข 1, 2, 3… ', h('b', {}, 'ตามเข็มนาฬิกา')),
          h('li', {}, 'คนข้างซ้ายมือ = เลขถัดไป · คนข้างขวามือ = เลขก่อนหน้า (วนครบวง)'),
        ),
        diagram,
      ),

      h(
        'section',
        { class: 'panel' },
        h(
          'details',
          { class: 'names' },
          h('summary', {}, h('span', {}, 'ใส่ชื่อเล่น'), h('small', {}, ' (ไม่บังคับ)')),
          h('p', { class: 'muted' }, 'ไม่ใส่ชื่อ เกมจะเรียกเป็น “เบอร์ 4” ตอนเล่นแตะเลขในผังเพื่อดูชื่อได้'),
          namesGrid,
        ),
      ),

      h(
        'section',
        { class: 'panel', 'aria-labelledby': 'h-cat' },
        h('h2', { id: 'h-cat' }, 'หมวดคำสั่ง'),
        catList,
        consentWrap,
        h('div', { class: 'row-links' }, h('a', { href: '#library', class: 'link-btn' }, `📜 คลังคำสั่ง (${total})`), h('a', { href: '#edit-new', class: 'link-btn' }, '＋ เพิ่มคำสั่งเอง')),
      ),

      h('section', { class: 'panel', 'aria-label': 'ตั้งค่าการเล่น' }, h('h2', {}, 'จังหวะ'), modeRow, h('div', { class: 'sound-row' }, soundBtn)),

      h('p', { class: 'fineprint' }, 'ข้ามได้ทุกใบโดยไม่มีบทลงโทษ · เลือกน้ำเปล่าแทนได้เสมอ · กิจกรรมสัมผัสตัวต้องตกลงกันทั้งคู่ · ดื่มแล้วไม่ขับ'),
    ),
    h('footer', { class: 'setup-footer' }, reason, startBtn),
  );

  minus.toggleAttribute('disabled', d.playerCount <= MIN_PLAYERS);
  plus.toggleAttribute('disabled', d.playerCount >= MAX_PLAYERS);
  renderDiagram();
  renderNames();
  refreshStart();
  return root;
}
