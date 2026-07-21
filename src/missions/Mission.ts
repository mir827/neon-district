export type Vec2 = { x: number; z: number };
export type MissionObjective =
  | { type: 'reach'; position: Vec2; radius: number; label: string }
  | { type: 'collect'; itemId: string; position: Vec2; radius: number; label: string }
  | { type: 'escape'; wantedAtMost: number; label: string };

export type MissionDefinition = {
  id: string;
  title: string;
  description: string;
  startPosition: Vec2;
  objectives: MissionObjective[];
  timeLimit: number;
  reward: number;
  successCondition: string;
  failureCondition: string;
};

export type MissionContext = {
  position: Vec2;
  collectedItems: ReadonlySet<string>;
  wantedLevel: number;
};

export type MissionState = 'inactive' | 'active' | 'succeeded' | 'failed';

export class MissionRuntime {
  public state: MissionState = 'inactive';
  public objectiveIndex = 0;
  public remaining: number;

  public constructor(public readonly definition: MissionDefinition) {
    this.remaining = definition.timeLimit;
  }

  public start(): void {
    this.state = 'active';
    this.objectiveIndex = 0;
    this.remaining = this.definition.timeLimit;
  }

  public update(delta: number, context: MissionContext): MissionState {
    if (this.state !== 'active') return this.state;
    this.remaining -= delta;
    if (this.remaining <= 0) {
      this.state = 'failed';
      return this.state;
    }
    const objective = this.definition.objectives[this.objectiveIndex];
    if (!objective) {
      this.state = 'succeeded';
      return this.state;
    }
    let complete = false;
    if (objective.type === 'escape') complete = context.wantedLevel <= objective.wantedAtMost;
    else {
      const distance = Math.hypot(
        context.position.x - objective.position.x,
        context.position.z - objective.position.z,
      );
      complete = distance <= objective.radius;
      if (objective.type === 'collect') complete &&= context.collectedItems.has(objective.itemId);
    }
    if (complete) {
      this.objectiveIndex += 1;
      if (this.objectiveIndex >= this.definition.objectives.length) this.state = 'succeeded';
    }
    return this.state;
  }

  public currentObjective(): MissionObjective | undefined {
    return this.definition.objectives[this.objectiveIndex];
  }
}
