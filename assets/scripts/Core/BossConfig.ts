import { GameConstants } from "./GameConstants";

// 定义一个部位
export interface BossPartConfig {
    name: string;       // 节点名字，比如 "Body", "Ring"
    texture: string;    // 贴图路径
    x?: number;         // 相对位置X
    y?: number;         // 相对位置Y
    scale?: number;     // 缩放
    animation?: string; // 挂载什么动画组件，比如 "SpinAnimator"
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
}

export interface BossPhaseConfig {
    skills: SkillConfig[];
}

export interface BossConfigData {
    maxHp: number;
    moveSpeed: number;
    scale:number;
    hitBox?: BossHitBoxConfig;
    parts: BossPartConfig[]; // 由多个部件组成
    phases: BossPhaseConfig[];// 这个阶段开启哪些技能组件
   
}


export const BOSS_CONFIG:Record<string,BossConfigData> = {
    [GameConstants.BOSS_TYPE.ICE_BOSS]: {
        maxHp: 1000,
        moveSpeed: 1.5,
        scale: 0.3,
        hitBox: { shape: 'circle', radius: 250 },   
        // 1. 组装外观
        parts: [
            { 
                name: "RingInner", 
                texture: "textures/boss/ice/ice_ring_inner", 
                animation: GameConstants.ANIMATOR_TYPE.SPIN_ANIMATOR ,   // 内圈法阵：顺时针快转
            },
            { 
                name: "RingOuter", 
                texture: "textures/boss/ice/ice_ring_outer", // 资源路径
                animation: GameConstants.ANIMATOR_TYPE.SPIN_ANIMATOR,            // 外圈法阵：逆时针慢转
            },   
            { 
                name: "Body", 
                texture: "textures/boss/ice/ice_body", 
                animation: GameConstants.ANIMATOR_TYPE.FLOAT_ANIMATOR,          // 身体：上下浮动
    
            },     
            { 
                name: "Core", 
                texture: "textures/boss/ice/ice_core", 
                animation: GameConstants.ANIMATOR_TYPE.PULSE_ANIMATOR,             // 能量球：呼吸缩放
                scale: 0.2,
      
                
            },
            
        ],
        // 2. 组装战斗阶段
        phases: [
            { 
                // 阶段1：缓慢的冰环
                skills: [
                    {name:GameConstants.BOSS_SKILL.SINE_MOVE, params: { amplitude: 250, frequency: 0.5 } },
                    { name: GameConstants.BOSS_SKILL.RING_FIRE,  params: { bulletCount: 16, damage: 10, speed: 300,interval: 2.0 }},
                ]
            },
            { 
                // 阶段2：狂暴双螺旋
                skills: [{ name:GameConstants.BOSS_SKILL.SPIRAL_FIRE, params: { arms: 2, damage: 8 ,interval: 0.15} },

                ] 
            }
        ]
    },
};

