import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { GAME_CONFIG } from '../core/config';
import { Health } from './Health';

export class Player {
  public readonly mesh = new THREE.Group();
  public readonly body: CANNON.Body;
  public readonly health = new Health(GAME_CONFIG.maxHealth);
  public inVehicleId: string | null = null;

  public constructor(scene: THREE.Scene, physics: CANNON.World) {
    const suit = new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.7 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x14d9c4, emissive: 0x063c38 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 1.4, 4, 8), suit);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 8), accent);
    head.position.y = 1.45;
    torso.castShadow = true;
    head.castShadow = true;
    this.mesh.add(torso, head);
    scene.add(this.mesh);
    this.body = new CANNON.Body({
      mass: 70,
      position: new CANNON.Vec3(0, 3, 0),
      fixedRotation: true,
      linearDamping: 0.88,
      shape: new CANNON.Sphere(0.85),
    });
    physics.addBody(this.body);
  }

  public sync(): void {
    this.mesh.position.set(this.body.position.x, this.body.position.y - 0.2, this.body.position.z);
    this.mesh.visible = this.inVehicleId === null;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.body.velocity.setZero();
  }
}
