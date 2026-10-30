import { _decorator, Component, Label, Node } from 'cc';
import { GameConstants } from '../Core/GameConstants';
import { EventBus } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('PopupPanel')
export class PopupPanel extends Component {

    @property(Label) 
    titleLabel: Label = null!; // 面板上的大标题

    // 依然用数组管理，扁平化最爽的地方
    @property({ type: [Node], tooltip: "暂停时显示的按钮" }) 
    pauseBtns: Node[] = [];

    @property({ type: [Node], tooltip: "胜利时显示的按钮" }) 
    winBtns: Node[] = [];

    @property({ type: [Node], tooltip: "失败时显示的按钮" }) 
    loseBtns: Node[] = [];

    onLoad() {
        this.node.active = false;  
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onGameStateChanged, this);
    }

    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onGameStateChanged, this);
    }

    private onGameStateChanged(state: string) {
        switch (state) {
        case GameConstants.GAME_STATE.PAUSE:
            this.showPause(); // 只有真正点暂停，才弹这个
            break;
        case GameConstants.GAME_STATE.VICTORY:
            this.showWin();
            break;
        case GameConstants.GAME_STATE.OVER:
            this.showOver();
            break;
        case GameConstants.GAME_STATE.PLAYING:
            this.hidePanel(); // 恢复游戏时隐藏
            break;
        case GameConstants.GAME_STATE.UPGRADING:
            // 升级时，不关我的事，我不显示，也不隐藏（或者直接隐藏）
            this.hidePanel(); 
            break;
        }
    }



    showPause(){
        this.node.active = true;
        this.hideAllBtns();
        this.titleLabel.string = '游戏暂停';
        this.showBtns(this.pauseBtns);
    }

    showWin(){
        this.node.active = true;
        this.hideAllBtns();
        this.titleLabel.string = '游戏胜利';
        this.showBtns(this.winBtns);
    }

    showOver(){
        this.node.active = true;
        this.hideAllBtns();
        this.titleLabel.string = '游戏结束';
        this.showBtns(this.loseBtns);
    }

     // === 下面是辅助方法 ===
    private hideAllBtns() {
        this.setBtnsActive(this.pauseBtns, false);
        this.setBtnsActive(this.winBtns, false);
        this.setBtnsActive(this.loseBtns, false);
    }

    private showBtns(btns: Node[]) {
        this.setBtnsActive(btns, true);
    }

    private setBtnsActive(btns: Node[], active: boolean) {
        btns.forEach(btn => { 
            if(btn) btn.active = active; 
        });
    }

    private hidePanel() {
        this.node.active = false;
    }
}


