import { _decorator, Component, Node, Button, Sprite, Color } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BuildActionPanel')
export class BuildActionPanel extends Component {
    @property(Node) btnConfirm: Node = null!;
    @property(Node) btnCancel: Node = null!;

    protected onLoad() {
        // 绑定按钮点击事件，发送给 BuildManager
        this.btnConfirm.on(Button.EventType.CLICK, () => {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CONFIRM_BUILD_CLICK);
        }, this);
        
        this.btnCancel.on(Button.EventType.CLICK, () => {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CANCEL_BUILD_CLICK);
        }, this);

        this.node.active = false; // 默认隐藏
    }

    setConfirmState(canBuild: boolean){
         const btn = this.btnConfirm.getComponent(Button);
        if (btn) {
            // 控制按钮是否可交互（变灰不可点）
            btn.interactable = canBuild;
        }

        // （可选）如果你想让按钮变灰得更明显，可以顺便改一下它的颜色
        const sprite = this.btnConfirm.getComponent(Sprite);
        if (sprite) {
            sprite.color = canBuild ? new Color(255, 255, 255, 255) : new Color(150, 150, 150, 255);
        }
    
    }

    // 供外部调用的显示方法
    public show() { this.node.active = true; }
    public hide() { this.node.active = false; }
}