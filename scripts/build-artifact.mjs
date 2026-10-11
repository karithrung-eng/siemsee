// แปลงไฟล์เดียว (dist-single/index.html) เป็นหน้าแบบ fragment สำหรับเผยแพร่เป็น Claude Artifact
// Artifact จะครอบ <html><head><body> ให้เอง และเว้นขอบ safe-area ที่ :root ให้แล้ว
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('dist-single/index.html', 'utf8');
const pick = (re) => [...src.matchAll(re)].map((m) => m[0]).join('\n');
const title = '<title>เซียมซี้!</title>';
const links = pick(/<link[^>]+fonts\.googleapis\.com\/css2[^>]*>/g);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);
const body = src.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
const override = `<style>
/* ใน Artifact :root ถูกเว้นขอบ safe-area แล้ว จึงหักออกจากความสูงจอ */
.screen{height:calc(var(--app-h,100dvh) - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px))}
.topbar,.setup-scroll{padding-top:6px}
.setup-footer,.result-actions,.play .stage{padding-bottom:10px}
</style>`;
writeFileSync('dist-single/artifact.html', [title, links, styles, override, body.trim(), scripts].join('\n'));
console.log('wrote dist-single/artifact.html', readFileSync('dist-single/artifact.html').length, 'bytes');
