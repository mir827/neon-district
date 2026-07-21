import * as THREE from 'three';
import { AIStateMachine } from './AIStateMachine';

export class NPC {
  public readonly mesh: THREE.Mesh;
  private readonly ai = new AIStateMachine();
  private direction = Math.random() * Math.PI * 2;
  public constructor(position: THREE.Vector3, color: number, scene: THREE.Scene) {
    this.mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.48, 1.15, 3, 6),
      new THREE.MeshStandardMaterial({ color }),
    );
    this.mesh.position.copy(position);
    this.mesh.position.y = 1.1;
    this.mesh.castShadow = true;
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
