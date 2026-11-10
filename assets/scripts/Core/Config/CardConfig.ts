import { GameConstants } from "../Event/GameConstants";

// 定义一张卡牌的数据结构
export interface CardConfigData {
    id: string;          // 唯一标识，用于逻辑判断
    name: string;        // 卡牌名字（给UI显示）
    desc: string;        // 卡牌描述（给UI显示）
    maxLevel?: number;   // (可选) 这个强化最多能选几次，如果不填默认无限
    iconIndex?:number;   //卡牌图标
    requireWeapon?: string;
    type: typeof GameConstants.CARD_TYPE[keyof typeof GameConstants.CARD_TYPE]; 
    targetWeapon?: string;  // 这张卡是给谁用的？
}

// 定义所有的卡片池
export const CARD_CONFIG:CardConfigData[] = [
    //============== 普通子弹强化卡 ==============
    // 伤害强化
    {
        id:  GameConstants.CARD_ID.DMG_UP,
        name: '强力大奎',
        desc: '由于昊天帮助，奎来伤害 +30%',
        maxLevel:5,
        iconIndex:0,
        type: GameConstants.CARD_TYPE.STAT,
    },
    // 射速强化
    {
        id: GameConstants.CARD_ID.SPD_UP,
        name: '快速奎来肘击',
        desc: '由于胡碟的帮忙，奎来肘击间隔  -20%',
        maxLevel: 3, 
        iconIndex:1,
        type: GameConstants.CARD_TYPE.STAT,
    },
    {
        id: GameConstants.CARD_ID.BULLET_UP,
        name: '奎子充足',
        desc: '奎来得到羊风翼帮助，每次多发射1奎子',
        maxLevel: 4, 
        iconIndex:2,
        type: GameConstants.CARD_TYPE.STAT,
    },
    {
        id: GameConstants.CARD_ID.MOVE_UP,
        name: '兵奎神速',
        desc: '奎来得到武金箔帮助，奎子飞行速度+30%',
        maxLevel: 5,
        iconIndex:3,
        type: GameConstants.CARD_TYPE.STAT,
    },
    // ============== 武器获得卡 ==============
    {
        id: GameConstants.CARD_ID.LASER,
        name: '激光打奎',
        desc: '奎来得到顶针帮助，奎子能发射激光',
        maxLevel: 1, 
        type: GameConstants.CARD_TYPE.WEAPON,
        targetWeapon: GameConstants.BULLET_TYPE.LASER,
    },
    {
        id: GameConstants.CARD_ID.HOMING_MISSILE,
        name: '奎眼盯真',
        desc: '由于仗皆灰的帮助，奎来获得追踪弹',
        maxLevel: 1, 
        type: GameConstants.CARD_TYPE.WEAPON,
        targetWeapon: GameConstants.BULLET_TYPE.HOMING,

    },
     // ============== 激光强化卡 ==============
    { id: GameConstants.CARD_ID.LASER_DMG, 
        name: '激光增幅', 
        desc: '激光伤害 +30%', 
        maxLevel: 3, 
        requireWeapon: GameConstants.CARD_ID.LASER, 
        type: GameConstants.CARD_TYPE.UPGRADE,
        targetWeapon: GameConstants.BULLET_TYPE.LASER,
    },
    { id: GameConstants.CARD_ID.LASER_CD, 
        name: '光速冷却', 
        desc: '激光开火间隔-15%', 
        maxLevel: 3, 
        iconIndex:1,
        requireWeapon: GameConstants.CARD_ID.LASER, 
        type: GameConstants.CARD_TYPE.UPGRADE,
        targetWeapon: GameConstants.BULLET_TYPE.LASER,
    },

    // ============== 追踪弹强化卡 ==============
    { id: GameConstants.CARD_ID.HOMING_DMG, 
        name: '高爆弹头', 
        desc: '追踪导弹伤害 +30%', 
        maxLevel: 3, 
        requireWeapon:GameConstants.CARD_ID.HOMING_MISSILE, 
        type: GameConstants.CARD_TYPE.UPGRADE,
        targetWeapon: GameConstants.BULLET_TYPE.HOMING,
     },
     { id: GameConstants.CARD_ID.HOMING_UP, 
        name: '奎来66', 
        desc: '给奎来补个弹，追踪导弹+1', 
        maxLevel: 3, 
        iconIndex:2,
        requireWeapon:GameConstants.CARD_ID.HOMING_MISSILE, 
        type: GameConstants.CARD_TYPE.UPGRADE,
        targetWeapon: GameConstants.BULLET_TYPE.HOMING,
     },

    
];

