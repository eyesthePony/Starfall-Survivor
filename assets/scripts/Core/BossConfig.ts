import { AimMode, FireMode, TriggerMode, TurretFormation } from "./ConfigEnums";
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
    delay?: number;                  // 延迟多少秒后执行这个技能
}

export interface BossPhaseConfig {
    skills: SkillConfig[];
    loop?: boolean;       // 👈 改为布尔值：是否循环此阶段
    loopDelay?: number;   // 👈 可选：循环间隙休息几秒（默认 0.5 秒） 
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
    [GameConstants.BOSS_TYPE.MACHINE_BOSS]: {
        name:"胡杰飞飞飞",
        maxHp: 1500,
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
                    { name: GameConstants.BOSS_SKILL.SINE_MOVE, params: { amplitude: 150, frequency: 0.5 } },
                    { 
                        
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: { 
                                formation: TurretFormation.ATTACHED,
                                triggerMode: TriggerMode.AUTO,      // 原来 autoFire: true
                                aimMode: AimMode.BLIND,             // 原来 cmd: FIRE_FORWARD
                                fireMode: FireMode.VOLLEY,          // 原来没有，默认齐射
                                fireAngle: 180,
                                interval: 3,
                                damage: 10,
                                bulletSpeed: 300,
                                bulletType: GameConstants.BULLET_TYPE.NORMAL,
                                isPlayerBullet: false,              
                                turretPrefabPath: 'prefabs/Turret',
                                attachRadius: 150,     
                                orbitRadius: 250,      
                                rotateSpeed: 45,      
                                turretCount: 8,           
                                },
                    },
                ]                   

                },
                  // ================== 阶段 2：狂暴冲刺（触发 enterAimPhase） ==================
            { 
            loop: true, // 循环此阶段
            skills: [
                    // ① 0秒：停火，进入静默状态，准备冲刺
                    { name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, params: { triggerMode: TriggerMode.MANUAL }, delay: 0 },

                    // ② 0秒：Boss 冲刺到屏幕中央（耗时 0.8 秒）
                    { 
                        name: GameConstants.BOSS_SKILL.BOSSMOVETO, 
                        params: { targetX: 0, targetY: 0, duration: 0.8 }, 
                        delay: 0 
                    },

                    // ③ 0.9秒：Boss 到位后，开一发瞄准的大招！
                    // （这里留了 0.1 秒缓冲，确保 Boss 完全停稳再开枪）
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: {   
                            aimMode: AimMode.AIM, attachRadius: 90 
                                  
                                }, 
                        delay: 0.9 
                    },
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: {   
                            cmd: true, aimMode: AimMode.AIM, fireMode: FireMode.VOLLEY, damage: 50
                                  
                                }, 
                        delay: 1.5  
                    },

                    // ④：Boss 威慑完毕，开始撤退（耗时 1.0 秒）
                    { 
                        name: GameConstants.BOSS_SKILL.BOSSMOVETO, 
                        params: { targetX: 0, targetY: 400, duration: 1.0 }, 
                        delay:  2.6  
                    },

                    // ⑤ 2.6秒：撤退完毕，恢复第一阶段的向下盲射
                    { 
                        name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, 
                        params: { triggerMode: TriggerMode.AUTO,
                                    aimMode: AimMode.BLIND,      
                                    fireMode: FireMode.VOLLEY,
                                    fireAngle: 180,
                                    interval: 0.5,
                                    damage: 10, 
                                    attachRadius:150,               
                                }, 
                        delay: 2.6 
                    },
            ]                   
            },
              // ================== 阶段 3：脱离环绕，激光处刑（触发 enterOrbitPhase） ==================
            { 
            skills: [
              
                // 保持炮台队长激活
                { name: GameConstants.BOSS_SKILL.CANNON_BARRAGE, params: {
                    formation: TurretFormation.ORBITING,
                    triggerMode: TriggerMode.AUTO,
                    aimMode: AimMode.BLIND,              
                    fireMode: FireMode.SEQUENCE,      
                    rotateSpeed: 0,                    
                    seqInterval: 1,  
                    seqGap: 2,                   
                    damage: 10,                        
                    bulletSpeed: 300,
                    isPlayerBullet: false,
                    followTarget: false, // 不跟随，位置用快照中心，只更新炮口
                    bulletType: GameConstants.BULLET_TYPE.LASER, // 激光
                    orbitRadius:200, // 环绕半径
                    
                } }, 
            ]                   
            },
        ]
    },
    
};

