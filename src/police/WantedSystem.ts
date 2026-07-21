export class WantedSystem {
  private level = 0;
  private unseenSeconds = 0;

  public constructor(private readonly decaySeconds = 18) {}

  public getLevel(): number {
    return this.level;
  }

  public setLevel(level: number): void {
    this.level = Math.max(0, Math.min(5, Math.floor(level)));
    this.unseenSeconds = 0;
  }

  public addCrime(severity = 1): number {
    this.setLevel(this.level + severity);
    return this.level;
  }

  public update(delta: number, visibleToPolice: boolean): number {
    if (visibleToPolice || this.level === 0) {
      this.unseenSeconds = 0;
      return this.level;
    }
    this.unseenSeconds += delta;
    if (this.unseenSeconds >= this.decaySeconds) {
      this.level -= 1;
      this.unseenSeconds = 0;
    }
    return this.level;
  }
}
