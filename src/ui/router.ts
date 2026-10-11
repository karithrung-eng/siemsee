// เส้นทางแบบ hash (#library, #play, #edit-<id>) ใช้ตัวอักษรธรรมดาเท่านั้น
// ให้ปุ่มย้อนกลับของเบราว์เซอร์ใช้ได้ และโฮสต์แบบไฟล์นิ่ง/ฝังในกรอบได้ทุกที่

export type Route = { name: 'setup' } | { name: 'play' } | { name: 'library' } | { name: 'edit'; id: string };

export function parse(hash = location.hash): Route {
  const p = hash.replace(/^#\/?/, '');
  if (p === 'play') return { name: 'play' };
  if (p === 'library') return { name: 'library' };
  const m = p.match(/^edit-(.+)$/);
  if (m) return { name: 'edit', id: decodeURIComponent(m[1]) };
  return { name: 'setup' };
}

export const href = (path: string) => (path ? `#${path}` : '#setup');

export function navigate(path: string, replace = false) {
  const target = href(path);
  if (location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  if (replace) {
    history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = target;
  }
}
