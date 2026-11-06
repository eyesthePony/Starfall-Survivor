[English](README.md) | [简体中文](README.zh-CN.md)

# Starfall Survivor

A portrait (720×1280) **Roguelike auto-fire bullet-hell shooter** built with **Cocos Creator 3.8 (TypeScript)**.

The player drags the ship to dodge dense patterns while the ship fires automatically. Kills grant EXP; on level-up, the player picks 1 of 3 upgrade cards and progressively builds their firepower. Core loop: **waves → kills for EXP → level-up draft → phase bosses → victory/defeat**.

---

## 📂 Directory Structure & Class Responsibilities

All TypeScript source lives under `assets/scripts`, split into `Core / Component / Entity / Manager / UI`. Tables below list the real file and class name; mismatched file/class names are noted.

### Core/ — Infrastructure & config tables

| File | Exported class / data | Responsibility |
|---|---|---|
| `EventBus.ts` | `EventBus` | Static global synchronous event bus. `on / off / dispatchEvent`, handlers deduped by `handler + target`; the original array is iterated so an `off` inside a callback is safe. Entities and UI never reference each other directly. |
| `PoolManager.ts` | `PoolManager` (singleton) | Node object pool keyed by `prefab.name`. `getNode / putNode / preLoadPrefab / clearPool / clearAllPool / destroyNode`; `destroyInstance` clears all pools and releases the singleton on scene switch. |
| `GameConstants.ts` | `GameConstants` | Central constants: `EVENT_TYPE`, `GAME_STATE`, `GAME_SCENE`, enemy type / prefab / category, boss type / skill / animator, bullet type / prefab, card type / card id, collision group masks `ITEM_GROUP`, effect / audio types; exports `SavedBuildingData`. |
| `GameData.ts` | `GameData` | Runtime static globals: `selectedLevel`, `unlockedLevel`, `isEndlessMode`, `playerMaxHp`, `currentTarget` (locked target), `viewW / viewH`; `init()` reads the visible size. |
| `ConfigEnums.ts` | Enums | Boss turret enums: `OrbitCenter`, `TurretFormation`, `TriggerMode`, `FireMode`, `AimMode`. |
| `BossConfig.ts` | `BossConfigData` etc. + `BOSS_CONFIG` | Data-driven boss config. Interfaces: `BossPartConfig`, `BossHitBoxConfig`, `SkillConfig`, `BossPhaseConfig`, `BossConfigData`. Registered: `machine_boss`, `whale_boss`. |
| `EnemyConfig.ts` | `EnemyData` + `ENEMY_CONFIG` | Normal enemy config. `EnemyData` covers prefab / sprite / HP / speed / ram damage / EXP / bullet type / fire interval / bullet damage-speed / drop. Registered: `basic_drone`, `sine_drone`, `arc_drone`. |
| `BulletConfig.ts` | `BulletData` + `BULLET_CONFIG` | Bullet data-driven config: prefab, sprite name, `baseSpeed`, `baseDamage`, scale, pierce count. Current: blue / yellow / laser / homing / particle. |
| `LevelConfig.ts` | `WaveGroup / WaveData / LevelData` + `LEVELS` + `ENDLESS_LEVEL` | Level & wave config. `LEVELS` holds four normal levels; `ENDLESS_LEVEL` is the endless loop. Waves advance by `delay`, groups stagger by `time`; each group records type / count / interval / spawn side. |
| `CardConfig.ts` | `CardConfigData` + `CARD_CONFIG` | Roguelike card pool. Fields: `id / name / desc / maxLevel / iconIndex / requireWeapon / type / targetWeapon`; 10 cards in `STAT / WEAPON / UPGRADE`. |
| `SkillMap.ts` | `SkillMap`, `AnimatorMap` | Name → component class maps. `SkillMap` maps boss skill names to fire/move components; `AnimatorMap` maps animator names to visual animators. |
| `MathUtils.ts` | `DirTable` | Precomputed direction lookup; ring/spiral firing reads the table instead of trig per shot. |
| `DamageStats.ts` | `DamageStats` (singleton) | Damage ledger. `addDamage` accumulates per weapon, `getRankedStats` returns a descending ranking, `isDirty` drives UI refresh, `clear` resets on restart. |
| `BuildingConfig.ts` | `BuildingData` + `BUILDINGS` | Lobby building config (prototype): name, cost, etc. |
| `EffectManager.ts` | `EffectManager` (singleton) | Effect spawn & recycle. Maps prefabs by name, plays explosions and recycles them on a timer; recovers all effects on `GAME_RESET`. |
| `AudioManager.ts` | `AudioManager` (singleton) | Audio playback. Maps clips by name, manages BGM and one-shot SFX; hosts an internal `AudioSource`. |

### Component/ — Reusable behavior components

#### Fire/

| File | Class | Responsibility |
|---|---|---|
| `BaseFire.ts` | `BaseFire` | Fire base class. Holds `interval`, `bulletDamage`, `bulletSpeed`, shoot direction, player-bullet flag, `weaponType`; `update` counts down and calls the subclass `shoot()`, `reset()` clears the timer. |
| `RingFire.ts` | `RingFire extends BaseFire` | Ring burst firing in all directions. |
| `SpiralFire.ts` | `SpiralFire extends BaseFire` | Multi-arm spiral barrage rotating over time. |
| `LaserFire.ts` | `LaserFire extends BaseFire` | Player laser weapon, periodically emits a sustained beam. |
| `HomingFire.ts` | `HomingFire extends BaseFire` | Player homing missile weapon. |
| `CannonBarrage.ts` | `CannonBarrage extends BaseFire` | Boss turret orchestrator. Drives a group of independent `Turret` nodes by formation / trigger / aim / fire mode. |

#### Move/

| File | Class | Responsibility |
|---|---|---|
| `SineMove.ts` | `SineMove` | Sinusoidal patrol along a horizontal sine path. |
| `BossEnterMove.ts` | `BossEnterMove` | Boss entrance tween from off-screen to its station. |
| `BossMoveTo.ts` | `BossMoveTo` | Phased boss movement, eased to a target point. |
| `BackgroundScroll.ts` | `BackgroundScroll` | Infinite scrolling background; aligns dual sprites by `viewH` to avoid black bars on tall screens. |

#### Animator/

| File | Class | Responsibility |
|---|---|---|
| `FloatAnimator.ts` | `FloatAnimator` | Vertical float animation. |
| `PulseAnimator.ts` | `PulseAnimator` | Breathing scale animation. |
| `SpinAnimator.ts` | `SpinAnimator` | Constant rotation animation. |

#### Component root

| File | Class | Responsibility |
|---|---|---|
| `CameraDrag.ts` | `CameraDrag` | Lobby orthographic camera drag / zoom (prototype). |

### Entity/ — Game entities

#### plane/

| File | Class | Responsibility |
|---|---|---|
| `BasePlane.ts` | `BasePlane` | Plane base. Holds max/current HP, move speed, fire CD, death flag, fire timer, `expReward`, `ramDamage`; `takeDamage`, virtual `onDeath` / `shoot`, `setPaused`, `tickFire` auto-fire timer. |
| `player/PlayerPlane.ts` | `PlayerPlane extends BasePlane` | Player ship. Drag movement clamped to bounds, invincibility frames, bullet damage / speed / count / spacing; owns mounted weapon list `_activeWeapons`; `applyUpgrade` executes card upgrades (stat mutation / weapon mount / weapon `onUpgrade`); handles body collision and death events; writes itself to `GameData.currentTarget`. |
| `enemy/BaseEnemyPlane.ts` | `BaseEnemyPlane extends BasePlane` | Normal enemy base. `init` injects config / position / HP multiplier / sprite; stores bullet type / damage / speed, swaps the `body` child `Sprite`. |
| `enemy/StraightEnemy.ts` | `StraightEnemy extends BaseEnemyPlane` | Straight dives toward the bottom; off-bottom counts as escape. |
| `enemy/SineEnemy.ts` | `SineEmemy extends BaseEnemyPlane` (legacy class spelling) | Sine-swaying enemy weaving left and right. |
| `enemy/ArcEnemy.ts` | `ArcEnemy extends BaseEnemyPlane` | Arc-cutting enemy approaching along a curve. |
| `enemy/BaseBoss.ts` | `BaseBoss extends BasePlane` | Universal data-driven boss carrier. Phase index, skill component cache, delayed task queue, phase loop timer, entrance invincibility; assembles parts / colliders / skills from config; `checkPhase` switches phases on HP threshold and `activatePhase` activates the new phase skills. |
| `enemy/Turret.ts` | `Turret extends Component` | Boss turret child node. Barrel rotation aim and independent firing; recycled with the boss. |

#### bullet/

| File | Class | Responsibility |
|---|---|---|
| `BaseBullet.ts` | `BaseBullet extends Component` | Bullet base. Movement, off-screen recycle, hit dispatch, camp affiliation. |
| `Laser.ts` | `Laser extends Component` | Sustained-damage beam. Maintains a hit set, ticks damage on an interval, fades out near end-of-life. |
| `HomingMissile.ts` | `HomingMissile extends BaseBullet` | Homing missile. Throttled retargeting, steering interpolation to the nearest enemy. |

#### item/

| File | Class | Responsibility |
|---|---|---|
| `BuildItem.ts` | `BuildItem extends Component` | Lobby building list item. Binds name / cost labels, emits a place-building intent on click. |

### Manager/ — Global managers (singletons, schedule only, hold no UI)

| File | Class | Responsibility |
|---|---|---|
| `GameManager.ts` | `GameManager` (singleton) | Game state machine. Transitions across `READY / PLAYING / PAUSE / UPGRADING / VICTORY / OVER`, broadcasts `GAME_STATE_CHANGED`; subscribes to `GAME_OVER / GAME_RESTART / GAME_RESUME / GAME_PAUSE / GAME_VICTORY / LEVEL_UP`. |
| `WaveManager.ts` | `WaveManager extends Component` | Wave progression & spawn cadence. State machine `IDLE / WAITING / SPAWNING / WAITING_CLEAR / FINISHED`; spawns groups on the config timeline, gates the next wave on alive-enemy count; endless mode resets waves and scales HP by `loopCount`. |
| `EnemyPlaneManager.ts` | `EnemyManager extends Component` (singleton) | Enemy / boss spawn & recycle. Prefab and sprite dictionaries, `spawnNormalEnemy / spawnBoss`, active enemy list. |
| `BulletManager.ts` | `BulletManager` (singleton) | Unified bullet / laser / homing spawn & recycle. Sprite dictionary, camp-split final damage / speed; special-behavior bullets branch off early. |
| `UpgradeManager.ts` | `UpgradeManager extends Component` | EXP, level-up and draft decision. Owns `_maxExp / _exp / _level`; awards kills (enemy `expReward`, fallback 10), loops multi-level-ups, requests a 3-card draft, tracks per-card picks, responds to selection. |
| `BuildManager.ts` | `BuildManager extends Component` | Lobby building system (prototype). Ghost preview, place / confirm / cancel, built-list tracking. |
| `MapManager.ts` | `MapManager extends Component` | Lobby map (prototype). Generates tile grid, records occupancy in a 2D table. |

### UI/ — Presentation layer (render on events, emit intent events on clicks)

| File | Class | Responsibility |
|---|---|---|
| `StartPanel.ts` | `StartPanel extends Component` | Lobby entry. Binds normal level buttons in a loop and the endless button separately; preloads the boss bundle, then `startGame` writes `GameData` and loads the battle scene. |
| `LodingUI.ts` | `LoadingUI extends Component` (legacy file spelling) | Loading progress panel: `show / hide / updateProgress / finish`. |
| `PopupPanel.ts` | `PopupPanel extends Component` | Unified pause / victory / defeat panel, toggled by state. |
| `UpgradePanel.ts` | `UpgradePanel extends Component` | Pick-1-of-3 draft panel. Requests cards, shows candidates, dispatches `CARD_SELECTED`, resumes battle. |
| `PlayerHealthUI.ts` | `PlayerHealthUI extends Component` | Player HP display, refreshed on HP change events. |
| `BossHealthUI.ts` | `BossHealthUI extends Component` | Top boss health bar, refreshed on `BOSS_HP_CHANGED`. |
| `ExpBarUI.ts` | `ExpBarUI extends Component` | EXP bar & level, refreshed on `EXP_CHANGED`. |
| `StatsPanel.ts` | `StatsPanel extends Component` | Damage ranking read from `DamageStats`. |
| `Pause.ts` | `Pause extends Component` | Pause button, dispatches `GAME_PAUSE`. |
| `Resume.ts` | `Resume extends Component` | Resume button, dispatches `GAME_RESUME`. |
| `Restart.ts` | `ReStart extends Component` (legacy class spelling) | Restart button, dispatches `GAME_RESTART`. |
| `Quit.ts` | `Quit extends Component` | Quit button. |
| `BuildPanel.ts` | `BuildPanel extends Component` | Lobby building list panel. |
| `BuildActionPanel.ts` | `BuildActionPanel extends Component` | Build confirm / cancel panel, dispatches `CONFIRM_BUILD_CLICK / CANCEL_BUILD_CLICK`. |
| `Build.ts` | `Build extends Component` | Build entry mount component. |

---

## 🎮 Game Systems

### 1. Combat Loop

- **Controls**: drag the ship, clamped to screen bounds; the ship fires automatically, no fire button.
- **Player**: max HP from `GameData.playerMaxHp` (1000 currently), brief invincibility frames after a hit; zero HP dispatches `GAME_OVER`.
- **Kill rewards**: EXP from enemy `expReward` (fallback 10). Current: straight 10, sine 15, arc 20; bosses: whale 400, machine 1000.
- **Level threshold**: `UpgradeManager` starts `_maxExp = 50`, grows by 70 per level; overflow levels up repeatedly and drafts one card at a time.
- **Draft**: reaching EXP enters `UPGRADING` pause and shows a 1-of-3 panel; battle resumes after selection.

### 2. Roguelike Card System (UpgradeManager + CardConfig)

Cards fall into three types; the draft picks per slot priority and dedupes by picked count:

| Type | Role | Examples |
|---|---|---|
| `STAT` | Direct base-stat changes | Damage up, fire-rate up, bullet count, bullet speed |
| `WEAPON` | Grants a new weapon (component) | Laser, homing missile |
| `UPGRADE` | Empowers an owned weapon (requires prerequisite) | Laser damage, laser cooldown, homing damage, homing count |

- Each card supports `maxLevel`; `requireWeapon` gates unlock behind another card; `targetWeapon` marks the affected weapon.
- `UpgradeManager` owns drafting and counting; `PlayerPlane.applyUpgrade` executes it (stat mutation / weapon mount / weapon `onUpgrade`).

### 3. Player Weapons (components on PlayerPlane)

- **Spread shots**: `bulletCount` controls parallel spread; one shared temp vector computes muzzle offsets.
- **Laser `LaserFire → Laser`**: periodically emits a sustained beam; BEGIN/END contact maintains a hit set, ticks damage on an interval, fades out near end-of-life.
- **Homing `HomingFire → HomingMissile`**: steers toward the nearest enemy after spawn; retargets at throttle when the target is invalid.

**Data-driven bullets (`BulletManager` + `BulletConfig`)**:

- All straight-line bullets share one `baseBulletPrefab`; `BulletManager` holds a `SpriteFrame` dictionary keyed by bullet type.
- `BULLET_CONFIG` stores per-type base speed / damage. Final values split by camp:
  - **Player bullets**: final damage = damage × `baseDamage`, final speed = speed × `baseSpeed`.
  - **Enemy bullets**: damage and speed pass through as absolute values (no base multiplier); every enemy skill config must set `bulletSpeed` explicitly.
- Special-behavior bullets (Laser, homing) keep their own prefabs and branch off early in `spawnBullet` via `if/return`.
- Adding a bullet type = one config entry + one dragged `SpriteFrame`; no new prefab needed.

### 4. Data-Driven Boss System (BaseBoss + BossConfig)

**All bosses share one `BaseBoss` carrier**, assembled at runtime from config; adding a boss requires no code change:

- **Parts `parts`**: load textures per node and attach visual animators (float / pulse / spin).
- **Colliders `hitBox`**: circle or rectangle; the matching collider enables at runtime.
- **Phases `phases`**: switch by HP threshold; each phase bundles skill configs supporting `delay`, `loop / loopDelay`, and `params` injected into `applyConfig`.
- **Skill registration**: `SkillMap` maps config names to component classes; `ensureSkills` de-duplicates get/addComponent and caches skills.

**Turret barrage `CannonBarrage`**:

- Formation `TurretFormation`: `ATTACHED` / `ORBITING` / `SCATTERED`;
- Trigger `TriggerMode`: `IDLE` / `ONCE` / `CONTINUOUS`;
- Aim `AimMode`: `FIXED` / `TARGET` / `SPIN` / `OSCILLATE` / `CENTER`;
- Fire `FireMode`: `VOLLEY` / `SEQUENCE` (the next turret flashes red and scales up as a warning before firing);
- Each turret is an independent `Turret` node handling barrel rotation and firing; prefabs load asynchronously and all turrets clean up on death/reset.

**Configured bosses**:

| Boss | Role |
|---|---|
| `whale_boss` | Mid-game boss, 5500 HP, 400 EXP, slow ring-pattern pressure. |
| `machine_boss` | Final boss, 18000 HP, 1000 EXP, multi-phase turret barrages and rushing lasers. |

### 5. Waves & Levels (WaveManager + LevelConfig)

- Normal levels advance per `LEVELS`; alive-enemy count gates the next wave; finishing all waves dispatches `GAME_VICTORY`.
- Current four levels: L1 Ice Frontier (whale boss), L2 War (pure wave feed), L3 Deep Ice Frontier (pure arc-cut, no boss), L4 Mechanical Fortress (machine boss finale).
- Boss waves and normal enemies share one spawn path.
- Endless mode uses `ENDLESS_LEVEL` (Starlight Corridor); clearing a loop resets waves and scales enemy HP by `loopCount`.

---

## 🏗️ Architecture Conventions

- **Event-driven**: hits, kills, HP changes, state transitions and UI refresh all flow through `EventBus`; entities never reference UI directly; UI renders from events and emits intent events on clicks.
- **Manager layering**: `GameManager` state machine; combat managers schedule entities; `UpgradeManager` decision layer; `PlayerPlane` execution layer. No circular imports between managers; superiors/subordinates call singletons, peers communicate via events.
- **Object pooling**: bullets, lasers, enemies and effects all recycle through `PoolManager` per prefab name.
- **State freezing**: outside `PLAYING`, managers freeze entity/bullet updates via `setPaused` / `enabled = false`; paused frames produce no logic progression.

## ⚡ Performance Notes

- `DirTable` precomputes directions; ring/spiral firing performs zero trig calls per shot.
- Reusable `Vec3` temporaries in hot scripts avoid per-frame allocation.
- Bullet arrays use swap-remove (`removeFast`) to avoid shifting the whole array.
- Homing target seek throttled; UI refreshes use dirty flags / throttling.
- Collider references and half-screen sizes cached in `onLoad`, not fetched every frame.
- Off-screen recycle keeps a margin around the viewport; bullets past the margin return to the pool.

## 🎮 Controls

| Action | Description |
|---|---|
| Drag ship | Follows finger; clamped inside screen bounds |
| Auto fire | Continuous automatic attack; no tap-to-shoot |
| Level-up draft | Pick 1 of 3; battle resumes automatically |
| Pause / Restart / Quit | Button groups dispatch state events |

## 🛠️ Setup

1. Install **Cocos Creator 3.8.x**.
2. Import this project via Cocos Dashboard.
3. Open `assets/scene/BattleScene.scene` for gameplay; `assets/scene/HallScene.scene` for the lobby.
4. Drag required prefabs / sprites / audio into each Manager's `@property` slots.
5. Click Play in the editor.

## 🚧 In Progress & Roadmap

- [ ] Lobby map & building system (`MapManager` / `BuildManager` / `CameraDrag` prototype)
- [ ] More enemy types and bosses (extendable via data-driven config)
- [ ] Enemy body contact damage and drop pickup system
- [ ] Meta-progression and local save unlocking
- [ ] Score system, boss explosion effects, player death fade-out and other asset feedback
- [ ] Endless-mode balance and wave closure tuning
