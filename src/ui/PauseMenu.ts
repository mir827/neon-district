import type { QualitySettings } from '../core/config';

export class PauseMenu {
  public readonly element: HTMLElement;
  public paused = false;
  public constructor(
    parent: HTMLElement,
    settings: QualitySettings,
    onChange: (settings: QualitySettings) => void,
    onSave: () => void,
    onLoad: () => void,
  ) {
    this.element = document.createElement('section');
    this.element.id = 'pause';
    this.element.innerHTML = `<div><h1>일시정지</h1><p>WASD 이동 · Shift 달리기 · Space 점프/브레이크<br>E 상호작용 · F 미션 · Esc 닫기</p><label>해상도 <input id="resolution" type="range" min="0.5" max="1.5" step="0.25" value="${settings.resolutionScale}"></label><label><input id="shadows" type="checkbox" ${settings.shadows ? 'checked' : ''}> 그림자</label><label><input id="statsToggle" type="checkbox" ${settings.developerStats ? 'checked' : ''}> 개발자 통계</label><label>음량 <input id="volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><button id="save">저장</button><button id="load">불러오기</button><button id="resume">계속</button></div>`;
    parent.append(this.element);
    const emit = (): void =>
      onChange({
        resolutionScale: Number(this.input('resolution').value),
        shadows: this.input('shadows').checked,
        developerStats: this.input('statsToggle').checked,
        volume: Number(this.input('volume').value),
      });
    this.element
      .querySelectorAll('input')
      .forEach((input) => input.addEventListener('input', emit));
    this.element.querySelector('#save')?.addEventListener('click', onSave);
    this.element.querySelector('#load')?.addEventListener('click', onLoad);
    this.element.querySelector('#resume')?.addEventListener('click', () => this.toggle(false));
  }
  public toggle(value = !this.paused): void {
    this.paused = value;
    this.element.classList.toggle('visible', value);
    if (value) document.exitPointerLock();
  }
  private input(id: string): HTMLInputElement {
    const input = this.element.querySelector<HTMLInputElement>(`#${id}`);
    if (!input) throw new Error(`설정 입력 누락: ${id}`);
    return input;
  }
}
