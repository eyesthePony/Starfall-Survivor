import { _decorator, Component, Node } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { BasePlane } from '../Entity/plane/BasePlane';
import { PlayerPlane } from '../Entity/plane/player/PlayerPlane';
const { ccclass, property } = _decorator;

@ccclass('UpgradeManager')
export class UpgradeManager extends Component {
    private _maxExp:number = 100;
    private _exp:number = 0;
    private _level:number = 1;

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.expChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.reset, this);
        EventBus.on(GameConstants.EVENT_TYPE.CARD_SELECTED,this.applyUpgrade,this);
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
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.EXP_CHANGED, this._level, this._exp/this._maxExp);
    }

    public applyUpgrade(cardId: string){
        if (PlayerPlane.instance) {
            PlayerPlane.instance.applyUpgrade(cardId);
        }
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.expChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.reset, this);
        EventBus.off(GameConstants.EVENT_TYPE.CARD_SELECTED,this.applyUpgrade,this);
    }
}


