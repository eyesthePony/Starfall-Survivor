import { EventBus } from '../Event/EventBus';
import { GameConstants } from '../Event/GameConstants';
import { SaveManager } from './SaveManager';



export class EconomyManager{

    private static _instance:EconomyManager = null;

    private _gold:number = 1000;

    private constructor() {
    }

    // 第一次调用时自动创建实例
    public static get instance(): EconomyManager {
        if (!this._instance) {
            this._instance = new EconomyManager();
        }
        return this._instance;
    }

    public init(gold: number) {
        this._gold = gold;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GOLD_CHANGED, this._gold);
    }


    public get gold(): number {
        return this._gold;
    }

    //===============金币变化类==========================
    //保存并更新ui
    addGold(amount:number){
        this._gold += amount;
        this.saveToLocal();
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GOLD_CHANGED,this._gold);
    }

    spendGold(amount:number): boolean{
        if(this._gold >= amount){
            this._gold -= amount;
            this.saveToLocal();
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GOLD_CHANGED,this._gold);
            return true;
        }else{
            return false;
        }
    }

    //===========存档类===============
    public saveToLocal() {
        SaveManager.instance.data.gold = this._gold;
        SaveManager.instance.save();
    }

    


}


