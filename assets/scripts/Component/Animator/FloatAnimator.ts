import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloatAnimator')
export class FloatAnimator extends Component {
    @property({ tooltip: "浮动距离（幅度）" })
    distance = 15; 

    @property({ tooltip: "浮动速度（越大越快）" })
    speed = 2; 

    @property({ tooltip: "浮动方向角度（0=左右，90=上下，45=左下右上，135=左上右下）" })
    angle = 90; 

    private _time = 0;
    private _basePos: Vec3 = new Vec3();

    private _cosAngle = 0;
    private _sinAngle = 0;


    start() {
        this._basePos = this.node.position.clone();
        this._time = Math.random() * 10; // 随机初始相位，防止所有怪同步浮动
        
        // 只在初始化算一次，终身受用！
        const rad = this.angle * Math.PI / 180;
        this._cosAngle = Math.cos(rad);
        this._sinAngle = Math.sin(rad);
    }

    update(dt: number) {
        this._time += dt * this.speed;
        
        // 用正弦波算出当前应该偏移的比例（范围在 -1 到 1 之间）
        const offsetRatio = Math.sin(this._time) * this.distance;

        const offsetX = this._cosAngle * offsetRatio; // 直接用缓存
        const offsetY = this._sinAngle * offsetRatio; // 直接用缓存

        this.node.setPosition(
            this._basePos.x + offsetX,
            this._basePos.y + offsetY,
            this._basePos.z
        );
    }
}


