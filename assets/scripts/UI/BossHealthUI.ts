import { _decorator, Component, Label, Node, ProgressBar } from 'cc';
import { GameConstants } from '../Core/GameConstants';
import { EventBus } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('BossHealthUI')
export class BossHealthUI extends Component {

    @property(Node)
    hpBarNode: Node = null!;      

    @property(ProgressBar)
    progressBar: ProgressBar = null!; 

    @property(Label)
    bossNameLabel: Label = null!; 

     private _maxHp: number = 1;


    protected onLoad(): void {
        this.node.active = false; 
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_SHOW_HP_BAR,this.bossShowHpBar,this);
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR,this.bossHideHpBar,this);
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_HP_CHANGED,this.bossHPChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.bossHideHpBar, this);
    }


    bossShowHpBar(bossName: string = "冰霜之主",maxHp:number){
        this.node.active = true;
        this.bossNameLabel.string = bossName;
        this._maxHp = maxHp;
        this.progressBar.progress = 1; 
    }

    bossHideHpBar(){
        this.node.active = false; 
    }

    bossHPChanged(curHp:number){

        if (!this.node.active || !this.progressBar) return;
        let ratio = curHp / this._maxHp;
        this.progressBar.progress = Math.max(0, Math.min(1, ratio)); 
    }


    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.BOSS_SHOW_HP_BAR,this.bossShowHpBar,this);
        EventBus.off(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR,this.bossHideHpBar,this);
        EventBus.off(GameConstants.EVENT_TYPE.BOSS_HP_CHANGED,this.bossHPChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.bossHideHpBar, this);
    }
}


