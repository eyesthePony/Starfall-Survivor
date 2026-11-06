[English](README.md) | [简体中文](README.zh-CN.md)

# Starfall Survivor 星陨幸存者

基于 **Cocos Creator 3.8（TypeScript）** 的竖屏（720×1280）**Roguelike 自动开火弹幕射击游戏**。

玩家拖动战机走位躲避弹幕，战机自动攻击；击杀敌机积累经验，升级时从三张强化卡中选择其一，逐步构筑火力。核心循环：**波次刷怪 → 击杀取经验 → 升级抽卡 → 阶段 Boss → 胜利/失败结算**。

---

## 📂 目录结构与类职责

全部 TypeScript 源码位于 `assets/scripts`，按 `Core / Component / Entity / Manager / UI` 五层划分。下表按真实文件与类名标注职责；类名与文件名不一致处一并注明。

### Core/ —— 基础设施与配置表

| 文件 | 导出类 / 数据 | 职责 |
|---|---|---|
| `EventBus.ts` | `EventBus` | 静态全局同步事件总线。`on / off / dispatchEvent`，按 `handler + target` 去重注册；遍历原数组派发，回调内部 `off` 不会引发致命错误。实体之间、实体与 UI 之间不直接引用，统一走事件。 |
| `PoolManager.ts` | `PoolManager`（单例） | 节点对象池。按 `prefab.name` 分 `NodePool`，提供 `getNode / putNode / preLoadPrefab / clearPool / clearAllPool / destroyNode`；`destroyInstance` 在关卡切换时清空全部池并释放单例。 |
| `GameConstants.ts` | `GameConstants` | 全局常量集中地：事件名 `EVENT_TYPE`、游戏状态 `GAME_STATE`、场景名 `GAME_SCENE`、敌机类型 / 预制体 / 阵营分类、Boss 类型 / 技能 / 动画类型、子弹类型 / 预制体、卡牌类型 / 卡牌 ID、碰撞分组位掩码 `ITEM_GROUP`、特效 / 音频类型；末尾导出 `SavedBuildingData` 接口。 |
| `GameData.ts` | `GameData` | 运行时全局静态数据：`selectedLevel`、`unlockedLevel`、`isEndlessMode`、`playerMaxHp`、`currentTarget`（全局锁定目标）、`viewW / viewH`；`init()` 从可见尺寸写入视口宽高。 |
| `ConfigEnums.ts` | 枚举组 | Boss 炮台编排枚举：`OrbitCenter`（环绕圆心）、`TurretFormation`（阵型）、`TriggerMode`（触发方式）、`FireMode`（齐射 / 轮射）、`AimMode`（瞄准方式）。 |
| `BossConfig.ts` | `BossConfigData` 等接口 + `BOSS_CONFIG` | Boss 数据驱动配置表。接口：`BossPartConfig`（外观部件）、`BossHitBoxConfig`（碰撞体）、`SkillConfig`（技能）、`BossPhaseConfig`（阶段）、`BossConfigData`（整机）。当前注册 `machine_boss`、`whale_boss` 两个 Boss。 |
| `EnemyConfig.ts` | `EnemyData` + `ENEMY_CONFIG` | 小怪配置表。`EnemyData` 含预制体 / 贴图 / 血量 / 速度 / 撞击伤害 / 经验 / 子弹类型 / 开火间隔 / 弹伤弹速 / 掉落。当前注册 `basic_drone`、`sine_drone`、`arc_drone` 三种。 |
| `BulletConfig.ts` | `BulletData` + `BULLET_CONFIG` | 子弹数据驱动配置表。每类型记录预制体、贴图名、基础速度 `baseSpeed`、基础伤害 `baseDamage`、缩放、穿透数；当前含蓝色 / 黄色 / 激光 / 追踪 / 粒子五种。 |
| `LevelConfig.ts` | `WaveGroup / WaveData / LevelData` + `LEVELS` + `ENDLESS_LEVEL` | 关卡与波次配置。`LEVELS` 为四个普通关；`ENDLESS_LEVEL` 为无尽模式循环波次。波次按 `delay` 间隔、组内按 `time` 错峰，每组记录兵种 / 数量 / 生成间隔 / 出生方向。 |
| `CardConfig.ts` | `CardConfigData` + `CARD_CONFIG` | Roguelike 卡牌池。每卡含 `id / name / desc / maxLevel / iconIndex / requireWeapon / type / targetWeapon`；当前 10 张，分 `STAT / WEAPON / UPGRADE` 三类。 |
| `SkillMap.ts` | `SkillMap`、`AnimatorMap` | 名称到组件类的映射表。`SkillMap` 把 Boss 技能名映射到开火 / 移动组件；`AnimatorMap` 把动画名映射到视觉动画组件。 |
| `MathUtils.ts` | `DirTable` | 预计算方向查表，环形 / 螺旋开火按角度查表取方向向量，避免每帧三角函数。 |
| `DamageStats.ts` | `DamageStats`（单例） | 伤害统计记账本。`addDamage` 按武器名累计伤害，`getRankedStats` 返回降序榜单，`isDirty` 脏标记驱动 UI 刷新，`clear` 重开时清空。 |
| `BuildingConfig.ts` | `BuildingData` + `BUILDINGS` | 大厅建造物配置表（原型），记录名称、花费等。 |
| `EffectManager.ts` | `EffectManager`（单例） | 特效生成与回收。按预制体名建映射，播放爆炸等特效并定时回池；监听 `GAME_RESET` 把场上特效全部回收。 |
| `AudioManager.ts` | `AudioManager`（单例） | 音频播放。按音频名建映射，管理 BGM 与打击 / 爆炸 / 升级等短音效，内部挂 `AudioSource`。 |

### Component/ —— 可复用行为组件（挂到实体节点上）

#### Fire/ 开火组件

| 文件 | 类 | 职责 |
|---|---|---|
| `BaseFire.ts` | `BaseFire` | 开火基类。持有 `interval` 开火间隔、`bulletDamage`、`bulletSpeed`、射击方向、是否玩家弹、`weaponType` 标签；`update` 计时到点调子类重写的 `shoot()`，`reset()` 清计时。 |
| `RingFire.ts` | `RingFire extends BaseFire` | 环形齐射，向一周方向同时开火。 |
| `SpiralFire.ts` | `SpiralFire extends BaseFire` | 多臂螺旋弹幕，随时间旋转出弹。 |
| `LaserFire.ts` | `LaserFire extends BaseFire` | 玩家激光武器，周期性发射一道持续伤害光束。 |
| `HomingFire.ts` | `HomingFire extends BaseFire` | 玩家追踪弹武器，生成追踪导弹。 |
| `CannonBarrage.ts` | `CannonBarrage extends BaseFire` | Boss 炮台编排器。按阵型 / 触发 / 瞄准 / 发射模式驱动一组独立 `Turret` 节点开火。 |

#### Move/ 移动组件

| 文件 | 类 | 职责 |
|---|---|---|
| `SineMove.ts` | `SineMove` | 正弦巡逻，机体沿横向正弦轨迹摆动。 |
| `BossEnterMove.ts` | `BossEnterMove` | Boss 入场补间，控制 Boss 从屏外滑入站位。 |
| `BossMoveTo.ts` | `BossMoveTo` | Boss 阶段位移，缓动移动到目标点后停驻。 |
| `BackgroundScroll.ts` | `BackgroundScroll` | 背景无限滚动，按 `viewH` 动态对齐双图，适配长屏防黑边。 |

#### Animator/ 视觉动画组件

| 文件 | 类 | 职责 |
|---|---|---|
| `FloatAnimator.ts` | `FloatAnimator` | 上下浮动动画。 |
| `PulseAnimator.ts` | `PulseAnimator` | 呼吸缩放动画。 |
| `SpinAnimator.ts` | `SpinAnimator` | 匀速旋转动画。 |

#### Component 根目录

| 文件 | 类 | 职责 |
|---|---|---|
| `CameraDrag.ts` | `CameraDrag` | 大厅正交相机拖拽 / 缩放（原型）。 |

### Entity/ —— 游戏实体

#### plane/ 飞行单位

| 文件 | 类 | 职责 |
|---|---|---|
| `BasePlane.ts` | `BasePlane` | 飞机基类。持有血量上限 / 当前血量 / 移速 / 开火间隔 / 死亡标记 / 开火倒计时 / 经验奖励 `expReward` / 撞击伤害 `ramDamage`；提供 `takeDamage` 受伤、`onDeath` 与 `shoot` 虚方法、`setPaused` 冻结更新、`tickFire` 自动开火计时。 |
| `player/PlayerPlane.ts` | `PlayerPlane extends BasePlane` | 玩家战机。拖动走位并钳制在屏幕边界内、受击无敌帧、子弹伤害 / 速度 / 数量 / 并排间距；维护已挂载武器组件列表 `_activeWeapons`；`applyUpgrade` 执行卡牌强化（改属性 / 挂武器 / 调武器 `onUpgrade`）；处理机身撞机与死亡事件，并把自身写入 `GameData.currentTarget` 供敌弹锁定。 |
| `enemy/BaseEnemyPlane.ts` | `BaseEnemyPlane extends BasePlane` | 普通敌机基类。`init` 注入配置 / 出生位置 / 血量倍率 / 贴图；记录子弹类型 / 伤害 / 速度，从 `body` 子节点取 `Sprite` 换图。 |
| `enemy/StraightEnemy.ts` | `StraightEnemy extends BaseEnemyPlane` | 直飞下潜敌机，直线压向屏底，出底判定逃逸。 |
| `enemy/SineEnemy.ts` | `SineEmemy extends BaseEnemyPlane`（类名沿用历史拼写） | 正弦摆动敌机，左右摇曳推进。 |
| `enemy/ArcEnemy.ts` | `ArcEnemy extends BaseEnemyPlane` | 圆弧切入敌机，沿弧线逼近玩家。 |
| `enemy/BaseBoss.ts` | `BaseBoss extends BasePlane` | 通用数据驱动 Boss 载体。管理阶段索引、技能组件缓存、延迟任务队列、阶段循环倒计时、入场无敌；按配置组装外观部件 / 碰撞体 / 技能；血量过阈值时 `checkPhase` 切换阶段并 `activatePhase` 激活新阶段技能。 |
| `enemy/Turret.ts` | `Turret extends Component` | Boss 炮台子节点。负责炮管旋转瞄准与独立开火，随 Boss 死亡 / 重置一并回收。 |

#### bullet/ 子弹

| 文件 | 类 | 职责 |
|---|---|---|
| `BaseBullet.ts` | `BaseBullet extends Component` | 子弹基类。位移推进、出界回收、命中事件分发、阵营归属。 |
| `Laser.ts` | `Laser extends Component` | 持续伤害激光。维护照射命中集合，按间隔周期结算伤害，临近生命周期结束渐隐。 |
| `HomingMissile.ts` | `HomingMissile extends BaseBullet` | 追踪导弹。节流重新索敌，转向插值追踪最近敌机。 |

#### item/ 道具 / 大厅实体

| 文件 | 类 | 职责 |
|---|---|---|
| `BuildItem.ts` | `BuildItem extends Component` | 大厅建造物列表项。绑定名称 / 花费标签，点击发出放置建造意图事件。 |

### Manager/ —— 全局管理器（单例，只做调度不持有 UI）

| 文件 | 类 | 职责 |
|---|---|---|
| `GameManager.ts` | `GameManager`（单例） | 游戏状态机。在 `READY / PLAYING / PAUSE / UPGRADING / VICTORY / OVER` 间流转，状态变化广播 `GAME_STATE_CHANGED`；订阅 `GAME_OVER / GAME_RESTART / GAME_RESUME / GAME_PAUSE / GAME_VICTORY / LEVEL_UP`。 |
| `WaveManager.ts` | `WaveManager extends Component` | 波次推进与刷怪节奏。状态机 `IDLE / WAITING / SPAWNING / WAITING_CLEAR / FINISHED`；按关卡配置分组计时刷怪，以存活敌机数作为进下一波的闸门；无尽模式清空后波次归零循环，按 `loopCount` 给血量倍率。 |
| `EnemyPlaneManager.ts` | `EnemyManager extends Component`（单例） | 敌机 / Boss 生成与回收。维护预制体字典与贴图字典，提供 `spawnNormalEnemy / spawnBoss`，管理存活敌机列表。 |
| `BulletManager.ts` | `BulletManager`（单例） | 子弹 / 激光 / 追踪弹统一生成与回收。维护贴图字典，按阵营分流计算最终伤害 / 速度；激光、追踪弹等特殊行为子弹在生成路径提前分流。 |
| `UpgradeManager.ts` | `UpgradeManager extends Component` | 经验、升级与抽卡决策。维护 `_maxExp / _exp / _level`；击杀入账（取敌机 `expReward`，保底 10），`while` 循环处理连升；请求三选一候选、记录每张卡已选次数去重、响应选卡回调。 |
| `BuildManager.ts` | `BuildManager extends Component` | 大厅建造系统（原型）。幽灵预览、放置 / 确认 / 取消、维护已建列表。 |
| `MapManager.ts` | `MapManager extends Component` | 大厅地图（原型）。生成地块网格，用二维表记录格子占用状态。 |

### UI/ —— 纯表现层（监听事件渲染，点击只发意图事件）

| 文件 | 类 | 职责 |
|---|---|---|
| `StartPanel.ts` | `StartPanel extends Component` | 大厅入口。遍历绑定普通关按钮、单独绑定无尽按钮；预载 boss 分包后，`startGame` 写入 `GameData` 并跳转战斗场景。 |
| `LodingUI.ts` | `LoadingUI extends Component`（文件名沿用历史拼写） | 加载进度面板。`show / hide / updateProgress / finish` 驱动预加载进度展示。 |
| `PopupPanel.ts` | `PopupPanel extends Component` | 暂停 / 胜利 / 失败整合面板，按状态切换显隐。 |
| `UpgradePanel.ts` | `UpgradePanel extends Component` | 三选一强化面板。请求抽卡、展示候选、选卡后发 `CARD_SELECTED`，完成后恢复战斗。 |
| `PlayerHealthUI.ts` | `PlayerHealthUI extends Component` | 玩家血量显示，监听玩家血量变化事件刷新。 |
| `BossHealthUI.ts` | `BossHealthUI extends Component` | Boss 顶部血条，监听 `BOSS_HP_CHANGED` 刷新血量与显隐。 |
| `ExpBarUI.ts` | `ExpBarUI extends Component` | 经验条与等级显示，监听 `EXP_CHANGED` 刷新进度。 |
| `StatsPanel.ts` | `StatsPanel extends Component` | 伤害统计榜单，读取 `DamageStats` 降序展示各武器伤害。 |
| `Pause.ts` | `Pause extends Component` | 暂停按钮，点击发 `GAME_PAUSE`。 |
| `Resume.ts` | `Resume extends Component` | 继续按钮，点击发 `GAME_RESUME`。 |
| `Restart.ts` | `ReStart extends Component`（类名沿用历史拼写） | 重开按钮，点击发 `GAME_RESTART`。 |
| `Quit.ts` | `Quit extends Component` | 退出按钮。 |
| `BuildPanel.ts` | `BuildPanel extends Component` | 大厅建造列表面板。 |
| `BuildActionPanel.ts` | `BuildActionPanel extends Component` | 建造确认 / 取消面板，发出 `CONFIRM_BUILD_CLICK / CANCEL_BUILD_CLICK`。 |
| `Build.ts` | `Build extends Component` | 建造入口挂载组件。 |

---

## 🎮 玩法系统

### 1. 战斗循环

- **操作**：单指拖动战机，边界自动钳制；战机自动开火，无需手动射击按钮。
- **玩家**：血量上限取 `GameData.playerMaxHp`（当前 1000），受击后进入短暂无敌帧；血量归零发 `GAME_OVER`。
- **击杀奖励**：经验取自敌机配置 `expReward`（保底 10）。当前小怪：直飞 10、正弦 15、圆弧 20；Boss：鲸鱼 400、机械 1000。
- **升级阈值**：`UpgradeManager` 初始 `_maxExp = 50`，每级递增 70；经验满后可连续升级，逐个弹出三选一。
- **升级抽卡**：经验满后进入 `UPGRADING` 暂停态，弹出三选一卡牌；选完恢复 `PLAYING`。

### 2. Roguelike 卡牌系统（UpgradeManager + CardConfig）

卡牌分三类，抽卡按槽位优先级抽取并按已选次数去重：

| 类型 | 作用 | 代表卡牌 |
|---|---|---|
| `STAT` | 直接改玩家基础属性 | 伤害提升、射速提升、子弹数量、弹速 |
| `WEAPON` | 获得新武器（挂组件） | 激光、追踪导弹 |
| `UPGRADE` | 强化已有武器（需先获得对应武器） | 激光伤害、激光冷却、追踪弹伤害、追踪弹数量 |

- 每张卡支持 `maxLevel` 次数上限；`requireWeapon` 控制前置武器解锁；`targetWeapon` 标明作用对象。
- `UpgradeManager` 负责抽卡与记账，`PlayerPlane.applyUpgrade` 负责执行（属性修改 / 挂载武器 / 调武器 `onUpgrade`）。

### 3. 玩家武器（组件化，挂在 PlayerPlane 上）

- **普通散弹**：`bulletCount` 控制并排数量，多排共用临时向量计算偏移。
- **激光 `LaserFire → Laser`**：周期性发射一道持续伤害激光；碰撞进入 / 离开维护照射集合，按间隔周期结算，后段时间渐隐。
- **追踪弹 `HomingFire → HomingMissile`**：出生后向最近敌机转向；目标失效时节流重新请求目标。

**数据驱动子弹（`BulletManager` + `BulletConfig`）**：

- 所有直线子弹共用一个 `baseBulletPrefab`，`BulletManager` 维护按类型索引的 `SpriteFrame` 字典。
- `BULLET_CONFIG` 存每种子弹的基础速度 / 伤害。最终数值按阵营分流：
  - **玩家弹**：最终伤害 = 伤害 × `baseDamage`，最终速度 = 速度 × `baseSpeed`。
  - **敌弹**：伤害 / 速度直接取配置绝对值（不乘基础倍率），敌方技能配置必须显式配 `bulletSpeed`。
- 行为特殊的子弹（激光、追踪弹）保留独立预制体，在生成路径提前 `if/return` 分流。
- 新增子弹类型 = 加一行配置 + 拖一张 SpriteFrame，不用新建预制体。

### 4. 数据驱动 Boss 系统（BaseBoss + BossConfig）

**所有 Boss 共用一个 `BaseBoss` 载体**，运行时按配置组装，新增 Boss 不改代码：

- **外观组装 `parts`**：逐节点加载贴图、挂视觉动画组件（浮动 / 呼吸 / 旋转）。
- **碰撞体 `hitBox`**：支持圆形 / 矩形，运行时启用对应碰撞体。
- **阶段 `phases`**：按血量阈值逐级切换；每个阶段是一组技能配置，支持 `delay` 延迟触发、`loop / loopDelay` 阶段循环重播、`params` 参数注入组件 `applyConfig`。
- **技能注册**：`SkillMap` 把配置技能名映射到组件类，`ensureSkills` 去重获取 / 挂载并缓存。

**Boss 炮台编排 `CannonBarrage`**：

- 阵型 `TurretFormation`：`ATTACHED`（挂在 Boss 周围成圆阵）/ `ORBITING`（环绕指定中心）/ `SCATTERED`（散到屏幕四边）；
- 触发 `TriggerMode`：`IDLE` 停火 / `ONCE` 打一轮回待机 / `CONTINUOUS` 按间隔持续开火；
- 瞄准 `AimMode`：`FIXED` 固定角度 / `TARGET` 锁定 `GameData.currentTarget` / `SPIN` 匀速扫描 / `OSCILLATE` 来回摆动 / `CENTER` 瞄准屏幕中心；
- 发射 `FireMode`：`VOLLEY` 全体齐射 / `SEQUENCE` 炮台按间隔依次轮射，下一发开火前对应炮台红色闪烁放大预警；
- 炮台为独立 `Turret` 节点，负责炮管旋转与开火，预制体异步加载、死亡 / 重置时统一回收。

**当前配置的 Boss**：

| Boss | 定位 |
|---|---|
| `whale_boss` 鲸鱼 | 中前期 Boss，5500 血，400 经验，慢速环弹走位压力。 |
| `machine_boss` 机械 | 终局 Boss，18000 血，1000 经验，多阶段炮台编排与冲刺激光。 |

### 5. 波次与关卡（WaveManager + LevelConfig）

- 普通关按 `LevelConfig.LEVELS` 顺序推进波次，统计存活敌机数，清空后进入下一波；全部波次结束发 `GAME_VICTORY`。
- 当前四关：L1 冰原边境（鲸鱼 Boss）、L2 战争（纯道中潮水）、L3 冰原边境·深入（纯道中切入，无 Boss）、L4 机械要塞（机械 Boss 终局战）。
- Boss 波与普通波共用同一刷怪通道。
- 无尽模式使用 `ENDLESS_LEVEL`（星空回廊），清空一轮后波次归零循环，按 `loopCount` 给怪物血量倍率递增。

---

## 🏗️ 架构约定

- **事件驱动**：碰撞命中、击杀、血量变化、状态切换、UI 刷新全部走 `EventBus`；实体不直接引用 UI，UI 只监听事件渲染，点击只发意图事件。
- **Manager 分层**：`GameManager` 状态机；战斗 Manager 调度实体；`UpgradeManager` 决策层；`PlayerPlane` 执行层。Manager 之间不互相 import 成环，上下级可调单例，同级通信用事件。
- **对象池**：子弹、激光、敌机、特效统一经 `PoolManager` 按预制体名分池回收，避免高频 `instantiate / destroy`。
- **状态冻结**：非 `PLAYING` 状态下，Manager 通过 `setPaused` / `enabled = false` 冻结实体与子弹更新，暂停期间不产生逻辑推进。

## ⚡ 性能要点

- `DirTable` 预计算方向表，环形 / 螺旋弹幕开火零三角函数运算。
- 高频脚本复用 `Vec3` 临时对象，避免 `update` 内反复 `new Vec3`。
- 子弹数组使用交换删除（`removeFast`），避免数组整体搬移。
- 追踪弹索敌节流（0.2s 一次），UI 刷新带脏标记 / 节流。
- 碰撞体引用、屏幕半宽高等在 `onLoad` 缓存，不在每帧重复获取。
- 出界回收在视口四周留缓冲边距，超出即回池。

## 🎮 操作

| 操作 | 说明 |
|---|---|
| 拖动战机 | 跟随手指移动，限制在屏幕边界内 |
| 自动开火 | 战机持续攻击，无需点击射击 |
| 升级选卡 | 三选一，点击后自动恢复战斗 |
| 暂停 / 重开 / 退出 | 由面板按钮组分发状态事件 |

## 🛠️ 开发环境

1. 安装 **Cocos Creator 3.8.x**。
2. 用 Dashboard 导入本工程目录。
3. 战斗预览打开 `assets/scene/BattleScene.scene`；大厅打开 `assets/scene/HallScene.scene`。
4. 在编辑器层级面板把对应预制体 / 贴图 / 音频拖到各 Manager 的 `@property` 槽位。
5. 点击编辑器 Play 运行。

## 🚧 进行中与后续规划

- [ ] 大厅地图与建造系统（`MapManager` / `BuildManager` / `CameraDrag` 原型完善）
- [ ] 更多普通敌机种类与新 Boss（复用数据驱动配置即可扩展）
- [ ] 敌机本体撞击伤害与掉落拾取系统
- [ ] 局外成长与本地存档解锁
- [ ] 分数系统、Boss 爆炸表现与玩家死亡淡出等素材向反馈
- [ ] 无尽模式数值与波次闭环调优
