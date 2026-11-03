import { _decorator,  Component,  Node, ProgressBar, tween, Tween } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { GameData } from '../Core/GameData';
const { ccclass, property } = _decorator;

@ccclass('PlayerHealthUI')
export class PlayerHealthUI extends Component {

   

    @property(Node)
    hpBarNode: Node = null!;      
    
    @property(ProgressBar)
    progressBar: ProgressBar = null!; 
    
    
    private _tweenTarget = { p: 1 };

    private _maxHp:number = 5;


 

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED, this.onHpChanged, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.init, this); // 监听重开
        this.init();
    }

    public init(){
        this._maxHp = GameData.playerMaxHp;
        this.node.active = true;
        Tween.stopAllByTarget(this._tweenTarget);
        this._tweenTarget.p = 1;
        this.progressBar.progress = 1;
    }

    onHpChanged(curHp:number){
        if (!this.node.active || !this.progressBar) return;
        const ratio = Math.max(0, Math.min(1, curHp / this._maxHp));
        Tween.stopAllByTarget(this._tweenTarget);
        tween(this._tweenTarget).to(0.2, { p: ratio }, {
            onUpdate: () => { this.progressBar.progress = this._tweenTarget.p; }
        }).start();
    }
    

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED, this.onHpChanged, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.init, this);
    }

}


