import './styles/main.css';
import { Game } from './core/Game';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('게임 루트 요소를 찾을 수 없습니다.');

try {
  const canvas = document.createElement('canvas');
  const supported = Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  if (!supported)
    root.innerHTML =
      '<section class="fatal"><h1>WebGL 2가 필요합니다</h1><p>최신 Chrome, Edge, Firefox 또는 Safari에서 하드웨어 가속을 켜주세요.</p></section>';
  else new Game(root).start();
} catch (error) {
  const message = error instanceof Error ? error.message : '알 수 없는 오류';
  root.innerHTML = `<section class="fatal"><h1>게임을 시작하지 못했습니다</h1><p>${message}</p><button onclick="location.reload()">다시 시도</button></section>`;
}
