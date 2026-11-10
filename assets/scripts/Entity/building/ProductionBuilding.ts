import { _decorator, Component, Node } from 'cc';
import { BuildingData } from '../../Core/Config/BuildingConfig';
import { EconomyManager } from '../../Core/Manager/EconomyManager';
const { ccclass, property } = _decorator;

@ccclass('ProductionBuilding')
export class ProductionBuilding extends Component {

    private _data: BuildingData = null!;
    private _level: number = 1;
    private _lastProduceTime: number = 0;


    private _isReady: boolean = false; 
    private _readyAmount: number = 0; 


    public init(data: BuildingData,level:number, lastProduceTime:number){
        this._data = data;
        this._level = level;
        this._lastProduceTime = lastProduceTime || Date.now();
    }

    public tick(now: number = Date.now()) {
        // 如果已经成熟了，就不加时间了，直接返回（阻塞生产）
        if (this._isReady) return; 

        const lvData = this._data.levels?.[this._level - 1];
        if (!lvData) return;

        const elapsedSec = (now - this._lastProduceTime) / 1000;
        const cycles = Math.floor(elapsedSec / lvData.productionCycle);
        
        // 只要时间到了，就标记为成熟，并停止时间
        if (cycles > 0) {
            this._isReady = true;
            this._readyAmount = cycles * lvData.productionAmount;
            
            // 这里你可以发个事件，让农田头上冒出个“可收割”的感叹号气泡
            // this.node.emit("OnReadyToHarvest"); 
        }
    }


    public collect(): number {
        if (!this._isReady) return 0;

        const amount = this._readyAmount;
        
        // 重置状态，重新开始计时
        this._isReady = false;
        this._readyAmount = 0;
        this._lastProduceTime = Date.now(); // 收割完的瞬间，重新开始新一轮倒计时

        EconomyManager.instance.addGold(amount);
        return amount;
    }

    public get isReady(): boolean { return this._isReady; }
    public getLevel(): number { return this._level; }
    public getLastProduceTime(): number { return this._lastProduceTime; }
}


