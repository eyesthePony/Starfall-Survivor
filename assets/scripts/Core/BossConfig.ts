import {OrbitCenter, AimMode, FireMode, TriggerMode, TurretFormation } from "./ConfigEnums";
import { GameConstants } from "./GameConstants";

// 定义一个部位
export interface BossPartConfig {
    name: string;       // 节点名字，比如 "Body"s, "Ring"
    texture?: string;    // 贴图路径
    x?: number;         // 相对位置X
    y?: number;         // 相对位置Y
    scale?: number;     // 缩放
    animation?: string; // 挂载什么动画组件，比如 "SpinAnimator"
    animClipPath?: string;//循环待机动画 Clip 的 resources 路径，有它就不加载单张图
    hitBox?: { shape: 'circle' | 'box'; radius?: number; width?: number; height?: number; };
}

// 碰撞体积
export interface BossHitBoxConfig {
    shape: 'circle' | 'box';
    radius?: number;       // circle 用
    width?: number;        // box 用
    height?: number;       // box 用
    offsetX?: number;
    offsetY?: number;
}

export interface SkillConfig {
    name: string;                    // 'RingFire'
    params?: Record<string, any>;    // 这个 Boss 用这个技能时的参数
    delay?: number;                  // 延迟多少秒后执行这个技能
}

export interface BossPhaseConfig {
    skills: SkillConfig[];
    hpRatio?: number;       // 进入阶段的血量比例，初始阶段不管
    loop?: boolean;       // 改为布尔值：是否循环此阶段
    loopDelay?: number;   // 可选：循环间隙休息几秒（默认 0.5 秒） 
}

export interface BossConfigData {
    name:string;
    maxHp: number;
    damage:number;//碰撞伤害
    expReward:number;
    moveSpeed: number;
    scale:number;
    hitBox?: BossHitBoxConfig;
    parts: BossPartConfig[]; // 由多个部件组成
    phases: BossPhaseConfig[];// 这个阶段开启哪些技能组件
   
}


export const BOSS_CONFIG:Record<string,BossConfigData> = {
   [GameConstants.BOSS_TYPE.WHALE_BOSS]: {
        name: "吴鲸波",
        maxHp: 12000,
        damage: 15,
        expReward: 400,
        moveSpeed: 1.5,
        scale: 0.3,
        hitBox: { shape: 'circle', radius: 350 },
        parts: [
            {
                name: "Body",
                animClipPath: 'animations/whale',
                scale: 4,
            },
        ],
        phases: [
            // ================== 阶段 1：双炮口交替散射（100% - 70%） ==================
            {
                skills: [
                    // 先挂阵型，停火
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            turretPath: 'prefabs/Turret',
                            turretCount: 2,
                            formation: TurretFormation.ATTACHED,
                            radius: 120,
                            aimMode: AimMode.FIXED,
                            fireAngle: 180,
                            triggerMode: TriggerMode.IDLE,
                        },
                    },
                    // 2 秒后开火：左串 → 喘 → 右串 → 循环
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            triggerMode: TriggerMode.CONTINUOUS,
                            fireMode: FireMode.SEQUENCE,
                            fireInterval: 0.03,
                            burstDuration: 2,       // 每炮口打 2 秒
                            burstGap: 1.2,          // 停 1.2 秒换口
                            spreadCount: 3,
                            spreadAngle: 36,
                            bulletSpeed: 240,
                            bulletDamage: 30,
                            bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
                            isPlayerBullet: false,
                            warnTime: 0.001,
                        },
                        delay: 2,
                    },
                    {
                        name: GameConstants.BOSS_SKILL.SINE_MOVE,
                        params: { amplitude: 180, frequency: 0.2 },
                    },
                ],
            },

            // ================== 阶段 2：环形 + 狂暴散射（70% - 35%） ==================
            {
                hpRatio: 0.7,
                skills: [
                    // 环形弹幕加入，2.5 秒一发
                    {
                        name: GameConstants.BOSS_SKILL.RING_FIRE,
                        params: {
                            bulletCount: 20,
                            bulletSpeed: 200,
                            bulletDamage: 50,
                            interval: 2.5,
                            bulletType: GameConstants.BULLET_TYPE.PARTICLE,
                            isPlayerBullet: false,
                        },
                    },
                    // 散射提速：5 发扇形，1.5 秒一串，停 0.8 秒
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            fireInterval: 0.025,
                            burstDuration: 1.5,
                            burstGap: 0.8,
                            spreadCount: 5,
                            spreadAngle: 50,
                            bulletSpeed: 240,
                            bulletDamage: 25,
                        },
                    },
                    // 横移加速
                    {
                        name: GameConstants.BOSS_SKILL.SINE_MOVE,
                        params: { amplitude: 250, frequency: 0.35 },
                    },
                ],
            },

            // ================== 阶段 3：最终爆发（35% - 0%） ==================
            {
                hpRatio: 0.35,
                skills: [
                    {
                        name: GameConstants.BOSS_SKILL.RING_FIRE,
                        params: {
                            bulletCount: 24,
                            bulletSpeed: 180,
                            bulletDamage: 60,
                            interval: 1.8,
                            bulletType: GameConstants.BULLET_TYPE.PARTICLE,
                            isPlayerBullet: false,
                        },
                    },
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            fireInterval: 0.02,
                            burstDuration: 1.2,
                            burstGap: 0.5,
                            spreadCount: 7,
                            spreadAngle: 60,
                            bulletSpeed: 220,
                            bulletDamage: 25,
                        },
                    },
                    {
                        name: GameConstants.BOSS_SKILL.SINE_MOVE,
                        params: { amplitude: 300, frequency: 0.5 },
                    },
                ],
            },
        ],
    },
    [GameConstants.BOSS_TYPE.MACHINE_BOSS]: {
        name: "胡碟飞飞飞",
        maxHp: 25000,
        damage: 15,
        expReward: 1000,
        moveSpeed: 1.5,
        scale: 1.5,
        hitBox: { shape: 'circle', radius: 50 },
        parts: [
            {
                name: "Body",
                texture: "textures/plane/machine/body",
                animation: GameConstants.ANIMATOR_TYPE.FLOAT_ANIMATOR,
            },
        ],
        phases: [
            // ================== 阶段 1：炮阵齐射（100% - 60%） ==================
            {
                skills: [
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            turretPath: 'prefabs/Turret',
                            turretCount: 8,
                            formation: TurretFormation.ATTACHED,
                            radius: 280,
                            aimMode: AimMode.FIXED,
                            fireAngle: 180,
                            triggerMode: TriggerMode.CONTINUOUS,
                            fireMode: FireMode.VOLLEY,
                            interval: 2.5,           // 每 2.5 秒齐射一波
                            spreadCount: 3,          // 每炮台扇形 3 发
                            spreadAngle: 45,
                            bulletSpeed: 280,
                            bulletDamage: 35,
                            bulletType: GameConstants.BULLET_TYPE.PARTICLE,
                            isPlayerBullet: false,
                            warnTime: 0.5,
                        },
                    },
                    {
                        name: GameConstants.BOSS_SKILL.SINE_MOVE,
                        params: { amplitude: 180, frequency: 0.4 },
                        delay: 1,
                    },
                ],
            },

            // ================== 阶段 2：冲脸·扇形齐射（60% - 30%，loop） ==================
            {
                hpRatio: 0.6,
                loop: true,
                loopDelay: 1.2,
                skills: [
                    // ① 冲到屏幕中下
                    {
                        name: GameConstants.BOSS_SKILL.BOSSMOVETO,
                        params: { targetX: 0, targetY: 80, duration: 0.6 },
                        delay: 0,
                    },
                    // ② 炮台收缩 + 瞄准玩家（TARGET 只瞄一次就锁死）
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            aimMode: AimMode.TARGET,
                            triggerMode: TriggerMode.IDLE,
                            radius: 100,
                        },
                        delay: 1.0,
                    },
                    // ③ 扇形一波爆发
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            triggerMode: TriggerMode.ONCE,
                            fireMode: FireMode.VOLLEY,
                            spreadCount: 5,
                            spreadAngle: 60,
                            bulletDamage: 45,
                            bulletSpeed: 300,
                        },
                        delay: 1.4,
                    },
                    // ④ 炮台恢复阵型、朝下
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            aimMode: AimMode.FIXED,
                            fireAngle: 180,
                            triggerMode: TriggerMode.IDLE,
                            radius: 280,
                        },
                        delay: 1.8,
                    },
                    // ⑤ 飞回顶部
                    {
                        name: GameConstants.BOSS_SKILL.BOSSMOVETO,
                        params: { targetX: 0, targetY: 380, duration: 0.9 },
                        delay: 2.0,
                    },
                ],
            },

            // ================== 阶段 3：激光处刑（30% - 0%） ==================
            {
                hpRatio: 0.3,
                skills: [
                    // ① 停火，炮台散布到屏幕边缘，朝中心
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            formation: TurretFormation.SCATTERED,
                            rotateSpeed: 45,
                            aimMode: AimMode.CENTER,
                            triggerMode: TriggerMode.IDLE,
                        },
                    },
                    // ② 环形弹幕压制
                    {
                        name: GameConstants.BOSS_SKILL.RING_FIRE,
                        params: {
                            bulletCount: 20,
                            bulletSpeed: 170,
                            bulletDamage: 50,
                            interval: 1.5,
                            bulletType: GameConstants.BULLET_TYPE.PARTICLE,
                            isPlayerBullet: false,
                        },
                        delay: 1.5,
                    },
                    // ③ 8 炮台轮流射激光（从边缘扫向中心）
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,
                        params: {
                            bulletType: GameConstants.BULLET_TYPE.LASER,
                            triggerMode: TriggerMode.CONTINUOUS,
                            fireMode: FireMode.SEQUENCE,
                            fireInterval: 0.5,       // 每 0.5 秒轮到下个炮台
                            burstDuration: 0.5,
                            burstGap: 0.3,
                            spreadCount: 1,
                            spreadAngle: 0,
                            bulletDamage: 20,
                            warnTime: 0.3,
                        },
                        delay: 2.5,
                    },
                ],
            },
        ],
    },
       
    
};

