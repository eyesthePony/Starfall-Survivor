import { _decorator, Vec3 } from 'cc';
import { BaseFire } from './BaseFire';
import { BulletManager } from '../../Manager/BulletManager';
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
    }

    protected fire(): void {
        const spawnPos = this.node.worldPosition;
        const averageAngle = 360 / this._bulletCount;
        for(let i=0;i < this._bulletCount; ++i){
            const angle = averageAngle * i;
            const rad = angle * Math.PI / 180;
            this._shootDir.set(Math.sin(rad),-Math.cos(rad),0);

            BulletManager.instance.spawnBullet(this._bulletType,false,spawnPos,this._shootDir,this.damage,this.bulletSpeed);
        }
    }
}


