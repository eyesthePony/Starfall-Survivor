import { _decorator,  Node, Vec3 } from 'cc';
import { BaseBullet } from './BaseBullet';
import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('HomingMissile')
export class HomingMissile extends BaseBullet {
    
    @property({ tooltip: "转向速度" })
    public turnSpeed: number = 5; 

    private _targetNode: Node = null;
    private _tempDir: Vec3 = new Vec3();

    private _retargetCd: number = 0; 
    

    // 接收目标，以及一个“没目标时向我求助”的回调函数
    public init(isPlayerBullet: boolean, dir: Vec3, damage: number, speed: number, startPos: Vec3,) {
        super.init(isPlayerBullet, dir, damage, speed, startPos);
        this._targetNode = null; 
    }

     // 每次需要目标的时候，发个广播
    private requestTarget() {
        if (this.playerBullet) {
            // 👈 发出请求：我的位置在哪，请把结果通过回调传给我
            EventBus.dispatchEvent(
                GameConstants.EVENT_TYPE.REQUEST_HOMING_TARGET, 
                this.node.worldPosition, 
                (target: Node) => {
                    this._targetNode = target;
                }
            );
        }
    }

    update(deltaTime: number) {
        if (this._isDead) return;

        this._retargetCd -= deltaTime;

        // 1. 如果目标死了，通过回调向 Manager 请求新目标
        if ((!this._targetNode || !this._targetNode.isValid || !this._targetNode.active) && this._retargetCd <= 0){
            this.requestTarget(); // 发广播要一个
            this._retargetCd = 0.2; // 👈 200 毫秒内只允许请求一次
        }

        // 2. 只要有了目标，就开始追踪
        if (this._targetNode) {
            const pos = this.node.worldPosition;
            const targetPos = this._targetNode.worldPosition;
            this._tempDir.set(targetPos.x - pos.x, targetPos.y - pos.y, 0);
            this._tempDir.normalize();

            const factor = this.turnSpeed * deltaTime;
            this._direction.x += (this._tempDir.x - this._direction.x) * factor;
            this._direction.y += (this._tempDir.y - this._direction.y) * factor;
            this._direction.normalize();

            const angleRad = Math.atan2(this._direction.y, this._direction.x);
            this.node.angle = (angleRad * 180 / Math.PI) - 90;
        }

        super.update(deltaTime);
    }
}


