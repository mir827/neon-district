import * as THREE from 'three';
import { GAME_CONFIG } from '../core/config';
import { NPC } from './NPC';

export class NPCManager {
  public readonly npcs: NPC[] = [];
  public constructor(scene: THREE.Scene) {
    const colors = [0xff6b9e, 0x7ee8a2, 0xffd166, 0x91a7ff];
    for (let i = 0; i < 24; i += 1)
      this.npcs.push(
        new NPC(
          new THREE.Vector3(((i * 47) % 340) - 170, 1, ((i * 83) % 340) - 170),
          colors[i % colors.length] ?? 0xffffff,
          scene,
        ),
      );
  }
  public update(delta: number, threat: THREE.Vector3): void {
    this.npcs.forEach((npc, i) => {
      const distance = npc.mesh.position.distanceTo(threat);
      const interval = distance > 70 ? 4 : 1;
      if ((Math.floor(performance.now() / 100) + i) % interval === 0)
        npc.update(delta * interval, threat, distance < GAME_CONFIG.npcActiveDistance);
    });
  }
  public interact(position: THREE.Vector3): string | null {
    const npc = this.npcs.find((candidate) => candidate.mesh.position.distanceTo(position) < 5);
    return npc?.speak() ?? null;
  }
}
