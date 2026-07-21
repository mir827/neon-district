export type AIState = 'idle' | 'walk' | 'flee';
export class AIStateMachine {
  public state: AIState = 'idle';
  private timer = 1;
  public update(delta: number, threatDistance: number): AIState {
    if (threatDistance < 13) {
      this.state = 'flee';
      this.timer = 3;
      return this.state;
    }
    this.timer -= delta;
    if (this.timer <= 0) {
      this.state = this.state === 'idle' ? 'walk' : 'idle';
      this.timer = 2 + Math.random() * 4;
    }
    return this.state;
  }
}
