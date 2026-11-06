
import { GameConstants } from './GameConstants';

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
    [GameConstants.ENEMY_TYPE.BASIC_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.STRAIGHT,
        spriteName: "drone_purple",
        maxHp: 20,
        speed: 100,
        damage: 30,
        expReward: 10,
        fireInterval: 1,
        bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 15,
        bulletSpeed: 220,
        dropRate: 0.1,
    },

    [GameConstants.ENEMY_TYPE.SINE_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.SINE,
        spriteName: "middle",
        maxHp: 24, speed: 130, damage: 40, expReward: 15,
        fireInterval: 1.2, bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 18, bulletSpeed: 260, dropRate: 0.12,
    },
    [GameConstants.ENEMY_TYPE.ARC_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.ARC,
        spriteName: "big",
        maxHp: 30, speed: 120, damage: 60, expReward: 20,
        fireInterval: 1.5, bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 20, bulletSpeed: 300, dropRate: 0.15,
    },
    
};