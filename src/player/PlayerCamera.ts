import * as THREE from 'three';
import { GAME_CONFIG } from '../core/config';
import type { InputManager } from '../core/InputManager';

export class PlayerCamera {
  public yaw = Math.PI;
  private pitch = 0.35;
  private distance = 11;
  private readonly target = new THREE.Vector3();

  public constructor(
    public readonly camera: THREE.PerspectiveCamera,
    private readonly input: InputManager,
    canvas: HTMLElement,
  ) {
    canvas.addEventListener(
      'wheel',
      (event) => {
        this.distance = THREE.MathUtils.clamp(
          this.distance + event.deltaY * 0.01,
          GAME_CONFIG.cameraMin,
          GAME_CONFIG.cameraMax,
        );
      },
      { passive: true },
    );
    let lastX = 0;
    let lastY = 0;
    canvas.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      if (touch) {
        lastX = touch.clientX;
        lastY = touch.clientY;
      }
    });
    canvas.addEventListener(
      'touchmove',
      (event) => {
        const touch = event.touches[0];
        if (!touch || touch.clientX < innerWidth * 0.45) return;
        this.yaw -= (touch.clientX - lastX) * 0.006;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch + (touch.clientY - lastY) * 0.004,
          -0.1,
          1.05,
        );
        lastX = touch.clientX;
        lastY = touch.clientY;
      },
      { passive: true },
    );
  }

  public update(focus: THREE.Vector3, delta: number): void {
    this.yaw -= this.input.cameraX * 0.0025;
    this.pitch = THREE.MathUtils.clamp(this.pitch + this.input.cameraY * 0.002, -0.1, 1.05);
    this.target.lerp(focus, Math.min(1, delta * 9));
    const horizontal = Math.cos(this.pitch) * this.distance;
    const desired = new THREE.Vector3(
      Math.sin(this.yaw) * horizontal,
      Math.sin(this.pitch) * this.distance + 3,
      Math.cos(this.yaw) * horizontal,
    ).add(this.target);
    this.camera.position.lerp(desired, Math.min(1, delta * 7));
    this.camera.lookAt(this.target.x, this.target.y + 1, this.target.z);
  }
}
