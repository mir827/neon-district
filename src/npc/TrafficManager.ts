import * as THREE from 'three';

type TrafficCar = {
  mesh: THREE.Group;
  body: THREE.Group;
  wheels: THREE.Mesh[];
  axis: 'x' | 'z';
  direction: number;
  speed: number;
  phase: number;
};

/** Lightweight road traffic follows straight loops without full vehicle physics. */
export class TrafficManager {
  private readonly cars: TrafficCar[] = [];

  public constructor(scene: THREE.Scene) {
    const colors = [0x45c6ad, 0xf58b47, 0xa585e8, 0xd6e5ef];
    for (let i = 0; i < 10; i += 1) {
      const axis = i % 2 === 0 ? 'x' : 'z';
      const mesh = this.createCar(colors[i % colors.length] ?? 0xffffff, i);
      const lane = ((i % 5) - 2) * 80 + (i % 3 === 0 ? 4 : -4);
      mesh.position.set(
        axis === 'x' ? i * 31 - 160 : lane,
        0.7,
        axis === 'x' ? lane : i * 31 - 160,
      );
      const direction = i % 3 === 0 ? -1 : 1;
      mesh.rotation.y = axis === 'x' ? direction * (Math.PI / 2) : direction < 0 ? Math.PI : 0;
      scene.add(mesh);
      const body = mesh.children[0];
      if (!(body instanceof THREE.Group)) throw new Error('Traffic car body was not created.');
      this.cars.push({
        mesh,
        body,
        wheels: mesh.children.filter((child) => child instanceof THREE.Mesh),
        axis,
        direction,
        speed: 7 + (i % 4),
        phase: i * 0.83,
      });
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
      car.phase += delta * (2.2 + car.speed * 0.22);
      car.body.position.y = Math.sin(car.phase) * 0.035;
      car.body.rotation.z = Math.sin(car.phase * 0.7) * 0.025 * car.direction;
      car.wheels.forEach((wheel, index) => {
        wheel.rotation.x += car.speed * delta * 2.3 * car.direction;
        wheel.position.y = -0.46 + Math.sin(car.phase + index * 0.8) * 0.018;
      });
    }
  }

  private createCar(color: number, seed: number): THREE.Group {
    const root = new THREE.Group();
    const body = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.32, roughness: 0.45 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x10151a, roughness: 0.8 });
    const glass = new THREE.MeshBasicMaterial({ color: 0x91e7ff });
    const frontLight = new THREE.MeshBasicMaterial({ color: 0xf1fbff });
    const rearLight = new THREE.MeshBasicMaterial({ color: 0xff315c });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.82, 3.9), paint);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.62, 1.55), glass);
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.2, 0.18), trim);
    chassis.position.y = 0.03;
    cabin.position.set(0, 0.62, -0.22);
    bumper.position.set(0, -0.28, 1.98);
    body.add(chassis, cabin, bumper);
    for (const x of [-0.72, 0.72]) {
      const headlamp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.08), frontLight);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.08), rearLight);
      headlamp.position.set(x, 0.12, 2.0);
      tail.position.set(x, 0.12, -2.0);
      body.add(headlamp, tail);
    }
    root.add(body);
    const wheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14);
    for (const x of [-1.02, 1.02]) {
      for (const z of [-1.32, 1.32]) {
        const wheel = new THREE.Mesh(wheelGeometry, trim);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, -0.46, z + Math.sin(seed + z) * 0.04);
        root.add(wheel);
      }
    }
    root.traverse((part) => {
      if (part instanceof THREE.Mesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    return root;
  }
}
