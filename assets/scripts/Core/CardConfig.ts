import { GameConstants } from "./GameConstants";

// 定义一张卡牌的数据结构
export interface CardConfigData {
    id: string;          // 唯一标识，用于逻辑判断
    name: string;        // 卡牌名字（给UI显示）
    desc: string;        // 卡牌描述（给UI显示）
    maxLevel?: number;   // (可选) 这个强化最多能选几次，如果不填默认无限
}

// 定义所有的卡片池
export const CARD_CONFIG:CardConfigData[] = [
    // 伤害强化
    {
        id:  GameConstants.CARD_ID.DMG_UP,
        name: '强力大奎头',
        desc: '由于黄昊天帮助，唐奎伤害 +100',
    },
    // 射速强化
    {
        id: GameConstants.CARD_ID.SPD_UP,
        name: '快速唐奎肘击',
        desc: '由于胡杰的帮忙，唐奎肘击间隔 -15%',
        maxLevel: 5, // 假设射速最多强化 5 次
    },
    {
        id: GameConstants.CARD_ID.BULLET_UP,
        name: '奎子充足',
        desc: '唐奎得到杨丰屹帮助，每次多发射2奎子',
        maxLevel: 5, // 假设射速最多强化 5 次
    }
    
];

