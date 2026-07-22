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
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.16), armor);
    chest.position.set(0, 1.14, 0.36);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), skin);
    head.position.y = 1.9;
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
    }
    for (const part of [torso, chest, head, helmet, visorBand, belt]) part.castShadow = true;
    this.mesh.add(torso, chest, head, helmet, visorBand, belt);
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
