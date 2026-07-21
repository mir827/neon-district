import { DEFAULT_SETTINGS, validateSettings, type QualitySettings } from './config';

export const SAVE_VERSION = 2;
export type GameSave = {
  version: number;
  player: { x: number; y: number; z: number; health: number };
  completedMissions: string[];
  credits: number;
  settings: QualitySettings;
  lastVehicle: string | null;
  collectedItems: string[];
};

export const DEFAULT_SAVE: GameSave = {
  version: SAVE_VERSION,
  player: { x: 0, y: 3, z: 0, health: 100 },
  completedMissions: [],
  credits: 0,
  settings: { ...DEFAULT_SETTINGS },
  lastVehicle: null,
  collectedItems: [],
};

export function deserializeSave(raw: string | null): GameSave {
  if (!raw) return structuredClone(DEFAULT_SAVE);
  try {
    const data = JSON.parse(raw) as Partial<GameSave> & { score?: number };
    const player = data.player ?? DEFAULT_SAVE.player;
    return {
      version: SAVE_VERSION,
      player: {
        x: Number.isFinite(player.x) ? player.x : 0,
        y: Number.isFinite(player.y) ? player.y : 3,
        z: Number.isFinite(player.z) ? player.z : 0,
        health: Math.min(100, Math.max(0, Number.isFinite(player.health) ? player.health : 100)),
      },
      completedMissions: Array.isArray(data.completedMissions)
        ? data.completedMissions.filter((x): x is string => typeof x === 'string')
        : [],
      credits: Number.isFinite(data.credits)
        ? Math.max(0, data.credits ?? 0)
        : Math.max(0, data.score ?? 0),
      settings: validateSettings(data.settings),
      lastVehicle: typeof data.lastVehicle === 'string' ? data.lastVehicle : null,
      collectedItems: Array.isArray(data.collectedItems)
        ? data.collectedItems.filter((x): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export class SaveManager {
  private readonly key = 'neon-district-save';
  public load(): GameSave {
    return deserializeSave(localStorage.getItem(this.key));
  }
  public save(data: GameSave): void {
    localStorage.setItem(this.key, JSON.stringify({ ...data, version: SAVE_VERSION }));
  }
}
