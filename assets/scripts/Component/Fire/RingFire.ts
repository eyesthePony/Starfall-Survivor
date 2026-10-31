import { _decorator, Vec3 } from 'cc';
import { BaseFire } from './BaseFire';
import { BulletManager } from '../../Manager/BulletManager';
import { DirTable } from '../../Core/MathUtils';
const { ccclass, property } = _decorator;



@ccclass('RingFire')
export class RingFire extends BaseFire{
    

    private _bulletCount:number = 12;

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.bulletCount !== undefined) this._bulletCount = params.bulletCount;
        if (params.damage !== undefined) this.damage = params.damage;
        if (params.speed !== undefined) this.bulletSpeed = params.speed;
        if (params.interval !== undefined) this.interval = params.interval;
        if(params.isPlayerBullet !== undefined)this._isPlayerBullet = params.isPlayerBullet;
    }

    protected fire(): void {
        const spawnPos = this.node.worldPosition;
        const averageAngle = 360 / this._bulletCount;
        for(let i=0;i < this._bulletCount; ++i){
            const angle = averageAngle * i;
            const idx = Math.floor(angle) % 360;
            this._shootDir.set(DirTable[idx].x, DirTable[idx].y, 0);

            BulletManager.instance.spawnBullet(this._bulletType,
                this._isPlayerBullet,spawnPos,this._shootDir,this.damage,this.bulletSpeed);
        }
    }
}


