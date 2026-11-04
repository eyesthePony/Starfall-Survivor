import { GameConstants } from "./GameConstants";

// 定义子弹数据的接口
export interface BulletData {
    baseSpeed: number;
    baseDamage: number;
    scale?: number;
    pierceCount?: number;
}




export const BULLET_CONFIG: Record<string, BulletData> = {
    [GameConstants.BULLET_TYPE.BLUEBULLET]:{baseSpeed:400, baseDamage:100},
    [GameConstants.BULLET_TYPE.HOMING]:{baseSpeed:400, baseDamage:100},
    [GameConstants.BULLET_TYPE.ICE]:{baseSpeed:400, baseDamage:100},
    [GameConstants.BULLET_TYPE.YELLOWBULLET]:{baseSpeed:400, baseDamage:100},
    [GameConstants.BULLET_TYPE.LASER]:{baseSpeed:400, baseDamage:100},
    [GameConstants.BULLET_TYPE.PARTICLE]:{baseSpeed:400, baseDamage:100},

}