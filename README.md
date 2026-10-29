[English](README.md) | [简体中文](README.zh-CN.md)

**Starfall Survivor** is a **Roguelike auto-fire bullet-hell shooter** built with Cocos Creator.

In the game, the player focuses on maneuvering their ship to dodge dense bullet patterns, while the ship automatically attacks enemies. The project currently features a complete gameplay loop: wave spawning, boss encounters, and a **data-driven Roguelike upgrade system (pick 1 of 3)**.

---

## 📂 Directory Structure

All TypeScript source code lives under `assets/scripts`. The architecture follows a **high-cohesion, low-coupling** modular split:

```text
assets/scripts/
├── Core/           # Core infrastructure (constants, events, pooling, configs)
├── Component/      # Reusable behavior components (skills, movement, animation)
│   ├── Fire/       #   Fire skills: BaseFire / RingFire / SpiralFire
│   ├── Move/       #   Movement skills: SineMove / BossEnterMove
│   └── Animator/   #   Visual animators: Spin / Float / Pulse
├── Entity/         # Game entities (planes, bullets, etc.)
├── Manager/        # Global game managers
└── UI/             # UI components and panels
```

## 🏗️ Core Systems

### 1. Core (Infrastructure)

- **EventBus**: A global event bus that decouples Managers, Entities, and UI (e.g. enemy killed, player hit, game reset).
- **PoolManager**: A generic node object pool reducing instantiate/destroy overhead.
- **GameConstants / GameData / LevelConfig / BossConfig / CardConfig**: Data-driven configuration files for constants, player stats, level waves, boss designs, and Roguelike upgrade cards.

### 2. Component (Reusable Behavior Layer)

- **BaseFire / RingFire / SpiralFire**: Fire skills with configurable intervals, damage, and bullet patterns.
- **SineMove / BossEnterMove**: Movement skills for patrolling and boss entrances.
- **SpinAnimator / FloatAnimator / PulseAnimator**: Visual animations for boss parts.

### 3. Entity (Entity Layer)

- **BasePlane**: Base class encapsulating HP, damage interface, and basic fire timing.
- **BaseBullet**: Handles direction-based movement, boundary checks, and collision.
- **PlayerPlane**: Features auto-firing, multi-bullet spread, invincibility frames, and dynamic stat upgrades.
- **EnemyPlane**: Normal enemy logic.
- **BaseBoss**: Universal boss carrier. Appearance and skills are fully data-driven via `BossConfig`. All bosses share one `BaseBoss.prefab`.

### 4. Manager (Manager Layer)

- **BulletManager**: Centralized bullet pooling and recycling.
- **EnemyManager**: Spawns, initializes, and recycles enemies and bosses.
- **GameManager**: Core state machine (Ready / Playing / Paused / Over).
- **WaveManager**: Parses level configs and controls enemy spawn cadence.
- **UpgradeManager**: The brain of the Roguelike system. Listens to `ENEMY_KILLED`, calculates EXP, handles level-ups, and applies selected upgrades to the player.

### 5. UI (UI Layer)

- **PlayerHealthUI**: Dynamically renders health blocks based on current/max HP.
- **BossHealthUI**: Top-screen boss health bar with smooth transitions.
- **ExpBarUI**: Top-screen experience bar and level indicator.
- **UpgradePanel**: The "Pick 1 of 3" upgrade panel. Handles random card drawing and pause/resume logic.
- **PausePanel / ResultPanels**: Game flow UI components.

## 🎮 Technical Highlights

- **Object Pooling**: High-frequency bullets and enemies use object pooling for stable performance.
- **Event-Driven Architecture**: Collisions and UI updates are fully decoupled via `EventBus`. Logic entities do not directly reference UI nodes.
- **Data-Driven Boss**: A single `BaseBoss` prefab powered by `BossConfig` (visual parts, colliders, phased skills). Adding a new boss requires zero code changes.
- **Data-Driven Roguelike Upgrades**: The `UpgradeManager` handles EXP and triggers the `UpgradePanel`. Upgrades are defined in `CardConfig` and applied directly to `PlayerPlane`'s dynamic stats (damage, fire rate, bullet count).
- **Dynamic UI Rendering**: Health bars and EXP bars dynamically generate their nodes based on the player's current `maxHp` and upgrade states.

## 🚀 Planned Features

- [ ] **Unique Bullet Patterns**: Expand weapon varieties (homing missiles, lasers, etc.).
- [ ] **Visual & Audio Feedback**: Hit effects, screen shake, and sound effects.
- [ ] **Meta-progression**: Permanent upgrades outside of runs.
- [ ] **More Bosses and Enemies**: Utilizing the data-driven architecture.

## 🛠️ Development Setup

1. Install Cocos Creator 3.8 or later.
2. Clone this repository and import it via Cocos Dashboard.
3. Open `Scenes/HallScene.scene` (lobby) or `Scenes/BattleScene.scene` (battle) to preview the core gameplay.
4. Click the **Play** button in the editor.