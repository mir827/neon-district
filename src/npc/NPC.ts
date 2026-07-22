import * as THREE from 'three';
import { AIStateMachine } from './AIStateMachine';

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

type GaitProfile = {
  phase: number;
  cadence: number;
  stride: number;
  bounce: number;
  sway: number;
  armSwing: number;
  height: number;
  shoulderWidth: number;
  hipWidth: number;
};

export class NPC {
  public readonly mesh = new THREE.Group();
  private readonly ai = new AIStateMachine();
  private readonly shoulders = new THREE.Group();
  private readonly hips = new THREE.Group();
  private readonly arms: THREE.Group[] = [];
  private readonly forearms: THREE.Group[] = [];
  private readonly legs: THREE.Group[] = [];
  private readonly shins: THREE.Group[] = [];
  private readonly shoes: THREE.Object3D[] = [];
  private readonly head: THREE.Object3D;
  private readonly torso: THREE.Object3D;
  private direction = Math.random() * Math.PI * 2;
  private pace = 0;
  private turnVelocity = 0;
  private energyBlend = 0;
  private readonly gait: GaitProfile;
  public constructor(position: THREE.Vector3, color: number, scene: THREE.Scene, seed = 0) {
    this.gait = this.createGaitProfile(seed);
    const jacket = new THREE.MeshStandardMaterial({ color, roughness: 0.68 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1d2430, roughness: 0.82 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xbe875e, roughness: 0.76 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.6 });
    const glow = new THREE.MeshBasicMaterial({ color: 0x7efcff });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.78, 6, 10), jacket);
    torso.scale.set(1.04 + (this.gait.shoulderWidth - 1) * 0.45, this.gait.height, 0.66);
    torso.position.y = 0.98;
    this.torso = torso;
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.09), cloth);
    shirt.position.set(0, 0.99, 0.25);
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), skin);
    this.head.scale.set(0.92, 1.08, 0.9);
    this.head.position.y = 1.68 * this.gait.height;
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 8, 0, Math.PI * 2, 0, 1.45),
      hair,
    );
    cap.position.y = 1.76 * this.gait.height;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.12), cloth);
    bag.position.set(-0.32, 0.88, -0.23);
    this.shoulders.position.y = 1.22 * this.gait.height;
    this.hips.position.y = 0.5;
    for (const side of [-1, 1]) {
      const arm = this.createJointedLimb(
        side * 0.42 * this.gait.shoulderWidth,
        0,
        0,
        0.075,
        0.38 * this.gait.height,
        0.34 * this.gait.height,
        jacket,
        skin,
      );
      const leg = this.createJointedLimb(
        side * 0.15 * this.gait.hipWidth,
        0,
        0,
        0.09,
        0.46 * this.gait.height,
        0.43 * this.gait.height,
        cloth,
        cloth,
      );
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.32), cloth);
      shoe.position.set(0, -0.46, 0.08);
      arm.root.rotation.z = side * 0.18;
      leg.root.rotation.z = side * 0.03;
      leg.lower.add(shoe);
      this.shoulders.add(arm.root);
      this.hips.add(leg.root);
      this.arms.push(arm.root);
      this.forearms.push(arm.lower);
      this.legs.push(leg.root);
      this.shins.push(leg.lower);
      this.shoes.push(shoe);
    }
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), glow);
    badge.position.set(0.16, 1.05, 0.31);
    this.mesh.add(this.hips, torso, shirt, this.shoulders, this.head, cap, bag, badge);
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.45 * this.gait.height;
    this.mesh.traverse((part) => {
      if (part instanceof THREE.Mesh) part.castShadow = true;
    });
    scene.add(this.mesh);
  }
  public update(delta: number, threat: THREE.Vector3, active: boolean): void {
    this.mesh.visible = active;
    if (!active) return;
    const distance = this.mesh.position.distanceTo(threat);
    const state = this.ai.update(delta, distance);
    if (state === 'idle') {
      this.animate(delta, 0, state);
      return;
    }
    const previousDirection = this.direction;
    if (state === 'flee') {
      const desired = Math.atan2(this.mesh.position.x - threat.x, this.mesh.position.z - threat.z);
      this.direction = THREE.MathUtils.damp(previousDirection, desired, 4.5, delta);
    } else if (Math.random() < delta * 0.15) this.direction += (Math.random() - 0.5) * 1.5;
    this.turnVelocity = THREE.MathUtils.damp(
      this.turnVelocity,
      THREE.MathUtils.clamp(this.direction - previousDirection, -0.35, 0.35),
      8,
      delta,
    );
    const speed = (state === 'flee' ? 6 : 2.1) * this.gait.cadence;
    this.mesh.position.x += Math.sin(this.direction) * speed * delta;
    this.mesh.position.z += Math.cos(this.direction) * speed * delta;
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -190, 190);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -190, 190);
    this.mesh.rotation.y = THREE.MathUtils.damp(previousDirection, this.direction, 7, delta);
    this.animate(delta, speed, state);
  }
  public speak(): string {
    return (
      [
        '파도 발전소가 오늘도 반짝이네요.',
        '공원 야시장에 가보셨나요?',
        '해안 순환로는 밤에 더 아름다워요.',
      ][Math.floor(Math.random() * 3)] ?? '안녕하세요.'
    );
  }

  private animate(delta: number, speed: number, state: string): void {
    const targetEnergy = state === 'flee' ? 1 : speed > 0 ? 0.55 : 0.12;
    this.energyBlend = THREE.MathUtils.damp(this.energyBlend, targetEnergy, 7, delta);
    const energy = this.energyBlend;
    this.pace += delta * (state === 'flee' ? 9.8 : speed > 0 ? 4.8 : 1.05) * this.gait.cadence;
    const phase = this.pace + this.gait.phase;
    const leftCycle = this.getFootCycle(phase);
    const rightCycle = this.getFootCycle(phase + Math.PI);
    const stride = (leftCycle.drive - rightCycle.drive) * 0.5 * energy;
    const counterStride = -stride;
    const hipSway = Math.sin(phase) * 0.04 * energy * this.gait.sway - this.turnVelocity * 0.16;
    const shoulderSway = -hipSway * 0.78;
    const bounce = (leftCycle.lift + rightCycle.lift) * 0.026 * energy * this.gait.bounce;
    this.mesh.position.y = 0.45 * this.gait.height + bounce;
    this.hips.position.y =
      0.5 + bounce * 0.42 - (leftCycle.contact + rightCycle.contact) * 0.006 * energy;
    this.hips.rotation.z = THREE.MathUtils.damp(this.hips.rotation.z, hipSway, 8, delta);
    this.hips.rotation.y = THREE.MathUtils.damp(this.hips.rotation.y, -stride * 0.075, 7, delta);
    this.shoulders.rotation.z = THREE.MathUtils.damp(
      this.shoulders.rotation.z,
      shoulderSway,
      8,
      delta,
    );
    this.torso.rotation.z = THREE.MathUtils.damp(
      this.torso.rotation.z,
      shoulderSway * 0.45 - this.turnVelocity * 0.45,
      8,
      delta,
    );
    this.torso.rotation.x = THREE.MathUtils.damp(
      this.torso.rotation.x,
      state === 'flee' ? -0.08 : -0.025 * energy,
      7,
      delta,
    );
    this.head.rotation.y =
      Math.sin(this.pace * 0.55 + this.gait.phase) * (state === 'idle' ? 0.14 : 0.07);
    this.head.rotation.z = THREE.MathUtils.damp(
      this.head.rotation.z,
      this.turnVelocity * 0.22,
      8,
      delta,
    );
    this.arms.forEach((arm, index) => {
      const forearm = this.forearms[index];
      if (!forearm) return;
      const side = index === 0 ? -1 : 1;
      const cycle = index === 0 ? rightCycle : leftCycle;
      const phase = index === 0 ? stride : counterStride;
      arm.rotation.x = THREE.MathUtils.damp(
        arm.rotation.x,
        -phase * 0.58 * this.gait.armSwing - energy * 0.06 - cycle.lift * 0.035,
        10,
        delta,
      );
      arm.rotation.z = THREE.MathUtils.damp(
        arm.rotation.z,
        side * (0.16 + energy * 0.035),
        8,
        delta,
      );
      forearm.rotation.x = THREE.MathUtils.damp(
        forearm.rotation.x,
        -0.12 - Math.max(0, phase) * 0.22 - cycle.contact * 0.035 * energy,
        9,
        delta,
      );
    });
    this.legs.forEach((leg, index) => {
      const shin = this.shins[index];
      if (!shin) return;
      const side = index === 0 ? -1 : 1;
      const cycle = index === 0 ? leftCycle : rightCycle;
      const phase = index === 0 ? stride : counterStride;
      leg.rotation.x = THREE.MathUtils.damp(
        leg.rotation.x,
        -phase * 0.5 * this.gait.stride + cycle.lift * 0.075 * energy,
        10,
        delta,
      );
      leg.rotation.z = THREE.MathUtils.damp(
        leg.rotation.z,
        side * (0.03 - energy * 0.01),
        8,
        delta,
      );
      shin.rotation.x = THREE.MathUtils.damp(
        shin.rotation.x,
        (cycle.lift * (state === 'flee' ? 0.58 : 0.34) + cycle.contact * 0.04) * energy,
        10,
        delta,
      );
    });
    this.shoes.forEach((shoe, index) => {
      const cycle = index === 0 ? leftCycle : rightCycle;
      shoe.rotation.x = THREE.MathUtils.damp(
        shoe.rotation.x,
        cycle.toe * 0.18 * energy - cycle.contact * 0.08 * energy,
        10,
        delta,
      );
      shoe.position.y = -0.46 + cycle.lift * 0.025 * energy;
      shoe.position.z = 0.08 + cycle.toe * 0.045 * energy - cycle.contact * 0.012 * energy;
    });
  }

  private createGaitProfile(seed: number): GaitProfile {
    const wave = (offset: number) =>
      Math.sin((seed + 1) * (12.9898 + offset) + 78.233) * 43758.5453;
    const unit = (offset: number) => wave(offset) - Math.floor(wave(offset));
    return {
      phase: unit(0) * Math.PI * 2,
      cadence: THREE.MathUtils.lerp(0.88, 1.15, unit(1)),
      stride: THREE.MathUtils.lerp(0.86, 1.16, unit(2)),
      bounce: THREE.MathUtils.lerp(0.75, 1.2, unit(3)),
      sway: THREE.MathUtils.lerp(0.78, 1.22, unit(4)),
      armSwing: THREE.MathUtils.lerp(0.82, 1.22, unit(5)),
      height: THREE.MathUtils.lerp(0.94, 1.07, unit(6)),
      shoulderWidth: THREE.MathUtils.lerp(0.9, 1.14, unit(7)),
      hipWidth: THREE.MathUtils.lerp(0.9, 1.12, unit(8)),
    };
  }

  private getFootCycle(phase: number): FootCycle {
    const forward = Math.sin(phase);
    const liftWave = Math.sin(phase - Math.PI * 0.25);
    const contact = THREE.MathUtils.smoothstep(-liftWave, 0.05, 0.8);
    const lift = THREE.MathUtils.smoothstep(liftWave, 0.12, 0.95);
    const toe = THREE.MathUtils.smoothstep(forward, 0.08, 0.96);
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
      new THREE.CapsuleGeometry(radius, upperLength, 5, 8),
      upperMaterial,
    );
    upper.position.y = -upperLength * 0.5;
    const lower = new THREE.Group();
    lower.position.y = -upperLength;
    const lowerMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius * 0.86, lowerLength, 5, 8),
      lowerMaterial,
    );
    lowerMesh.position.y = -lowerLength * 0.5;
    lower.add(lowerMesh);
    root.add(upper, lower);
    return { root, lower };
  }
}
