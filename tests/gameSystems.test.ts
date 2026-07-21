import { describe, expect, it } from 'vitest';
import { validateSettings } from '../src/core/config';
import { deserializeSave, SAVE_VERSION } from '../src/core/SaveManager';
import { MissionRuntime, type MissionDefinition } from '../src/missions/Mission';
import { Health } from '../src/player/Health';
import { WantedSystem } from '../src/police/WantedSystem';
import { calculateVehicleDamage } from '../src/vehicles/VehicleDamage';

describe('WantedSystem', () => {
  it('clamps crimes to five and decays while unseen', () => {
    const wanted = new WantedSystem(10);
    wanted.addCrime(9);
    expect(wanted.getLevel()).toBe(5);
    wanted.update(10, false);
    expect(wanted.getLevel()).toBe(4);
    wanted.update(20, true);
    expect(wanted.getLevel()).toBe(4);
  });
  it('maps gameplay crime triggers to wanted severity', () => {
    const wanted = new WantedSystem();
    expect(wanted.reportCrime('vehicle-theft')).toBe(1);
    expect(wanted.reportCrime('collision')).toBe(2);
    expect(wanted.reportCrime('restricted-zone')).toBe(4);
    expect(wanted.reportCrime('ignored-stop')).toBe(5);
  });
});

const mission: MissionDefinition = {
  id: 'test',
  title: 'test',
  description: 'test',
  startPosition: { x: 0, z: 0 },
  objectives: [{ type: 'reach', position: { x: 5, z: 5 }, radius: 2, label: 'reach' }],
  timeLimit: 10,
  reward: 1,
  successCondition: 'reach',
  failureCondition: 'timeout',
};
describe('MissionRuntime', () => {
  it('succeeds when objective is reached', () => {
    const runtime = new MissionRuntime(mission);
    runtime.start();
    expect(
      runtime.update(1, { position: { x: 5, z: 5 }, collectedItems: new Set(), wantedLevel: 0 }),
    ).toBe('succeeded');
  });
  it('fails after timeout', () => {
    const runtime = new MissionRuntime(mission);
    runtime.start();
    expect(
      runtime.update(11, { position: { x: 0, z: 0 }, collectedItems: new Set(), wantedLevel: 0 }),
    ).toBe('failed');
  });
});

describe('Save data', () => {
  it('migrates old score and validates player data', () => {
    const save = deserializeSave(
      JSON.stringify({ version: 1, score: 7, player: { x: 2, y: 3, z: 4, health: 120 } }),
    );
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.credits).toBe(7);
    expect(save.player.health).toBe(100);
  });
  it('restores defaults from malformed JSON', () =>
    expect(deserializeSave('{').player.health).toBe(100));
});

describe('Damage and settings', () => {
  it('calculates vehicle durability from impact threshold', () => {
    expect(calculateVehicleDamage(100, 3)).toBe(100);
    expect(calculateVehicleDamage(100, 14)).toBe(75);
  });
  it('clamps health and healing', () => {
    const health = new Health(100);
    health.damage(150);
    expect(health.current).toBe(0);
    health.heal(250);
    expect(health.current).toBe(100);
  });
  it('validates settings ranges and types', () => {
    const settings = validateSettings({ resolutionScale: 5, volume: -2, shadows: 'yes' });
    expect(settings.resolutionScale).toBe(1.5);
    expect(settings.volume).toBe(0);
    expect(settings.shadows).toBe(true);
  });
});
