export type HUDData = {
  health: number;
  wanted: number;
  speed: number | null;
  durability: number | null;
  credits: number;
  mission: string;
  objective: string;
  stats: string;
};
export class HUD {
  private readonly root: HTMLElement;
  private messageTimer = 0;
  public constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `<div class="brand">NEON <b>DISTRICT</b></div><div class="top"><div>체력 <span id="health"></span></div><div id="wanted"></div><div>₡ <span id="credits"></span></div></div><div class="mission"><b id="mission"></b><span id="objective"></span></div><div id="vehicle"></div><div id="message"></div><div id="stats"></div>`;
    parent.append(this.root);
  }
  public update(data: HUDData): void {
    this.set('health', `${Math.ceil(data.health)}`);
    this.set('wanted', data.wanted ? `수배 ${'◆'.repeat(data.wanted)}` : '수배 없음');
    this.set('credits', `${data.credits}`);
    this.set('mission', data.mission);
    this.set('objective', data.objective);
    this.set(
      'vehicle',
      data.speed === null
        ? ''
        : `${Math.round(Math.abs(data.speed) * 3.6)} km/h · 내구도 ${Math.ceil(data.durability ?? 0)}%`,
    );
    this.set('stats', data.stats);
    if (this.messageTimer > 0) this.messageTimer -= 1 / 60;
    else this.set('message', '');
  }
  public notify(text: string): void {
    this.set('message', text);
    this.messageTimer = 4;
  }
  private set(id: string, text: string): void {
    const node = this.root.querySelector(`#${id}`);
    if (node) node.textContent = text;
  }
}
