import { _decorator, Button, Color, Component, Node, Sprite } from 'cc';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BuildActionPanel')
export class BuildActionPanel extends Component {
    @property(Node) btnConfirm: Node = null!;
    @property(Node) btnCancel: Node = null!;

    protected onLoad() {
        // 绑定按钮点击事件，发送给 BuildManager
        EventBus.on(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL, this.onShow, this);
        EventBus.on(GameConstants.EVENT_TYPE.HIDE_BUILD_ACTION_PANEL, this.onHide, this);
        this.btnConfirm.on(Button.EventType.CLICK, () => {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CONFIRM_BUILD_CLICK);
        }, this);
        
        this.btnCancel.on(Button.EventType.CLICK, () => {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CANCEL_BUILD_CLICK);
        }, this);

        this.node.active = false; // 默认隐藏
    }
    
    protected onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL, this.onShow, this);
        EventBus.off(GameConstants.EVENT_TYPE.HIDE_BUILD_ACTION_PANEL, this.onHide, this);
    }

    private onShow(canBuild: boolean) {
        this.node.active = true;
        this.setConfirmState(canBuild);
    }

    private onHide() {
        this.node.active = false;
    }

    setConfirmState(canBuild: boolean){
        const btn = this.btnConfirm.getComponent(Button);
        if (btn) {
            // 控制按钮是否可交互（变灰不可点）
            btn.interactable = canBuild;
        }
        
        const sprite = this.btnConfirm.getComponent(Sprite);
        if (sprite) {
            sprite.color = canBuild ? new Color(255, 255, 255, 255) : new Color(150, 150, 150, 255);
        }
    
    }

}