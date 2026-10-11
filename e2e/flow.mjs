// ถ่ายภาพหน้าจอตามลำดับการเล่น: node e2e/flow.mjs <baseUrl> <outDir> [w] [h] [players]
import { chromium } from 'playwright';
const [base, out, w = 390, h = 664, players = 6] = process.argv.slice(2);
const px = process.env.HTTPS_PROXY?.replace(/^https?:\/\//, '');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: px ? [`--proxy-server=https=${px}`] : [] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(base);
await p.evaluate((n) => localStorage.setItem('siemsee:v1', JSON.stringify({ v: 1, playerCount: +n, names: [], categories: { drink: true, water: true, close: true }, customCards: [], disabledIds: [], muted: true, mode: 'quick' })), players);
await p.reload();
await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/1-setup.png`, fullPage: false });
await p.check('#consent');
await p.click('text=เริ่มเขย่า!');
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/2-idle.png` });
await p.click('.shake-btn');
await p.waitForTimeout(700);
await p.screenshot({ path: `${out}/3-stick.png` });
await p.waitForSelector('[data-phase="result"]');
await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/4-result.png` });
for (let i = 0; i < 6; i++) {
  await p.click('text=รอบต่อไป →');
  await p.click('.shake-btn');
  await p.waitForSelector('[data-phase="result"]');
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/5-result-${i}.png` });
}
await b.close();
