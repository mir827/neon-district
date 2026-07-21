export class GameLoop {
  private previous = performance.now();
  private running = false;
  public constructor(private readonly update: (delta: number) => void) {}
  public start(): void {
    this.running = true;
    requestAnimationFrame(this.tick);
  }
  public stop(): void {
    this.running = false;
  }
  private readonly tick = (now: number): void => {
    if (!this.running) return;
    const delta = Math.min((now - this.previous) / 1000, 0.05);
    this.previous = now;
    this.update(document.hidden ? Math.min(delta, 1 / 10) : delta);
    requestAnimationFrame(this.tick);
  };
}
