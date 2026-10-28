import { _decorator, Component, Node, UITransform, view } from 'cc';
import { EventBus } from './Core/EventBus';
import { GameConstants } from './Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('background')
export class background extends Component {

    @property speed = 200;

    private bgs: Node[] = [];
    private bgHeight = 0;
  

    onLoad() {
        // 用逻辑单位



        this.bgs = this.node.children;

        if (this.bgs.length < 2) {
            console.error('背景需要至少两张图');
            return;
        }

        // 两张图首尾相接
        // 假设锚点在中心，bg1 在 0，bg2 在 bgHeight
        this.bgHeight = this.bgs[0].getComponent(UITransform).height;

        const screenHeight = view.getVisibleSize().height;

        this.bgs[0].setPosition(0, 0);
        this.bgs[1].setPosition(0, this.bgHeight);

        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
    }

    onStateChanged(state:string){
        const isPlaying = (state === GameConstants.GAME_STATE.PLAYING);
        if (isPlaying) {
            this.enabled = true;                 // 恢复 update（开火等逻辑）
        } else {
            this.enabled = false;                // 冻结 update
        }
    }

    update(dt: number) {
         const dy = this.speed * dt;
        
        for (let i = 0; i < this.bgs.length; i++) {
            const bg = this.bgs[i];
            const pos = bg.position;
            
            // 1. 统一向下移动
            bg.setPosition(pos.x, pos.y - dy, pos.z);

            // 2. 只要图完全移出屏幕底部，立刻挪到另一张图的上方
            if (bg.position.y <= -this.bgHeight) {
                const otherBg = this.bgs[1 - i];
                
                // ★ 修改点：故意重叠 2 个像素，防止出现黑线
                // ★ 修改点：用 Math.round 取整，避免浮点数产生小缝隙
                const targetY = otherBg.position.y + this.bgHeight - 2; 
                bg.setPosition(pos.x, Math.round(targetY), pos.z);
            }
        }
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
    }
}