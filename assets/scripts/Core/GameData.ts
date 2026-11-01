import { Node } from 'cc'; 

export class GameData  {
    static selectedLevel: number = 0;      // 当前选的关
    static unlockedLevel: number = 0;       // 解锁到第几关
    public static isEndlessMode: boolean = false; //无尽关卡

    //屏幕尺寸
    static screenWidth: number = 720;
    static screenHeight: number = 1280;

    static playerMaxHp: number = 5; //玩家血量

    public static currentTarget: Node = null;//全局目标，子弹和敌机的子弹都可以使用这个目标来锁定
    
}


