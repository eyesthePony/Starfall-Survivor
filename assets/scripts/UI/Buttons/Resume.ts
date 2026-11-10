import { _decorator, Button, Component } from 'cc';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';
const { ccclass } = _decorator;

@ccclass('Resume')
export class Resume extends Component {
    
    onLoad() {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    onDestroy() {
        this.node.off(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick() {
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_RESUME);
    }
}


