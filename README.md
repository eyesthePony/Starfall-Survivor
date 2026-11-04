[English](README.md) | [简体中文](README.zh-CN.md)

# Starfall Survivor

A portrait (720×1280, FIT_HEIGHT) **Roguelike auto-fire bullet-hell shooter** built with **Cocos Creator 3.8 (TypeScript)**.

The player drags the ship to dodge dense patterns while the ship fires automatically. Kills grant EXP; on level-up, the player picks 1 of 3 upgrade cards and progressively builds their firepower. Core loop: **waves → kills for EXP → level-up draft → phase bosses → victory/defeat**.

---

## 📂 Directory Structure

All TypeScript source lives under `assets/scripts`, split by responsibility:

```text
assets/
├── scene/                          # Scenes
│   ├── HallScene.scene             # Lobby (with building prototype)
│   └── BattleScene.scene           # Battle scene
├── resources/
│   └── prefabs/                    # Prefabs (bullets / enemies / boss / turrets / effects / UI blocks)
└── scripts/
    ├── Core/                       # Infrastructure & config tables
    │   ├── EventBus.ts             #   Global synchronous event bus
    │   ├── PoolManager.ts          #   NodePools keyed by prefab.name
    │   ├── GameConstants.ts        #   Events, states, collision group masks, skill/anim constants
    │   ├── GameData.ts             #   Runtime globals (screen size, player HP, locked target)
    │   ├── ConfigEnums.ts          #   Turret formation / trigger / aim / fire-mode enums
    │   ├── BossConfig.ts           #   Boss visuals, collider, phased skill configs
    │   ├── BulletConfig.ts         #   Bullet data-driven config (base speed / damage per type)
    │   ├── LevelConfig.ts          #   Level & wave configs
    │   ├── CardConfig.ts           #   Roguelike card pool
    │   ├── SkillMap.ts             #   Skill name → component class map (incl. AnimatorMap)
    │   ├── MathUtils.ts            #   DirTable direction lookup (replaces trig calls)
    │   ├── DamageStats.ts          #   Damage statistics
    │   ├── BuildingConfig.ts       #   Lobby building configs
    │   ├── EffectManager.ts        #   Pooled effects with timed recycle
    │   └── AudioManager.ts         #   BGM / one-shot SFX playback
    ├── Component/                  # Reusable behavior components
    │   ├── Fire/
    │   │   ├── BaseFire.ts         #     Fire base class (interval timer, config injection)
    │   │   ├── RingFire.ts         #     Ring burst
    │   │   ├── SpiralFire.ts       #     Multi-arm spiral
    │   │   ├── LaserFire.ts         #     Player laser weapon
    │   │   ├── HomingFire.ts       #     Player homing missile weapon
    │   │   └── CannonBarrage.ts    #     Boss turret barrage (formation / volley / sequence / aim)
    │   ├── Move/
    │   │   ├── SineMove.ts         #     Sinusoidal patrol
    │   │   ├── BossEnterMove.ts   #     Boss entrance tween
    │   │   ├── BackgroundScroll.ts #     Infinite scrolling background (dynamic viewH fit)
    │   │   └── BossMoveTo.ts      #     Phased boss movement (eased)
    │   ├── Animator/               #   Float / Pulse / Spin visual animators
    │   └── CameraDrag.ts           # Lobby orthographic camera drag/zoom (prototype)
    ├── Entity/
    │   ├── plane/
    │   │   ├── BasePlane.ts        #   Plane base (HP, takeDamage, fire timer, pause)
    │   │   ├── player/PlayerPlane.ts
    │   │   └── enemy/
    │   │       ├── EnemyPlane.ts  #   Normal enemy
    │   │       ├── BaseBoss.ts    #   Universal data-driven boss carrier + phase timeline
    │   │       └── Turret.ts      #   Boss turret child (aim / fire)
    │   ├── bullet/
    │   │   ├── BaseBullet.ts       #   Normal bullet (movement, off-screen recycle, contact dispatch)
    │   │   ├── Laser.ts            #   Sustained-damage beam (contact set, periodic tick, fade-out)
    │   │   └── HomingMissile.ts    #   Throttled target seek + steering interpolation
    │   └── item/BuildItem.ts
    ├── Manager/
    │   ├── GameManager.ts          #   Game state machine
    │   ├── WaveManager.ts          #   Wave progression & spawn cadence
    │   ├── EnemyPlaneManager.ts    #   Enemy / boss spawn & recycle
    │   ├── BulletManager.ts        #   Bullet / laser spawn & recycle
    │   ├── UpgradeManager.ts       #   EXP, level-ups, draft, upgrade application
    │   ├── BuildManager.ts         #   Lobby building (prototype)
    │   └── MapManager.ts           #   Lobby map (prototype)
    └── UI/                         # Presentation layer: render on events, emit intent events
        ├── PopupPanel.ts           #   Unified pause / victory / defeat panel
        ├── UpgradePanel.ts         #   Pick-1-of-3 upgrade panel
        ├── PlayerHealthUI.ts       #   Heart-block HP display
        ├── BossHealthUI.ts         #   Top boss health bar
        ├── ExpBarUI.ts             #   EXP bar & level
        ├── StatsPanel.ts           #   Damage stats
        ├── Start / Pause / Resume / Restart / Quit.ts
        └── Build.ts / BuildPanel / BuildActionPanel.ts
```

---

## 🎮 Game Systems

### 1. Combat Loop

- **Controls**: drag the ship; movement clamped to screen bounds. The ship fires automatically — no fire button.
- **Player**: 5 hearts; taking a hit costs 1 heart and grants brief invincibility frames; HP zero dispatches `GAME_OVER`.
- **Kill rewards**: normal enemy 10 EXP, boss 1000 EXP; level-up EXP starts at 100 and grows by 200 per level.
- **Draft**: on level-up the game enters `UPGRADING` (paused) and shows a 1-of-3 card panel; selecting a card dispatches `GAME_RESUME`.

### 2. Roguelike Card System (UpgradeManager + CardConfig)

Cards fall into three types; the draft picks per slot priority and removes drawn cards from the pool:

| Type | Role | Examples |
|---|---|---|
| `STAT` | Direct base-stat changes | Damage up, fire-rate up, bullet count, speed |
| `WEAPON` | Grants a new weapon (component) | Laser, homing missile |
| `UPGRADE` | Empowers an owned weapon (requires prerequisite weapon) | Laser damage, laser cooldown, homing damage |

- Each card supports `maxLevel`; `requireWeapon` gates unlock behind another card.
- `UpgradeManager` owns drafting and counting; `PlayerPlane.applyUpgrade` executes (stat mutation / weapon component mount / weapon `onUpgrade`).

### 3. Player Weapons (components on PlayerPlane)

- **Spread shots**: `bulletCount` controls parallel spread; one shared temp vector computes muzzle offsets.
- **Laser `LaserFire → Laser`**: periodically emits a sustained beam; BEGIN/END contact maintains a hit set, ticks damage on an interval, and fades out near end-of-life.
- **Homing `HomingFire → HomingMissile`**: steers toward the nearest enemy after spawn; retargets at 0.2s throttle when the target is invalid.

**Data-driven bullets (`BulletManager` + `BulletConfig`)**:

- All straight-line bullets share one `baseBulletPrefab`; `BulletManager` holds a `SpriteFrame` dictionary keyed by bullet type.
- `BULLET_CONFIG` stores per-type base speed / damage; runtime damage/speed are passed in by the caller (player attack bonus / buffs).
- Special-behavior bullets (Laser, homing) keep their own prefabs and are dispatched early in `spawnBullet` via `if/return`.
- Adding a new bullet type = one config entry + one dragged `SpriteFrame` — no new prefab needed.

### 4. Data-Driven Boss System (BaseBoss + BossConfig)

**All bosses share one `BaseBoss.prefab`**, assembled at runtime from config; adding a new boss requires no code change:

- **Visual parts `parts`**: load textures per node and attach visual animators (float / pulse / spin).
- **Colliders `hitBox`**: circle or rectangle; the matching collider enables at runtime.
- **Phases `phases`**: switch by HP threshold; each phase bundles skill configs supporting:
  - `delay`: delayed activation on a unified timeline queue;
  - `loop` / `loopDelay`: phase loop replay;
  - `params`: injected into the component's `applyConfig`.
- **Skill registration**: `SkillMap` maps config names to component classes; `ensureSkills` de-duplicates get/addComponent and caches skills.

**Turret barrage `CannonBarrage`**:

- Formation `TurretFormation`: `ATTACHED` (circling the boss) / `ORBITING` (orbiting a designated center) / `SCATTERED` (spread along the four screen edges);
- Trigger `TriggerMode`: `IDLE` (standby) / `ONCE` (one round then back to IDLE) / `CONTINUOUS` (fire on a repeating interval);
- Aim `AimMode`: `FIXED` (fixed angle) / `TARGET` (locks `GameData.currentTarget`) / `SPIN` (constant sweep rotation) / `OSCILLATE` (pendulum swing around a center angle) / `CENTER` (always aim at screen center);
- Fire `FireMode`: `VOLLEY` (all turrets fire together) / `SEQUENCE` (turret-by-turret at `seqInterval`; the next turret flashes red and scales up as a warning before firing);
- Each turret is an independent `Turret` node handling barrel rotation and firing; the prefab loads asynchronously and all turrets are cleaned up on death/reset.

**Configured bosses**:

| Boss | Phase design |
|---|---|
| `ICE_BOSS` (3 phases) | P1 sine patrol + 16-shot ring; P2 two-arm spiral; P3 four-arm spiral |
| `MACHINE_BOSS` (4 phases) | P1 attached circular turret ring firing downward on continuous volleys while sine-patrolling; P2 loop: rush to screen center → lock player → one volley → retreat upward; P3 turrets scatter to the screen edges aiming at center, then fire lasers in sequence after 2s; P4 turret ring sweeps at high rotation speed, then fires continuous volleys after 1s |

### 5. Waves & Levels (WaveManager + LevelConfig)

- Waves advance per `LevelConfig`; alive-enemy count gates the next wave; when all waves finish, `GAME_VICTORY` dispatches.
- Boss waves and normal enemies share one spawn path; endless mode resets waves after clearing and scales enemy HP by `1 + loopCount × 0.5`.

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
- Homing target seek throttled to 0.2s; UI refreshes use dirty flags / throttling.
- Collider references and half-screen sizes cached in `onLoad`, not fetched every frame.

## 🎮 Controls

| Action | Description |
|---|---|
| Drag ship | Follows finger; clamped inside screen bounds |
| Auto fire | Continuous automatic attack; no tap-to-shoot |
| Level-up draft | Pick 1 of 3; battle resumes automatically |
| Pause / Restart / Quit | Button groups on `PopupPanel` dispatch state events |

## 🛠️ Setup

1. Install **Cocos Creator 3.8.x**.
2. Import this project via Cocos Dashboard.
3. Open `assets/scene/BattleScene.scene` for gameplay; `assets/scene/HallScene.scene` for the lobby.
4. Drag required prefabs into each Manager's `@property` slots (bullets / enemies / boss / effects / audio).
5. Click Play in the editor.

## 🚧 In Progress & Roadmap

- [ ] Lobby map & building system (`MapManager` / `BuildManager` / `CameraDrag` prototype)
- [ ] More enemy types and bosses (extendable via data-driven config)
- [ ] Meta-progression and local save unlocking
- [ ] Score system, boss explosion effects, player death fade-out and other asset feedback
- [ ] Endless-mode balance and wave closure tuning
