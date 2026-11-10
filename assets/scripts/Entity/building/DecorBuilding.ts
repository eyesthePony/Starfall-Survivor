import { _decorator, Component, Node } from 'cc';
import { BuildingData } from '../../Core/Config/BuildingConfig';
const { ccclass, property } = _decorator;

@ccclass('DecorBuilding')
export class DecorBuilding extends Component {
    private _data: BuildingData = null!;
    
    // 增益范围和倍率
    public auraRadius: number = 1; // 影响周围 1 格
    public auraMultiplier: number = 1.2; // 加成 20%

    public init(data: BuildingData, level: number, lastProduceTime: number) {
        this._data = data;
        // 你可以在数据表里配光环范围
        // this.auraRadius = data.auraRadius || 1;
    }

    /**
     * 当玩家把建筑放下后，呼叫周围的生产建筑，给它们打上光环 buff
     */
    public applyAura() {
       
    }
}


