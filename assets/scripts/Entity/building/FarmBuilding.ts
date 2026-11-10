import { _decorator, Component, Node } from 'cc';
import { EconomyManager } from '../../Core/Manager/EconomyManager';
const { ccclass, property } = _decorator;

@ccclass('FarmBuilding')
export class FarmBuilding extends Component {

    @property({ tooltip: "几秒产一次钱" })
    public interval: number = 3;

    @property({ tooltip: "每次产多少钱" })
    public amount: number = 10;

    private _timer: number = 0;

    update(deltaTime: number) {
        this._timer += deltaTime;
        if (this._timer >= this.interval) {
            this._timer -= this.interval;
            EconomyManager.instance.addGold(this.amount);
        }
    }
}


