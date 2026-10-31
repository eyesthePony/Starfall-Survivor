import { _decorator, Component, Node } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { BasePlane } from '../Entity/plane/BasePlane';
import { PlayerPlane } from '../Entity/plane/player/PlayerPlane';
import { CARD_CONFIG, CardConfigData } from '../Core/CardConfig';
const { ccclass, property } = _decorator;

@ccclass('UpgradeManager')
export class UpgradeManager extends Component {
    private _maxExp:number = 100;
    private _exp:number = 0;
    private _level:number = 1;

    private _cardCounts: Record<string, number> = {};

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.expChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.reset, this);
        EventBus.on(GameConstants.EVENT_TYPE.CARD_SELECTED,this.onCardSelected,this);
        EventBus.on(GameConstants.EVENT_TYPE.REQUEST_DRAW_CARDS, this.onRequestDrawCards, this);
    }

    //获得经验
    expChanged(enemyNode:Node){
        const plane = enemyNode.getComponent(BasePlane);
        let addExp = plane ? plane.expReward : 10; // 如果没取到，保底给 10
        this._exp += addExp;

        let levelUpCount = 0;
        while (this._exp >= this._maxExp) {
            this._exp -= this._maxExp;
            this._maxExp += 200; // 下一级需要的经验增多
            ++this._level;
            ++levelUpCount;
        }

        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.EXP_CHANGED,  this._level, this._exp/this._maxExp); //给经验条ui更新数据
        if(levelUpCount > 0){
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.LEVEL_UP, levelUpCount);
        }
    }



    //重置
    reset(){
        this._level = 1;
        this._maxExp = 100;
        this._exp = 0;
        this._cardCounts = {};
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.EXP_CHANGED, this._level, this._exp/this._maxExp);
    }

    // 玩家在 UI 里点选了某张卡
    private onCardSelected(cardId: string) {
        // 1. 记账 +1
        if (!this._cardCounts[cardId]) this._cardCounts[cardId] = 0;
        this._cardCounts[cardId]++;

        // 2. 通知玩家执行具体的属性强化
        if (PlayerPlane.instance) {
            PlayerPlane.instance.applyUpgrade(cardId);
        }
    }

    private onRequestDrawCards(count: number) {
        // 1. 过滤满级卡
        const availableCards = CARD_CONFIG.filter(card => {
            const currentCount = this._cardCounts[card.id] || 0;
            return currentCount < card.maxLevel;
        });

        // 2. 洗牌抽卡
        const result: CardConfigData[] = [];
        const tempPool = [...availableCards];
        for (let i = 0; i < count && tempPool.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * tempPool.length);
            result.push(tempPool[randomIndex]);
            tempPool.splice(randomIndex, 1);
        }

        // 3. 把抽好的卡返回给 UI
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.DRAW_CARDS_RESULT, result);
    }


    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.expChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.reset, this);
        EventBus.off(GameConstants.EVENT_TYPE.CARD_SELECTED,this.onCardSelected,this);
        EventBus.off(GameConstants.EVENT_TYPE.REQUEST_DRAW_CARDS, this.onRequestDrawCards, this);
        
    }
}


