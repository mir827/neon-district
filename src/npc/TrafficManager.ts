import * as THREE from 'three';

type TrafficCar = { mesh: THREE.Mesh; axis: 'x' | 'z'; direction: number; speed: number };

/** Lightweight road traffic follows straight loops without full vehicle physics. */
export class TrafficManager {
  private readonly cars: TrafficCar[] = [];

  public constructor(scene: THREE.Scene) {
    const colors = [0x45c6ad, 0xf58b47, 0xa585e8, 0xd6e5ef];
    for (let i = 0; i < 10; i += 1) {
      const axis = i % 2 === 0 ? 'x' : 'z';
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.1, 4),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length] ?? 0xffffff }),
      );
      const lane = ((i % 5) - 2) * 80 + (i % 3 === 0 ? 4 : -4);
      mesh.position.set(
        axis === 'x' ? i * 31 - 160 : lane,
        0.7,
        axis === 'x' ? lane : i * 31 - 160,
      );
      mesh.rotation.y = axis === 'x' ? Math.PI / 2 : 0;
      scene.add(mesh);
      this.cars.push({ mesh, axis, direction: i % 3 === 0 ? -1 : 1, speed: 7 + (i % 4) });
    }
  }

  public update(delta: number, playerPosition: THREE.Vector3): void {
    for (const car of this.cars) {
      const active = car.mesh.position.distanceToSquared(playerPosition) < 170 * 170;
      car.mesh.visible = active;
      if (!active) continue;
      car.mesh.position[car.axis] += car.direction * car.speed * delta;
      if (car.mesh.position[car.axis] > 198) car.mesh.position[car.axis] = -198;
      if (car.mesh.position[car.axis] < -198) car.mesh.position[car.axis] = 198;
    }
  }
}
