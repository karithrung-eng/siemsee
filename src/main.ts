import './styles.css';
import { setMuted } from './audio/sound';
import { Game } from './state/game';
import { store } from './state/store';
import { toast } from './ui/dom';
import { editorScreen } from './ui/editor';
import { libraryScreen } from './ui/library';
import { playScreen } from './ui/play';
import { navigate, parse } from './ui/router';
import { setupScreen } from './ui/setup';

const app = document.getElementById('app')!;
const game = new Game();
let gameActive = false;
let destroyCurrent: (() => void) | null = null;

// ความสูงจอที่เหลือจริง (รวมกรณีแถบเครื่องมือเบราว์เซอร์แสดงอยู่)
const setAppHeight = () => {
  const vv = window.visualViewport;
  const hgt = Math.round(vv && vv.scale === 1 ? vv.height : window.innerHeight);
  document.documentElement.style.setProperty('--app-h', `${hgt}px`);
};
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.visualViewport?.addEventListener('resize', setAppHeight);

setMuted(store.data.muted);

/** เริ่มวงใหม่ทุกครั้ง: ยกเลิกงานเก่า ล้างรอบ/ประวัติ เก็บชื่อและคำสั่งส่วนตัวไว้ */
function startGame() {
  game.start(store.data.playerCount, store.playableCards());
  gameActive = true;
  navigate('play');
}

function leaveGame() {
  game.cancel();
  gameActive = false;
  navigate('', true);
}

function mount() {
  destroyCurrent?.();
  destroyCurrent = null;
  const route = parse();
  if (route.name !== 'play' && gameActive) {
    // ออกจากหน้าเล่นด้วยปุ่มย้อนกลับของเบราว์เซอร์
    game.cancel();
    gameActive = false;
  }
  let el: HTMLElement;
  switch (route.name) {
    case 'play': {
      if (!gameActive) {
        navigate('', true);
        return;
      }
      const p = playScreen(game, leaveGame);
      el = p.el;
      destroyCurrent = () => {
        p.destroy();
        game.cancel();
      };
      break;
    }
    case 'library':
      el = libraryScreen();
      break;
    case 'edit':
      el = editorScreen(route.id);
      break;
    default:
      el = setupScreen(startGame);
  }
  app.replaceChildren(el);
  window.scrollTo(0, 0);
  document.documentElement.dataset.route = route.name;
}

window.addEventListener('hashchange', mount);
mount();

if (!store.storageOk) toast('เบราว์เซอร์บันทึกข้อมูลไม่ได้ เล่นต่อได้ตามปกติ', 4000);
