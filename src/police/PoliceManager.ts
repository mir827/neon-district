import * as THREE from 'three';

export class PoliceManager {
  private readonly units: THREE.Mesh[] = [];
  public constructor(private readonly scene: THREE.Scene) {}
  public update(delta: number, target: THREE.Vector3, wantedLevel: number): boolean {
    while (this.units.length < Math.min(wantedLevel, 3)) {
      const unit = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.7, 4.6),
        new THREE.MeshStandardMaterial({ color: 0x315dff, emissive: 0x081848 }),
      );
      unit.position.set(target.x + 35 + this.units.length * 8, 1, target.z + 30);
      this.scene.add(unit);
      this.units.push(unit);
    }
    while (this.units.length > wantedLevel) {
      const unit = this.units.pop();
      if (unit) {
        this.scene.remove(unit);
        unit.geometry.dispose();
      }
    }
    let visible = false;
    for (const unit of this.units) {
      const direction = target.clone().sub(unit.position);
      const distance = direction.length();
      visible ||= distance < 45;
      if (distance > 4) {
        direction.normalize();
        unit.position.addScaledVector(direction, delta * (7 + wantedLevel * 1.4));
        unit.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }
    return visible;
  }
  public positions(): THREE.Vector3[] {
    return this.units.map((unit) => unit.position);
  }
}
