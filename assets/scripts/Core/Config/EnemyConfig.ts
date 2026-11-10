import { GameConstants } from '../Event/GameConstants';


export interface EnemyData {

    //====小怪逻辑========
    prefabName: string;     // 选哪个 Prefab 模板

    //=====小怪图标=========
    spriteName: string;     // 换哪张图（对应 SpriteFrame 字典 key）
    scale?: number;         // 大小缩放 (可选，默认1.0)

    // === 战斗数值 ===
    maxHp: number;          // 最大血量
    speed: number;          // 移动速度
    damage: number;         // 撞击玩家造成的伤害
    expReward: number;          // 击杀后给的经验

    // === 攻击能力 ===
    bulletType?: string;    // 发射的子弹类型 (对接BulletConfig)
    fireInterval?: number;  // 开火间隔 (比如 1.5 秒)
    bulletDamage?: number;  // 子弹伤害
    bulletSpeed?:number;  //子弹速度

    // === 掉落与奖励 ===
    dropItemId?: string;    // 掉落道具ID 
    dropRate?: number;      // 掉落概率 (0 ~ 1)
}

export const ENEMY_CONFIG: Record<string, EnemyData> = {
     // 新手炮灰：直飞，低血，偶尔开火
    [GameConstants.ENEMY_TYPE.BASIC_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.STRAIGHT,
        spriteName: "drone_purple",
        maxHp: 15,       // 一枪死
        speed: 100,
        damage: 8,      // 撞击掉10血
        expReward: 15,
        fireInterval: 2.0, 
        bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 6, 
        bulletSpeed: 200,
    },

    // 游击兵：正弦横向切入，速度快
    [GameConstants.ENEMY_TYPE.SINE_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.SINE,
        spriteName: "middle",
        maxHp: 25, 
        speed: 180,      // 速度极快，抓不住
        damage: 10, 
        expReward: 25,
        fireInterval: 1.5, 
        bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 8, 
        bulletSpeed: 240, 
    },

    // 重装护卫：圆弧侧切，血厚
    [GameConstants.ENEMY_TYPE.ARC_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.ARC,
        spriteName: "big",
        maxHp: 50,       // 需要打好几枪
        speed: 80,       // 慢悠悠
        damage: 15, 
        expReward: 40,
        fireInterval: 2.5, 
        bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 10, 
        bulletSpeed: 200, 
    },
    //冲刺队
    [GameConstants.ENEMY_TYPE.SPRINT_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.STRAIGHT,
        spriteName: "drone_purple",
        maxHp: 15,       // 一枪死
        speed: 500,
        damage: 10,      // 撞击掉10血
        expReward: 20,
    },
    // 敢死队
    [GameConstants.ENEMY_TYPE.DIVE_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.DIVE, 
        spriteName: "drone_dive",
        maxHp: 10, 
        speed: 300,      // 疯狗速度
        damage: 30,      // 撞到巨痛
        expReward: 25,
        // 不填 bulletType，代码里禁言
    },
    
    
};