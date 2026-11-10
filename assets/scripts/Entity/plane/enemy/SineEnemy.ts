import { _decorator, SpriteFrame, UITransform, Vec3 } from 'cc';
import { EnemyData } from '../../../Core/Config/EnemyConfig';
import { EventBus } from '../../../Core/Event/EventBus';
import { GameConstants } from '../../../Core/Event/GameConstants';
import { GameData } from '../../../Core/Data/GameData';
import { BaseEnemyPlane } from './BaseEnemyPlane';
const { ccclass, property } = _decorator;


const DIR_X = 1;   //方向：1从左到右，-1从右到左
const AMPLITUDE = 80;//上下摆动幅度
const FREQUENCY = 2;//角频率 rad/s
@ccclass('SineEnemy')
export class SineEnemy extends BaseEnemyPlane {
    private _phase = 0;
    private _baseY = 0;
    private _halfW = 0;
    private _leftX = 0;
    private _rightX = 0;
    private _dirX: number = 1; 

    init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame){
        super.init(cfg,position,hpMultiplier,sf);
        this._phase = 0;
        this._baseY = position.y;
        this._leftX = -GameData.viewW / 2;
        this._rightX = GameData.viewW / 2;
        this._dirX = position.x > 0 ? -1 : 1; 

        const body = this.node.getChildByName("body")?.getComponent(UITransform);
        this._halfW = (body.width / 2) * this.node.scale.x;
    }

    
    update(deltaTime: number) {
        if(this.isDead) return;
         // 执行基类update：开火计时
        super.update(deltaTime);

        this._phase += FREQUENCY * deltaTime;
        const cur = this.node.position;
        const x = cur.x + this._dirX * this.moveSpeed * deltaTime;
        const y = this._baseY + AMPLITUDE * Math.sin(this._phase);
        this.node.setPosition(x, y, cur.z);

        // 出界改判 x：越过对侧屏外 + 半宽即回收
        const out = this._dirX > 0
            ? x > this._rightX + this._halfW
            : x < this._leftX - this._halfW;
        if (out) {
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
        }
        
    }
}


