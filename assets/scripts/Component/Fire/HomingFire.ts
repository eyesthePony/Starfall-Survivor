import { _decorator, Node, Vec3 } from 'cc';
import { BaseFire } from './BaseFire';
import { GameConstants } from '../../Core/GameConstants';
import { BulletManager } from '../../Manager/BulletManager';
const { ccclass, property } = _decorator;

@ccclass('HomingFire')
export class HomingFire extends BaseFire {


    private _muzzleNode: Node = null;
    private _homingCount: number = 1;      // 每次发射几颗追踪弹
    private _spawnSpacing: number = 30;    // 多发时的横向间隔
    private _tempVec3: Vec3 = new Vec3();  // 复用，避免每帧 new
    
    protected onLoad(): void {
        this.interval = 0.8; // 每 0.8 秒发一颗
        this._bulletType = GameConstants.BULLET_TYPE.HOMING;
        this.weaponType = GameConstants.BULLET_TYPE.HOMING; 
        
    }

  

    onUpgrade(cardId:string){
        if (cardId === GameConstants.CARD_ID.HOMING_DMG) {
            this.bulletDamage *= 1.3;
        }else if(cardId === GameConstants.CARD_ID.HOMING_UP){
            this._homingCount += 1;
        }
    }

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.bulletDamage !== undefined) this.bulletDamage = params.bulletDamage;
        if (params.bulletSpeed !== undefined) this.bulletSpeed = params.bulletSpeed;
        if (params.interval !== undefined) this.interval = params.interval;
        if (params.isPlayerBullet !== undefined) this._isPlayerBullet = params.isPlayerBullet;
        if (params.muzzleNode !== undefined) this._muzzleNode = params.muzzleNode;
    }

    protected fire(): void {
        // 初始朝上发射，子弹会在出生后自己拐弯
        this._shootDir.set(0, 1, 0);
        const basePos = this._muzzleNode ? this._muzzleNode.worldPosition : this.node.worldPosition;

        for (let i = 0; i < this._homingCount; i++) {
            // 多发时横向散开，单发时 offsetX = 0 正好居中
            const offsetX = (i - (this._homingCount - 1) / 2) * this._spawnSpacing;
            const spawnPos = this._tempVec3.set(basePos.x + offsetX, basePos.y, basePos.z);

            BulletManager.instance.spawnBullet(
                this._bulletType,
                this._isPlayerBullet,
                spawnPos,
                this._shootDir,
                this.bulletDamage,
                this.bulletSpeed
            );
        }
    }
}


