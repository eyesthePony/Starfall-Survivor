import { _decorator, Component, director, tween, UIOpacity, } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { AudioManager } from '../Core/AudioManager';

const { ccclass} = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    static instance:GameManager = null;

    // 游戏状态
    private _state:string = GameConstants.GAME_STATE.READY;



    onLoad() {
        console.time("GameManager_load");
   
        GameManager.instance = this;
        
        EventBus.on(GameConstants.EVENT_TYPE.GAME_OVER, this.onGameOver, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESTART, this.onGameRestart, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESUME,this.onGameResume,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_PAUSE,this.onGamePause,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_VICTORY,this.onGameVictory,this);
        EventBus.on(GameConstants.EVENT_TYPE.LEVEL_UP, this.onPlayerLevelUp, this); // ... 你的逻辑 ...
     console.timeEnd("GameManager_load");  
    }

    start(){
         // ... 你的逻辑 ...
     console.time("GameManager_Start");
        this.onGameStart();
         // ... 你的逻辑 ...
    console.timeEnd("GameManager_Start")
    }

    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_OVER, this.onGameOver, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESTART, this.onGameRestart, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESUME,this.onGameResume,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_PAUSE,this.onGamePause,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_VICTORY,this.onGameVictory,this);
        EventBus.off(GameConstants.EVENT_TYPE.LEVEL_UP, this.onPlayerLevelUp, this);
    }

    private onStateChanged(state:string){
        if (this._state === state) return;
        this._state = state;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this._state);
    }

    private onGameStart(){
        this.onStateChanged(GameConstants.GAME_STATE.PLAYING);
        AudioManager.instance.play(GameConstants.AUDIO_TYPE.BGM,0.7);

         const scene = director.getScene();
        const loadingNode = scene?.getChildByName("LoadingPanel"); 

        if (loadingNode) {
            // 获取或添加透明度组件
            const opacity = loadingNode.getComponent(UIOpacity) || loadingNode.addComponent(UIOpacity);
            opacity.opacity = 255; // 保证一开始是不透明的，挡住那卡顿的2秒

            // 延迟 0.1 秒，等战斗场景的第一帧画面渲染出来，然后再执行淡出
            this.scheduleOnce(() => {
                tween(opacity)
                    .to(0.3, { opacity: 0 }) // 花 0.3 秒平滑淡出
                    .call(() => {
                        // 彻底移除常驻标记并销毁，防止进下一关时出 Bug
                        director.removePersistRootNode(loadingNode);
                        loadingNode.destroy(); 
                    })
                    .start();
            }, 0.1);
        }
    }

    //游戏胜利，相当于游戏结束
    private onGameVictory() {
        this.onStateChanged(GameConstants.GAME_STATE.VICTORY); 
       
    }

    // 游戏结束
    private onGameOver() {
        this.onStateChanged(GameConstants.GAME_STATE.OVER);


    }

    // 重开
    private onGameRestart() {
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_RESET);
        this.onStateChanged(GameConstants.GAME_STATE.PLAYING);


    }

    onPlayerLevelUp(levelUpCount: number){
      
        this.onStateChanged(GameConstants.GAME_STATE.UPGRADING);
        // 通知 UI 弹出选卡界面
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.SHOW_UPGRADE_PANEL, levelUpCount);
    }

    onGamePause(){
        this.onStateChanged(GameConstants.GAME_STATE.PAUSE);
    }

    onGameResume(){

        this.onStateChanged(GameConstants.GAME_STATE.PLAYING);
    }

}