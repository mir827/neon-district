import type { MissionDefinition, MissionContext } from './Mission';
import { MissionRuntime } from './Mission';
import { MISSIONS } from './missionData';

export class MissionManager {
  public active: MissionRuntime | null = null;
  public readonly completed = new Set<string>();
  public constructor(private readonly onReward: (credits: number) => void) {}
  public nearest(position: { x: number; z: number }): MissionDefinition | null {
    return (
      MISSIONS.find(
        (mission) =>
          Math.hypot(position.x - mission.startPosition.x, position.z - mission.startPosition.z) <
            10 && !this.completed.has(mission.id),
      ) ?? null
    );
  }
  public start(definition: MissionDefinition): void {
    this.active = new MissionRuntime(definition);
    this.active.start();
  }
  public update(delta: number, context: MissionContext): 'succeeded' | 'failed' | null {
    if (!this.active) return null;
    const state = this.active.update(delta, context);
    if (state === 'succeeded') {
      this.completed.add(this.active.definition.id);
      this.onReward(this.active.definition.reward);
      this.active = null;
      return state;
    }
    if (state === 'failed') {
      this.active = null;
      return state;
    }
    return null;
  }
}
