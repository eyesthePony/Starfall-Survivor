import { _decorator, Button, Component} from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('Pause')
export class Pause extends Component {
    private _btn: Button = null!;
    onLoad() {
        this._btn = this.getComponent(Button)!;
        this.node.on(Button.EventType.CLICK, this.onClick, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
    }

     // 不是游玩状态（如暂停、升级、结算），按钮就不可点
    private onStateChanged(state: string) {
        if (this._btn) {
            this._btn.interactable = (state === GameConstants.GAME_STATE.PLAYING);
        }
    }

    private onClick() {
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.PLAYER_PAUSE_CLICK);
    }
    
    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
        this.node.off(Button.EventType.CLICK, this.onClick, this);
    }
    
    
}


