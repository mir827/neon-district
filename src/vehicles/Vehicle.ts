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
  private readonly bodyRoot = new THREE.Group();
  private readonly wheels: THREE.Group[] = [];
  private readonly frontWheels: THREE.Group[] = [];
  private wheelSpin = 0;
  private lean = 0;

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
    this.bodyRoot.add(body, hood, trunk, cabin, roof, grille, plate, spoiler);
    for (const x of [-1.08, 1.08]) {
      const headlamp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.06), lightFront);
      headlamp.position.set(x, 0.48, 2.78);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.06), lightRear);
      tail.position.set(x, 0.5, -2.78);
      this.bodyRoot.add(headlamp, tail);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.38), darkTrim);
      mirror.position.set(x * 1.38, 1.1, 0.72);
      this.bodyRoot.add(mirror);
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
        this.wheels.push(wheelGroup);
        if (z > 0) this.frontWheels.push(wheelGroup);
      }
    this.mesh.add(this.bodyRoot);
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
    const previousSpeed = this.speed;
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
    this.animateChassis(delta, steering, previousSpeed);
  }

  public collide(impact: number): void {
    this.durability = calculateVehicleDamage(this.durability, impact);
    this.speed *= -0.15;
    this.lean = THREE.MathUtils.clamp(impact * 0.018, -0.22, 0.22);
  }

  private animateChassis(delta: number, steering: number, previousSpeed: number): void {
    this.wheelSpin += this.speed * delta * 1.85;
    const steerAngle = THREE.MathUtils.clamp(steering, -1, 1) * 0.42;
    const accelerationPitch = THREE.MathUtils.clamp(
      (this.speed - previousSpeed) * 0.018,
      -0.08,
      0.08,
    );
    const targetLean = -steering * Math.min(0.22, Math.abs(this.speed) * 0.012);
    this.lean = THREE.MathUtils.damp(this.lean, targetLean, 6.5, delta);
    this.bodyRoot.rotation.z = this.lean;
    this.bodyRoot.rotation.x = THREE.MathUtils.damp(
      this.bodyRoot.rotation.x,
      -accelerationPitch,
      6,
      delta,
    );
    this.bodyRoot.position.y =
      0.02 + Math.sin(this.wheelSpin * 0.35) * Math.min(0.035, Math.abs(this.speed) * 0.0015);
    for (const wheel of this.wheels) wheel.rotation.x = this.wheelSpin;
    for (const wheel of this.frontWheels)
      wheel.rotation.y = THREE.MathUtils.damp(wheel.rotation.y, steerAngle, 10, delta);
  }
}
