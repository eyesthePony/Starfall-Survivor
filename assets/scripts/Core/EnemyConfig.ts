import { SpriteFrame } from 'cc';
import { GameConstants } from './GameConstants';

export interface EnemyData {

    //====小怪逻辑========
    prefabName: string;     // 选哪个 Prefab 模板

    //=====小怪图标=========
    spriteName: string;     // 换哪张图（对应 SpriteFrame 字典 key）
    scale?: number;         // 大小缩放 (可选，默认1.0)

    // === ❤️ 战斗数值 ===
    maxHp: number;          // 最大血量
    speed: number;          // 移动速度 (供移动组件读取)
    damage: number;         // 撞击玩家造成的伤害
    score: number;          // 击杀后给的分数/经验

    // === 🎯 攻击能力 (如果是会开火的小怪) ===
    bulletType?: string;    // 发射的子弹类型 (对接之前的BulletConfig)
    fireInterval?: number;  // 开火间隔 (比如 1.5 秒)
    bulletDamage?: number;  // 子弹伤害
    bulletSpeed?:number;  //子弹速度

    // === 🎁 掉落与奖励 ===
    dropItemId?: string;    // 掉落道具ID (比如 "coin_small", "hp_pack")
    dropRate?: number;      // 掉落概率 (0 ~ 1)
}

export const ENEMY_CONFIG: Record<string, EnemyData> = {
    [GameConstants.ENEMY_TYPE.BASIC_DRONE]: {
        prefabName: GameConstants.ENEMY_PREFAB.STRAIGHT,
        spriteName: "drone_purple",
        maxHp: 20,
        speed: 100,
        damage: 1,
        score: 10,
        fireInterval: 0.5,
        bulletType: GameConstants.BULLET_TYPE.YELLOWBULLET,
        bulletDamage: 1,
        bulletSpeed: 200,
        dropRate: 0.1,
    },
};