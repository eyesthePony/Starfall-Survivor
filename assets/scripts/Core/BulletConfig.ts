import { GameConstants } from "./GameConstants";

// 定义子弹数据的接口
export interface BulletData {
    spriteName: string;     // 换哪张图（对应 SpriteFrame 字典 key）
    baseSpeed: number;
    baseDamage: number;
    scale?: number;
    pierceCount?: number;
}




export const BULLET_CONFIG: Record<string, BulletData> = {
    [GameConstants.BULLET_TYPE.BLUEBULLET]: {
        spriteName: "bluebullet", baseSpeed: 400, baseDamage: 100,
    },
    [GameConstants.BULLET_TYPE.YELLOWBULLET]: {
        spriteName: "yellowbullet", baseSpeed: 400, baseDamage: 100,
    },
    [GameConstants.BULLET_TYPE.LASER]: {
        spriteName: "laser", baseSpeed: 400, baseDamage: 100,
    },
    [GameConstants.BULLET_TYPE.HOMING]: {
        spriteName: "homing", baseSpeed: 400, baseDamage: 100,
    },
    [GameConstants.BULLET_TYPE.PARTICLE]: {
        spriteName: "particle", baseSpeed: 400, baseDamage: 100,
    },

}