import { _decorator, Component, Node } from 'cc';
import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BackgroundScroll')
export class BackgroundScroll extends Component {
    @property({ type: [Node], tooltip: "两张一样的背景图节点，上下叠放" })
    backgrounds: Node[] = [];

    @property
    speed: number = 50;  // 向下滚动速度，像素/秒

    @property
    scrollHeight: number = 1280;  // 单张背景高度，屏幕高 1280 就填 1280

    private _isPaused: boolean = false;

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);

    }

    private onStateChanged(state:string){
         // 游戏开始，启动定时器
        if(state === GameConstants.GAME_STATE.PLAYING){
            this.onResume();
        }else{
            this.onPause();
        }
    }
    private onPause(): void { this._isPaused = true; }
    private onResume(): void { this._isPaused = false; }

    update(deltaTime: number): void {
        if (this._isPaused) return;
        for (const bg of this.backgrounds) {
            bg.setPosition(bg.position.x, bg.position.y - this.speed * deltaTime);
            // 移出屏幕底部就瞬移到另一张顶上
            if (bg.position.y < -this.scrollHeight) {
                bg.setPosition(bg.position.x, bg.position.y + this.scrollHeight * 2);
            }
        }
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
    }
}
