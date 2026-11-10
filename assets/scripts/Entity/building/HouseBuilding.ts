import { _decorator, Component, Node } from 'cc';
import { BuildingData } from '../../Core/Config/BuildingConfig';
const { ccclass, property } = _decorator;

@ccclass('HouseBuilding')
export class HouseBuilding extends Component {
    private _data: BuildingData = null!;
    private _level: number = 1;

    // 住房提供的人口上限
    public populationCap: number = 10;

    public init(data: BuildingData, level: number, lastProduceTime: number) {
        this._data = data;
        this._level = level;
        
        // 可以根据等级算人口：比如 1 级 10 人，2 级 20 人
        this.populationCap = 10 * level;
        
        // 你可以在游戏全局（比如 GameData）里加上这个人口上限
        // GameData.totalPopulationCap += this.populationCap;
    }
    
    // 如果以后需要保存状态，可以暴露这个方法
    public getLevel(): number { return this._level; }
}


