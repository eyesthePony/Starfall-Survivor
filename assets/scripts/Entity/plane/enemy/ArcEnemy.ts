import { _decorator, Node, SpriteFrame,  Vec3 } from 'cc';
import { BaseEnemyPlane } from './BaseEnemyPlane';
import { EnemyData } from '../../../Core/EnemyConfig';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
const { ccclass, property } = _decorator;

const RADIUS = 300;        // 固定半径


@ccclass('ArcEnemy')
export class ArcEnemy extends BaseEnemyPlane {

    private _theta = 0;
    private _center = new Vec3();
    private _omega = 0;

    private _swept = 0;      // 已走过的角度（弧度）

    init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame){
        super.init(cfg,position,hpMultiplier,sf);
        const isRight = position.x > 0;
        const FLIP = isRight ? 1 : -1; 
        this._center.set(position.x, position.y + RADIUS, 0);        
        this._theta = -Math.PI / 2;                  
        this._omega = -(this.moveSpeed / RADIUS)*FLIP ;     
        this._swept = 0;

    }

    update(deltaTime: number) {
        if (this.isDead) return;
        super.update(deltaTime);

        const dTheta = this._omega * deltaTime; //这一帧走的角度增量
        this._theta += dTheta;                 //角度变化
        this._swept += Math.abs(dTheta);  //已经走过的角度，走完180度回收

        //极坐标算x，y
        const x = this._center.x + RADIUS * Math.cos(this._theta);
        const y = this._center.y + RADIUS * Math.sin(this._theta);
        this.node.setPosition(x, y, 0);
        const halfW = GameData.viewW / 2;
        const halfH = GameData.viewH / 2;
        if (x < -halfW - 100 || x > halfW + 100 || y < -halfH - 100 || y > halfH + 100) {
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
            return;
        }
        if (this._swept >= Math.PI) {           // 走完半圈回到同侧，回收
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
        }
    }
}


