import { FormationType,SpawnPosition } from './ConfigEnums';
import { GameData } from './GameData';


export interface WaveGroup {
    category: string;        // NORMAL / BOSS
    enemyType: string;
    count: number;            //该组敌人生成数量
    spawnInterval?: number;   // 该组每种敌人生成间隔
    time: number;            // 这组怪在这波内出场时间，绝对时间
    spawnPos?: SpawnPosition;//初始位置
    startX?: number;         //坐标
    startY?: number;

    formation?: FormationType; //阵型
    formationSpacing?: number; //阵型飞机间距
}

export interface WaveData{
    groups: WaveGroup[];
    delay: number;    //这波距离上波结束多少秒开始 ，相对时间
}

export interface LevelData {
    levelId: number;
    levelName: string;
    backgroundRes: string;  // 背景图路径
    bgmRes: string;         // 背景音乐
    waves: WaveData[];
}



export const LEVELS: LevelData[] = [
     // ============================================================
    // 关卡 1：冰原边境 —— 熟悉操作，直飞为主
    // ============================================================
    {
        levelId: 1,
        levelName: "冰原边境",
        backgroundRes: '',
        bgmRes: '',
        waves: [
            // 波次1：一字长蛇（认识直飞怪）
            {
                delay: 1.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "basic_drone",
                        count: 7,
                        spawnInterval: 0,
                        time: 0,
                        formation: FormationType.LINE,
                        formationSpacing: 80,
                        startY: GameData.viewH / 2 + 50,
                    },
                ],
            },
            // 波次2：V 字 + 正弦初登场（认识侧翼）
            {
                delay: 2.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "basic_drone",
                        count: 9,
                        spawnInterval: 0,
                        time: 0,
                        formation: FormationType.VSHAPE,
                        formationSpacing: 60,
                        startY: GameData.viewH / 2 + 50,
                    },
                    {
                        category: "normal",
                        enemyType: "sine_drone",
                        count: 3,
                        spawnInterval: 0.5,
                        time: 1.5,
                        spawnPos: SpawnPosition.LEFT,
                    },
                ],
            },
            // 波次3：圆弧首次登场（认识曲线）
            {
                delay: 2.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 3,
                        spawnInterval: 0.6,
                        time: 0,
                        spawnPos: SpawnPosition.LEFT,
                    },
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 3,
                        spawnInterval: 0.6,
                        time: 0.3,
                        spawnPos: SpawnPosition.RIGHT,
                    },
                ],
            },
            // 波次4：Boss —— 吴鲸波
            {
                delay: 3.0,
                groups: [
                    {
                        category: "boss",
                        enemyType: "whale_boss",
                        count: 1,
                        time: 0,
                    },
                ],
            },
        ],
    },


    // ============================================================
    // 关卡 2：铁壁合围 —— 纯小怪高压，走位训练（无 Boss）
    // ============================================================
    {
        levelId: 2,
        levelName: "铁壁合围",
        backgroundRes: '',
        bgmRes: '',
        waves: [
            // 波次1：四面楚歌（随机边缘，四面八方来）
            {
                delay: 1.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "basic_drone",
                        count: 12,
                        spawnInterval: 0.2,
                        time: 0,
                        spawnPos: SpawnPosition.RANDOM,
                    },
                ],
            },
            // 波次2：两翼圆弧 + 中间 V 字（经典包抄）
            {
                delay: 2.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 3,
                        spawnInterval: 0.6,
                        time: 0,
                        spawnPos: SpawnPosition.LEFT,
                    },
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 3,
                        spawnInterval: 0.6,
                        time: 0.3,
                        spawnPos: SpawnPosition.RIGHT,
                    },
                    {
                        category: "normal",
                        enemyType: "basic_drone",
                        count: 5,
                        spawnInterval: 0,
                        time: 1.0,
                        formation: FormationType.VSHAPE,
                        startY: GameData.viewH / 2 + 50,
                    },
                ],
            },
            // 波次3：高速压力（冲刺 + 敢死队）
            {
                delay: 2.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "sprint_drone",
                        count: 10,
                        spawnInterval: 0.3,
                        time: 0,
                        spawnPos: SpawnPosition.TOP,
                    },
                    {
                        category: "normal",
                        enemyType: "dive_drone",
                        count: 6,
                        spawnInterval: 0.4,
                        time: 1.0,
                        spawnPos: SpawnPosition.TOP,
                    },
                ],
            },
            // 波次4：精英波次（大量圆弧两翼）—— 本关高潮
            {
                delay: 2.5,
                groups: [
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 5,
                        spawnInterval: 0.5,
                        time: 0,
                        spawnPos: SpawnPosition.LEFT,
                    },
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 5,
                        spawnInterval: 0.5,
                        time: 0,
                        spawnPos: SpawnPosition.RIGHT,
                    },
                    {
                        category: "normal",
                        enemyType: "sine_drone",
                        count: 6,
                        spawnInterval: 0.3,
                        time: 0.8,
                        spawnPos: SpawnPosition.LEFT,
                    },
                ],
            },
            // 波次5：终局高压（全类型混刷，收尾）
            {
                delay: 3.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "basic_drone",
                        count: 15,
                        spawnInterval: 0.15,
                        time: 0,
                        spawnPos: SpawnPosition.TOP,
                    },
                    {
                        category: "normal",
                        enemyType: "dive_drone",
                        count: 8,
                        spawnInterval: 0.3,
                        time: 1.0,
                        spawnPos: SpawnPosition.TOP,
                    },
                    {
                        category: "normal",
                        enemyType: "sine_drone",
                        count: 4,
                        spawnInterval: 0.4,
                        time: 1.5,
                        spawnPos: SpawnPosition.RIGHT,
                    },
                ],
            },
        ],
    },


    // ============================================================
    // 关卡 3：机械狂潮 —— 全类型混刷 + 机器 Boss
    // ============================================================
    {
        levelId: 3,
        levelName: "机械狂潮",
        backgroundRes: '',
        bgmRes: '',
        waves: [
            // 波次1：铁壁排布（9 直飞一字 + 6 正弦骚扰）
            {
                delay: 1.0,
                groups: [
                    {
                        category: "normal",
                        enemyType: "basic_drone",
                        count: 9,
                        spawnInterval: 0,
                        time: 0,
                        formation: FormationType.LINE,
                        formationSpacing: 70,
                        startY: GameData.viewH / 2 + 100,
                    },
                    {
                        category: "normal",
                        enemyType: "sine_drone",
                        count: 6,
                        spawnInterval: 0.3,
                        time: 0,
                        spawnPos: SpawnPosition.LEFT,
                    },
                ],
            },
            // 波次2：两翼圆弧包抄
            {
                delay: 1,
                groups: [
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 4,
                        spawnInterval: 0.5,
                        time: 0,
                        spawnPos: SpawnPosition.LEFT,
                    },
                    {
                        category: "normal",
                        enemyType: "arc_drone",
                        count: 4,
                        spawnInterval: 0.5,
                        time: 0,
                        spawnPos: SpawnPosition.RIGHT,
                    },
                ],
            },
            // 波次3：敢死队 + 冲刺冲锋（高速压场）
            {
                delay: 1,
                groups: [
                    {
                        category: "normal",
                        enemyType: "dive_drone",
                        count: 10,
                        spawnInterval: 0.25,
                        time: 0,
                        spawnPos: SpawnPosition.TOP,
                    },
                    {
                        category: "normal",
                        enemyType: "sprint_drone",
                        count: 12,
                        spawnInterval: 0.3,
                        time: 1.0,
                        spawnPos: SpawnPosition.TOP,
                    },
                ],
            },
            // 波次4：Boss —— 胡碟飞飞飞
            {
                delay: 1.0,
                groups: [
                    {
                        category: "boss",
                        enemyType: "machine_boss",
                        count: 1,
                        time: 0,
                    },
                ],
            },
        ],
    },


    // ============================================================
    // 关卡 4：终局审判 —— 双 Boss 连战
    // ============================================================
    {
        levelId: 4,
        levelName: "终局审判",
        backgroundRes: '',
        bgmRes: '',
        waves: [

            {
                delay: 2.0,
                groups: [
                    {
                        category: "boss",
                        enemyType: "whale_boss",
                        count: 1,
                        time: 0,
                    },
                ],
            },
        
            {
                delay: 2.0,
                groups: [
                    {
                        category: "boss",
                        enemyType: "machine_boss",
                        count: 1,
                        time: 0,
                    },
                ],
            },
        ],
    },
   
];


// ===== 无尽模式：一轮 3 波循环，打完一轮 loopCount++ 再从头刷，难度随轮回递增 =====
export const ENDLESS_LEVEL: LevelData = {
      levelId: 0,
    levelName: "星空回廊",
    backgroundRes: '',
    bgmRes: '',
    waves: [
        // 波次1：热身（一字 + 随机散怪）
        {
            delay: 1.0,
            groups: [
                {
                    category: "normal",
                    enemyType: "basic_drone",
                    count: 10,
                    spawnInterval: 0,
                    time: 0,
                    formation: FormationType.LINE,
                    formationSpacing: 70,
                    startY: GameData.viewH / 2 + 30,
                },
                {
                    category: "normal",
                    enemyType: "basic_drone",
                    count: 6,
                    spawnInterval: 0.4,
                    time: 1.0,
                    spawnPos: SpawnPosition.RANDOM,
                },
            ],
        },
        // 波次2：两翼穿插（V 字 + 双翼正弦）
        {
            delay: 1.5,
            groups: [
                {
                    category: "normal",
                    enemyType: "basic_drone",
                    count: 9,
                    spawnInterval: 0,
                    time: 0,
                    formation: FormationType.VSHAPE,
                    formationSpacing: 60,
                    startY: GameData.viewH / 2 + 50,
                },
                {
                    category: "normal",
                    enemyType: "sine_drone",
                    count: 5,
                    spawnInterval: 0.4,
                    time: 1.2,
                    spawnPos: SpawnPosition.LEFT,
                },
                {
                    category: "normal",
                    enemyType: "sine_drone",
                    count: 5,
                    spawnInterval: 0.4,
                    time: 1.2,
                    spawnPos: SpawnPosition.RIGHT,
                },
            ],
        },
        // 波次3：高压压缩（密集中路 + 侧翼骚扰）
        {
            delay: 2.0,
            groups: [
                {
                    category: "normal",
                    enemyType: "basic_drone",
                    count: 20,
                    spawnInterval: 0.1,
                    time: 0,
                    spawnPos: SpawnPosition.TOP,
                },
                {
                    category: "normal",
                    enemyType: "sine_drone",
                    count: 6,
                    spawnInterval: 0.3,
                    time: 1.0,
                    spawnPos: SpawnPosition.LEFT,
                },
            ],
        },
        // 波次4：敢死队 + 冲刺（高速压迫）
        {
            delay: 2.0,
            groups: [
                {
                    category: "normal",
                    enemyType: "dive_drone",
                    count: 15,
                    spawnInterval: 0.3,
                    time: 0,
                    spawnPos: SpawnPosition.TOP,
                },
                {
                    category: "normal",
                    enemyType: "sprint_drone",
                    count: 20,
                    spawnInterval: 0.5,
                    time: 1.0,
                    spawnPos: SpawnPosition.TOP,
                },
            ],
        },
        // 波次5：Boss —— 默认鲸鱼，代码里按 loopCount 轮换
        {
            delay: 3.0,
            groups: [
                {
                    category: "boss",
                    enemyType: "whale_boss",
                    count: 1,
                    time: 0,
                },
            ],
        },
    ],
};
