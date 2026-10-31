import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BaseFire')
export  class BaseFire extends Component {

    public interval: number = 1.0;   // 开火间隔（秒）

    public damage:number = 100;

    public bulletSpeed:number = 150;

    protected _timer:number = 0;

    protected _shootDir:Vec3 = new Vec3();

    protected _bulletType = GameConstants.BULLET_TYPE.NORMAL;

    public reset(): void {
        this._timer = 0;
    }

    update(deltaTime: number) {
        this._timer += deltaTime;
        if (this._timer >= this.interval) {
            this._timer -= this.interval;   // ← 保留超出部分，不丢帧
            this.fire();
        }
    }

    protected fire(){

    }
}


