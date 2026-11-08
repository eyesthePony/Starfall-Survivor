[English](README.md) | [简体中文](README.zh-CN.md)

# Starfall Survivor 星陨幸存者

基于 **Cocos Creator 3.8（TypeScript）** 的竖屏（720×1280）**Roguelike 自动开火弹幕射击游戏**。

玩家拖动战机走位躲避弹幕，战机自动攻击；击杀敌机积累经验，升级时从三张强化卡中选择其一，逐步构筑火力。核心循环：**波次刷怪 → 击杀取经验 → 升级抽卡 → 阶段 Boss → 胜利/失败结算**。

---

## 📂 目录结构与类职责

全部 TypeScript 源码位于 `assets/scripts`，按 `Core / Component / Entity / Manager / UI` 五层划分。

### Core/ —— 基础设施与配置表

| 文件 | 导出类 / 数据 | 职责 |
|---|---|---|
| `EventBus.ts` | `EventBus` | 静态全局同步事件总线。实体与 UI 解耦，统一通过事件通信。 |
| `PoolManager.ts` | `PoolManager`（单例） | 节点对象池。按预制体名称分池，支持预热与回收，避免高频实例化。 |
| `GameConstants.ts` | `GameConstants` | 全局常量表：事件名、游戏状态、碰撞掩码、实体类型、卡牌 ID 等。 |
| `GameData.ts` | `GameData` | 运行时静态数据：玩家血量（100）、当前关卡、屏幕宽高、锁定目标等。 |
| `ConfigEnums.ts` | 枚举组 | 炮台编排枚举：阵型、触发方式、瞄准模式、发射模式（齐射/轮射）。 |
| `BossConfig.ts` | `BossConfigData` + `BOSS_CONFIG` | Boss 数据驱动配置表（吴鲸波、胡碟飞飞飞），定义阶段、技能参数与外观。 |
| `EnemyConfig.ts` | `EnemyData` + `ENEMY_CONFIG` | 小怪配置表。定义血量、速度、经验值、开火能力（已支持无子弹静默怪）。 |
| `BulletConfig.ts` | `BulletData` + `BULLET_CONFIG` | 子弹配置表。**仅玩家子弹**使用 `baseSpeed/baseDamage` 倍率；敌人子弹读取绝对数值。 |
| `LevelConfig.ts` | `WaveGroup` + `LEVELS` | 关卡与波次配置。包含 4 个标准关卡与无尽模式，支持阵型与错峰刷怪。 |
| `CardConfig.ts` | `CardConfigData` + `CARD_CONFIG` | Roguelike 卡池。分属性强化、新武器获得、已有武器强化三类。 |
| `SkillMap.ts` | `SkillMap` / `AnimatorMap` | 映射表。将 Boss 技能字符串映射到对应开火/移动组件类。 |

### Component/ —— 行为组件库

#### Fire/ 开火组件
*   **`BaseFire.ts`**：开火基类，控制全局开火节奏。
*   **`CannonBarrage.ts`**：**Boss 炮台编排器（核心特色）**。支持多炮台阵型排布、环绕、散开；支持固定、瞄准、扫描；支持连发（`fireInterval`）、持续时间（`burstDuration`）与喘息（`burstGap`）交替发射。
*   **`RingFire / SpiralFire`**：环形与螺旋弹幕生成器。
*   **`LaserFire / HomingFire`**：玩家的激光与追踪弹武器组件。

#### Move/ 移动组件
*   **`SineMove / BossMoveTo / BossEnterMove`**：正弦横移、阶段位移与入场缓动。
*   **`BackgroundScroll.ts`**：无限背景滚动，自适应长屏。

#### Animator/ 视觉动画
*   **`Float / Pulse / Spin`**：浮动、呼吸、旋转视觉效果。

### Entity/ —— 游戏实体

*   **`BasePlane.ts`**：飞行单位基类。统一处理血量、开火倒计时（`tickFire`）、受击与死亡。
*   **`PlayerPlane.ts`**：玩家实体。处理拖拽移动、无敌帧、机身碰撞；维护武器组件列表与卡牌强化逻辑（`applyUpgrade`）。
*   **`BaseEnemyPlane.ts`**：敌机基类。已修复静默小怪（无子弹类型）误触发生成 `undefined` 的边界 Bug。
*   **`BaseBoss.ts`**：数据驱动 Boss 载体。管理多阶段时间轴、技能延迟注入与阶段循环。
*   **`Turret.ts`**：Boss 炮台子节点。负责单独的转向与扇形散射（`fireSpread`）。
*   **`BaseBullet / Laser / HomingMissile`**：直线弹、持续伤害激光、追踪导弹。

### Manager/ —— 全局管理器（调度层）

*   **`GameManager`**：游戏状态机（准备、游玩、暂停、升级、结算）。
*   **`WaveManager`**：波次推进。管理刷新节奏、存活数检测与无尽模式轮换。
*   **`EnemyPlaneManager`**：敌机与 Boss 的生成、池化回收与距离索敌。
*   **`BulletManager`**：子弹生成中枢。区分阵营计算伤害，特殊子弹分路处理。
*   **`UpgradeManager`**：经验池与抽卡决策。处理升级经验阈值、卡片池过滤与抽取。

### UI/ —— 表现层

*   监听事件进行渲染（血条、经验条、伤害统计），点击按钮仅分发意图事件（暂停、继续、选卡），与实体零耦合。

---

## 🎮 核心系统与数值设计

### 1. 战斗与数值模型
*   **玩家**：初始血量 100，受击后 1 秒无敌。初始 DPS 约为 50。
*   **子弹计算**：玩家子弹吃到面板倍率加成；敌人子弹直接读取配置的绝对伤害。
*   **小怪**：血量 10~50，经验值 15~40。部分高速怪设置为“哑巴”怪，仅撞击伤害。
*   **Boss**：吴鲸波 12000 血，胡碟飞飞飞 25000 血。阶段具有压迫感，击杀耗时控制在 60~90 秒。

### 2. 数据驱动 Boss 系统
所有 Boss 共用 `BaseBoss`，通过 `BossConfig.ts` 实现高度可定制：
*   **多阶段时间轴**：按血量比例切换，技能支持 `delay` 延迟释放与 `loop` 循环。
*   **炮台组合模式**：通过 `CannonBarrage` 实现环绕、固定、散开阵型；支持“左炮口连发 2 秒 -> 停顿 1.2 秒 -> 右炮口连发”的节奏感弹幕（如吴鲸波）。

### 3. Roguelike 构筑系统
*   玩家击杀获取经验，升级时三选一。卡池按 `STAT` (数值)、`WEAPON` (新武器)、`UPGRADE` (武器强化) 分类。
*   抽卡权重优先保证玩家解锁新武器，再提供对应的强化路线。

### 4. 对象池与性能
*   所有实体（敌机、子弹、特效）走 `PoolManager`，彻底消除 GC 卡顿。
*   `MathUtils` 预计算 360 度方向查表，弹幕发射零三角函数运算。

---

## 🚀 快速开始

1. 安装 **Cocos Creator 3.8.x**。
2. 使用 Dashboard 导入工程，打开 `assets/scene/BattleScene.scene`。
3. 在管理器节点上配置所需的 `@property`（预制体、贴图等）。
4. 点击编辑器 Play 即可游玩。

## 🚧 未来规划 (Roadmap)

- [ ] 加入肉鸽“质变”卡牌（如激光折射、导弹分裂），强化构筑爽感。
- [ ] 加入“擦弹”充能系统，鼓励玩家在弹幕中穿梭。
- [ ] 扩展更多 Boss 与特殊波次。