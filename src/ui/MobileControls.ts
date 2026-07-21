import type { InputManager } from '../core/InputManager';

export class MobileControls {
  public constructor(parent: HTMLElement, input: InputManager) {
    if (!input.isTouchDevice()) return;
    const root = document.createElement('div');
    root.id = 'mobile';
    root.innerHTML = `<div id="stick"><i></i></div><div class="buttons"><button data-code="ShiftLeft">달리기</button><button data-code="Space">점프/브레이크</button><button data-code="KeyE">탑승·대화</button><button data-code="KeyF">미션</button></div>`;
    parent.append(root);
    const stick = root.querySelector<HTMLElement>('#stick');
    const knob = root.querySelector<HTMLElement>('#stick i');
    let originX = 0;
    let originY = 0;
    stick?.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        if (touch) {
          originX = touch.clientX;
          originY = touch.clientY;
        }
      },
      { passive: true },
    );
    stick?.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        const x = Math.max(-1, Math.min(1, (touch.clientX - originX) / 45));
        const y = Math.max(-1, Math.min(1, (touch.clientY - originY) / 45));
        input.setTouchMove(x, y);
        if (knob) knob.style.transform = `translate(${x * 35}px,${y * 35}px)`;
      },
      { passive: true },
    );
    stick?.addEventListener('touchend', () => {
      input.setTouchMove(0, 0);
      if (knob) knob.style.transform = '';
    });
    root.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      const code = button.dataset.code ?? '';
      button.addEventListener('touchstart', (event) => {
        event.preventDefault();
        input.pressVirtual(code);
      });
      button.addEventListener('touchend', () => input.releaseVirtual(code));
    });
  }
}
