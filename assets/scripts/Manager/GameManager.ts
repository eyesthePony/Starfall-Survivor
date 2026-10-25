import { _decorator, Component, view } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { AudioManager } from '../Core/AudioManager';
import { GameData } from '../Core/GameData';
const { ccclass} = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    static instance:GameManager = null;

    // 游戏状态
    private _state:string = GameConstants.GAME_STATE.READY;

    onLoad() {
        GameManager.instance = this;
        const size = view.getVisibleSize();
        GameData.screenWidth = size.width;
        GameData.screenHeight = size.height;
        EventBus.on(GameConstants.EVENT_TYPE.GAME_OVER, this.onGameOver, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESTART, this.onGameRestart, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESUME,this.onGameResume,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_PAUSE,this.onGamePause,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_VICTORY,this.onGameVictory,this);
    }

    start(){
        this.onGameStart();
    }

    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_OVER, this.onGameOver, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESTART, this.onGameRestart, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESUME,this.onGameResume,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_PAUSE,this.onGamePause,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_VICTORY,this.onGameVictory,this);
    }

    private onStateChanged(state:string){
        if (this._state === state) return;
        this._state = state;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this._state);
    }

    private onGameStart(){
        this.onStateChanged(GameConstants.GAME_STATE.PLAYING);
        AudioManager.instance.play(GameConstants.AUDIO_TYPE.BGM,1);
    }

    //游戏胜利，相当于游戏结束
    private onGameVictory() {
        this.onStateChanged(GameConstants.GAME_STATE.OVER); 
        console.log('[GameManager] 胜利');
    }

    // 游戏结束
    private onGameOver() {
        this.onStateChanged(GameConstants.GAME_STATE.OVER);
        console.log('[GameManager] 游戏结束');

    }

    // 重开
    private onGameRestart() {
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_RESET);
        this.onStateChanged(GameConstants.GAME_STATE.PLAYING);
        console.log('[GameManager] 重新开始');
    }

    onGamePause(){
        this.onStateChanged(GameConstants.GAME_STATE.PAUSE);
    }

    onGameResume(){
        this.onStateChanged(GameConstants.GAME_STATE.PLAYING);
    }

}