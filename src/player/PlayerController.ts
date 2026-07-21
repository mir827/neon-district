import * as THREE from 'three';
import { GAME_CONFIG } from '../core/config';
import type { InputManager } from '../core/InputManager';
import type { Player } from './Player';

export class PlayerController {
  private readonly direction = new THREE.Vector3();
  public constructor(
    private readonly player: Player,
    private readonly input: InputManager,
  ) {}

  public update(cameraYaw: number): void {
    if (this.player.inVehicleId) return;
    const x =
      Number(this.input.isDown('KeyD')) - Number(this.input.isDown('KeyA')) + this.input.moveX;
    const z =
      Number(this.input.isDown('KeyS')) - Number(this.input.isDown('KeyW')) + this.input.moveY;
    this.direction.set(x, 0, z);
    if (this.direction.lengthSq() > 0.01) {
      this.direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      const speed = this.input.isDown('ShiftLeft') ? GAME_CONFIG.runSpeed : GAME_CONFIG.walkSpeed;
      this.player.body.velocity.x = this.direction.x * speed;
      this.player.body.velocity.z = this.direction.z * speed;
      this.player.mesh.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    }
    if (this.input.consume('Space') && this.player.body.position.y < 1.2)
      this.player.body.velocity.y = GAME_CONFIG.jumpSpeed;
    if (this.player.body.position.y < -8) this.player.setPosition(0, 3, 0);
  }
}
