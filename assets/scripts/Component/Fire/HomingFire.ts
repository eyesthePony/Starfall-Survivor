import { _decorator, Node } from 'cc';
import { BaseFire } from './BaseFire';
import { GameConstants } from '../../Core/GameConstants';
import { BulletManager } from '../../Manager/BulletManager';
import { EventBus } from '../../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('HomingFire')
export class HomingFire extends BaseFire {


    private _muzzleNode: Node = null;
    
    protected onLoad(): void {
        this.interval = 0.8; // 每 0.8 秒发一颗
        this.damage = 40;    // 追踪弹单发伤害高点
        this.bulletSpeed = 400; // 追踪弹不需要太快，否则拐不过弯
        this._bulletType = GameConstants.BULLET_TYPE.HOMING;
        this.weaponType = GameConstants.BULLET_TYPE.HOMING; 
        
    }

  

    onUpgrade(cardId:string){
        if (cardId === GameConstants.CARD_ID.HOMING_DMG) {
            this.damage *= 1.5;
        }
    }

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.damage !== undefined) this.damage = params.damage;
        if (params.speed !== undefined) this.bulletSpeed = params.speed;
        if (params.interval !== undefined) this.interval = params.interval;
        if (params.isPlayerBullet !== undefined) this._isPlayerBullet = params.isPlayerBullet;
        if (params.muzzleNode !== undefined) this._muzzleNode = params.muzzleNode;
    }

    protected fire(): void {
        // 初始朝上发射，子弹会在出生后自己拐弯
        this._shootDir.set(0, 1, 0);
        const spawnPos = this._muzzleNode ? this._muzzleNode.worldPosition : this.node.worldPosition;

        BulletManager.instance.spawnBullet(
            this._bulletType, 
            this._isPlayerBullet, 
            spawnPos, 
            this._shootDir, 
            this.damage, 
            this.bulletSpeed
        );
    }
}


