import * as THREE from 'three';
import { AIStateMachine } from './AIStateMachine';

export class NPC {
  public readonly mesh = new THREE.Group();
  private readonly ai = new AIStateMachine();
  private direction = Math.random() * Math.PI * 2;
  public constructor(position: THREE.Vector3, color: number, scene: THREE.Scene) {
    const jacket = new THREE.MeshStandardMaterial({ color, roughness: 0.68 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1d2430, roughness: 0.82 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xbe875e, roughness: 0.76 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.6 });
    const glow = new THREE.MeshBasicMaterial({ color: 0x7efcff });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.9, 4, 8), jacket);
    torso.position.y = 0.82;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 9), skin);
    head.position.y = 1.58;
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 12, 6, 0, Math.PI * 2, 0, 1.45),
      hair,
    );
    cap.position.y = 1.67;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.12), cloth);
    bag.position.set(-0.32, 0.88, -0.23);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.58, 3, 6), jacket);
      arm.position.set(side * 0.42, 0.78, 0);
      arm.rotation.z = side * 0.16;
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.72, 3, 6), cloth);
      leg.position.set(side * 0.14, 0.05, 0);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.32), cloth);
      shoe.position.set(side * 0.14, -0.36, 0.06);
      this.mesh.add(arm, leg, shoe);
    }
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), glow);
    badge.position.set(0.16, 1.05, 0.31);
    this.mesh.add(torso, head, cap, bag, badge);
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.45;
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
    if (state === 'idle') return;
    if (state === 'flee')
      this.direction = Math.atan2(this.mesh.position.x - threat.x, this.mesh.position.z - threat.z);
    else if (Math.random() < delta * 0.15) this.direction += (Math.random() - 0.5) * 1.5;
    const speed = state === 'flee' ? 6 : 2.1;
    this.mesh.position.x += Math.sin(this.direction) * speed * delta;
    this.mesh.position.z += Math.cos(this.direction) * speed * delta;
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -190, 190);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -190, 190);
    this.mesh.rotation.y = this.direction;
    const stride =
      Math.sin(performance.now() * 0.008 + this.mesh.id) * (state === 'flee' ? 0.18 : 0.08);
    this.mesh.children.forEach((child, index) => {
      if (index >= 5 && index <= 10) child.rotation.x = index % 2 === 0 ? stride : -stride;
    });
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
}
