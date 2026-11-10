import { _decorator, Component, Label, Node } from 'cc';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('GoldUI')
export class GoldUI extends Component {

    @property(Label) 
    goldLabel: Label = null!;
    
    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.GOLD_CHANGED,this.onGoldChanged,this);
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GOLD_CHANGED,this.onGoldChanged,this);
    }

    onGoldChanged(gold: number){
        if(this.goldLabel) this.goldLabel.string = `金币: ${gold}`;
    }
}


