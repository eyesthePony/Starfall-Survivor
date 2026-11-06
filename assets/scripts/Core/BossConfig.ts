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
    [GameConstants.BOSS_TYPE.MACHINE_BOSS]: {
        name:"胡碟飞飞飞",
        maxHp: 18000,
        damage:80,
        expReward:1000,
        moveSpeed: 1.5,
        scale: 1.5,
        hitBox: { shape: 'circle', radius: 50 },
        parts: [
              
            { 
                name: "Body", 
                texture: "textures/plane/machine/body", 
                animation: GameConstants.ANIMATOR_TYPE.FLOAT_ANIMATOR,          // 身体：上下浮动
    
            },     
            
        ],
        phases: [
                { 
                     // ================== 阶段 1：挂载炮台，普通子弹 ==================
                skills: [
                   
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: {
                            turretPath: 'prefabs/Turret',
                            formation: TurretFormation.ATTACHED, 
                            aimMode: AimMode.FIXED, 
                            fireAngle: 180, triggerMode: TriggerMode.CONTINUOUS, fireMode: FireMode.VOLLEY, 
                            interval: 3,radius:300,bulletSpeed:300,bulletDamage:40,
                            isPlayerBullet:false,bulletType:GameConstants.BULLET_TYPE.PARTICLE,},
                    },
                    { name: GameConstants.BOSS_SKILL.SINE_MOVE, 
                        params: { amplitude: 150, frequency: 0.5 } ,
                        delay:1,
                        
                    },
                ]                   

                },
                  // ================== 阶段 2：狂暴冲刺（触发 enterAimPhase） ==================
            { 
                loop:true,
                loopDelay:1,
                hpRatio: 0.6,
                skills: [
                    // ① 0秒：从当前位置飞到屏幕中心，耗时 0.8 秒
                    { 
                        name: GameConstants.BOSS_SKILL.BOSSMOVETO, 
                        params: { targetX: 0, targetY: 0, duration: 0.8 }, 
                        delay: 0 
                    },
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: {
                            aimMode: AimMode.TARGET, 
                            triggerMode: TriggerMode.IDLE, 
                            radius:100,
                            },
                        delay:1.2,
                    },
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: {
                            triggerMode: TriggerMode.ONCE, fireMode: FireMode.VOLLEY, bulletDamage:40,
                            },
                        delay:1.6,
                    },
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: {
                            aimMode:AimMode.FIXED,
                            fireAngle:180,
                            triggerMode: TriggerMode.IDLE, 
                            radius:300,
                            },
                        delay:2,
                    },
                 
                    { 
                        name: GameConstants.BOSS_SKILL.BOSSMOVETO, 
                        params: { targetX: 0, targetY: 400, duration: 1.0 }, 
                        delay: 2,
                    },
                ]                
            },
              // ================== 阶段 3：脱离环绕，激光处刑（触发 enterOrbitPhase） ==================
            { 
            hpRatio: 0.3,
            skills: [
                    // ① 0秒：停火，进入静默状态，准备冲刺
                    { name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, params: { 
                        formation:TurretFormation.SCATTERED, 
                        rotateSpeed: 45,
                        aimMode: AimMode.CENTER, 
                        triggerMode: TriggerMode.IDLE, },

                    },
                    {
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE,params: { 
                            bulletType:GameConstants.BULLET_TYPE.LASER,
                            triggerMode: TriggerMode.CONTINUOUS,
                            fireMode: FireMode.SEQUENCE, 
                            bulletDamage:60,
                            seqInterval:1.2,
                        },
                        delay:2,
                    }
            ]                   
            },
        ]
    },
    [GameConstants.BOSS_TYPE.WHALE_BOSS]:{
        name:"吴鲸波",
        maxHp: 5500,
        damage:80,
        expReward:400,
        moveSpeed: 1.5,
        scale: 0.3,
        hitBox: { shape: 'circle', radius: 350 },  
        parts: [
            { 
                name: "Body", 
               
                animClipPath:'animations/whale',          // 身体：上下浮动
                scale: 4,
    
            },     
            
        ],
         phases: [
            { 
                // 阶段1：缓慢的冰环
                skills: [
                    {name:GameConstants.BOSS_SKILL.SINE_MOVE, params: { amplitude: 250, frequency: 0.2 } },
                    { name: GameConstants.BOSS_SKILL.RING_FIRE,  params: { bulletCount: 16, bulletDamage: 70, bulletSpeed: 200,interval: 1.0,bulletType:GameConstants.BULLET_TYPE.PARTICLE,isPlayerBullet:false,}},
                ]
            },
            {
                hpRatio: 0.7,
                skills: [
                    {name: GameConstants.BOSS_SKILL.RING_FIRE,params:{bulletCount: 18, bulletDamage: 70, bulletSpeed: 200,interval: 1.0,bulletType:GameConstants.BULLET_TYPE.PARTICLE,isPlayerBullet:false,}},
                ]
            },
        ]

    },
       
    
};

