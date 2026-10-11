// ส่งออกภาพมาสคอต/โลโก้จากหน้าเว็บที่ build แล้ว: node scripts/export-assets.mjs [url]
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const px = process.env.HTTPS_PROXY?.replace(/^https?:\/\//, '');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: px ? [`--proxy-server=https=${px}`] : [] });
const p = await b.newPage({ viewport: { width: 420, height: 800 }, deviceScaleFactor: 3 });
await p.goto(url);
await p.waitForTimeout(1200);
const svg = await p.$eval('.logo-mascot svg', (s) => s.outerHTML);
writeFileSync('assets/mascot.svg', svg);
await p.locator('.logo').screenshot({ path: 'assets/logo.png', omitBackground: true });
await p.locator('.logo-mascot').screenshot({ path: 'assets/mascot.png', omitBackground: true });
await b.close();
console.log('ok');
