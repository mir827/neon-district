export class Health {
  public current: number;

  public constructor(
    public readonly maximum = 100,
    initial = maximum,
  ) {
    this.current = Math.min(maximum, Math.max(0, initial));
  }

  public damage(amount: number): number {
    this.current = Math.max(0, this.current - Math.max(0, amount));
    return this.current;
  }

  public heal(amount: number): number {
    this.current = Math.min(this.maximum, this.current + Math.max(0, amount));
    return this.current;
  }
}
