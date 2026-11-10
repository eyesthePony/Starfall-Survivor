import { Node, view, } from 'cc';

export class GameData  {

    public static selectedLevel: number = 0;      // 当前选的关
    public static unlockedLevel: number = 0;       // 解锁到第几关
    public static isEndlessMode: boolean = false; //无尽关卡

    public static playerMaxHp: number = 100; //玩家血量

    public static currentTarget: Node = null;//全局目标，子弹和敌机的子弹都可以使用这个目标来锁定

    public static viewH:number = 1280;
    public static viewW:number = 720;
    

    public static init(){
      
        const size = view.getVisibleSize(); 
        this.viewW = size.width;
        this.viewH = size.height;
    }

}

   

   
    



