import { _decorator, Component, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('BossEnterMove')
export class BossEnterMove extends Component {

    private _duration = 2;
    private _time = 0;
    private _startPos = new Vec3();
    private _targetPos = new Vec3();
    private _onComplete: (() => void) | null = null;

    public play(duration: number, target: Vec3, onComplete: () => void) {
        this._duration = duration;
        this._time = 0;
        this._startPos.set(this.node.position);
        this._targetPos.set(target);
        this._onComplete = onComplete;
        this.enabled = true;
    }

    update(dt: number) {
        this._time += dt;
        const ratio = Math.min(this._time / this._duration, 1);
        const eased = Math.sin((ratio * Math.PI) / 2);   // sineOut

        const x = this._startPos.x + (this._targetPos.x - this._startPos.x) * eased;
        const y = this._startPos.y + (this._targetPos.y - this._startPos.y) * eased;
        this.node.setPosition(x, y, 0);

        if (ratio >= 1) {
            this.enabled = false;      // ← 入场结束，update 不再跑
            const cb = this._onComplete;
            this._onComplete = null;
            cb?.();
        }
    }
}