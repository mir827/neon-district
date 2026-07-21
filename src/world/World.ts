import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { CityGenerator } from './CityGenerator';

export class World {
  public readonly physics = new CANNON.World({ gravity: new CANNON.Vec3(0, -24, 0) });
  public readonly city = new CityGenerator();
  public constructor(public readonly scene: THREE.Scene) {
    this.physics.defaultContactMaterial.friction = 0.1;
    this.physics.addBody(
      new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
      }),
    );
    this.city.build(scene);
    for (const box of this.city.colliders) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(center.x, center.y, center.z),
        shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
      });
      this.physics.addBody(body);
    }
  }
  public update(delta: number): void {
    this.physics.step(1 / 60, delta, 3);
  }
}
