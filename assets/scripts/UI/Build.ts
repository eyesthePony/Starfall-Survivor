import { _decorator, Button, Component, director, Node } from 'cc';
import { GameConstants } from '../Core/GameConstants';
import { EventBus } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('Build')
export class Build extends Component {
    onLoad() {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    onDestroy() {
        this.node.off(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick() {
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, 0);     
    }
}


