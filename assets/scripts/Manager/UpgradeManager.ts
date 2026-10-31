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
    private onCardSelected(cardData: CardConfigData) {
          // 1. 记账
        if (!this._cardCounts[cardData.id]) this._cardCounts[cardData.id] = 0;
        this._cardCounts[cardData.id]++;

        // 2. 通知玩家（直接把对象甩过去）
        if (PlayerPlane.instance) {
            PlayerPlane.instance.applyUpgrade(cardData); // 👈 传对象
        }
    }

    private onRequestDrawCards(count: number) {
        // 1. 过滤池子（这部分保持你原来的代码不动）
        const availableCards = CARD_CONFIG.filter(card => {
            const currentCount = this._cardCounts[card.id] || 0;
            if (currentCount >= (card.maxLevel || 99)) return false;
            if (card.requireWeapon) {
                const hasWeapon = (this._cardCounts[card.requireWeapon] || 0) > 0;
                if (!hasWeapon) return false;
            }
            return true;
        });

        // ================= 全新的抽卡逻辑开始 =================
        
        // 2. 分类池子
        const weaponPool = availableCards.filter(c => c.type === GameConstants.CARD_TYPE.WEAPON);
        const upgradePool = availableCards.filter(c => c.type === GameConstants.CARD_TYPE.UPGRADE);
        const statPool = availableCards.filter(c => c.type === GameConstants.CARD_TYPE.STAT);

        const result: CardConfigData[] = [];
        
        // 我们做一个内部辅助方法：抽到一张卡，就把它从对应的池子里“删掉”，防止重复
        const pickAndRemove = (pool: CardConfigData[]): CardConfigData | null => {
            if (pool.length === 0) return null;
            const index = Math.floor(Math.random() * pool.length);
            const card = pool[index];
            pool.splice(index, 1); // 👈 从池子里抽走
            return card;
        };

        // 槽位1：优先抽新武器
        let pick = pickAndRemove(weaponPool) || pickAndRemove(upgradePool) || pickAndRemove(statPool);
        if (pick) result.push(pick);

        // 槽位2：优先抽武器强化
        pick = pickAndRemove(upgradePool) || pickAndRemove(statPool) || pickAndRemove(weaponPool);
        if (pick) result.push(pick);

        // 槽位3：剩下的随便给，只要没满 3 张，就从三个池子里轮流找
        while (result.length < count) {
            pick = pickAndRemove(weaponPool) || pickAndRemove(upgradePool) || pickAndRemove(statPool);
            if (!pick) break; // 池子全空了，没得抽了
            result.push(pick);
        }

        // ================= 全新的抽卡逻辑结束 =================

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


