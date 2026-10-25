import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SpinAnimator')
export class SpinAnimator extends Component {
    @property speed = 30; // 旋转速度（度/秒），负数就是反方向

    update(dt: number) {
        this.node.angle += this.speed * dt;
    }
}


