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
    name:string;
    maxHp: number;
    moveSpeed: number;
    scale:number;
    hitBox?: BossHitBoxConfig;
    parts: BossPartConfig[]; // 由多个部件组成
    phases: BossPhaseConfig[];// 这个阶段开启哪些技能组件
   
}


export const BOSS_CONFIG:Record<string,BossConfigData> = {
    [GameConstants.BOSS_TYPE.ICE_BOSS]: {
        name:"冰王杨丰屹",
        maxHp: 1000,
        moveSpeed: 1.5,
        scale: 0.3,
        hitBox: { shape: 'circle', radius: 350 },   
        // 1. 组装外观
        parts: [
              
            { 
                name: "Body", 
                texture: "textures/plane/ice", 
                animation: GameConstants.ANIMATOR_TYPE.FLOAT_ANIMATOR,          // 身体：上下浮动
    
            },     
            
        ],
        // 2. 组装战斗阶段
        phases: [
            { 
                // 阶段1：缓慢的冰环
                skills: [
                    {name:GameConstants.BOSS_SKILL.SINE_MOVE, params: { amplitude: 250, frequency: 0.2 } },
                    { name: GameConstants.BOSS_SKILL.RING_FIRE,  params: { bulletCount: 16, damage: 10, speed: 300,interval: 1.0,bulletType:GameConstants.BULLET_TYPE.ICE,isPlayerBullet:false,}},
                ]
            },
            { 
                // 阶段2：狂暴双螺旋
                skills: [{ name:GameConstants.BOSS_SKILL.SPIRAL_FIRE, params: { arms: 2, damage: 8 ,interval: 0.15,bulletType:GameConstants.BULLET_TYPE.ICE,isPlayerBullet:false,} },

                ] 
            },
            { 
                // 阶段3：狂暴四螺旋
                skills: [{ name:GameConstants.BOSS_SKILL.SPIRAL_FIRE, params: { arms: 4, damage: 8 ,interval: 0.05,bulletType:GameConstants.BULLET_TYPE.ICE,isPlayerBullet:false,} },

                ] 
            },
        ]
    },
};

