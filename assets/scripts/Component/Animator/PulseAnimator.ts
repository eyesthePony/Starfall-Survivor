import { _decorator, Component, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PulseAnimator')
export class PulseAnimator extends Component {
    @property({ tooltip: "最小缩放" })
    minScale = 0.9;

    @property({ tooltip: "最大缩放" })
    maxScale = 1.15;

    @property({ tooltip: "呼吸速度" })
    speed = 3; 

    @property({ tooltip: "是否闪烁透明度" })
    flashOpacity = false;

    private _time = 0;
    private _baseScale: Vec3 = new Vec3(1, 1, 1);
    private _uiOpacity: UIOpacity = null;

    start() {
        // 记录初始缩放值
        this._baseScale = this.node.scale.clone();
        this._time = Math.random() * 10; // 随机相位，防止所有光球同步跳动

        if (this.flashOpacity) {
            this._uiOpacity = this.node.getComponent(UIOpacity);
            if (!this._uiOpacity) {
                this._uiOpacity = this.node.addComponent(UIOpacity);
            }
        }
    }

    update(dt: number) {
        this._time += dt * this.speed;

        // 计算当前的正弦波比例 (-1 到 1)
        const sinVal = Math.sin(this._time);
        
        // 将 -1 到 1 映射到 minScale 和 maxScale 之间
        // 公式：中间值 + 振幅 * 正弦值
        const midScale = (this.maxScale + this.minScale) / 2;
        const range = (this.maxScale - this.minScale) / 2;
        const currentScaleRatio = midScale + range * sinVal;

        // 应用缩放
        this.node.setScale(
            this._baseScale.x * currentScaleRatio,
            this._baseScale.y * currentScaleRatio,
            this._baseScale.z
        );

        // 应用透明度闪烁（如果开启）
        if (this._uiOpacity) {
            // 根据正弦值映射透明度，最小 150，最大 255
            const opacity = 150 + (sinVal + 1) / 2 * 105;
            this._uiOpacity.opacity = opacity;
        }
    }
}


