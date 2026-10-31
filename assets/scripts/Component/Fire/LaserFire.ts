import { _decorator, Node, } from 'cc';
import { BaseFire } from './BaseFire';
import { BulletManager } from '../../Manager/BulletManager';
import { GameConstants } from '../../Core/GameConstants';
import { EventBus } from '../../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('LaserFire')
export class LaserFire extends BaseFire {

    // 激光默认朝上 (给玩家用)
    // 如果是 Boss 用，在 applyConfig 里把角度改成 180 即可
    private _baseAngle: number = 0;
     // 记录枪口节点
    private _muzzleNode: Node = null; 

    protected onLoad(): void {
        this.interval = 1.2; 
        this.damage = 20;    
        this._bulletType = GameConstants.BULLET_TYPE.LASER;
        this.weaponType = GameConstants.BULLET_TYPE.LASER; 

    }



    onUpgrade(cardId:string){
        if (cardId === GameConstants.CARD_ID.LASER_DMG) {
            this.damage *= 1.5;
        }else if(cardId === GameConstants.CARD_ID.LASER_CD){
            this.interval *= 0.8;
            
        }
    }

    public reset() {
        super.reset();
        
    }

    
    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.damage !== undefined) this.damage = params.damage;
        if (params.interval !== undefined) this.interval = params.interval;
        if (params.baseAngle !== undefined) this._baseAngle = params.baseAngle;
        if (params.muzzleNode !== undefined) this._muzzleNode = params.muzzleNode; 
        if(params.isPlayerBullet !== undefined)this._isPlayerBullet = params.isPlayerBullet;
    }

    

    protected fire(): void {
        // 2. 计算方向。默认朝上(0,1)，可通过 _baseAngle 调整（比如 Boss 朝下就是 180）
        const rad = this._baseAngle * Math.PI / 180;
        this._shootDir.set(Math.sin(rad), Math.cos(rad), 0);
        const spawnPos = this._muzzleNode.worldPosition;

        // 3. 发射激光
        BulletManager.instance.spawnBullet(
            this._bulletType, 
            this._isPlayerBullet,               
            spawnPos, 
            this._shootDir, 
            this.damage, 
            0 ,                 // 激光速度传 0 即可
            this._muzzleNode,
        );
    }
}