import { _decorator, Component, Node, Vec3 } from 'cc';
import { BaseFire } from './BaseFire';
import { BulletManager } from '../../Manager/BulletManager';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('SpiralFire')
export class SpiralFire extends BaseFire {

    // 螺旋臂的数量（比如2就是交叉双螺旋，3就是三叉螺旋）
    private _arms: number = 2; 
    
    // 每次开火时，角度增加多少（决定了螺旋的旋转速度）
    private _angleStep: number = 15; 

    // 螺旋角度的累加器
    private _spiralAngle: number = 0;
  

    // 每次切换到该阶段启用时，重置角度
    onEnable() {
        super.onEnable(); // 重置父类的开火计时器
        this._spiralAngle = 0; 
    }


    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.damage !== undefined) this.damage = params.damage;
        if (params.speed !== undefined) this.bulletSpeed = params.speed;
        if(params.arms !== undefined) this._arms = params.arms;
        if(params.angleStep !== undefined) this._angleStep = params.angleStep;
        if (params.interval !== undefined) this.interval = params.interval;
    }

    protected fire(): void {
        const spawnPos = this.node.worldPosition;

        // 1. 每次开火前，基准角度增加
        this._spiralAngle += this._angleStep;
        this._spiralAngle %= 360;

        // 每个螺旋臂的相差角度（比如2臂相差180度，3臂相差120度）
        const averageArm = 360 / this._arms; 
         // 2. 根据螺旋臂数量发射
        for (let i = 0; i < this._arms; i++) {
            // 一个螺旋臂的方向角度
            const armOffset = averageArm * i;
            //根据基准角度偏移
            const angle = this._spiralAngle + armOffset;
            
            //将角度化作弧度
            const rad = angle * Math.PI / 180;
            //射击方向从（0，-1）逆时针旋转
            this._shootDir.set(Math.sin(rad), -Math.cos(rad), 0);

            BulletManager.instance.spawnBullet(
                this._bulletType, 
                false, 
                spawnPos, 
                this._shootDir, 
                this.damage, 
                this.bulletSpeed
            );
        }
    }
}


