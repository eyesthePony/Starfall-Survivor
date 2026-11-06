import { GameConstants } from "./GameConstants";

// 定义子弹数据的接口
export interface BulletData {
    prefab: string,          //对应预制体，bulletmangaer根据这个判断实例化哪个预制体
    spriteName: string;     // 换哪张图（对应 SpriteFrame 字典 key）
    baseSpeed: number;
    baseDamage: number;
    scale?: number;
    pierceCount?: number;
}




export const BULLET_CONFIG: Record<string, BulletData> = {
    [GameConstants.BULLET_TYPE.BLUEBULLET]: {
       prefab:GameConstants.BULLET_PREFAB.BASE, spriteName: "bluebullet", baseSpeed: 420, baseDamage: 10,
    },
    [GameConstants.BULLET_TYPE.YELLOWBULLET]: {
        prefab:GameConstants.BULLET_PREFAB.BASE,spriteName: "yellowbullet", baseSpeed: 260, baseDamage: 10,
    },
    [GameConstants.BULLET_TYPE.LASER]: {
         prefab:GameConstants.BULLET_PREFAB.LASER,spriteName: "laser", baseSpeed: 0, baseDamage: 14,
    },
    [GameConstants.BULLET_TYPE.HOMING]: {
         prefab:GameConstants.BULLET_PREFAB.HOMING,spriteName: "homing", baseSpeed: 320, baseDamage: 12,
    },
    [GameConstants.BULLET_TYPE.PARTICLE]: {
         prefab:GameConstants.BULLET_PREFAB.BASE,spriteName: "particle", baseSpeed: 240, baseDamage: 10,
    },

}