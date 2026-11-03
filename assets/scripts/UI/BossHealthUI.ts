import { _decorator, Component, Label, Node, ProgressBar, tween, Tween } from 'cc';
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

    private _tweenTarget = { p: 1 };


    protected onLoad(): void {
        this.node.active = false; 
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_SHOW_HP_BAR,this.bossShowHpBar,this);
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR,this.bossHideHpBar,this);
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_HP_CHANGED,this.bossHPChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.bossHideHpBar, this);
    }


    bossShowHpBar(bossName: string = "冰霜之主", maxHp: number) {
        this.node.active = true;
        this.bossNameLabel.string = bossName;
        this._maxHp = maxHp;
        Tween.stopAllByTarget(this._tweenTarget);
        this._tweenTarget.p = 1;
        this.progressBar.progress = 1;
    }

    bossHPChanged(curHp: number) {
        if (!this.node.active || !this.progressBar) return;
        const ratio = Math.max(0, Math.min(1, curHp / this._maxHp));
        Tween.stopAllByTarget(this._tweenTarget);
        tween(this._tweenTarget).to(0.2, { p: ratio }, {
            onUpdate: () => { this.progressBar.progress = this._tweenTarget.p; }
        }).start();
    }

    bossHideHpBar(){
        this.node.active = false; 
    }



    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.BOSS_SHOW_HP_BAR,this.bossShowHpBar,this);
        EventBus.off(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR,this.bossHideHpBar,this);
        EventBus.off(GameConstants.EVENT_TYPE.BOSS_HP_CHANGED,this.bossHPChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.bossHideHpBar, this);
    }
}


