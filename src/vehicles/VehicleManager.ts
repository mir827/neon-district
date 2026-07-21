import * as THREE from 'three';
import type { InputManager } from '../core/InputManager';
import type { Player } from '../player/Player';
import type { CityGenerator } from '../world/CityGenerator';
import { Vehicle, type VehicleSpec } from './Vehicle';

const SPECS: VehicleSpec[] = [
  {
    id: 'pulse-coupe',
    name: 'Pulse Coupe',
    color: 0xff3d81,
    maxSpeed: 35,
    acceleration: 2.5,
    handling: 1.8,
  },
  {
    id: 'tideline-van',
    name: 'Tideline Van',
    color: 0x46b8ff,
    maxSpeed: 25,
    acceleration: 1.8,
    handling: 1.25,
  },
  {
    id: 'ion-runner',
    name: 'Ion Runner',
    color: 0xffc857,
    maxSpeed: 42,
    acceleration: 3.2,
    handling: 2.1,
  },
];

export class VehicleManager {
  public readonly vehicles: Vehicle[];
  public active: Vehicle | null = null;
  public constructor(
    scene: THREE.Scene,
    private readonly city: CityGenerator,
  ) {
    this.vehicles = SPECS.map(
      (spec, i) => new Vehicle(spec, new THREE.Vector3(-16 + i * 9, 1, 24), scene),
    );
  }

  public interact(player: Player): boolean {
    if (this.active) {
      player.inVehicleId = null;
      player.setPosition(this.active.mesh.position.x + 4, 2, this.active.mesh.position.z);
      this.active.occupied = false;
      this.active = null;
      return true;
    }
    const nearest = this.vehicles.reduce<Vehicle | null>(
      (best, vehicle) =>
        vehicle.mesh.position.distanceTo(player.mesh.position) <
        (best?.mesh.position.distanceTo(player.mesh.position) ?? 7)
          ? vehicle
          : best,
      null,
    );
    if (!nearest) return false;
    nearest.occupied = true;
    this.active = nearest;
    player.inVehicleId = nearest.spec.id;
    player.mesh.visible = false;
    return true;
  }

  public update(delta: number, input: InputManager, player: Player): number {
    if (!this.active) return 0;
    const throttle = Number(input.isDown('KeyW')) - Number(input.isDown('KeyS')) - input.moveY;
    const steering = Number(input.isDown('KeyA')) - Number(input.isDown('KeyD')) - input.moveX;
    const before = this.active.mesh.position.clone();
    this.active.drive(throttle, steering, input.isDown('Space'), delta);
    const vehicleBox = new THREE.Box3().setFromCenterAndSize(
      this.active.mesh.position,
      new THREE.Vector3(3.3, 2, 5.5),
    );
    if (this.city.colliders.some((box) => box.intersectsBox(vehicleBox))) {
      const impact = Math.abs(this.active.speed);
      this.active.mesh.position.copy(before);
      this.active.collide(impact);
      player.body.position.set(this.active.mesh.position.x, 2, this.active.mesh.position.z);
      return impact;
    }
    player.body.position.set(this.active.mesh.position.x, 2, this.active.mesh.position.z);
    return 0;
  }
}
