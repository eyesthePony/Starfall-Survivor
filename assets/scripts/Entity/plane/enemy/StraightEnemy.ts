import { _decorator, Node, SpriteFrame, UITransform, Vec3 } from 'cc';
import { BaseEnemyPlane } from './BaseEnemyPlane';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
import { EnemyData } from '../../../Core/EnemyConfig';
const { ccclass, property } = _decorator;

@ccclass('StraightEnemy')
export class StraightEnemy extends BaseEnemyPlane {
 
    private _bottomY:number = 0;
    private _halfH:number = 0;


    
    init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame){
        super.init(cfg,position,hpMultiplier,sf);
        this._bottomY = -GameData.viewH / 2;   //底部的Y坐标
        const body = this.node.getChildByName("body")?.getComponent(UITransform);//获取body的尺寸
        this._halfH = (body.height / 2) * this.node.scale.y;
    }

    update(deltaTime: number) {
        if(this.isDead) return;
        // 执行基类update：开火计时
        super.update(deltaTime);
        /**
         * 这里使用局部坐标position来判断出界
         * 由于enemy是enemymanger子节点，position就是相对于enemymanger的坐标
         * 不过由于enemymanger对齐了canvas的坐标，所以相当于相对于canavs的坐标
         * 目前能用
         */
        const cur = this.node.position;
        const newY = cur.y - this.moveSpeed * deltaTime;
        this.node.setPosition(cur.x, newY, cur.z);

        if (newY - this._halfH < this._bottomY) {
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
            return;
        }       
    }
}


