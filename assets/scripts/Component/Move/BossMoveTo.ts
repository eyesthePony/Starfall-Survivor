import { _decorator, Component, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('BossMoveTo')
export class BossMoveTo extends Component {
    
    private _startPos: Vec3 = new Vec3();
    private _targetPos: Vec3 = new Vec3();
    private _duration: number = 0.8;
    private _currentTime: number = 0;
    private _isMoving: boolean = false;

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;

        // 记录起点和终点
        this._startPos.set(this.node.position);
        this._targetPos.set(params.targetX ?? 0, params.targetY ?? 0, 0);
        this._duration = params.duration ?? 0.8;

        this._currentTime = 0;
        this._isMoving = true;
    }

    // 关键：所有的缓动都可以手写公式
    private getEaseValue(t: number): number {
        // 这里以最常用的 backOut 为例（带一点回弹）
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    update(deltaTime: number) {
        if (!this._isMoving) return;

        // 1. 累加时间
        this._currentTime += deltaTime;
        
        // 2. 计算进度 (0~1)
        let progress = Math.min(this._currentTime / this._duration, 1);

        // 3. 缓动插值
        let eased = this.getEaseValue(progress);

        // 4. 计算当前位置并赋值
        const currentX = this._startPos.x + (this._targetPos.x - this._startPos.x) * eased;
        const currentY = this._startPos.y + (this._targetPos.y - this._startPos.y) * eased;
        this.node.setPosition(currentX, currentY, 0);

        // 5. 判断是否移动完毕
        if (progress >= 1) {
            this._isMoving = false;
            this.enabled = false; // 自己把自己关掉
        }
    }
}