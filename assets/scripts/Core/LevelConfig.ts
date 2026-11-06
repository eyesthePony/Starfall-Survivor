


export interface WaveGroup {
    category: string;        // NORMAL / BOSS
    enemyType: string;
    count: number;            //该组敌人生成数量
    spawnInterval?: number;   // 该组每种敌人生成间隔
    time: number;            // 这组怪在这波内出场时间，绝对时间
    spawnPos?: "top" | "left" | "right" | "random";//初始位置
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
    {
        levelId:1,
        levelName: "冰原边境",
        backgroundRes: '',
        bgmRes: '',
        // 教学小高潮，约 2~3 分钟，3 波：炮灰热身 → 骚扰引入 → 小 Boss
        waves: [
            //第1波：炮灰海热身，成群入场一扫一片
            {
                delay: 1.0,
                groups: [
                    { category: "normal", enemyType: 'basic_drone', count: 14, spawnInterval: 0.16, time: 0,   spawnPos: "top" },
                ],
            },
            //第2波：直飞补压 + 左侧正弦骚扰
            {
                delay: 1.5,
                groups: [
                    { category: "normal", enemyType: 'basic_drone', count: 10, spawnInterval: 0.18, time: 0,   spawnPos: "top" },
                    { category: "normal", enemyType: 'sine_drone',  count: 5,  spawnInterval: 0.45, time: 0.8, spawnPos: "left" },
                ],
            },
            //第3波：小 Boss 高潮，圆弧侧面暖场，错开 Boss 开场
            {
                delay: 2.0,
                groups: [
                    { category: "boss",   enemyType: 'whale_boss', count: 1, time: 0,   spawnPos: "top" },
                    { category: "normal", enemyType: 'arc_drone',  count: 3, spawnInterval: 0.70, time: 1.5, spawnPos: "right" },
                ],
            },
        ]
    },
    {
        levelId:2,
        levelName: "战争",
        backgroundRes: '',
        bgmRes: '',
        // 双侧包围潮水，约 3~4 分钟，3 波：中路压场 → 右路回切 → 收尾混编
        waves: [
            //第1波：直飞中路炮灰海 + 左侧正弦骚扰
            {
                delay: 1.0,
                groups: [
                    { category: "normal", enemyType: 'basic_drone', count: 18, spawnInterval: 0.15, time: 0,   spawnPos: "top" },
                    { category: "normal", enemyType: 'sine_drone',  count: 6,  spawnInterval: 0.40, time: 0.8, spawnPos: "left" },
                ],
            },
            //第2波：右侧正弦回切 + 直飞增援
            {
                delay: 2.0,
                groups: [
                    { category: "normal", enemyType: 'sine_drone',  count: 8,  spawnInterval: 0.40, time: 0,   spawnPos: "right" },
                    { category: "normal", enemyType: 'basic_drone', count: 12, spawnInterval: 0.16, time: 0.5, spawnPos: "top" },
                ],
            },
            //第3波：直飞收尾压场 + 右侧正弦穿插
            {
                delay: 2.0,
                groups: [
                    { category: "normal", enemyType: 'basic_drone', count: 10, spawnInterval: 0.16, time: 0,   spawnPos: "top" },
                    { category: "normal", enemyType: 'sine_drone',  count: 6,  spawnInterval: 0.45, time: 1.0, spawnPos: "right" },
                ],
            },
        ],
    },
    {
        levelId:3,
        levelName: "冰原边境·深入",
        backgroundRes: '',
        bgmRes: '',
        // 贴身切入挑战，约 3~4 分钟，3 波：圆弧左切 → 右侧穿插 → 收尾混编，无 Boss
        waves: [
            //第1波：圆弧左侧切入 + 直飞压场
            {
                delay: 1.0,
                groups: [
                    { category: "normal", enemyType: 'arc_drone',   count: 7,  spawnInterval: 0.60, time: 0,   spawnPos: "left" },
                    { category: "normal", enemyType: 'basic_drone', count: 12, spawnInterval: 0.16, time: 0.5, spawnPos: "top" },
                ],
            },
            //第2波：圆弧右侧切入 + 正弦右侧穿插
            {
                delay: 2.0,
                groups: [
                    { category: "normal", enemyType: 'arc_drone',   count: 6, spawnInterval: 0.60, time: 0,   spawnPos: "right" },
                    { category: "normal", enemyType: 'sine_drone', count: 7, spawnInterval: 0.35, time: 0.8, spawnPos: "right" },
                ],
            },
            //第3波：左侧圆弧 + 直飞 + 右侧正弦收尾混编
            {
                delay: 2.0,
                groups: [
                    { category: "normal", enemyType: 'arc_drone',   count: 5,  spawnInterval: 0.55, time: 0,   spawnPos: "left" },
                    { category: "normal", enemyType: 'basic_drone', count: 10, spawnInterval: 0.18, time: 0.5, spawnPos: "top" },
                    { category: "normal", enemyType: 'sine_drone',  count: 6,  spawnInterval: 0.40, time: 1.0, spawnPos: "right" },
                ],
            },
        ],
    },
    {
        levelId:4,
        levelName: "机械要塞",
        backgroundRes: '',
        bgmRes: '',
        // 混编大潮 + 终局 Boss，约 5~7 分钟，3 波：大潮压场 → 贴身压制 → Machine 终局战
        waves: [
            //第1波：最大炮灰海 + 全方向正弦混编
            {
                delay: 1.0,
                groups: [
                    { category: "normal", enemyType: 'basic_drone', count: 22, spawnInterval: 0.15, time: 0,   spawnPos: "top" },
                    { category: "normal", enemyType: 'sine_drone',  count: 8,  spawnInterval: 0.40, time: 0.8, spawnPos: "random" },
                ],
            },
            //第2波：圆弧贴身 + 右侧正弦压制
            {
                delay: 2.0,
                groups: [
                    { category: "normal", enemyType: 'arc_drone',   count: 8, spawnInterval: 0.55, time: 0,   spawnPos: "left" },
                    { category: "normal", enemyType: 'sine_drone', count: 6, spawnInterval: 0.45, time: 1.0, spawnPos: "right" },
                ],
            },
            //第3波：Boss 前暖场攒经验，随后 Machine 终局入场
            {
                delay: 2.5,
                groups: [
                    { category: "normal", enemyType: 'basic_drone', count: 8, spawnInterval: 0.18, time: 0,   spawnPos: "top" },
                    { category: "boss",   enemyType: 'machine_boss', count: 1, time: 1.0, spawnPos: "top" },
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
        //第1波：炮灰大潮 + 全方向正弦骚扰
        {
            delay: 1.5,
            groups: [
                { category: "normal", enemyType: 'basic_drone', count: 16, spawnInterval: 0.16, time: 0,   spawnPos: "top" },
                { category: "normal", enemyType: 'sine_drone',  count: 6,  spawnInterval: 0.40, time: 0.8, spawnPos: "random" },
            ],
        },
        //第2波：圆弧左侧切入 + 右侧正弦穿插
        {
            delay: 2.0,
            groups: [
                { category: "normal", enemyType: 'arc_drone',   count: 6, spawnInterval: 0.60, time: 0,   spawnPos: "left" },
                { category: "normal", enemyType: 'sine_drone', count: 6, spawnInterval: 0.40, time: 1.0, spawnPos: "right" },
            ],
        },
        //第3波：暖场小怪 + Boss（Boss 由 WaveManager 按 loopCount 取模轮换 whale / machine）
        {
            delay: 2.5,
            groups: [
                { category: "normal", enemyType: 'basic_drone', count: 6, spawnInterval: 0.20, time: 0,   spawnPos: "top" },
                { category: "boss",   enemyType: 'whale_boss', count: 1, time: 1.0, spawnPos: "top" },
            ],
        },
    ],
};
