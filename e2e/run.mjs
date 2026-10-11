// ทดสอบบนเบราว์เซอร์จริง (Chromium ผ่าน Playwright)
// ใช้: npm run build && npx vite preview --port 4173 & ; node e2e/run.mjs [baseUrl]
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173/';
const px = process.env.HTTPS_PROXY?.replace(/^https?:\/\//, '');
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: px ? [`--proxy-server=https=${px}`] : [] });

const results = [];
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
async function test(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
  const t0 = Date.now();
  try {
    await fn();
    results.push(['✅', name, Date.now() - t0]);
    console.log('✅', name);
  } catch (e) {
    results.push(['❌', name, Date.now() - t0, e.message]);
    console.log('❌', name, '\n   ', e.message.split('\n').slice(0, 6).join('\n    '));
  }
}

const SAVED = (over = {}) => ({ v: 1, playerCount: 6, names: [], categories: { drink: true, water: true, close: true }, customCards: [], disabledIds: [], muted: true, mode: 'quick', ...over });

async function page({ w = 390, h = 664, saved, reduced = true, init } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  if (init) await ctx.addInitScript(init);
  // ข้อความในการ์ดต้องอยู่ในกรอบการ์ดทั้งหมด (ไม่ล้น ไม่ถูกตัด)
  await ctx.addInitScript(() => {
    window.__textFits = () => {
      const card = document.querySelector('.card').getBoundingClientRect();
      return [...document.querySelectorAll('.card .doers, .card .command, .card .note, .card .amount')].every((el) => {
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const r = rg.getBoundingClientRect();
        return r.width === 0 || (r.left >= card.left - 1 && r.right <= card.right + 1 && r.top >= card.top - 1 && r.bottom <= card.bottom + 1);
      });
    };
  });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.goto(BASE);
  if (saved !== undefined) {
    await p.evaluate((s) => (s ? localStorage.setItem('siemsee:v1', JSON.stringify(s)) : localStorage.clear()), saved);
    await p.reload();
  }
  await p.waitForSelector('.screen');
  return p;
}

async function startGame(p, { consent = true } = {}) {
  if (consent && (await p.isVisible('#consent'))) await p.check('#consent');
  await p.click('text=เริ่มเขย่า!');
  await p.waitForSelector('.play[data-phase="idle"]');
}

async function rollToResult(p) {
  await p.click('.shake-btn');
  await p.waitForSelector('.play[data-phase="result"]', { timeout: 8000 });
}

const phase = (p) => p.getAttribute('.play', 'data-phase');

// ---------------------------------------------------------------- หน้าตั้งวง
await test('ตั้งวง: ปุ่มเพิ่ม/ลด 2–24 คน และปุ่มใหญ่พอ', async () => {
  const p = await page({ saved: null });
  assert.equal(await p.textContent('#player-count'), '6');
  for (let i = 0; i < 10; i++) await p.click('[aria-label="ลดจำนวนคน"]', { force: true });
  assert.equal(await p.textContent('#player-count'), '2');
  assert.equal(await p.isDisabled('[aria-label="ลดจำนวนคน"]'), true);
  for (let i = 0; i < 30; i++) await p.click('[aria-label="เพิ่มจำนวนคน"]', { force: true });
  assert.equal(await p.textContent('#player-count'), '24');
  assert.equal(await p.isDisabled('[aria-label="เพิ่มจำนวนคน"]'), true);
  const box = await p.locator('[aria-label="เพิ่มจำนวนคน"]').boundingBox();
  assert.ok(box.width >= 60 && box.height >= 60, 'ปุ่มอย่างน้อย 60px');
  assert.equal(await p.locator('.seat-diagram .seat').count(), 24);
  await p.close();
});

await test('ตั้งวง: ค่าเริ่มต้นเลือกครบ 3 หมวด ความยินยอมไม่ติ๊กให้เอง และมีเหตุผลใกล้ปุ่ม', async () => {
  const p = await page({ saved: null });
  for (const id of ['drink', 'water', 'close']) assert.equal(await p.isChecked(`#cat-${id}`), true);
  assert.equal(await p.isChecked('#consent'), false);
  const reason = await p.textContent('#start-reason');
  assert.match(reason, /20\+/);
  await p.click('text=เริ่มเขย่า!', { force: true }); // aria-disabled ยังกดได้ แต่ต้องไม่เริ่ม
  assert.equal(await p.locator('.play').count(), 0, 'ต้องยังไม่เริ่ม');
  await p.check('#consent');
  assert.equal(await p.isVisible('#start-reason'), false);
  // ปิดหมวดใกล้ชิด → ไม่ต้องยืนยัน
  await p.uncheck('#consent');
  await p.uncheck('#cat-close');
  assert.equal(await p.isVisible('#consent'), false);
  assert.equal(await p.isVisible('#start-reason'), false);
  // ปิดทุกหมวด → บอกเหตุผล
  await p.uncheck('#cat-drink');
  await p.uncheck('#cat-water');
  assert.match(await p.textContent('#start-reason'), /อย่างน้อย 1 หมวด/);
  await p.close();
});

await test('ตั้งวง: ชื่อไม่บังคับ ไม่ใส่ชื่อแสดงแค่ “เบอร์ N”', async () => {
  const p = await page({ saved: SAVED({ playerCount: 3, categories: { drink: true, water: false, close: false } }) });
  await startGame(p);
  await rollToResult(p);
  const doers = await p.textContent('.doers');
  assert.doesNotMatch(doers, /#|เพื่อน/);
  assert.match(doers, /เบอร์\s\d|ผู้เล่น|ทุกคน|เลข/);
  await p.close();
});

// ---------------------------------------------------------------- การเล่น
await test('เล่น: เขย่า → ไม้โผล่ → “สุ่มได้เบอร์ N” → คำสั่ง (โหมดลุ้นเต็ม)', async () => {
  const p = await page({ saved: SAVED({ mode: 'full' }), reduced: false });
  await startGame(p);
  const seen = [];
  await p.exposeFunction('rec', (x) => seen.push(x));
  await p.evaluate(() => new MutationObserver(() => window.rec(document.querySelector('.play').dataset.phase + '|' + document.querySelector('.bubble').textContent)).observe(document.querySelector('.play'), { attributes: true }));
  await rollToResult(p);
  const phases = seen.map((s) => s.split('|')[0]);
  assert.deepEqual(phases, ['shaking', 'stick', 'number', 'result']);
  const num = seen.find((s) => s.startsWith('number')).split('|')[1];
  assert.match(num, /^สุ่มได้เบอร์ \d+$/);
  await p.close();
});

await test('เล่น: กดเขย่าซ้ำเร็ว ๆ ไม่สุ่มซ้อน', async () => {
  const p = await page({ saved: SAVED({ mode: 'full' }), reduced: false });
  await startGame(p);
  await p.evaluate(() => {
    const b = document.querySelector('.shake-btn');
    for (let i = 0; i < 20; i++) b.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  });
  await p.waitForSelector('.play[data-phase="result"]', { timeout: 8000 });
  assert.equal(await p.textContent('.round'), 'รอบ 1');
  await p.waitForTimeout(1500);
  assert.equal(await phase(p), 'result');
  assert.equal(await p.textContent('.round'), 'รอบ 1');
  await p.close();
});

await test('เล่น: ย้อนกลับระหว่างลุ้น ยกเลิกแอนิเมชันเก่า แล้วเริ่มใหม่นับรอบ 1', async () => {
  const p = await page({ saved: SAVED({ mode: 'full' }), reduced: false });
  await startGame(p);
  await p.click('.shake-btn');
  await p.waitForTimeout(300);
  assert.equal(await phase(p), 'shaking');
  await p.click('[aria-label="กลับไปตั้งวงใหม่"]');
  await p.waitForSelector('.setup');
  await p.waitForTimeout(4000); // ถ้างานเก่ายังค้าง จะเห็น error หรือเปลี่ยนหน้า
  assert.equal(await p.locator('.setup').count(), 1);
  await startGame(p);
  assert.equal(await phase(p), 'idle');
  assert.equal(await p.textContent('.round'), 'รอบ 1');
  await rollToResult(p);
  assert.equal(await p.textContent('.round'), 'รอบ 1');
  // ย้อนกลับหลังเปิดคำสั่ง
  await p.click('[aria-label="กลับไปตั้งวงใหม่"]');
  await p.waitForSelector('.setup');
  assert.equal(await p.evaluate(() => document.querySelector('.setup-scroll').scrollTop), 0);
  assert.deepEqual(p.errors, []);
  await p.close();
});

await test('เล่น: ข้ามและรอบต่อไป นับรอบถูก ไม่มีคำสั่งซ้ำก่อนครบสำรับ', async () => {
  const p = await page({ saved: SAVED({ categories: { drink: false, water: true, close: false } }) });
  await startGame(p);
  const texts = [];
  for (let i = 1; i <= 14; i++) {
    await rollToResult(p);
    assert.equal(await p.textContent('.round'), `รอบ ${i}`);
    texts.push((await p.textContent('.card-label')) + (await p.getAttribute('.card', 'class')));
    await p.click(i % 2 ? 'text=ข้าม ♡' : 'text=รอบต่อไป →');
    await p.waitForSelector('.play[data-phase="idle"]');
  }
  await p.close();
});

await test('เล่น: คีย์บอร์ด Space เขย่า Enter รอบต่อไป Esc กลับ', async () => {
  const p = await page({ saved: SAVED() });
  await startGame(p);
  await p.locator('body').focus();
  await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('Space');
  await p.waitForSelector('.play[data-phase="result"]', { timeout: 8000 });
  await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('Enter');
  await p.waitForSelector('.play[data-phase="idle"]');
  await p.keyboard.press('Escape');
  await p.waitForSelector('.setup');
  await p.close();
});

await test('เล่น: ลากซ้าย–ขวาที่กระบอกแล้วเขย่า', async () => {
  const p = await page({ saved: SAVED() });
  await startGame(p);
  const b = await p.locator('.shaker').boundingBox();
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  for (const dx of [-60, 60, -60, 60, -60]) await p.mouse.move(cx + dx, cy, { steps: 4 });
  await p.mouse.up();
  await p.waitForSelector('.play[data-phase="result"]', { timeout: 8000 });
  await p.close();
});

await test('ผังวง: ไฮไลต์ตรงกับคำสั่งทุกแบบ และมีเครื่องหมายไม่พึ่งสีอย่างเดียว', async () => {
  const p = await page({ saved: SAVED({ playerCount: 7 }) });
  await startGame(p);
  for (let i = 0; i < 70; i++) {
    await rollToResult(p);
    const info = await p.evaluate(() => {
      const on = [...document.querySelectorAll('.circle-box .seat.on')].map((g) => ({ seat: +g.dataset.seat, mark: g.querySelector('.seat-mark')?.textContent }));
      return { cmd: document.querySelector('.command').textContent, doers: document.querySelector('.doers').textContent, on };
    });
    const inText = [...info.cmd.matchAll(/เบอร์\s(\d+)/g)].map((m) => +m[1]);
    const onSeats = info.on.map((x) => x.seat);
    for (const s of inText) assert.ok(onSeats.includes(s), `${info.cmd} → ไฮไลต์ ${onSeats}`);
    assert.ok(info.on.every((x) => ['★', '◆', '✓'].includes(x.mark)), 'ทุกคนที่ไฮไลต์มีเครื่องหมาย');
    if (/^ผู้เล่นเลขคู่/.test(info.doers)) assert.ok(onSeats.every((s) => s % 2 === 0));
    if (/^ผู้เล่นเลขคี่/.test(info.doers)) assert.ok(onSeats.every((s) => s % 2 === 1));
    if (/^ทุกคน/.test(info.doers)) assert.equal(onSeats.length, 7);
    // เลขคนกับจำนวนไม่อยู่ในบรรทัดเดียวกัน
    assert.doesNotMatch(info.doers, /ช็อต|จิบ|แก้ว/);
    await p.click('text=รอบต่อไป →');
  }
  await p.close();
});

await test('เลือกผู้รับเอง: แตะเลือก เปลี่ยนแล้วไม่สะสม เลือกตัวเองได้', async () => {
  const custom = { id: 'my-choose', title: 'ทดสอบเลือก', category: 'drink', target: 'choose', text: '{player} เลือกคนรับ', kind: 'c', custom: true, amount: { value: 2, unit: 'ช็อต', each: false } };
  const p = await page({ saved: SAVED({ playerCount: 6, customCards: [custom], categories: { drink: true, water: false, close: false }, disabledIds: [] }) });
  // ปิดการ์ดเริ่มต้นทั้งหมดยกเว้นของเรา
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('siemsee:v1'));
    s.disabledIds = Array.from({ length: 40 }, (_, i) => 'd' + String(i + 1).padStart(2, '0'));
    localStorage.setItem('siemsee:v1', JSON.stringify(s));
  });
  await p.reload();
  await startGame(p);
  await rollToResult(p);
  const drawn = +(await p.textContent('.doers')).match(/เบอร์\s(\d+)/)[1];
  const others = [1, 2, 3, 4, 5, 6].filter((s) => s !== drawn);
  await p.click(`.circle-box .seat[data-seat="${others[0]}"]`);
  await p.click(`.circle-box .seat[data-seat="${others[1]}"]`);
  let on = await p.$$eval('.circle-box .seat.on', (gs) => gs.map((g) => +g.dataset.seat).sort());
  assert.deepEqual(on, [drawn, others[1]].sort());
  assert.equal(await p.textContent('.amount-v'), '2 ช็อต');
  await p.click(`.circle-box .seat[data-seat="${drawn}"]`);
  on = await p.$$eval('.circle-box .seat.on', (gs) => gs.map((g) => +g.dataset.seat));
  assert.deepEqual(on, [drawn]);
  assert.match(await p.textContent('.doers'), /เลือกตัวเอง/);
  assert.equal(await p.textContent('.amount-v'), '2 ช็อต');
  await p.close();
});

await test('เสียง: ปิด/เปิดได้ และจำหลังรีโหลด', async () => {
  const p = await page({ saved: SAVED({ muted: false }) });
  await startGame(p);
  await p.click('[aria-label="ปิดเสียง"]');
  assert.equal(await p.getAttribute('.topbar .icon-btn[aria-pressed]', 'aria-pressed'), 'true');
  await p.reload();
  await p.waitForSelector('.setup');
  assert.match(await p.textContent('.toggle'), /ปิด/);
  await p.click('.toggle');
  assert.match(await p.textContent('.toggle'), /เปิด/);
  await p.reload();
  assert.match(await p.textContent('.toggle'), /เปิด/);
  await p.close();
});

// ---------------------------------------------------------------- คลังคำสั่ง
await test('คลัง: เพิ่ม แก้ไข ปิด ลบ ค้นหา และเปิดคำสั่งเริ่มต้นกลับโดยไม่ลบของเรา', async () => {
  const p = await page({ saved: null });
  await p.click('text=＋ เพิ่มคำสั่งเอง');
  await p.fill('#f-title', 'ท่าพิเศษ');
  await p.selectOption('#f-target', 'right');
  await p.fill('#f-text', '');
  await p.click('text=คนที่สุ่มได้ {player}');
  await p.type('#f-text', 'ชนศอกกับ ');
  await p.click('text=คนขวา {right}');
  await p.fill('#f-amt', '2');
  await p.check('#f-each');
  assert.match(await p.textContent('.preview-card .command'), /เบอร์\s1 ชนศอกกับ เบอร์\s6/);
  assert.equal(await p.textContent('.preview-card .amount-v'), 'คนละ 2 ช็อต');
  await p.click('button[type=submit]');
  await p.waitForSelector('.lib-list');
  await p.fill('.search', 'ชนศอก');
  assert.equal(await p.locator('.lib-item').count(), 1);
  // แก้ไข
  await p.click('text=แก้ไข');
  await p.fill('#f-title', 'ท่าพิเศษ 2');
  await p.click('button[type=submit]');
  await p.waitForSelector('.lib-list');
  await p.fill('.search', 'ท่าพิเศษ 2');
  assert.equal(await p.locator('.lib-item').count(), 1);
  // ปิดคำสั่งเริ่มต้น 1 ใบ + ปิดของเรา
  await p.fill('.search', '');
  await p.click('.lib-item:first-child .switch');
  assert.equal(await p.getAttribute('.lib-item:first-child .switch', 'aria-checked'), 'false');
  await p.fill('.search', 'ท่าพิเศษ 2');
  await p.click('.lib-item .switch');
  assert.equal(await p.getAttribute('.lib-item .switch', 'aria-checked'), 'false');
  // เปิดเริ่มต้นกลับ: ของเรายังอยู่และยังปิด
  await p.click('text=↺ เปิดคำสั่งเริ่มต้นทั้งหมด');
  assert.equal(await p.locator('.lib-item').count(), 1);
  assert.equal(await p.getAttribute('.lib-item .switch', 'aria-checked'), 'false');
  await p.fill('.search', '');
  assert.equal(await p.getAttribute('.lib-item:first-child .switch', 'aria-checked'), 'true');
  // รีโหลดแล้วยังอยู่
  await p.reload();
  await p.fill('.search', 'ท่าพิเศษ 2');
  assert.equal(await p.locator('.lib-item').count(), 1);
  // ลบ
  await p.click('.lib-item button.danger');
  await p.click('.lib-item button.danger'); // แตะซ้ำเพื่อยืนยัน
  await p.waitForTimeout(100);
  assert.equal(await p.locator('.lib-item:not(.empty)').count(), 0);
  await p.close();
});

await test('คำสั่งที่เพิ่มเองถูกสุ่มได้ และไฮไลต์ตามตัวแทน', async () => {
  const custom = { id: 'my-x', title: 'x', category: 'water', target: 'player', text: '{player} ส่งแก้วให้ {opposite}', kind: 'x', custom: true };
  const p = await page({ saved: SAVED({ playerCount: 8, customCards: [custom], categories: { drink: false, water: true, close: false }, disabledIds: Array.from({ length: 14 }, (_, i) => 'w' + String(i + 1).padStart(2, '0')) }) });
  await startGame(p);
  await rollToResult(p);
  const cmd = await p.textContent('.command');
  const [a, b] = [...cmd.matchAll(/เบอร์\s(\d+)/g)].map((m) => +m[1]);
  assert.equal((a + 4 - 1) % 8 + 1, b, 'ตรงข้ามในวง 8 คน = +4');
  const on = await p.$$eval('.circle-box .seat.on', (gs) => gs.map((g) => +g.dataset.seat).sort((x, y) => x - y));
  assert.deepEqual(on, [a, b].sort((x, y) => x - y));
  assert.equal(await p.isVisible('.amount'), false);
  await p.close();
});

// ---------------------------------------------------------------- การบันทึก
await test('บันทึก: จำนวนคน ชื่อ หมวด เสียง ยังอยู่หลังรีโหลด แต่ความยินยอมไม่ถูกจำ', async () => {
  const p = await page({ saved: null });
  await p.click('[aria-label="เพิ่มจำนวนคน"]');
  await p.click('details.names summary');
  await p.fill('#name-2', 'ต้น');
  await p.uncheck('#cat-water');
  await p.check('#consent');
  await p.click('.toggle');
  await p.reload();
  await p.waitForSelector('.setup');
  assert.equal(await p.textContent('#player-count'), '7');
  assert.equal(await p.isChecked('#cat-water'), false);
  assert.equal(await p.isChecked('#cat-close'), true);
  assert.equal(await p.isChecked('#consent'), false, 'ความยินยอมต้องไม่ถูกจำ');
  assert.match(await p.textContent('.toggle'), /ปิด/);
  await p.click('details.names summary');
  assert.equal(await p.inputValue('#name-2'), 'ต้น');
  await p.close();
});

await test('บันทึก: เบราว์เซอร์บันทึกไม่ได้ ยังเล่นได้และแจ้งสั้น ๆ', async () => {
  const p = await page({
    init: () => {
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      Storage.prototype.getItem = () => {
        throw new Error('SecurityError');
      };
    },
  });
  assert.match(await p.textContent('.warn'), /บันทึกข้อมูลไม่ได้/);
  await startGame(p);
  await rollToResult(p);
  assert.deepEqual(p.errors, []);
  await p.close();
});

await test('เริ่มวงใหม่: เก็บชื่อและคำสั่งส่วนตัวไว้ นับรอบใหม่', async () => {
  const custom = { id: 'my-k', title: 'keep', category: 'drink', target: 'player', text: '{player} ยิ้ม', kind: 'k', custom: true };
  const p = await page({ saved: SAVED({ names: ['เอ', 'บี'], customCards: [custom] }) });
  await startGame(p);
  await rollToResult(p);
  await p.click('text=รอบต่อไป →');
  await rollToResult(p);
  assert.equal(await p.textContent('.round'), 'รอบ 2');
  await p.click('[aria-label="กลับไปตั้งวงใหม่"]');
  await p.click('details.names summary');
  assert.equal(await p.inputValue('#name-1'), 'เอ');
  await startGame(p);
  await rollToResult(p);
  assert.equal(await p.textContent('.round'), 'รอบ 1');
  await p.goto(BASE + '#library');
  await p.fill('.search', 'keep');
  assert.equal(await p.locator('.lib-item').count(), 1);
  await p.close();
});

// ---------------------------------------------------------------- พอดีจอ
async function checkFit(p, label, { expectNoScroll }) {
  const m = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const sc = document.querySelector('.result-scroll');
    return {
      vh: window.innerHeight,
      card: r('.card'),
      circle: r('.circle-wrap'),
      svg: r('.circle-box svg'),
      next: r('.result-actions .btn-primary'),
      skip: r('.result-actions .btn-ghost'),
      scroll: sc.scrollHeight - sc.clientHeight,
      cmd: document.querySelector('.command').textContent,
      cmdSize: parseFloat(getComputedStyle(document.querySelector('.command')).fontSize),
      doerSize: parseFloat(getComputedStyle(document.querySelector('.doers')).fontSize),
    };
  });
  assert.ok(m.next.bottom <= m.vh + 0.5 && m.next.top >= 0, `${label}: ปุ่มรอบต่อไปอยู่ในจอ`);
  assert.ok(m.skip.bottom <= m.vh + 0.5, `${label}: ปุ่มข้ามอยู่ในจอ`);
  assert.ok(m.cmdSize >= 24 && m.cmdSize <= 32, `${label}: ขนาดคำสั่ง ${m.cmdSize}`);
  assert.ok(m.doerSize >= 16 && m.doerSize <= 18, `${label}: ขนาดบรรทัดคน ${m.doerSize}`);
  if (expectNoScroll) {
    assert.ok(m.scroll <= 1, `${label}: ต้องไม่ต้องเลื่อน (เกิน ${m.scroll}px) “${m.cmd}”`);
    assert.ok(m.card.bottom <= m.circle.top + 1, `${label}: การ์ดไม่ทับผัง`);
    assert.ok(m.circle.bottom <= m.next.top, `${label}: ผังไม่ถูกปุ่มบัง`);
  }
  return m;
}

for (const [w, h, name] of [
  [390, 664, 'iPhone 14 + แถบ Safari'],
  [375, 553, 'iPhone SE + แถบ Safari'],
  [360, 640, 'Android 360×640'],
  [412, 780, 'Pixel 7 + แถบ Chrome'],
]) {
  await test(`พอดีจอ ${name} (${w}×${h}): วง 6 คน ครบทุกคำสั่งเริ่มต้น ไม่ต้องเลื่อน`, async () => {
    const p = await page({ w, h, saved: SAVED() });
    await startGame(p);
    let minCircle = Infinity;
    for (let i = 0; i < 68; i++) {
      await rollToResult(p);
      const m = await checkFit(p, `${name} รอบ ${i + 1}`, { expectNoScroll: true });
      minCircle = Math.min(minCircle, m.svg.height);
      if (i === 0) await p.screenshot({ path: `${process.env.SHOTS ?? '/tmp'}/fit-${w}x${h}.png` });
      await p.click('text=รอบต่อไป →');
    }
    assert.ok(minCircle >= 180, `ผังวงสูงอย่างน้อย 180px (ได้ ${minCircle})`);
    await p.close();
  });
}

await test('วง 24 คน + คำสั่งยาวมาก + จอเล็ก 320×480: เลื่อนอ่านได้ครบ ปุ่มไม่บัง', async () => {
  const long = { id: 'my-long', title: 'ยาว', category: 'drink', target: 'opposite', text: '{player} ' + 'เล่าเรื่องยาวมากมาย '.repeat(14) + 'กับ {opposite}', kind: 'l', custom: true, amount: { value: 1, unit: 'ช็อต', each: true }, note: 'หมายเหตุยาว '.repeat(10) };
  const p = await page({ w: 320, h: 480, saved: SAVED({ playerCount: 24, customCards: [long], categories: { drink: true, water: false, close: false }, disabledIds: Array.from({ length: 34 }, (_, i) => 'd' + String(i + 1).padStart(2, '0')) }) });
  await startGame(p);
  await rollToResult(p);
  const m = await checkFit(p, '24 คน จอเล็ก', { expectNoScroll: false });
  assert.ok(m.scroll > 0, 'ต้องเลื่อนได้');
  await p.evaluate(() => (document.querySelector('.result-scroll').scrollTop = 99999));
  const after = await p.evaluate(() => {
    const sc = document.querySelector('.result-scroll').getBoundingClientRect();
    const c = document.querySelector('.circle-wrap').getBoundingClientRect();
    const n = document.querySelector('.result-actions').getBoundingClientRect();
    const cmd = document.querySelector('.command');
    return { circleBottom: c.bottom, scBottom: sc.bottom, actionsTop: n.top, clipped: !window.__textFits(), seats: document.querySelectorAll('.circle-box .seat').length };
  });
  assert.ok(after.circleBottom <= after.scBottom + 1, 'ผังเลื่อนมาเห็นครบ');
  assert.ok(after.scBottom <= after.actionsTop + 1, 'ปุ่มไม่ทับพื้นที่เลื่อน');
  assert.equal(after.clipped, false, 'ข้อความไม่ถูกตัด');
  assert.equal(after.seats, 24);
  await p.screenshot({ path: `${process.env.SHOTS ?? '/tmp'}/fit-24-small.png` });
  await p.close();
});

await test('วง 24 คนบนจอมือถือปกติ: ผังอ่านได้ ปุ่มกดได้', async () => {
  const p = await page({ w: 390, h: 664, saved: SAVED({ playerCount: 24 }) });
  await startGame(p);
  for (let i = 0; i < 10; i++) {
    await rollToResult(p);
    await checkFit(p, `24 คน รอบ ${i + 1}`, { expectNoScroll: false });
    const seat = await p.locator('.circle-box .seat[data-seat="13"] .seat-card').boundingBox();
    assert.ok(seat.width >= 24, `การ์ดเลขกว้าง ${seat.width}px`);
    if (i === 0) await p.screenshot({ path: `${process.env.SHOTS ?? '/tmp'}/fit-24.png` });
    await p.click('text=รอบต่อไป →');
  }
  await p.close();
});

await test('ขยายตัวอักษร 150%: ข้อความไม่ถูกตัด ปุ่มยังกดได้', async () => {
  const p = await page({ saved: SAVED() });
  await startGame(p);
  await rollToResult(p);
  await p.evaluate(() => (document.documentElement.style.zoom = '1.5'));
  await p.waitForTimeout(200);
  const m = await p.evaluate(() => {
    return { clipped: !window.__textFits() };
  });
  assert.equal(m.clipped, false);
  await p.click('text=รอบต่อไป →');
  await p.waitForSelector('.play[data-phase="idle"]');
  await p.close();
});

await test('การเข้าถึง: ปุ่มสำคัญมีชื่อ และไม่มี error ในหน้า', async () => {
  const p = await page({ saved: SAVED() });
  const unnamed = await p.$$eval('button, a', (els) => els.filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim())).length);
  assert.equal(unnamed, 0);
  await startGame(p);
  const unnamed2 = await p.$$eval('button, a, [role=button]', (els) => els.filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim())).length);
  assert.equal(unnamed2, 0);
  assert.deepEqual(p.errors, []);
  await p.close();
});

await browser.close();

// WebKit (เครื่องยนต์เดียวกับ Safari) ถ้ามีในเครื่อง
try {
  const wk = await webkit.launch();
  await test('WebKit: เล่นครบวงจร', async () => {
    const ctx = await wk.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(BASE);
    await p.check('#consent');
    await p.click('text=เริ่มเขย่า!');
    await p.click('.shake-btn');
    await p.waitForSelector('.play[data-phase="result"]', { timeout: 8000 });
    await p.close();
  });
  await wk.close();
} catch (e) {
  results.push(['⚠️', 'WebKit ไม่มีในเครื่องทดสอบนี้ — ข้าม', 0, e.message.split('\n')[0]]);
  console.log('⚠️  WebKit ไม่มีในเครื่องทดสอบนี้ — ข้าม');
}

const failed = results.filter((r) => r[0] === '❌').length;
console.log(`\nผ่าน ${results.filter((r) => r[0] === '✅').length} / ${results.length}${failed ? ` · ไม่ผ่าน ${failed}` : ''}`);
process.exit(failed ? 1 : 0);
