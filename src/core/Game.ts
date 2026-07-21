import * as THREE from 'three';
import { AudioManager } from './AudioManager';
import { DEFAULT_SETTINGS, type QualitySettings } from './config';
import { GameLoop } from './GameLoop';
import { InputManager } from './InputManager';
import { SaveManager, type GameSave } from './SaveManager';
import { MissionManager } from '../missions/MissionManager';
import { NPCManager } from '../npc/NPCManager';
import { TrafficManager } from '../npc/TrafficManager';
import { Player } from '../player/Player';
import { PlayerCamera } from '../player/PlayerCamera';
import { PlayerController } from '../player/PlayerController';
import { PoliceManager } from '../police/PoliceManager';
import { WantedSystem } from '../police/WantedSystem';
import { HUD } from '../ui/HUD';
import { MiniMap } from '../ui/MiniMap';
import { MobileControls } from '../ui/MobileControls';
import { PauseMenu } from '../ui/PauseMenu';
import { VehicleManager } from '../vehicles/VehicleManager';
import { World } from '../world/World';

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
  private readonly input: InputManager;
  private readonly audio = new AudioManager();
  private readonly saveManager = new SaveManager();
  private readonly world: World;
  private readonly player: Player;
  private readonly playerController: PlayerController;
  private readonly playerCamera: PlayerCamera;
  private readonly vehicles: VehicleManager;
  private readonly npcs: NPCManager;
  private readonly traffic: TrafficManager;
  private readonly police: PoliceManager;
  private readonly wanted = new WantedSystem();
  private readonly missions: MissionManager;
  private readonly hud: HUD;
  private readonly minimap: MiniMap;
  private readonly pause: PauseMenu;
  private readonly loop: GameLoop;
  private settings: QualitySettings = { ...DEFAULT_SETTINGS };
  private credits = 0;
  private collected = new Set<string>();
  private frames = 0;
  private statTime = 0;
  private fps = 0;

  public constructor(root: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    root.replaceChildren(this.renderer.domElement);
    this.input = new InputManager(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x07111f);
    this.scene.fog = new THREE.FogExp2(0x07111f, 0.0035);
    this.scene.add(new THREE.HemisphereLight(0x8bcfff, 0x24321f, 2.2));
    const sun = new THREE.DirectionalLight(0xffd6a3, 2.7);
    sun.position.set(100, 160, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
    this.world = new World(this.scene);
    this.player = new Player(this.scene, this.world.physics);
    this.playerController = new PlayerController(this.player, this.input);
    this.playerCamera = new PlayerCamera(this.camera, this.input, this.renderer.domElement);
    this.vehicles = new VehicleManager(this.scene, this.world.city);
    this.npcs = new NPCManager(this.scene);
    this.traffic = new TrafficManager(this.scene);
    this.police = new PoliceManager(this.scene);
    this.missions = new MissionManager((reward) => {
      this.credits += reward;
      this.audio.tone(880, 0.35);
      this.hud.notify(`미션 완료 · ₡${reward}`);
      this.persist();
    });
    this.hud = new HUD(root);
    const mapCanvas = document.createElement('canvas');
    mapCanvas.id = 'minimap';
    mapCanvas.width = 180;
    mapCanvas.height = 180;
    root.append(mapCanvas);
    this.minimap = new MiniMap(mapCanvas);
    this.pause = new PauseMenu(
      root,
      this.settings,
      (settings) => this.applySettings(settings),
      () => {
        this.persist();
        this.hud.notify('게임을 저장했습니다.');
      },
      () => {
        this.restore();
        this.hud.notify('저장 데이터를 불러왔습니다.');
      },
    );
    new MobileControls(root, this.input);
    this.loop = new GameLoop((delta) => this.update(delta));
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('beforeunload', () => this.persist());
    this.renderer.domElement.addEventListener('pointerdown', () => this.audio.unlock(), {
      once: true,
    });
  }

  public start(): void {
    this.restore();
    this.loop.start();
  }

  private update(delta: number): void {
    if (this.input.consume('Escape')) this.pause.toggle();
    if (!this.pause.paused) {
      this.playerController.update(this.playerCamera.yaw);
      this.vehicles.update(delta, this.input, this.player);
      this.world.update(delta);
      this.player.sync();
      const focus = this.vehicles.active?.mesh.position ?? this.player.mesh.position;
      this.playerCamera.update(focus, delta);
      this.npcs.update(delta, focus);
      this.traffic.update(delta, focus);
      if (this.input.consume('KeyE')) {
        const handled = this.vehicles.interact(this.player);
        if (!handled) {
          const speech = this.npcs.interact(focus);
          if (speech) this.hud.notify(speech);
        } else {
          this.audio.tone(520);
          if (this.vehicles.active) this.wanted.addCrime(1);
        }
      }
      if (this.input.consume('KeyF') && !this.missions.active) {
        const nearby = this.missions.nearest(focus);
        if (nearby) {
          this.missions.start(nearby);
          if (nearby.id === 'silent-harbor') this.wanted.setLevel(2);
          this.hud.notify(`미션 시작 · ${nearby.title}`);
        }
      }
      if (focus.distanceTo(new THREE.Vector3(132, 1, 92)) < 8) this.collected.add('solar-cell');
      if (focus.distanceTo(new THREE.Vector3(-65, 1, -65)) < 5) {
        this.player.health.heal(25 * delta);
      }
      const visible = this.police.update(delta, focus, this.wanted.getLevel());
      this.wanted.update(delta, visible);
      const result = this.missions.update(delta, {
        position: focus,
        collectedItems: this.collected,
        wantedLevel: this.wanted.getLevel(),
      });
      if (result === 'failed') this.hud.notify('미션 실패 · 제한 시간 초과');
    }
    this.render(delta);
    this.input.endFrame();
  }

  private render(delta: number): void {
    this.frames += 1;
    this.statTime += delta;
    if (this.statTime >= 0.5) {
      this.fps = Math.round(this.frames / this.statTime);
      this.frames = 0;
      this.statTime = 0;
    }
    const activeMission = this.missions.active;
    const objective = activeMission?.currentObjective();
    const target = objective && objective.type !== 'escape' ? objective.position : undefined;
    this.hud.update({
      health: this.player.health.current,
      wanted: this.wanted.getLevel(),
      speed: this.vehicles.active?.speed ?? null,
      durability: this.vehicles.active?.durability ?? null,
      credits: this.credits,
      mission: activeMission
        ? `${activeMission.definition.title} · ${Math.ceil(activeMission.remaining)}초`
        : '자유 탐험',
      objective: objective?.label ?? 'F: 미션 지점 · E: 상호작용',
      stats: this.settings.developerStats
        ? `${this.fps} FPS · ${this.renderer.info.render.calls} calls · ${this.renderer.info.render.triangles} tris`
        : '',
    });
    const focus = this.vehicles.active?.mesh.position ?? this.player.mesh.position;
    this.minimap.draw(
      focus,
      this.vehicles.active?.mesh.rotation.y ?? this.player.mesh.rotation.y,
      this.police.positions(),
      target,
    );
    this.renderer.render(this.scene, this.camera);
  }

  private applySettings(settings: QualitySettings): void {
    this.settings = settings;
    this.audio.volume = settings.volume;
    this.renderer.shadowMap.enabled = settings.shadows;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * settings.resolutionScale);
    this.resize();
  }
  private persist(): void {
    const p = this.player.body.position;
    this.saveManager.save({
      version: 2,
      player: { x: p.x, y: p.y, z: p.z, health: this.player.health.current },
      completedMissions: [...this.missions.completed],
      credits: this.credits,
      settings: this.settings,
      lastVehicle: this.vehicles.active?.spec.id ?? null,
      collectedItems: [...this.collected],
    });
  }
  private restore(): void {
    const data: GameSave = this.saveManager.load();
    this.player.setPosition(data.player.x, data.player.y, data.player.z);
    this.player.health.current = data.player.health;
    this.credits = data.credits;
    this.collected = new Set(data.collectedItems);
    data.completedMissions.forEach((id) => this.missions.completed.add(id));
    this.applySettings(data.settings);
  }
  private resize(): void {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
}
