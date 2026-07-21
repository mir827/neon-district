import * as THREE from 'three';

export type CityLandmark = { name: string; x: number; z: number; color: number };
export const LANDMARKS: CityLandmark[] = [
  { name: '도심', x: 0, z: 0, color: 0x19d3ff },
  { name: '주거', x: -112, z: 78, color: 0xffc857 },
  { name: '공업', x: 118, z: 82, color: 0xff715b },
  { name: '공원', x: -80, z: -80, color: 0x55d68b },
  { name: '경찰서', x: 78, z: -55, color: 0x4c78ff },
  { name: '주차장', x: 28, z: 116, color: 0xbda7ff },
];

/** Generates an original modular low-poly city using only primitive geometry. */
export class CityGenerator {
  public readonly colliders: THREE.Box3[] = [];
  public readonly roads: { x: number; z: number; w: number; d: number }[] = [];

  public build(scene: THREE.Scene): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x172433, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 105),
      new THREE.MeshStandardMaterial({ color: 0x064d68, metalness: 0.2, roughness: 0.45 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.3, -250);
    scene.add(water);
    this.makeRoads(scene);
    this.makeBuildings(scene);
    this.makePark(scene);
    this.makeLandmarks(scene);
  }

  private makeRoads(scene: THREE.Scene): void {
    const material = new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 1 });
    for (let x = -160; x <= 160; x += 80) this.addRoad(scene, material, x, 0, 20, 400);
    for (let z = -160; z <= 160; z += 80) this.addRoad(scene, material, 0, z, 400, 20);
    this.addRoad(scene, material, 0, -175, 400, 24);
  }

  private addRoad(
    scene: THREE.Scene,
    material: THREE.Material,
    x: number,
    z: number,
    w: number,
    d: number,
  ): void {
    const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), material);
    road.position.set(x, 0.05, z);
    road.receiveShadow = true;
    scene.add(road);
    this.roads.push({ x, z, w, d });
  }

  private makeBuildings(scene: THREE.Scene): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [0x30475e, 0x3f4d67, 0x4d426d, 0x315c60].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.75 }),
    );
    for (let gx = -2; gx <= 2; gx += 1)
      for (let gz = -2; gz <= 2; gz += 1) {
        if (gx === -1 && gz === -1) continue;
        const centerX = gx * 80 + 40;
        const centerZ = gz * 80 + 40;
        for (let i = 0; i < 3; i += 1) {
          const width = 16 + ((gx + gz + i + 8) % 3) * 5;
          const depth = 15 + ((gx * gz + i + 8) % 3) * 4;
          const height = 12 + ((Math.abs(gx) + Math.abs(gz) + i) % 5) * 9;
          const mesh = new THREE.Mesh(geometry, materials[(gx + gz + i + 8) % materials.length]);
          const x = centerX + (i - 1) * 20;
          const z = centerZ + ((i % 2) * 2 - 1) * 10;
          mesh.scale.set(width, height, depth);
          mesh.position.set(x, height / 2, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          this.colliders.push(new THREE.Box3().setFromObject(mesh));
        }
      }
  }

  private makePark(scene: THREE.Scene): void {
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(58, 0.3, 58),
      new THREE.MeshStandardMaterial({ color: 0x245c48 }),
    );
    park.position.set(-80, 0.12, -80);
    scene.add(park);
    for (let i = 0; i < 12; i += 1) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 4),
        new THREE.MeshStandardMaterial({ color: 0x61452d }),
      );
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(3, 7, 6),
        new THREE.MeshStandardMaterial({ color: 0x36a26b }),
      );
      crown.position.y = 5;
      tree.add(trunk, crown);
      tree.position.set(-104 + (i % 4) * 16, 2, -104 + Math.floor(i / 4) * 20);
      scene.add(tree);
    }
  }

  private makeLandmarks(scene: THREE.Scene): void {
    for (const landmark of LANDMARKS) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4, 0.35, 8, 24),
        new THREE.MeshBasicMaterial({ color: landmark.color }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(landmark.x, 0.55, landmark.z);
      scene.add(ring);
    }
  }
}
