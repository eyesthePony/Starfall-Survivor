import { _decorator, Node, SpriteFrame,  Vec3 } from 'cc';
import { BaseEnemyPlane } from './BaseEnemyPlane';
import { EnemyData } from '../../../Core/EnemyConfig';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
const { ccclass, property } = _decorator;

const RADIUS = 300;        // 固定半径
const FLIP = -1;   //-1向上,1向下

@ccclass('ArcEnemy')
export class ArcEnemy extends BaseEnemyPlane {

    private _theta = 0;
    private _center = new Vec3();
    private _omega = 0;
    private _halfW = 0;
    private _swept = 0;      // 已走过的角度（弧度）

    init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame){
        super.init(cfg,position,hpMultiplier,sf);
        const isRight = position.x > 0;
        const FLIP = isRight ? 1 : -1; // 右边出生则圆弧向下凹，左边出生则向上凸
        this._center.set(position.x, position.y - FLIP * RADIUS, 0);          // 圆心(x,y加减半径);
        this._theta = FLIP*Math.PI / 2;                  // 向下飞一开始角度是90度，向上飞一开始是-90度
        this._omega = -(this.moveSpeed / RADIUS)*FLIP ;       //角速度，movespeed线速度除以半径获得，向上飞角速度正数，下负数
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

        if (this._swept >= Math.PI) {           // 走完半圈回到同侧，回收
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
        }
    }
}


