import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { GAME_CONFIG } from '../core/config';
import { Health } from './Health';

export class Player {
  public readonly mesh = new THREE.Group();
  public readonly body: CANNON.Body;
  public readonly health = new Health(GAME_CONFIG.maxHealth);
  public inVehicleId: string | null = null;
  private readonly arms: THREE.Object3D[] = [];
  private readonly legs: THREE.Object3D[] = [];
  private readonly boots: THREE.Object3D[] = [];
  private readonly head: THREE.Object3D;
  private readonly torso: THREE.Object3D;
  private lastPosition = new THREE.Vector3();
  private animationTime = 0;
  private smoothedSpeed = 0;

  public constructor(scene: THREE.Scene, physics: CANNON.World) {
    const suit = new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.62 });
    const armor = new THREE.MeshStandardMaterial({
      color: 0x202735,
      metalness: 0.25,
      roughness: 0.42,
    });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc89464, roughness: 0.72 });
    const visor = new THREE.MeshStandardMaterial({
      color: 0x14d9c4,
      emissive: 0x063c38,
      metalness: 0.45,
      roughness: 0.18,
    });
    const glow = new THREE.MeshBasicMaterial({ color: 0x39ffee });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.15, 5, 12), suit);
    torso.scale.set(1, 1.05, 0.7);
    torso.position.y = 0.9;
    this.torso = torso;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.16), armor);
    chest.position.set(0, 1.14, 0.36);
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), skin);
    this.head.position.y = 1.9;
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 18, 10, 0, Math.PI * 2, 0, 1.9),
      armor,
    );
    helmet.position.y = 1.98;
    const visorBand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.08), visor);
    visorBand.position.set(0, 1.96, 0.32);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.5), armor);
    belt.position.y = 0.42;
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.82, 4, 8), suit);
      arm.position.set(side * 0.58, 0.95, 0);
      arm.rotation.z = side * 0.18;
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.95, 4, 8), armor);
      leg.position.set(side * 0.22, -0.18, 0);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.5), armor);
      boot.position.set(side * 0.22, -0.76, 0.08);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.75, 0.04), glow);
      stripe.position.set(side * 0.43, 0.98, 0.37);
      this.mesh.add(arm, leg, boot, stripe);
      this.arms.push(arm);
      this.legs.push(leg);
      this.boots.push(boot);
    }
    for (const part of [torso, chest, this.head, helmet, visorBand, belt]) part.castShadow = true;
    this.mesh.add(torso, chest, this.head, helmet, visorBand, belt);
    scene.add(this.mesh);
    this.body = new CANNON.Body({
      mass: 70,
      position: new CANNON.Vec3(0, 3, 0),
      fixedRotation: true,
      linearDamping: 0.88,
      shape: new CANNON.Sphere(0.85),
    });
    physics.addBody(this.body);
    this.lastPosition.copy(this.mesh.position);
  }

  public sync(delta = 1 / 60): void {
    this.mesh.position.set(this.body.position.x, this.body.position.y - 0.2, this.body.position.z);
    this.mesh.visible = this.inVehicleId === null;
    const frameMove = this.mesh.position.clone().sub(this.lastPosition);
    const horizontalSpeed = Math.hypot(frameMove.x, frameMove.z) / Math.max(delta, 1 / 120);
    this.smoothedSpeed = THREE.MathUtils.damp(this.smoothedSpeed, horizontalSpeed, 12, delta);
    if (horizontalSpeed > 0.08) {
      const targetYaw = Math.atan2(frameMove.x, frameMove.z);
      this.mesh.rotation.y = THREE.MathUtils.damp(
        this.mesh.rotation.y,
        targetYaw,
        this.smoothedSpeed > 5 ? 18 : 11,
        delta,
      );
    }
    this.animate(Math.min(this.smoothedSpeed, 9), delta);
    this.lastPosition.copy(this.mesh.position);
  }

  public setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.body.velocity.setZero();
    this.lastPosition.set(x, y - 0.2, z);
  }

  private animate(speed: number, delta: number): void {
    const gait = THREE.MathUtils.clamp(speed / 7, 0, 1);
    this.animationTime += delta * (3.8 + speed * 1.05);
    const stride = Math.sin(this.animationTime) * gait;
    const counterStride = Math.sin(this.animationTime + Math.PI) * gait;
    const bob =
      Math.abs(Math.sin(this.animationTime)) * 0.06 * THREE.MathUtils.clamp(speed / 5, 0, 1);
    const shoulderRoll = Math.sin(this.animationTime * 0.5) * 0.035 * gait;
    this.mesh.position.y += bob;
    this.torso.rotation.x = THREE.MathUtils.damp(
      this.torso.rotation.x,
      speed > 0.2 ? -0.05 : 0,
      8,
      delta,
    );
    this.torso.rotation.z = THREE.MathUtils.damp(this.torso.rotation.z, shoulderRoll, 7, delta);
    this.head.rotation.x = THREE.MathUtils.damp(
      this.head.rotation.x,
      speed > 0.2 ? -0.07 : 0,
      8,
      delta,
    );
    this.head.rotation.z = THREE.MathUtils.damp(
      this.head.rotation.z,
      -shoulderRoll * 0.6,
      7,
      delta,
    );
    this.arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1;
      const phase = index === 0 ? stride : counterStride;
      arm.rotation.x = THREE.MathUtils.damp(
        arm.rotation.x,
        side * phase * 0.62 - gait * 0.12,
        14,
        delta,
      );
      arm.rotation.z = THREE.MathUtils.damp(arm.rotation.z, side * (0.16 + gait * 0.06), 10, delta);
    });
    this.legs.forEach((leg, index) => {
      const side = index === 0 ? -1 : 1;
      const phase = index === 0 ? stride : counterStride;
      leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, -side * phase * 0.5, 14, delta);
      leg.rotation.z = THREE.MathUtils.damp(
        leg.rotation.z,
        side * Math.max(0, 0.025 - gait * 0.02),
        8,
        delta,
      );
    });
    this.boots.forEach((boot, index) => {
      const side = index === 0 ? -1 : 1;
      const phase = index === 0 ? stride : counterStride;
      boot.rotation.x = THREE.MathUtils.damp(
        boot.rotation.x,
        -side * phase * 0.24 + Math.max(0, phase) * 0.08,
        14,
        delta,
      );
      boot.position.z = 0.08 + Math.max(0, phase) * 0.05;
    });
  }
}
