import { _decorator,  Node, SpriteFrame, UITransform, Vec3 } from 'cc';
import { BaseEnemyPlane } from './BaseEnemyPlane';
import { GameData } from '../../../Core/GameData';
import { EnemyData } from '../../../Core/EnemyConfig';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
const { ccclass, property } = _decorator;


const DIR_X = 1;   //方向：1从左到右，-1从右到左
const AMPLITUDE = 80;//上下摆动幅度
const FREQUENCY = 2;//角频率 rad/s
@ccclass('SineEnemy')
export class SineEmemy extends BaseEnemyPlane {
    private _phase = 0;
    private _baseY = 0;
    private _halfW = 0;
    private _leftX = 0;
    private _rightX = 0;

    init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame){
        super.init(cfg,position,hpMultiplier,sf);
        this._phase = 0;
        this._baseY = position.y;
        this._leftX = -GameData.viewW / 2;
        this._rightX = GameData.viewW / 2;

        const body = this.node.getChildByName("body")?.getComponent(UITransform);
        this._halfW = (body.width / 2) * this.node.scale.x;
    }

    
    update(deltaTime: number) {
        if(this.isDead) return;
         // 执行基类update：开火计时
        super.update(deltaTime);

        this._phase += FREQUENCY * deltaTime;
        const cur = this.node.position;
        const x = cur.x + DIR_X * this.moveSpeed * deltaTime;
        const y = this._baseY + AMPLITUDE * Math.sin(this._phase);
        this.node.setPosition(x, y, cur.z);

        // 出界改判 x：越过对侧屏外 + 半宽即回收
        const out = DIR_X > 0
            ? x > this._rightX + this._halfW
            : x < this._leftX - this._halfW;
        if (out) {
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
        }
        
    }
}


