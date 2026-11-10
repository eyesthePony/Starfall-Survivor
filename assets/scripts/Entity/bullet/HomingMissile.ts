import { _decorator, Node, SpriteFrame, Vec3 } from 'cc';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';
import { BaseBullet } from './BaseBullet';
const { ccclass, property } = _decorator;

@ccclass('HomingMissile')
export class HomingMissile extends BaseBullet {
    
    @property({ tooltip: "转向速度" })
    public turnSpeed: number = 8; 

    private _targetNode: Node = null;
    private _tempDir: Vec3 = new Vec3();
    private _retargetCd: number = 0; 

    public init(isPlayerBullet: boolean, dir: Vec3, damage: number, speed: number, startPos: Vec3, sf: SpriteFrame) {
        super.init(isPlayerBullet, dir, damage, speed, startPos, sf);
        this._targetNode = null; 
        this._retargetCd = 0; 
    }

    private requestTarget() {
        if (this.playerBullet) {
            EventBus.dispatchEvent(
                GameConstants.EVENT_TYPE.REQUEST_HOMING_TARGET, 
                this.node.position, 
                (target: Node) => {
                    if (target && target.isValid && target.active) {
                        this._targetNode = target;
                    } else {
                        this._targetNode = null;
                    }
                }
            );
        }
    }

    update(deltaTime: number) {
        if (this._isDead) return; 
        super.update(deltaTime);

        this._retargetCd -= deltaTime;

        if (this._targetNode && (!this._targetNode.isValid || !this._targetNode.active)) {
            this._targetNode = null;
        }

        if (!this._targetNode && this._retargetCd <= 0) {
            this.requestTarget(); 
            this._retargetCd = 0.1; 
        }

        if (this._targetNode) {
            const myPos = this.node.position;
            const targetPos = this._targetNode.position;
            
            this._tempDir.set(targetPos.x - myPos.x, targetPos.y - myPos.y, 0);

    
            // 如果目标跑到子弹下方去了（哪怕是稍微偏下），立刻无情抛弃！
            if (this._tempDir.y < 0) {
                this._targetNode = null;
            } 
            else if (this._tempDir.lengthSqr() > 100) {
                this._tempDir.normalize();

                const factor = Math.min(this.turnSpeed * deltaTime, 1);
                
                this._direction.x += (this._tempDir.x - this._direction.x) * factor;
                this._direction.y += (this._tempDir.y - this._direction.y) * factor;
            }
        }
        
        // 子弹保持当前惯性飞行，计算角度
        this._direction.normalize();
        const angleRad = Math.atan2(this._direction.y, this._direction.x);
        this.node.angle = (angleRad * 180 / Math.PI) - 90;
    }
}