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
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 1.1, 5.5),
      new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.35, roughness: 0.4 }),
    );
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x8ad8ea, metalness: 0.65, roughness: 0.18 }),
    );
    cabin.position.set(0, 1, 0.25);
    body.castShadow = true;
    cabin.castShadow = true;
    this.mesh.add(body, cabin);
    for (const x of [-1.5, 1.5])
      for (const z of [-1.75, 1.75]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.55, 0.35, 10),
          new THREE.MeshStandardMaterial({ color: 0x111317 }),
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, -0.45, z);
        this.mesh.add(wheel);
      }
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
