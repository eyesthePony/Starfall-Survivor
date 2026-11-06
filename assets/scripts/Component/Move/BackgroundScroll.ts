import { _decorator,  Component, Node, UITransform, } from 'cc';
import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
import { GameData } from '../../Core/GameData';
const { ccclass, property } = _decorator;

@ccclass('BackgroundScroll')
export class BackgroundScroll extends Component {
    @property({ type: [Node], tooltip: "上下叠放的两张图" })
    backgrounds: Node[] = [];

    @property({ tooltip: "滚动速度" })
    speed: number = 50; 

    @property({ tooltip: "单张背景高度，0=自动用屏幕高度" })
    scrollHeight: number = 0;

    

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
        this.scrollHeight = GameData.viewH;

        for (let i = 0; i < this.backgrounds.length; ++i) {
            const bg = this.backgrounds[i];
            bg.getComponent(UITransform).setContentSize(GameData.viewW,GameData.viewH);
            bg.setPosition(bg.position.x, i * GameData.viewH);
        }
        
    }

    private onStateChanged(state: string) {
        if(state === GameConstants.GAME_STATE.PLAYING){
            this.enabled = true;
        }else{
            this.enabled = false;
        }
    }

    update(deltaTime: number): void {
        
        for (let i = 0; i < this.backgrounds.length; ++i) {
            const bg = this.backgrounds[i];
            
            // 向下移动
            let newY = bg.position.y - this.speed * deltaTime;
            
            if (newY <= -this.scrollHeight) {
                newY += this.scrollHeight * 2;
            }
            
            // 🌟 核心修复 3：取整防止像素抖动（像素游戏必备）
            bg.setPosition(bg.position.x, Math.floor(newY));
        }
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
    }
}