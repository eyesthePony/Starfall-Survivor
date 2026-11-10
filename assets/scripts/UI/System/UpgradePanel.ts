import { _decorator, Button, Component, Label, Sprite, SpriteFrame } from 'cc';
import { CardConfigData } from '../../Core/Config/CardConfig';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('UpgradePanel')
export class UpgradePanel extends Component {

    @property([Button])
    cardButtons: Button[] = []; 

    @property({ type: [SpriteFrame], tooltip: "按顺序：剑//闪电/子弹翅膀" })
    iconFrames: SpriteFrame[] = [];

    private _pendingCount: number = 0; 
    private _currentCards: CardConfigData[] = [];
    private _isSelecting: boolean = false; 
    
    protected onLoad(): void {
        this.node.active = false;  
        EventBus.on(GameConstants.EVENT_TYPE.SHOW_UPGRADE_PANEL,this.show,this);
        EventBus.on(GameConstants.EVENT_TYPE.DRAW_CARDS_RESULT, this.onDrawResult, this);

        for (let i = 0; i < this.cardButtons.length; i++) {
            this.cardButtons[i].node.on(Button.EventType.CLICK, () => this.onCardClick(i), this);
        }
    }

    show(count: number = 1){
        this._isSelecting = false; 
        this.node.active = true;  
        this._pendingCount = count;
        this.setAllButtonsInteractable(false);
        // 请求抽卡
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.REQUEST_DRAW_CARDS, 3);
    }

    hide(){
         this.node.active = false;  
    }

    private onDrawResult(result: CardConfigData[]) {
        this._currentCards = result;

        // 如果全满级了，没牌可发，直接关掉恢复游戏
        if (this._currentCards.length === 0) {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_RESUME);
            this.hide();
            return;
        }
        this.setAllButtonsInteractable(true);
        this._isSelecting = false; 

        // 只负责渲染，不负责抽卡
        this.renderCardsUI();
    }

    onCardClick(index:number){
        if (this._isSelecting) return; 
        const selectedCard = this._currentCards[index];
        if (!selectedCard) return;

        this._isSelecting = true;
        this.setAllButtonsInteractable(false);
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CARD_SELECTED, selectedCard); 
        
        this._pendingCount--;
        if (this._pendingCount > 0) {
            // 如果还能选（连升多级），再请求新的卡
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.REQUEST_DRAW_CARDS, 3);
            
            // 延迟解锁，防止连点
            this.scheduleOnce(() => {
                this._isSelecting = false;
            }, 0.2); 
            return; 
        }
        
        // 选完了，恢复游戏
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_RESUME);
        this.hide();
    }


    private renderCardsUI() {
        for (let i = 0; i < this.cardButtons.length; i++){
            const card = this._currentCards[i];  
            const buttonNode = this.cardButtons[i].node;

            const iconNode = buttonNode.getChildByName('Icon');
            if (iconNode) {
                const iconSprite = iconNode.getComponent(Sprite);
                if (iconSprite && this.iconFrames[card.iconIndex]) {
                    iconSprite.spriteFrame = this.iconFrames[card.iconIndex];
                }
            }
            
            if (card) {
                buttonNode.active = true;
                const labelNode = buttonNode.getChildByName('Label');
                if (labelNode) {
                    const labelComp = labelNode.getComponent(Label);
                    if (labelComp) {
                        labelComp.string = card.name + '\n' + card.desc;
                    }
                }
            }else{
                buttonNode.active = false;
            }
        }
    }

    private setAllButtonsInteractable(active: boolean) {
        for (let i = 0; i < this.cardButtons.length; i++) {
            if (this.cardButtons[i]) {
                this.cardButtons[i].interactable = active;
            }
        }
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.SHOW_UPGRADE_PANEL,this.show,this);
        EventBus.off(GameConstants.EVENT_TYPE.DRAW_CARDS_RESULT, this.onDrawResult, this);
    }
}