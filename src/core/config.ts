export const GAME_CONFIG = {
  worldSize: 420,
  walkSpeed: 8,
  runSpeed: 14,
  jumpSpeed: 9,
  maxHealth: 100,
  cameraMin: 6,
  cameraMax: 20,
  npcActiveDistance: 110,
  wantedDecaySeconds: 18,
  interactionDistance: 7,
} as const;

export type QualitySettings = {
  shadows: boolean;
  resolutionScale: number;
  developerStats: boolean;
  volume: number;
};

export const DEFAULT_SETTINGS: QualitySettings = {
  shadows: true,
  resolutionScale: 1,
  developerStats: false,
  volume: 0.35,
};

export function validateSettings(value: unknown): QualitySettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS };
  const candidate = value as Partial<QualitySettings>;
  return {
    shadows: typeof candidate.shadows === 'boolean' ? candidate.shadows : true,
    resolutionScale:
      typeof candidate.resolutionScale === 'number'
        ? Math.min(1.5, Math.max(0.5, candidate.resolutionScale))
        : 1,
    developerStats:
      typeof candidate.developerStats === 'boolean' ? candidate.developerStats : false,
    volume:
      typeof candidate.volume === 'number' ? Math.min(1, Math.max(0, candidate.volume)) : 0.35,
  };
}
