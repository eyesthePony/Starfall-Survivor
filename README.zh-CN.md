[English](README.md) | [简体中文](README.zh-CN.md)

# Starfall Survivor 星陨幸存者

基于 **Cocos Creator 3.8（TypeScript）** 的竖屏（720×1280，FIT_HEIGHT）**Roguelike 自动开火弹幕射击游戏**。

玩家拖动战机走位躲避弹幕，战机自动攻击；击杀敌机积累经验，升级时从三张强化卡中选择其一，逐步构筑火力。核心循环：**波次刷怪 → 击杀取经验 → 升级抽卡 → 阶段 Boss → 胜利/失败结算**。

---

## 📂 目录结构

全部 TypeScript 源码位于 `assets/scripts`，按职责分层：

```text
assets/
├── scene/                          # 场景
│   ├── HallScene.scene             # 大厅（含建造原型）
│   └── BattleScene.scene           # 战斗场景
├── resources/
│   └── prefabs/                    # 预制体（子弹 / 敌机 / Boss / 炮台 / 特效 / UI 块）
└── scripts/
    ├── Core/                       # 基础设施与配置表
    │   ├── EventBus.ts             #   全局同步事件总线
    │   ├── PoolManager.ts          #   按 prefab.name 分池的对象池
    │   ├── GameConstants.ts        #   事件名 / 状态 / 分组位掩码 / 技能与动画常量
    │   ├── GameData.ts             #   运行时全局数据（屏幕尺寸、玩家血量、锁定目标）
    │   ├── ConfigEnums.ts          #   炮台阵型 / 触发 / 瞄准 / 发射模式枚举
    │   ├── BossConfig.ts           #   Boss 外观、碰撞体、阶段技能配置
    │   ├── BulletConfig.ts         #   子弹数据驱动配置（每种子弹的基础速度/伤害）
    │   ├── LevelConfig.ts          #   关卡与波次配置
    │   ├── CardConfig.ts           #   Roguelike 卡牌池
    │   ├── SkillMap.ts             #   技能名 → 组件类映射（含 AnimatorMap）
    │   ├── MathUtils.ts            #   方向查表 DirTable（替代三角函数）
    │   ├── DamageStats.ts          #   伤害统计
    │   ├── BuildingConfig.ts       #   大厅建造物配置
    │   ├── EffectManager.ts        #   特效对象池与定时回收
    │   └── AudioManager.ts         #   BGM / 短音效播放
    ├── Component/                  # 可复用行为组件（挂载到实体上）
    │   ├── Fire/                   #   开火组件
    │   │   ├── BaseFire.ts         #     开火基类（间隔计时、参数注入）
    │   │   ├── RingFire.ts         #     环形弹幕
    │   │   ├── SpiralFire.ts       #     多臂螺旋弹幕
    │   │   ├── LaserFire.ts        #     玩家激光武器
    │   │   ├── HomingFire.ts       #     玩家追踪弹武器
    │   │   └── CannonBarrage.ts    #     Boss 炮台编排（阵型 / 齐射 / 轮射 / 瞄准）
    │   ├── Move/                   #   移动组件
    │   │   ├── SineMove.ts         #     正弦巡逻
    │   │   ├── BossEnterMove.ts   #     Boss 入场补间
    │   │   ├── BackgroundScroll.ts #     背景无限滚动（动态适配 viewH 防黑边）
    │   │   └── BossMoveTo.ts       #     Boss 阶段位移（缓动）
    │   ├── Animator/               #   视觉动画组件
    │       ├── FloatAnimator.ts
    │       ├── PulseAnimator.ts
    │       └── SpinAnimator.ts
    │   └── CameraDrag.ts           #   大厅正交相机拖拽缩放（原型，Component 根目录）
    ├── Entity/                     # 游戏实体
    │   ├── plane/
    │   │   ├── BasePlane.ts        #   飞机基类（血量、受击、开火计时、暂停）
    │   │   ├── player/PlayerPlane.ts
    │   │   └── enemy/
    │   │       ├── EnemyPlane.ts   #   普通敌机
    │   │       ├── BaseBoss.ts     #   通用 Boss 载体（数据驱动组装 + 阶段时间轴）
    │   │       └── Turret.ts       #   Boss 炮台子组件（瞄准 / 开火）
    │   ├── bullet/
    │   │   ├── BaseBullet.ts       #   普通子弹（位移、出界回收、碰撞分发）
    │   │   ├── Laser.ts            #   持续伤害激光（照射集合 + 周期结算 + 渐隐）
    │   │   └── HomingMissile.ts    #   追踪弹（节流索敌 + 转向插值）
    │   └── item/BuildItem.ts       #   大厅建造物
    ├── Manager/                    # 全局管理器（单例，只做调度不持有 UI）
    │   ├── GameManager.ts          #   游戏状态机
    │   ├── WaveManager.ts          #   波次推进与刷怪节奏
    │   ├── EnemyPlaneManager.ts    #   敌机 / Boss 生成与回收
    │   ├── BulletManager.ts        #   子弹 / 激光统一生成与回收
    │   ├── UpgradeManager.ts       #   经验、升级、抽卡与强化应用
    │   ├── BuildManager.ts         #   大厅建造（原型）
    │   └── MapManager.ts           #   大厅地图（原型）
    └── UI/                         # 纯表现层，只监听事件渲染
        ├── PopupPanel.ts           #   暂停 / 胜利 / 失败整合面板
        ├── UpgradePanel.ts         #   三选一强化面板
        ├── PlayerHealthUI.ts       #   爱心格子血量
        ├── BossHealthUI.ts         #   Boss 顶部血条
        ├── ExpBarUI.ts             #   经验条与等级
        ├── StatsPanel.ts           #   伤害统计
        ├── Start / Pause / Resume / Restart / Quit.ts
        └── Build.ts / BuildPanel / BuildActionPanel.ts
```

---

## 🎮 玩法系统

### 1. 战斗循环

- **操作**：单指拖动战机，边界自动钳制；战机自动开火，无需手动射击。
- **玩家**：5 颗爱心，受击扣 1 血并进入短暂无敌帧；血量归零发 `GAME_OVER`。
- **击杀奖励**：普通敌机经验 10，Boss 经验 1000；升级所需经验 100，每级递增 200。
- **升级抽卡**：经验满后游戏进入 `UPGRADING` 暂停态，弹出三选一卡牌；选完发 `GAME_RESUME` 恢复。

### 2. Roguelike 卡牌系统（UpgradeManager + CardConfig）

卡牌分三类，抽卡按槽位优先级抽取并从池中去重：

| 类型 | 作用 | 代表卡牌 |
|---|---|---|
| `STAT` | 直接改玩家基础属性 | 伤害提升、射速提升、子弹数量、移速/弹速 |
| `WEAPON` | 获得新武器（挂组件） | 激光、追踪导弹 |
| `UPGRADE` | 强化已有武器（需先获得对应武器） | 激光伤害、激光冷却、追踪弹伤害 |

- 每张卡支持 `maxLevel` 次数上限；`requireWeapon` 控制解锁前置。
- `UpgradeManager` 决策抽卡与记账，`PlayerPlane.applyUpgrade` 负责执行（属性修改 / 挂载武器 / 调武器 `onUpgrade`）。

### 3. 玩家武器（组件化，挂在 PlayerPlane 上）

- **普通散弹**：`bulletCount` 控制并排数量，多排共用临时向量计算偏移。
- **激光 `LaserFire → Laser`**：周期性发射一道持续伤害激光；碰撞进入/离开维护照射集合，按 `damageInterval` 周期结算，后段时间渐隐。
- **追踪弹 `HomingFire → HomingMissile`**：出生后向最近敌机转向；目标失效时按 0.2s 节流重新请求目标。

**数据驱动子弹（`BulletManager` + `BulletConfig`）**：

- 所有直线子弹共用一个 `baseBulletPrefab`，`BulletManager` 维护一个按类型索引的 `SpriteFrame` 字典。
- `BULLET_CONFIG` 存每种子弹的基础速度 / 伤害。最终数值按阵营分流：
  - **玩家弹**：`最终伤害 = 伤害 × baseDamage`，`最终速度 = 速度 × baseSpeed`。
  - **敌弹**：伤害 / 速度直接取配置绝对值（不乘基础倍率），每个敌方技能配置必须显式配 `bulletSpeed`。
- 行为特殊的子弹（激光、追踪弹）保留独立 Prefab，在 `spawnBullet` 里提前 `if/return` 分流。
- 新增子弹类型 = 加一行配置 + 拖一张 SpriteFrame，不用新建 Prefab。

### 4. 数据驱动 Boss 系统（BaseBoss + BossConfig）

**所有 Boss 共用一个 `BaseBoss.prefab`**，运行时按配置组装，新增 Boss 不改代码：

- **外观组装 `parts`**：逐节点加载贴图、挂视觉动画组件（浮动 / 呼吸 / 旋转）。
- **碰撞体 `hitBox`**：支持圆形 / 矩形，运行时启用对应碰撞体。
- **阶段 `phases`**：按血量阈值逐级切换；每个阶段是一组技能配置，支持：
  - `delay`：技能延迟触发（统一时间轴队列）；
  - `loop` / `loopDelay`：阶段循环重播；
  - `params`：参数注入对应组件的 `applyConfig`。
- **技能注册**：`SkillMap` 把配置中的技能名映射到组件类，`ensureSkills` 去重获取/挂载并缓存。

**Boss 炮台编排 `CannonBarrage`**：

- 阵型 `TurretFormation`：`ATTACHED`（挂载在 Boss 周围成圆阵）/ `ORBITING`（环绕指定中心旋转）/ `SCATTERED`（散开到屏幕四边周长分布）；
- 触发 `TriggerMode`：`IDLE`（停火待机）/ `ONCE`（打一轮后回到 IDLE）/ `CONTINUOUS`（按间隔持续开火）；
- 瞄准 `AimMode`：`FIXED`（固定角度）/ `TARGET`（锁定 `GameData.currentTarget`）/ `SPIN`（匀速旋转扫描）/ `OSCILLATE`（围绕中心角来回摆动）/ `CENTER`（持续瞄准屏幕中心）；
- 发射 `FireMode`：`VOLLEY`（全体齐射）/ `SEQUENCE`（炮台按 `seqInterval` 依次轮射，下一发开火前对应炮台红色闪烁放大预警）；
- 炮台为独立 `Turret` 节点，负责炮管旋转与开火，预制体异步加载、死亡/重置时统一回收。

**当前配置的 Boss**：

| Boss | 阶段设计 |
|---|---|
| 冰王 `ICE_BOSS`（3 阶段） | P1 正弦巡逻 + 16 发环形弹幕；P2 双臂螺旋；P3 四臂螺旋 |
| 机械之王 `MACHINE_BOSS`（4 阶段） | P1 挂载圆阵炮台朝下持续齐射，叠加正弦移动；P2 循环：飞至屏幕中心 → 锁定玩家 → 齐射一轮 → 撤回上方；P3 炮台散到屏幕四边、瞄屏幕中心待机，2s 后依次轮射激光；P4 圆阵炮台高速旋转扫描，1s 后持续齐射 |

### 5. 波次与关卡（WaveManager + LevelConfig）

- 按 `LevelConfig` 顺序推进波次，统计存活敌机数，清空后进入下一波；全部波次结束发 `GAME_VICTORY`。
- Boss 波与普通波共用同一刷怪通道；无尽模式清空后波次归零循环，怪物血量按 `1 + 轮回数 × 0.5` 递增。

---

## 🏗️ 架构约定

- **事件驱动**：碰撞命中、击杀、血量变化、状态切换、UI 刷新全部走 `EventBus`；实体不直接引用 UI，UI 只监听事件渲染，点击只发意图事件。
- **Manager 分层**：`GameManager` 状态机；战斗 Manager 调度实体；`UpgradeManager` 决策层；`PlayerPlane` 执行层。Manager 之间不互相 import 成环，上下级可调单例，同级通信用事件。
- **对象池**：子弹、激光、敌机、特效统一经 `PoolManager` 按预制体名分池回收，避免高频 `instantiate/destroy`。
- **状态冻结**：非 `PLAYING` 状态下，Manager 通过 `setPaused` / `enabled = false` 冻结实体与子弹更新，暂停期间不产生逻辑推进。

## ⚡ 性能要点

- `DirTable` 预计算方向表，环形 / 螺旋弹幕开火零三角函数运算。
- 高频脚本复用 `Vec3` 临时对象，避免 `update` 内反复 `new Vec3`。
- 子弹数组使用交换删除（`removeFast`），避免数组整体搬移。
- 追踪弹索敌节流（0.2s 一次），UI 刷新带脏标记 / 节流。
- 碰撞体引用、屏幕半宽高等在 `onLoad` 缓存，不在每帧重复获取。
- 出界回收在视口四周留 30px `MARGIN` 缓冲，超出即回池。

## 🎮 操作

| 操作 | 说明 |
|---|---|
| 拖动战机 | 跟随手指移动，限制在屏幕边界内 |
| 自动开火 | 战机持续攻击，无需点击射击 |
| 升级选卡 | 三选一，点击后自动恢复战斗 |
| 暂停 / 重开 / 退出 | 由 `PopupPanel` 按钮组分发状态事件 |

## 🛠️ 开发环境

1. 安装 **Cocos Creator 3.8.x**。
2. 用 Dashboard 导入本工程目录。
3. 战斗预览直接打开 `assets/scene/BattleScene.scene`；大厅打开 `assets/scene/HallScene.scene`。
4. 在编辑器层级面板把对应预制体拖到各 Manager 的 `@property` 槽位（子弹 / 敌机 / Boss / 特效 / 音效）。
5. 点击编辑器 Play 运行。

## 🚧 进行中与后续规划

- [ ] 大厅地图与建造系统（`MapManager` / `BuildManager` / `CameraDrag` 原型完善）
- [ ] 更多普通敌机种类与新 Boss（复用数据驱动配置即可扩展）
- [ ] `ICE_BOSS` 子弹类型占位（配置已留，尚无对应 `BulletConfig` 条目与贴图）
- [ ] 敌机本体撞击伤害与掉落拾取系统
- [ ] 局外成长与本地存档解锁
- [ ] 分数系统、Boss 爆炸表现与玩家死亡淡出等素材向反馈
- [ ] 无尽模式数值与波次闭环调优
