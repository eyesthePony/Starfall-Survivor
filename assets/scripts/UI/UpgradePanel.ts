import { _decorator, Button, Component, Label, Node } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { CARD_CONFIG, CardConfigData } from '../Core/CardConfig';
const { ccclass, property } = _decorator;

@ccclass('UpgradePanel')
export class UpgradePanel extends Component {

    @property([Button])
    cardButtons: Button[] = []; // 把三个按钮拖进来

    private _pendingCount: number = 0; // 需要选几次

    private _currentCards: CardConfigData[] = [];
    
    
    protected onLoad(): void {
        this.node.active = false;  
        EventBus.on(GameConstants.EVENT_TYPE.SHOW_UPGRADE_PANEL,this.show,this);

        for (let i = 0; i < this.cardButtons.length; i++) {
            this.cardButtons[i].node.on(Button.EventType.CLICK, () => this.onCardClick(i), this);
        }
    }

    show(count: number = 1){
        this.node.active = true;  
        this._pendingCount = count;
        this.refreshCards();
    }

    hide(){
         this.node.active = false;  
    }

    onCardClick(index:number){
        const selectedCard = this._currentCards[index];
        if (!selectedCard) return;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CARD_SELECTED, selectedCard.id); // 发出选卡信号
        this._pendingCount--;
        if (this._pendingCount > 0) {
            // 如果还有次数，理论上应该重新刷卡片文字，现在先直接返回
            this.refreshCards();
            return; 
        }
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_RESUME);
        this.hide();
    }

    private refreshCards() {
        // 从 CARD_CONFIG 数组中随机抽取 3 张
        //重置
        this._currentCards = [];
        
        // 1. 复制一份卡池，免得抽卡时把原配置表弄坏了
        const tempPool:CardConfigData[] = [];
        for (let i = 0; i < CARD_CONFIG.length; i++) {
            tempPool.push(CARD_CONFIG[i]);
        }

        for (let i = 0; i < 3; i++) {
            // 如果卡池被抽空了，就提前结束
            if (tempPool.length === 0) break; 

            // 随机生成一个下标（0 到 剩余卡牌数量-1）
            const randomIndex = Math.floor(Math.random() * tempPool.length);
            
            // 把这张卡拿出来，塞进我们的结果数组里
            const card = tempPool[randomIndex];
            this._currentCards.push(card);

            // 把抽过的卡从临时池子里删掉，防止下次再抽到
            tempPool.splice(randomIndex, 1);
        }

        for (let i = 0; i < this.cardButtons.length; i++){
            const card = this._currentCards[i];  //获取卡片
            const buttonNode = this.cardButtons[i].node;//获取一个按钮

             // 如果抽到了卡，就去找按钮下的 Label 并显示文字
            if (card) {
                buttonNode.active = true;
                // 分两步找节点，清清楚楚
                const labelNode = buttonNode.getChildByName('Label');
                if (labelNode) {
                    const labelComp = labelNode.getComponent(Label);
                    if (labelComp) {
                        // 用最普通的字符串拼接，不用 `\n` 模板字符串
                        labelComp.string = card.name + '\n' + card.desc;
                    }
                }
            }else{//没牌了
                buttonNode.active = false;
            }


        }

    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.SHOW_UPGRADE_PANEL,this.show,this);
    }



    
}


