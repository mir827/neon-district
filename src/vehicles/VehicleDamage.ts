export function calculateVehicleDamage(current: number, impactSpeed: number): number {
  const damage = Math.max(0, impactSpeed - 4) * 2.5;
  return Math.max(0, Math.min(100, current - damage));
}
