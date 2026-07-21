import * as THREE from 'three';
import { LANDMARKS } from '../world/CityGenerator';
import { MISSIONS } from '../missions/missionData';

export class MiniMap {
  private readonly context: CanvasRenderingContext2D;
  public constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D Canvas를 초기화할 수 없습니다.');
    this.context = context;
  }
  public draw(
    player: THREE.Vector3,
    heading: number,
    police: THREE.Vector3[],
    chaseRadius: number,
    objective?: { x: number; z: number },
  ): void {
    const ctx = this.context;
    const w = this.canvas.width;
    const scale = w / 420;
    ctx.clearRect(0, 0, w, w);
    ctx.fillStyle = '#0b1724';
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#364a5c';
    ctx.lineWidth = 6;
    for (let p = -160; p <= 160; p += 80) {
      const c = (p + 210) * scale;
      ctx.beginPath();
      ctx.moveTo(c, 0);
      ctx.lineTo(c, w);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, c);
      ctx.lineTo(w, c);
      ctx.stroke();
    }
    for (const landmark of LANDMARKS) {
      ctx.fillStyle = `#${landmark.color.toString(16).padStart(6, '0')}`;
      ctx.fillRect((landmark.x + 210) * scale - 2, (landmark.z + 210) * scale - 2, 4, 4);
    }
    for (const mission of MISSIONS) {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(
        (mission.startPosition.x + 210) * scale - 3,
        (mission.startPosition.z + 210) * scale - 3,
        6,
        6,
      );
    }
    for (const unit of police) {
      ctx.fillStyle = '#447dff';
      ctx.beginPath();
      ctx.arc((unit.x + 210) * scale, (unit.z + 210) * scale, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (chaseRadius > 0) {
      ctx.strokeStyle = '#447dff88';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        (player.x + 210) * scale,
        (player.z + 210) * scale,
        chaseRadius * scale,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    if (objective) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc((objective.x + 210) * scale, (objective.z + 210) * scale, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate((player.x + 210) * scale, (player.z + 210) * scale);
    ctx.rotate(-heading);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
