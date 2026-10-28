import { _decorator, Component } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
const { ccclass} = _decorator;

@ccclass('PausePanel')
export class PausePanel extends Component {

    onLoad() {
        this.node.active = false;  
        EventBus.on(GameConstants.EVENT_TYPE.PLAYER_PAUSE_CLICK, this.show, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESUME, this.hide, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESTART, this.hide, this);
        
    }

    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.PLAYER_PAUSE_CLICK, this.show, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESUME, this.hide, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESTART, this.hide, this);
    }

    private show() {
        this.node.active = true;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_PAUSE);
    }

    private hide() {
        this.node.active = false;
    }

   
}