[English](README.md) | [简体中文](README.zh-CN.md)

**Earth_Demo** is a **Roguelike auto-fire bullet-hell shooter** built with Cocos Creator.

In the game, the player focuses on maneuvering their ship to dodge dense bullet patterns, while the ship automatically locks onto and attacks enemies. The project is currently in the early core-gameplay phase: the underlying architecture is complete, and full wave spawning plus boss encounters are already implemented.

---

## 📂 Directory Structure

All TypeScript source code lives under `assets/scripts`. The architecture follows a **high-cohesion, low-coupling** modular split:

```text
assets/scripts/
├── Core/           # Core infrastructure (constants, events, pooling, config)
├── Component/      # Reusable behavior components (skills, movement, animation)
│   ├── Fire/       #   Fire skills: BaseFire / RingFire / SpiralFire
│   ├── Move/       #   Movement skills: SineMove
│   └── Animator/   #   Visual animators: Spin / Float / Pulse
├── Entity/         # Game entities (planes, bullets, etc.)
├── Manager/        # Global game managers
└── UI/             # UI components and panels
```

🏗️ Core Systems
1. Core (Infrastructure)
Foundational services that support the rest of the game.

EventBus: A global event bus that decouples Managers from Entities (e.g. enemy killed, player hit, game reset).

PoolManager: A generic node object pool that drastically reduces instantiate / destroy overhead.

AudioManager / EffectManager: Wrappers for audio playback and visual effects.

GameConstants / GameData / LevelConfig: Constant enums, global data, and level wave configuration tables.

BossConfig: A data table describing each boss's HP, visual parts, collider, phased skills and their parameters.

SkillMap: A mapping from skill name to component class, used by BaseBoss to dynamically attach components at runtime.

2. Component (Reusable Behavior Layer)
Behavior components decoupled from entities. They receive parameters via BossConfig and are attached at runtime by BaseBoss:

Skill components (Fire / Move): attached to the BaseBoss node, toggled by phase configuration.

Animator components: attached to individual boss part nodes, running independently per part.

Available components:

BaseFire: Base class for fire skills. Handles interval timing, shot direction, damage / speed parameters. Subclasses only implement fire().

RingFire / SpiralFire: Circular spread and double-spiral bullet patterns.

SineMove: Sine-wave horizontal patrol with configurable amplitude and frequency.

SpinAnimator / FloatAnimator / PulseAnimator: Rotation / floating / breathing-scale visual animations.

3. Entity (Entity Layer)
Concrete objects in the game, designed with OOP and polymorphism.

BasePlane: Base class for planes. Encapsulates HP, death state, damage interface, and basic fire timing (used by normal enemies). Subclasses implement movement and firing as needed.

BaseBullet: Base class for bullets. Handles direction-based movement, screen-boundary checks, and collision callbacks.

PlayerPlane: The player's ship (auto-firing, damage handling).

EnemyPlane: Normal enemy logic (straight movement, out-of-bounds recycling).

BaseBoss: Universal boss carrier. It only owns the skeleton of 「HP / entry / phase switching / death」. Its appearance is assembled at runtime from BossConfig.parts (texture + scale + animation), and its skills are dynamically attached and toggled per phase from BossConfig.phases. All bosses share one BaseBoss.prefab — adding a new boss requires zero code changes.

4. Manager (Manager Layer)
Global scheduling and game flow control.

BulletManager (BulletManager.ts): Centralized bullet pooling and recycling, supports both factions (player / enemy).

EnemyManager (EnemyPlaneManager.ts): Spawns, initializes, and recycles enemies (normal + boss) via the object pool.

GameManager: Core state machine (Ready / Playing / Paused / Over). Coordinates cross-system behavior and dispatches victory and settle events.

WaveManager: Parses the level config (LevelConfig) and controls enemy spawn cadence, wave interval, and the end-of-stage boss.

5. UI (UI Layer)
In-game interactive panels and buttons (start panel, pause panel, result panel, etc.).

🎮 Technical Highlights
Object Pooling: All high-frequency bullets and enemies go through the object pool, keeping the frame rate stable during long sessions.

Data-Driven Waves: Level spawn sequences, delays, and enemy types are fully defined in LevelConfig, with no changes to core logic required.

Event-Driven: Collision detection does not modify HP directly; instead, events are emitted and dispatched by Managers, fully decoupling combat presentation from core logic.

Data-Driven Boss: A single BaseBoss prefab powers every boss. BossConfig describes visual parts, collider, per-phase skills and their parameters; BaseBoss assembles textures at runtime, injects skill parameters, and switches phases at HP thresholds. Adding a new boss is just a new config entry — no new prefab or class required.

🚀 Planned Features
Earth_Demo is growing toward a full Roguelike space-survival game. Upcoming features include:

□ Unique Bullet Patterns: On top of the existing circular spread and double-spiral, add fan spreads, homing missiles, laser sweeps, and more.
□ Life & Research Resource Systems: Introduce persistent meta-progression.
□ Planet Development: Build bases and upgrade the tech tree.
□ Spaceship Exploration & Gathering: Explore star systems on the world map and harvest rare minerals.
□ Defense Against Pirate Attacks: Besides taking the offensive, defend against random pirate raids and protect your planet's resources.
🛠️ Development Setup
Install Cocos Creator 3.8 or later.

Clone this repository and import it via Cocos Dashboard.

Open Scenes/HallScene.scene (lobby) or Scenes/BattleScene.scene (battle) to preview the core gameplay.

Click the Play button in the editor.