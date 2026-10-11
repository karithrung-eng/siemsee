// สคริปต์ถ่ายภาพหน้าจอเร็ว ๆ: node e2e/shot.mjs <url> <out.png> [w] [h]
import { chromium } from 'playwright';
const [url, out, w = 390, h = 664] = process.argv.slice(2);
const px = process.env.HTTPS_PROXY?.replace(/^https?:\/\//, '');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: px ? [`--proxy-server=https=${px}`] : [] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(url);
await p.waitForTimeout(1200);
await p.screenshot({ path: out });
await b.close();
