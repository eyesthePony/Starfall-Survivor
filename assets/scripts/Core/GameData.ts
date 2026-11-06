import { Node, view,screen } from 'cc'; 

export class GameData  {

    public static selectedLevel: number = 0;      // 当前选的关
    public static unlockedLevel: number = 0;       // 解锁到第几关
    public static isEndlessMode: boolean = false; //无尽关卡

    public static playerMaxHp: number = 1000; //玩家血量

    public static currentTarget: Node = null;//全局目标，子弹和敌机的子弹都可以使用这个目标来锁定

    public static viewH:number = 1280;
    public static viewW:number = 720;
    

    public static init(){
      
         // 1. 获取引擎的设计逻辑尺寸（通常这里返回 720 x 1280）
        const size = view.getVisibleSize();

         // 2. 获取手机真实的物理屏幕比例（比如 2400 / 1080 ≈ 2.22）
        const physicalRatio = screen.windowSize.height / screen.windowSize.width;

        //3.根据比例，适应宽度
        if (physicalRatio > 1.0) {
            this.viewH = size.width * physicalRatio;
        } else {
            this.viewH = 1280; // 电脑端默认高度
        }

        // 4. 赋值
        this.viewW = size.width; 

    }

   

   
    
}


