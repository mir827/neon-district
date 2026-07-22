import * as THREE from 'three';

export type CityLandmark = { name: string; x: number; z: number; color: number };
export type District = { id: string; name: string; x: number; z: number; radius: number };
export type Interior = {
  id: string;
  name: string;
  entrance: THREE.Vector3;
  inside: THREE.Vector3;
  exit: THREE.Vector3;
};

export const LANDMARKS: CityLandmark[] = [
  { name: '도심', x: 0, z: 0, color: 0x19d3ff },
  { name: '주거', x: -112, z: 78, color: 0xffc857 },
  { name: '공업', x: 118, z: 82, color: 0xff715b },
  { name: '공원', x: -80, z: -80, color: 0x55d68b },
  { name: '경찰서', x: 78, z: -55, color: 0x4c78ff },
  { name: '주차장', x: 28, z: 116, color: 0xbda7ff },
  { name: '항만', x: 155, z: -135, color: 0x29a383 },
];

export const DISTRICTS: District[] = [
  { id: 'midtown', name: '도심', x: 0, z: 0, radius: 72 },
  { id: 'residential', name: '주거', x: -112, z: 78, radius: 54 },
  { id: 'industrial', name: '공업', x: 118, z: 82, radius: 54 },
  { id: 'park', name: '공원', x: -80, z: -80, radius: 48 },
  { id: 'civic', name: '경찰서', x: 78, z: -55, radius: 44 },
  { id: 'garage', name: '주차장', x: 28, z: 116, radius: 42 },
  { id: 'harbor', name: '항만', x: 155, z: -135, radius: 46 },
];

export const INTERIORS: Interior[] = [
  {
    id: 'clinic',
    name: '응급 클리닉',
    entrance: new THREE.Vector3(-65, 1, -65),
    inside: new THREE.Vector3(-185, 2, 178),
    exit: new THREE.Vector3(-178, 1, 178),
  },
  {
    id: 'garage-office',
    name: '정비소 사무실',
    entrance: new THREE.Vector3(30, 1, 116),
    inside: new THREE.Vector3(178, 2, 178),
    exit: new THREE.Vector3(170, 1, 178),
  },
];

/** Generates an original modular low-poly city using only primitive geometry. */
export class CityGenerator {
  public readonly colliders: THREE.Box3[] = [];
  public readonly roads: { x: number; z: number; w: number; d: number }[] = [];

  public build(scene: THREE.Scene): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x1b2731, roughness: 0.96 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 105),
      new THREE.MeshStandardMaterial({ color: 0x075771, metalness: 0.28, roughness: 0.32 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.3, -250);
    scene.add(water);
    this.addGroundVariation(scene);
    this.addHarborDetails(scene);
    this.makeRoads(scene);
    this.makeBuildings(scene);
    this.makePark(scene);
    this.makeLandmarks(scene);
    this.makeInteriors(scene);
  }

  private makeRoads(scene: THREE.Scene): void {
    const material = new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 1 });
    for (let x = -160; x <= 160; x += 80) this.addRoad(scene, material, x, 0, 20, 400);
    for (let z = -160; z <= 160; z += 80) this.addRoad(scene, material, 0, z, 400, 20);
    this.addRoad(scene, material, 0, -175, 400, 24);
    const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xe7d66d });
    for (let x = -160; x <= 160; x += 80) {
      for (let z = -185; z <= 185; z += 22) this.addRoadStripe(scene, stripeMaterial, x, z, 1.1, 8);
    }
    for (let z = -160; z <= 160; z += 80) {
      for (let x = -185; x <= 185; x += 22) this.addRoadStripe(scene, stripeMaterial, x, z, 8, 1.1);
    }
    const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x65717c, roughness: 0.85 });
    for (const road of this.roads) {
      this.addCurb(scene, curbMaterial, road);
    }
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

  private addRoadStripe(
    scene: THREE.Scene,
    material: THREE.Material,
    x: number,
    z: number,
    w: number,
    d: number,
  ): void {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), material);
    stripe.position.set(x, 0.14, z);
    scene.add(stripe);
  }

  private addCurb(
    scene: THREE.Scene,
    material: THREE.Material,
    road: { x: number; z: number; w: number; d: number },
  ): void {
    const horizontal = road.w > road.d;
    const size = horizontal ? [road.w, 0.18, 0.7] : [0.7, 0.18, road.d];
    const offset = horizontal ? road.d / 2 + 0.55 : road.w / 2 + 0.55;
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
      curb.position.set(
        road.x + (horizontal ? 0 : side * offset),
        0.18,
        road.z + (horizontal ? side * offset : 0),
      );
      curb.receiveShadow = true;
      scene.add(curb);
    }
  }

  private makeBuildings(scene: THREE.Scene): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [0x30475e, 0x3f4d67, 0x4d426d, 0x315c60].map(
      (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.08, roughness: 0.78 }),
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
          this.addWindowGrid(scene, mesh.position, width, height, depth);
          this.addFacadeDetails(scene, mesh.position, width, height, depth, i);
          this.addStreetProps(scene, mesh.position, width, depth, gx + gz + i);
        }
      }
  }

  private addWindowGrid(
    scene: THREE.Scene,
    position: THREE.Vector3,
    width: number,
    height: number,
    depth: number,
  ): void {
    const rows = Math.max(2, Math.floor(height / 8));
    const columns = Math.max(2, Math.floor(width / 5));
    const geometry = new THREE.PlaneGeometry(1.1, 1.6);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8af7ff,
      transparent: true,
      opacity: 0.82,
    });
    const windows = new THREE.InstancedMesh(geometry, material, rows * columns);
    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const matrix = new THREE.Matrix4().setPosition(
          position.x - width / 2 + 3 + column * ((width - 6) / Math.max(1, columns - 1)),
          3 + row * 5,
          position.z + depth / 2 + 0.03,
        );
        windows.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    windows.instanceMatrix.needsUpdate = true;
    scene.add(windows);
  }

  private addFacadeDetails(
    scene: THREE.Scene,
    position: THREE.Vector3,
    width: number,
    height: number,
    depth: number,
    seed: number,
  ): void {
    const trim = new THREE.MeshStandardMaterial({
      color: 0x95a4b4,
      metalness: 0.25,
      roughness: 0.5,
    });
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x111820,
      metalness: 0.35,
      roughness: 0.28,
    });
    const signMat = new THREE.MeshBasicMaterial({ color: seed % 2 === 0 ? 0xffd166 : 0x36f1cd });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.45, depth + 1), trim);
    roof.position.set(position.x, height + 0.28, position.z);
    roof.castShadow = true;
    scene.add(roof);
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(Math.min(3.6, width * 0.34), 3.2, 0.18),
      doorMat,
    );
    door.position.set(position.x, 1.6, position.z + depth / 2 + 0.11);
    scene.add(door);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(Math.min(8, width * 0.62), 0.7, 0.12),
      signMat,
    );
    sign.position.set(position.x, 4.15, position.z + depth / 2 + 0.15);
    scene.add(sign);
    for (const x of [-width * 0.34, width * 0.34]) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.18), trim);
      vent.position.set(position.x + x, height + 0.65, position.z - depth * 0.25);
      scene.add(vent);
    }
  }

  private makePark(scene: THREE.Scene): void {
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(58, 0.3, 58),
      new THREE.MeshStandardMaterial({ color: 0x245c48 }),
    );
    park.position.set(-80, 0.12, -80);
    scene.add(park);
    const trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.5, 0.7, 4),
      new THREE.MeshStandardMaterial({ color: 0x61452d }),
      12,
    );
    const crowns = new THREE.InstancedMesh(
      new THREE.ConeGeometry(3, 7, 6),
      new THREE.MeshStandardMaterial({ color: 0x36a26b }),
      12,
    );
    for (let i = 0; i < 12; i += 1) {
      const x = -104 + (i % 4) * 16;
      const z = -104 + Math.floor(i / 4) * 20;
      const lean = ((i % 3) - 1) * 0.08;
      const trunkMatrix = new THREE.Matrix4()
        .makeRotationZ(lean)
        .setPosition(x + ((i * 7) % 5) - 2, 2, z + ((i * 11) % 5) - 2);
      trunks.setMatrixAt(i, trunkMatrix);
      const crownMatrix = new THREE.Matrix4()
        .makeScale(0.82 + (i % 4) * 0.08, 0.9 + (i % 3) * 0.1, 0.82 + ((i + 2) % 4) * 0.08)
        .setPosition(x + ((i * 7) % 5) - 2, 7, z + ((i * 11) % 5) - 2);
      crowns.setMatrixAt(i, crownMatrix);
    }
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    scene.add(trunks, crowns);
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xb7a476, roughness: 0.9 });
    const path = new THREE.Mesh(new THREE.BoxGeometry(48, 0.08, 4), pathMat);
    path.position.set(-80, 0.32, -80);
    scene.add(path);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x76523b, roughness: 0.75 });
    for (const z of [-96, -64]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(7, 0.45, 1.1), benchMat);
      bench.position.set(-80, 0.7, z);
      bench.castShadow = true;
      scene.add(bench);
    }
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x4bb779, roughness: 0.88 });
    for (let i = 0; i < 18; i += 1) {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(1.1 + (i % 3) * 0.25, 8, 6), shrubMat);
      shrub.scale.y = 0.55;
      shrub.position.set(-105 + ((i * 13) % 50), 0.72, -105 + ((i * 17) % 50));
      shrub.castShadow = true;
      scene.add(shrub);
    }
  }

  private makeLandmarks(scene: THREE.Scene): void {
    for (const landmark of LANDMARKS) {
      const lod = new THREE.LOD();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4, 0.35, 8, 24),
        new THREE.MeshBasicMaterial({ color: landmark.color }),
      );
      ring.rotation.x = Math.PI / 2;
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 0.3, 5.5),
        new THREE.MeshBasicMaterial({ color: landmark.color }),
      );
      lod.addLevel(ring, 0);
      lod.addLevel(marker, 95);
      lod.position.set(landmark.x, 0.55, landmark.z);
      scene.add(lod);
    }
  }

  private makeInteriors(scene: THREE.Scene): void {
    const material = new THREE.MeshStandardMaterial({ color: 0x18283a, roughness: 0.9 });
    for (const interior of INTERIORS) {
      const room = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 18), material);
      room.position.copy(interior.inside);
      room.position.y = 0.2;
      scene.add(room);
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.2, 1),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      );
      sign.position.copy(interior.entrance);
      sign.position.y = 0.6;
      scene.add(sign);
    }
  }

  private addHarborDetails(scene: THREE.Scene): void {
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x4b3f35, roughness: 0.82 });
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x6c7c86,
      metalness: 0.35,
      roughness: 0.45,
    });
    for (const x of [-120, -40, 40, 120]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(42, 0.5, 8), pierMat);
      pier.position.set(x, 0.05, -203);
      pier.castShadow = true;
      pier.receiveShadow = true;
      scene.add(pier);
      for (const side of [-1, 1]) {
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.3, 10), poleMat);
        bollard.position.set(x + side * 15, 0.7, -198);
        bollard.castShadow = true;
        scene.add(bollard);
      }
    }
    const buoyMat = new THREE.MeshBasicMaterial({ color: 0xff715b });
    for (const x of [-160, -90, -15, 70, 145]) {
      const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.4, 10), buoyMat);
      buoy.position.set(x, 0.15, -242 + (x % 3) * 5);
      buoy.rotation.z = (x % 2) * 0.12;
      scene.add(buoy);
    }
  }

  private addGroundVariation(scene: THREE.Scene): void {
    const patchMaterials = [0x213142, 0x1f352e, 0x25313a, 0x2a3040].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.98 }),
    );
    for (let i = 0; i < 34; i += 1) {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(4 + (i % 5) * 1.8, 9),
        patchMaterials[i % patchMaterials.length],
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(-190 + ((i * 37) % 380), 0.012, -185 + ((i * 53) % 370));
      patch.scale.set(1.5 + (i % 4) * 0.35, 0.7 + ((i + 2) % 4) * 0.22, 1);
      scene.add(patch);
    }
  }

  private addStreetProps(
    scene: THREE.Scene,
    position: THREE.Vector3,
    width: number,
    depth: number,
    seed: number,
  ): void {
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x58636f,
      metalness: 0.38,
      roughness: 0.42,
    });
    const lampMat = new THREE.MeshBasicMaterial({ color: seed % 2 === 0 ? 0x36f1cd : 0xffd166 });
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x3f4d3e, roughness: 0.9 });
    const sidewalkZ = position.z + depth / 2 + 4.4;
    for (const x of [position.x - width * 0.35, position.x + width * 0.35]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 4.4, 8), postMat);
      post.position.set(x, 2.2, sidewalkZ);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), lampMat);
      lamp.position.set(x, 4.55, sidewalkZ);
      const planter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.9), planterMat);
      planter.position.set(x + (seed % 2 === 0 ? 2.2 : -2.2), 0.42, sidewalkZ + 0.8);
      post.castShadow = true;
      planter.castShadow = true;
      scene.add(post, lamp, planter);
    }
  }
}
