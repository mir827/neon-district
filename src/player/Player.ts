import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { GAME_CONFIG } from '../core/config';
import { Health } from './Health';

type JointedLimb = {
  root: THREE.Group;
  lower: THREE.Group;
};

type FootCycle = {
  drive: number;
  lift: number;
  contact: number;
  toe: number;
};

export class Player {
  public readonly mesh = new THREE.Group();
  public readonly body: CANNON.Body;
  public readonly health = new Health(GAME_CONFIG.maxHealth);
  public inVehicleId: string | null = null;
  private readonly shoulders = new THREE.Group();
  private readonly hips = new THREE.Group();
  private readonly arms: THREE.Group[] = [];
  private readonly forearms: THREE.Group[] = [];
  private readonly legs: THREE.Group[] = [];
  private readonly shins: THREE.Group[] = [];
  private readonly boots: THREE.Object3D[] = [];
  private readonly head: THREE.Object3D;
  private readonly torso: THREE.Object3D;
  private lastPosition = new THREE.Vector3();
  private animationTime = 0;
  private smoothedSpeed = 0;
  private gaitBlend = 0;
  private turnLean = 0;

  public constructor(scene: THREE.Scene, physics: CANNON.World) {
    const shirt = new THREE.MeshStandardMaterial({ color: 0xe8ecf1, roughness: 0.74 });
    const jacket = new THREE.MeshStandardMaterial({ color: 0x2b3444, roughness: 0.72 });
    const denim = new THREE.MeshStandardMaterial({ color: 0x26395f, roughness: 0.8 });
    const shoes = new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.7 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc89464, roughness: 0.72 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x18100c, roughness: 0.68 });
    const glow = new THREE.MeshBasicMaterial({ color: 0x39ffee });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.82, 7, 14), shirt);
    torso.scale.set(1.08, 1, 0.62);
    torso.position.y = 1.04;
    this.torso = torso;
    const jacketFront = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.68, 0.16), jacket);
    jacketFront.position.set(0, 1.08, 0.29);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.1, 0.42), shoes);
    belt.position.y = 0.55;

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), skin);
    this.head.scale.set(0.92, 1.08, 0.9);
    this.head.position.y = 1.83;
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 18, 9, 0, Math.PI * 2, 0, 1.45),
      hair,
    );
    hairCap.position.y = 1.91;

    this.shoulders.position.y = 1.3;
    this.hips.position.y = 0.55;
    for (const side of [-1, 1]) {
      const arm = this.createJointedLimb(side * 0.52, 0, 0, 0.09, 0.47, 0.41, shirt, skin);
      const leg = this.createJointedLimb(side * 0.21, 0, 0, 0.12, 0.54, 0.52, denim, denim);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.42), shoes);
      boot.position.set(0, -0.55, 0.11);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.46, 0.035), glow);
      stripe.position.set(side * 0.39, 1.08, 0.39);
      arm.root.rotation.z = side * 0.22;
      leg.root.rotation.z = side * 0.04;
      leg.lower.add(boot);
      this.shoulders.add(arm.root);
      this.hips.add(leg.root);
      this.mesh.add(stripe);
      this.arms.push(arm.root);
      this.forearms.push(arm.lower);
      this.legs.push(leg.root);
      this.shins.push(leg.lower);
      this.boots.push(boot);
    }

    this.mesh.add(this.hips, torso, jacketFront, this.shoulders, this.head, hairCap, belt);
    this.mesh.traverse((part) => {
      if (part instanceof THREE.Mesh) part.castShadow = true;
    });
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
      const yawDelta = Math.atan2(
        Math.sin(targetYaw - this.mesh.rotation.y),
        Math.cos(targetYaw - this.mesh.rotation.y),
      );
      this.turnLean = THREE.MathUtils.damp(
        this.turnLean,
        THREE.MathUtils.clamp(yawDelta * this.smoothedSpeed * 0.08, -0.16, 0.16),
        10,
        delta,
      );
      this.mesh.rotation.y = THREE.MathUtils.damp(
        this.mesh.rotation.y,
        targetYaw,
        this.smoothedSpeed > 5 ? 18 : 11,
        delta,
      );
    } else this.turnLean = THREE.MathUtils.damp(this.turnLean, 0, 8, delta);
    this.animate(Math.min(this.smoothedSpeed, GAME_CONFIG.runSpeed), delta);
    this.lastPosition.copy(this.mesh.position);
  }

  public setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.body.velocity.setZero();
    this.lastPosition.set(x, y - 0.2, z);
  }

  private animate(speed: number, delta: number): void {
    const targetGait = THREE.MathUtils.clamp(speed / 7, 0, 1);
    this.gaitBlend = THREE.MathUtils.damp(this.gaitBlend, targetGait, 9, delta);
    const gait = this.gaitBlend;
    const runBlend = THREE.MathUtils.clamp((speed - GAME_CONFIG.walkSpeed) / 5, 0, 1);
    const cadence = THREE.MathUtils.lerp(5.6, 9.2, runBlend);
    this.animationTime += delta * cadence * Math.max(gait, 0.16);
    const leftCycle = this.getFootCycle(this.animationTime);
    const rightCycle = this.getFootCycle(this.animationTime + Math.PI);
    const step = (leftCycle.drive - rightCycle.drive) * 0.5;
    const strideAmount = THREE.MathUtils.lerp(0.42, 0.7, runBlend) * gait;
    const kneeAmount = THREE.MathUtils.lerp(0.38, 0.8, runBlend) * gait;
    const bob =
      (leftCycle.lift + rightCycle.lift) * THREE.MathUtils.lerp(0.045, 0.075, runBlend) * gait;
    const hipSway = Math.sin(this.animationTime) * 0.052 * gait - this.turnLean * 0.35;
    const shoulderRoll = -hipSway * 0.76 + this.turnLean * 0.3;
    this.mesh.position.y += bob;
    this.hips.position.y =
      0.55 + bob * 0.36 - (leftCycle.contact + rightCycle.contact) * 0.009 * gait;
    this.hips.rotation.z = THREE.MathUtils.damp(this.hips.rotation.z, hipSway, 9, delta);
    this.hips.rotation.y = THREE.MathUtils.damp(
      this.hips.rotation.y,
      -step * 0.055 * gait,
      8,
      delta,
    );
    this.shoulders.rotation.z = THREE.MathUtils.damp(
      this.shoulders.rotation.z,
      shoulderRoll,
      9,
      delta,
    );
    this.torso.rotation.x = THREE.MathUtils.damp(
      this.torso.rotation.x,
      speed > 0.2 ? -0.05 - runBlend * 0.06 : 0,
      8,
      delta,
    );
    this.torso.rotation.z = THREE.MathUtils.damp(
      this.torso.rotation.z,
      shoulderRoll * 0.55 + this.turnLean * 0.32,
      7,
      delta,
    );
    this.head.rotation.x = THREE.MathUtils.damp(
      this.head.rotation.x,
      speed > 0.2 ? -0.05 : 0,
      8,
      delta,
    );
    this.head.rotation.z = THREE.MathUtils.damp(
      this.head.rotation.z,
      -shoulderRoll * 0.6 - this.turnLean * 0.18,
      7,
      delta,
    );
    this.arms.forEach((arm, index) => {
      const forearm = this.forearms[index];
      if (!forearm) return;
      const side = index === 0 ? -1 : 1;
      const cycle = index === 0 ? rightCycle : leftCycle;
      const phase = index === 0 ? -step : step;
      arm.rotation.x = THREE.MathUtils.damp(
        arm.rotation.x,
        phase * THREE.MathUtils.lerp(0.58, 0.95, runBlend) - gait * 0.16 - cycle.lift * 0.08,
        14,
        delta,
      );
      arm.rotation.z = THREE.MathUtils.damp(arm.rotation.z, side * (0.16 + gait * 0.06), 10, delta);
      forearm.rotation.x = THREE.MathUtils.damp(
        forearm.rotation.x,
        -0.18 - Math.max(0, -phase) * 0.34 * gait - cycle.contact * 0.08,
        12,
        delta,
      );
    });
    this.legs.forEach((leg, index) => {
      const shin = this.shins[index];
      if (!shin) return;
      const side = index === 0 ? -1 : 1;
      const cycle = index === 0 ? leftCycle : rightCycle;
      const phase = index === 0 ? step : -step;
      leg.rotation.x = THREE.MathUtils.damp(
        leg.rotation.x,
        -phase * strideAmount + cycle.lift * 0.12,
        14,
        delta,
      );
      leg.rotation.z = THREE.MathUtils.damp(
        leg.rotation.z,
        side * Math.max(0.015, 0.04 - gait * 0.018),
        8,
        delta,
      );
      shin.rotation.x = THREE.MathUtils.damp(
        shin.rotation.x,
        cycle.lift * kneeAmount + cycle.contact * 0.045 * gait,
        14,
        delta,
      );
    });
    this.boots.forEach((boot, index) => {
      const cycle = index === 0 ? leftCycle : rightCycle;
      boot.rotation.x = THREE.MathUtils.damp(
        boot.rotation.x,
        cycle.toe * 0.36 * gait - cycle.contact * 0.12 * gait,
        14,
        delta,
      );
      boot.position.y = -0.55 + cycle.lift * 0.035 * gait;
      boot.position.z = 0.11 + cycle.toe * 0.08 * gait - cycle.contact * 0.018 * gait;
    });
  }

  private getFootCycle(phase: number): FootCycle {
    const forward = Math.sin(phase);
    const liftWave = Math.sin(phase - Math.PI * 0.28);
    const contact = THREE.MathUtils.smoothstep(-liftWave, 0.05, 0.82);
    const lift = THREE.MathUtils.smoothstep(liftWave, 0.12, 0.95);
    const toe = THREE.MathUtils.smoothstep(forward, 0.05, 0.95);
    return {
      drive: THREE.MathUtils.lerp(forward * 0.45, forward, lift),
      lift,
      contact,
      toe,
    };
  }

  private createJointedLimb(
    x: number,
    y: number,
    z: number,
    radius: number,
    upperLength: number,
    lowerLength: number,
    upperMaterial: THREE.Material,
    lowerMaterial: THREE.Material,
  ): JointedLimb {
    const root = new THREE.Group();
    root.position.set(x, y, z);
    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, upperLength, 6, 10),
      upperMaterial,
    );
    upper.position.y = -upperLength * 0.5;
    const lower = new THREE.Group();
    lower.position.y = -upperLength;
    const lowerMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius * 0.88, lowerLength, 6, 10),
      lowerMaterial,
    );
    lowerMesh.position.y = -lowerLength * 0.5;
    lower.add(lowerMesh);
    root.add(upper, lower);
    return { root, lower };
  }
}
