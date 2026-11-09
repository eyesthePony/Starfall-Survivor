[English](README.md) | [简体中文](README.zh-CN.md)

# Starfall: March Again

> *"Iron-clad barriers stretch far and wide; we'll step over them, from the very start."*

A portrait (720×1280) **Roguelike auto-fire bullet-hell shooter** built with **Cocos Creator 3.8 (TypeScript)**.

The player drags the ship to dodge dense patterns while the ship fires automatically. Kills grant EXP; on level-up, the player picks 1 of 3 upgrade cards to progressively build their firepower. Core loop: **waves → kills for EXP → level-up draft → phase bosses → victory/defeat**.

---

## 📂 Directory Structure & Class Responsibilities

All TypeScript source lives under `assets/scripts`, split into `Core / Component / Entity / Manager / UI`.

### Core/ — Infrastructure & Config Tables

| File | Exported Class / Data | Responsibility |
|---|---|---|
| `EventBus.ts` | `EventBus` | Static global synchronous event bus. Decouples entities and UI. |
| `PoolManager.ts` | `PoolManager` (singleton) | Node object pool keyed by prefab name. Prevents frequent instantiation. |
| `GameConstants.ts` | `GameConstants` | Central constants: event types, game states, collision masks, etc. |
| `GameData.ts` | `GameData` | Runtime static data: player max HP (100), level selection, viewport size, locked target. |
| `ConfigEnums.ts` | Enums | Turret orchestrator enums: formation, trigger, aim, and fire modes. |
| `BossConfig.ts` | `BossConfigData` + `BOSS_CONFIG` | Data-driven Boss config (Whale, Machine). Defines phases, skill params, and visuals. |
| `EnemyConfig.ts` | `EnemyData` + `ENEMY_CONFIG` | Enemy stats config. HP, speed, EXP, fire capabilities (silent enemies supported). |
| `BulletConfig.ts` | `BulletData` + `BULLET_CONFIG` | Bullet config. **Player bullets** use base multipliers; enemy bullets read absolute damage. |
| `LevelConfig.ts` | `WaveGroup` + `LEVELS` | Levels & waves config. 4 standard levels and endless mode, with formations. |
| `CardConfig.ts` | `CardConfigData` + `CARD_CONFIG` | Roguelike card pool: STAT, WEAPON, and UPGRADE cards. |
| `SkillMap.ts` | `SkillMap` / `AnimatorMap` | Maps skill string names to Fire/Move component classes. |

### Component/ — Behavior Components

#### Fire/
*   **`BaseFire.ts`**: Fire base class, controls global firing cadence.
*   **`CannonBarrage.ts`**: **Boss Turret Orchestrator (Core Feature)**. Arranges turrets, supports Fixed/Target/Spin aiming; supports burst durations (`burstDuration`) and gaps (`burstGap`) for rhythmic firing.
*   **`RingFire / SpiralFire`**: Ring and spiral barrage generators.
*   **`LaserFire / HomingFire`**: Player's laser and homing weapons.

#### Move/
*   **`SineMove / BossMoveTo / BossEnterMove`**: Sine patrol, phase movement, and entrance tween.
*   **`BackgroundScroll.ts`**: Infinite background scroll.

#### Animator/
*   **`Float / Pulse / Spin`**: Float, pulse, and spin visual effects.

### Entity/ — Game Entities

*   **`BasePlane.ts`**: Plane base. Handles HP, auto-fire timer (`tickFire`), and death.
*   **`PlayerPlane.ts`**: Player ship. Drag movement, invincibility frames, collision; manages weapon components and `applyUpgrade` logic.
*   **`BaseEnemyPlane.ts`**: Enemy base. Fixed a bug where silent enemies spawned `undefined` bullets.
*   **`BaseBoss.ts`**: Data-driven Boss carrier. Manages multi-phase timelines, delayed skill injection, and loops.
*   **`Turret.ts`**: Boss turret child. Handles rotation and spread firing (`fireSpread`).
*   **`BaseBullet / Laser / HomingMissile`**: Straight bullets, sustained lasers, and homing missiles.

### Manager/ — Global Managers

*   **`GameManager`**: Game state machine (READY, PLAYING, PAUSE, UPGRADING, OVER).
*   **`WaveManager`**: Wave progression. Spawns groups on a timeline, gates waves by alive count.
*   **`EnemyPlaneManager`**: Enemy/Boss spawning, pooling, and target seeking.
*   **`BulletManager`**: Bullet spawner. Splits damage by camp and handles special bullets.
*   **`UpgradeManager`**: EXP pool and draft decisions. Handles level thresholds and card pool filtering.

### UI/ — Presentation Layer

*   Listens to events for rendering (HP bars, EXP, Stats). Buttons only dispatch intent events (Pause, Resume, Select Card). Zero coupling with entities.

---

## 🎮 Core Systems & Balancing

### 1. Combat & Stats Model
*   **Player**: Base HP 100, 1-second invincibility frame after taking damage. Base DPS is around 50.
*   **Bullet Math**: Player bullets scale with base stats; enemy bullets use absolute values from config.
*   **Enemies**: HP 10~50, EXP 15~40. Fast enemies are configured as "silent" (ram damage only).
*   **Bosses**: Whale Boss (12,000 HP), Machine Boss (25,000 HP). Designed for 60~90 second tense fights.

### 2. Data-Driven Boss System
All bosses share `BaseBoss` and are customized via `BossConfig.ts`:
*   **Multi-Phase Timeline**: Switches by HP ratio; skills support `delay` and `loop`.
*   **Turret Orchestration**: `CannonBarrage` enables formations (Attached, Orbiting, Scattered) and rhythmic patterns (e.g., Left Turret fires for 2s -> 1.2s gap -> Right Turret fires).

### 3. Roguelike Draft System
*   Kill enemies for EXP, choose 1 of 3 cards on level up. Cards are categorized into `STAT`, `WEAPON`, and `UPGRADE`.
*   Draft priority ensures the player unlocks new weapons before receiving specific weapon upgrades.

### 4. Object Pool & Performance
*   All entities (enemies, bullets, effects) go through `PoolManager` to eliminate GC spikes.
*   `MathUtils` precomputes a 360-degree direction table, zero trig calls during barrages.

---

## 🚀 Quick Start

1. Install **Cocos Creator 3.8.x**.
2. Import the project via Dashboard and open `assets/scene/BattleScene.scene`.
3. Assign required prefabs/textures to the managers' `@property` slots.
4. Click Play in the editor to start.

## 🚧 Roadmap

- [ ] Add roguelike "transformation" cards (e.g., laser refraction, missile splitting) to enhance build synergy.
- [ ] Implement a "Graze" (bullet grazing) charge system to encourage high-risk dodging.
- [ ] Expand with more bosses and specialized wave patterns.