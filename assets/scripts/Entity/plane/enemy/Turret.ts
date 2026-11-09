import { _decorator, Component, Node, Vec3 } from 'cc';
import { BulletManager } from '../../../Manager/BulletManager';
import { DirTable } from '../../../Core/MathUtils';
const { ccclass } = _decorator;

@ccclass('Turret')
export class Turret extends Component {
    
    // 性能缓存：防止在计算时频繁 new Vec3
    private _tempDir: Vec3 = new Vec3();


    /**
     * 指令 1：转动炮管，瞄准某个世界坐标
     * @param targetPos 目标的世界坐标（比如玩家位置）
     */
    public aimAt(targetPos: Vec3,dt: number = 0,aimSpeed: number = 0) {
        const myPos = this.node.worldPosition;
        // 计算指向目标的单位向量
        this._tempDir.set(targetPos.x - myPos.x, targetPos.y - myPos.y, 0).normalize();
        
        // 计算角度：atan2 算出来是数学角，减去 90 度适配美术素材默认朝上
        const  targetAngle = Math.atan2(this._tempDir.y, this._tempDir.x) * 180 / Math.PI - 90;
        if (aimSpeed <= 0 || dt === 0) {
            this.node.angle = targetAngle;
            return;
        }

        // --- 以下为平滑旋转逻辑 ---
        let currentAngle = this.node.angle;
        
        // 1. 算出当前角度和目标角度的差值
        let diff = targetAngle - currentAngle;
        
        // 2. 将差值归一化到 [-180, 180] 之间，保证走最短路线（防止 359 度直接转回 1 度）
        diff = ((diff + 180) % 360 + 360) % 360 - 180;
        
        // 3. 算出这一帧最多能转多少度
        const maxStep = aimSpeed * dt;
        
        // 4. 如果差值在允许的步长内，直接对准；否则只转 maxStep 的幅度
        if (Math.abs(diff) <= maxStep) {
            this.node.angle = targetAngle;
        } else {
            this.node.angle += Math.sign(diff) * maxStep;
        }
    }

    /**
     * 指令 2：沿着当前炮管朝向，发射一颗子弹
     * @param damage 伤害
     * @param bulletType 子弹类型（如 NORMAL, LASER）
     * @param speed 飞行速度
     * @param isPlayerBullet 是否属于玩家阵营（默认 false 敌人）
     */
    public fire(damage: number, bulletType: string, speed: number, isPlayerBullet: boolean = false) {
        const myPos = this.node.worldPosition;
        
        // 根据当前节点的旋转角度，算出开火方向
        const deg = ((Math.round(this.node.angle) + 180) % 360 + 360) % 360;
        const d = DirTable[deg];
        this._tempDir.set(d.x, d.y, 0);   // 已经是单位向量，不用 normalize
        // 呼叫军火库生成子弹
        BulletManager.instance.spawnBullet(
            bulletType, 
            isPlayerBullet, 
            myPos, 
            this._tempDir, 
            damage, 
            speed,
            this.node,
        );
    }


    /**
     * 扇形散射：以当前炮口朝向为中心，向左右均匀散开 count 颗子弹
     * @param count       每次散射几颗（<=1 时退化成普通 fire）
     * @param spreadAngle 扇形总角度（度），如 30 表示左右各 15°
     */
    public fireSpread(
        damage: number,
        bulletType: string,
        speed: number,
        isPlayerBullet: boolean = false,
        count: number = 1,
        spreadAngle: number = 0
    ) {
        // 单发 / 无角度 → 直接走老逻辑
        if (count <= 1 || spreadAngle <= 0) {
            this.fire(damage, bulletType, speed, isPlayerBullet);
            return;
        }

        const myPos = this.node.worldPosition;
        // 与 fire() 保持一致：炮口朝向 = node.angle + 180
        const baseDeg = this.node.angle + 180;
        const start = baseDeg - spreadAngle / 2;
        const step = spreadAngle / (count - 1);

        for (let i = 0; i < count; i++) {
            let deg = Math.round(start + step * i);
            deg = ((deg % 360) + 360) % 360;   // 归一到 0~359
            const d = DirTable[deg];
            this._tempDir.set(d.x, d.y, 0);

            BulletManager.instance.spawnBullet(
                bulletType, isPlayerBullet, myPos,
                this._tempDir, damage, speed, this.node
            );
        }
    }

    
}