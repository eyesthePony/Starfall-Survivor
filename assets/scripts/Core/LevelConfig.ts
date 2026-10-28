
import { GameConstants } from "./GameConstants";


export interface WaveData{
    category:string;
    enemyType:string;
    count:number;
    delay: number;    //这波游戏开始多少秒出现
    spawnInterval: number;  // 这波怪里，每只怪刷新的间隔     
}

export interface LevelData {
    levelId: number;
    levelName: string;
    backgroundRes: string;  // 背景图路径
    bgmRes: string;         // 背景音乐
    waves: WaveData[];
}


export const LEVELS: LevelData[] = [
    {
        levelId:1,
        levelName: "冰原边境",
        backgroundRes: '',  
        bgmRes: '',      
        waves: [
           // 游戏开始后 1 秒开始，刷 3 个，每 0.5 秒刷一个
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 3, delay: 1.0, spawnInterval: 0.5 },
            // 上一波结束后  0.8 秒开始，刷 5 个，每 0.3 秒刷一个
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 4, delay: 0.8, spawnInterval: 0.3 },
            // 上一波结束后  0.8 秒开始，刷 8 个，每 0.1 秒刷一个（密集阵）
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 5, delay: 0.8, spawnInterval: 0.1 },
            { category:GameConstants.ENEMY_CATEGORY.BOSS,enemyType: GameConstants.BOSS_TYPE.ICE_BOSS, count: 1, delay: 2.0, spawnInterval: 0},
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 15, delay: 0.8, spawnInterval: 0.1 },
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 25, delay: 0.8, spawnInterval: 0.1 },
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 35, delay: 0.8, spawnInterval: 0.1 },
            { category:GameConstants.ENEMY_CATEGORY.NORMAL,enemyType: GameConstants.ENEMY_TYPE.NORMAL, count: 45, delay: 0.8, spawnInterval: 0.1 },
            { category:GameConstants.ENEMY_CATEGORY.BOSS,enemyType: GameConstants.BOSS_TYPE.ICE_BOSS, count: 1, delay: 2.0, spawnInterval: 0},
        ],
    },
    {
        levelId:2,
        levelName: "冰原边境",
        backgroundRes: '',  
        bgmRes: '',      
        waves: [
            {category:GameConstants.ENEMY_CATEGORY.BOSS, enemyType: GameConstants.BOSS_TYPE.ICE_BOSS, count: 1, delay: 0, spawnInterval: 0},
        ],
    }
];


