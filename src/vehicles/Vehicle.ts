import * as THREE from 'three';
import { calculateVehicleDamage } from './VehicleDamage';

export type VehicleSpec = {
  id: string;
  name: string;
  color: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
};

export class Vehicle {
  public readonly mesh = new THREE.Group();
  public speed = 0;
  public durability = 100;
  public occupied = false;

  public constructor(
    public readonly spec: VehicleSpec,
    position: THREE.Vector3,
    scene: THREE.Scene,
  ) {
    const paint = new THREE.MeshStandardMaterial({
      color: spec.color,
      metalness: 0.46,
      roughness: 0.32,
    });
    const darkTrim = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.72 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x8ad8ea,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.35,
      transparent: true,
      opacity: 0.72,
    });
    const lightFront = new THREE.MeshBasicMaterial({ color: 0xe9fbff });
    const lightRear = new THREE.MeshBasicMaterial({ color: 0xff284d });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.95, 5.45), paint);
    body.position.y = 0.08;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.22, 1.45), paint);
    hood.position.set(0, 0.68, 1.55);
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 1.15), paint);
    trunk.position.set(0, 0.7, -1.95);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.9, 2.15), glass);
    cabin.position.set(0, 1.06, -0.05);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.65), paint);
    roof.position.set(0, 1.58, -0.12);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.32, 0.08), darkTrim);
    grille.position.set(0, 0.34, 2.78);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.2, 0.04), lightFront);
    plate.position.set(0, 0.13, 2.83);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.28), darkTrim);
    spoiler.position.set(0, 1.08, -2.75);
    this.mesh.add(body, hood, trunk, cabin, roof, grille, plate, spoiler);
    for (const x of [-1.08, 1.08]) {
      const headlamp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.06), lightFront);
      headlamp.position.set(x, 0.48, 2.78);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.06), lightRear);
      tail.position.set(x, 0.5, -2.78);
      this.mesh.add(headlamp, tail);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.38), darkTrim);
      mirror.position.set(x * 1.38, 1.1, 0.72);
      this.mesh.add(mirror);
    }
    for (const x of [-1.5, 1.5])
      for (const z of [-1.75, 1.75]) {
        const wheelGroup = new THREE.Group();
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.38, 18), darkTrim);
        wheel.rotation.z = Math.PI / 2;
        const rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.32, 0.42, 12),
          new THREE.MeshStandardMaterial({ color: 0xb7c2cc, metalness: 0.7, roughness: 0.22 }),
        );
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(wheel, rim);
        wheelGroup.position.set(x, -0.45, z);
        this.mesh.add(wheelGroup);
      }
    this.mesh.traverse((part) => {
      if (part instanceof THREE.Mesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    this.mesh.position.copy(position);
    this.mesh.position.y = 1;
    scene.add(this.mesh);
  }

  public drive(throttle: number, steering: number, brake: boolean, delta: number): void {
    const target = throttle * this.spec.maxSpeed;
    this.speed = THREE.MathUtils.damp(
      this.speed,
      target,
      throttle === 0 ? 2.2 : this.spec.acceleration,
      delta,
    );
    if (brake) this.speed = THREE.MathUtils.damp(this.speed, 0, 8, delta);
    this.mesh.rotation.y +=
      steering *
      this.spec.handling *
      delta *
      Math.min(1, Math.abs(this.speed) / 5) *
      Math.sign(this.speed || 1);
    this.mesh.translateZ(this.speed * delta);
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -202, 202);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -202, 202);
  }

  public collide(impact: number): void {
    this.durability = calculateVehicleDamage(this.durability, impact);
    this.speed *= -0.15;
  }
}
