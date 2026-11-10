import { _decorator, Component, Vec3 } from 'cc';
import { GameConstants } from '../../Core/Event/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BaseFire')
export  class BaseFire extends Component {

    public interval: number = 1.0;   // 开火间隔（秒）

    public bulletDamage:number = 1;

    public bulletSpeed:number = 1;

    protected _timer:number = 0;

    protected _shootDir:Vec3 = new Vec3();

    protected _bulletType = GameConstants.BULLET_TYPE.BLUEBULLET;

    protected _isPlayerBullet:boolean = true;

    public weaponType: string = ''; // 武器的标签

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

    onUpgrade(cardId:string){

    }

    protected fire(){

    }

  
}


