[English](README.md) | [简体中文](README.zh-CN.md)

**Earth_Demo** 是一款基于 Cocos Creator 开发的 **Roguelike 自动开火弹幕射击游戏**。

在游戏中，玩家专注于操控战机移动以躲避密集的弹幕，而战机会自动攻击敌人。项目目前已具备完整的核心玩法循环：波次刷怪、Boss 战，以及**数据驱动的 Roguelike 升级系统（三选一强化）**。

---

## 📂 目录结构 (Directory Structure)

项目的 TypeScript 源码均位于 `assets/scripts` 目录下，整体架构遵循**高内聚、低耦合**的原则：

```text
assets/scripts/
├── Core/           # 核心底层系统（常量、事件、对象池、配置表）
├── Component/      # 可复用行为组件（技能、移动、动画）
│   ├── Fire/       #   开火技能：BaseFire / RingFire / SpiralFire
│   ├── Move/       #   移动技能：SineMove / BossEnterMove
│   └── Animator/   #   视觉动画：Spin / Float / Pulse
├── Entity/         # 游戏实体（飞机、子弹等）
├── Manager/        # 游戏全局管理器
└── UI/             # 用户界面组件与面板
```
🏗️ 核心模块解析 (Core Systems)
1. Core (基础设施层)
EventBus: 全局事件总线，用于解耦管理器、实体与 UI 之间的通信。

PoolManager: 通用节点对象池，极大减少实例化与销毁带来的性能开销。

各类 Config: 包括 GameConstants（常量）、GameData（玩家数据）、LevelConfig（波次）、BossConfig（Boss 数据）以及 CardConfig（强化卡牌池）。

2. Component (可复用行为层)
BaseFire / RingFire / SpiralFire: 开火技能基类及环形、螺旋弹幕实现。

SineMove / BossEnterMove: 正弦移动与 Boss 入场移动组件。

SpinAnimator / FloatAnimator / PulseAnimator: Boss 部件的旋转、浮动、呼吸等视觉动画。

3. Entity (实体层)
BasePlane: 飞机基类，封装血量、受击接口与基础开火计时。

BaseBullet: 处理子弹位移、边界检测及碰撞回调。

PlayerPlane: 玩家战机，支持自动开火、散弹并排发射、无敌帧以及动态属性强化。

EnemyPlane: 普通敌机。

BaseBoss: 通用 Boss 载体。外观与技能完全由 BossConfig 驱动，所有 Boss 共用一个 BaseBoss.prefab。

4. Manager (管理器层)
BulletManager: 统一管理子弹的对象池。

EnemyManager: 负责敌机与 Boss 的生成、初始化及回收。

GameManager: 核心状态机（准备、游玩、暂停、失败）。

WaveManager: 解析关卡配置，控制刷怪节奏。

UpgradeManager: 肉鸽系统大脑。监听击杀事件、计算经验值、处理升级触发，并将玩家选择的强化卡牌应用给 PlayerPlane。

5. UI (界面层)
PlayerHealthUI: 玩家血条。根据当前血量与最大血量动态生成并更新方块/爱心状态。

BossHealthUI: Boss 血条。顶部平滑过渡的进度条，入场显示，死亡隐藏。

ExpBarUI: 顶部经验条与等级数字显示。

UpgradePanel: 三选一强化面板。负责随机抽卡、UI 渲染，以及处理游戏暂停与恢复流程。

PausePanel / ResultPanels: 暂停与结算等流程控制 UI。

🎮 技术特点 (Technical Highlights)
对象池驱动 (Object Pooling): 高频刷新的子弹与敌机全面接入对象池，确保帧率稳定。

事件驱动 (Event-Driven): 碰撞与 UI 更新完全通过 EventBus 解耦，逻辑实体不直接引用 UI 节点。

配置驱动的 Boss (Data-Driven Boss): 仅用一份 BossConfig 数据即可驱动所有 Boss 的外观拼装与阶段技能。新增 Boss 零代码改动。

数据驱动的肉鸽系统 (Data-Driven Roguelike): UpgradeManager 独立管理经验与等级，通过 UpgradePanel 弹出随机卡牌，玩家选择后直接强化 PlayerPlane 的动态属性（伤害、射速、子弹数量）。

动态 UI 渲染: 血条与经验条能根据玩家当前的最大血量上限和升级状态，动态生成与调整 UI 节点。

🚀 未来规划 (Planned Features)
□ 专属弹幕模式: 扩展更多武器形态（追踪导弹、激光等）。
□ 视听反馈优化: 接入受击特效、屏幕震动与音效。
□ 局外成长系统: 引入永久升级机制。
□ 更多敌人与 Boss: 充分利用现有的数据驱动架构扩充内容。
🛠️ 开发环境 (Development Setup)
安装 Cocos Creator 3.8 或更高版本。

克隆本项目并导入 Cocos Dashboard。

打开 Scenes/HallScene.scene（大厅）或直接打开 Scenes/BattleScene.scene（战斗场景）。

点击编辑器顶部的 Play 按钮即可运行。


