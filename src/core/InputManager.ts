export class InputManager {
  private readonly keys = new Set<string>();
  private pressed = new Set<string>();
  public moveX = 0;
  public moveY = 0;
  public cameraX = 0;
  public cameraY = 0;

  public constructor(element: HTMLElement) {
    window.addEventListener('keydown', (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    element.addEventListener('click', () => {
      if (!this.isTouchDevice()) void element.requestPointerLock();
    });
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === element) {
        this.cameraX += event.movementX;
        this.cameraY += event.movementY;
      }
    });
  }

  public isDown(code: string): boolean {
    return this.keys.has(code);
  }
  public consume(code: string): boolean {
    const value = this.pressed.has(code);
    this.pressed.delete(code);
    return value;
  }
  public setTouchMove(x: number, y: number): void {
    this.moveX = x;
    this.moveY = y;
  }
  public pressVirtual(code: string): void {
    this.pressed.add(code);
    this.keys.add(code);
  }
  public releaseVirtual(code: string): void {
    this.keys.delete(code);
  }
  public endFrame(): void {
    this.cameraX = 0;
    this.cameraY = 0;
    this.pressed = new Set();
  }
  public isTouchDevice(): boolean {
    return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }
}
