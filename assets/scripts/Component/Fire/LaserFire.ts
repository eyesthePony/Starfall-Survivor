import { _decorator, Component, Node, Vec3 } from 'cc';
import { BaseFire } from './BaseFire';
import { BulletManager } from '../../Manager/BulletManager';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('LaserFire')
export class LaserFire extends BaseFire {

    // 激光默认朝上 (给玩家用)
    // 如果是 Boss 用，在 applyConfig 里把角度改成 180 即可
    private _baseAngle: number = 0;
    private _spawnPos:Vec3 = null;
     // 记录枪口节点
    private _muzzleNode: Node = null; 

    protected onLoad(): void {
        this.interval = 1.2; 
        this.damage = 20;    
        this._bulletType = GameConstants.BULLET_TYPE.LASER; // 你的枚举
    }

    public reset() {
        super.reset();
        
    }

    // 适配你的 Boss 架构（如果你以后想让 Boss 也能射激光）
    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.damage !== undefined) this.damage = params.damage;
        if (params.interval !== undefined) this.interval = params.interval;
        if (params.baseAngle !== undefined) this._baseAngle = params.baseAngle;
        if(params.spawnPos !== undefined)this._spawnPos = params.spawnPos;
        if (params.muzzleNode !== undefined) this._muzzleNode = params.muzzleNode; 
    }

    

    protected fire(): void {
        // 2. 计算方向。默认朝上(0,1)，可通过 _baseAngle 调整（比如 Boss 朝下就是 180）
        const rad = this._baseAngle * Math.PI / 180;
        this._shootDir.set(Math.sin(rad), Math.cos(rad), 0);

        // 3. 发射激光
        BulletManager.instance.spawnBullet(
            this._bulletType, 
            true,               // 👈 传 true 表示这是玩家子弹（Boss用就改为 false）
            this._spawnPos, 
            this._shootDir, 
            this.damage, 
            0 ,                 // 激光速度传 0 即可
            this._muzzleNode,
        );
    }
}