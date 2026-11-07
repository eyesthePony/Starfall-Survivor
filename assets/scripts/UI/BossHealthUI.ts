import { _decorator, Component, Label, Node, ProgressBar, } from 'cc';
import { GameConstants } from '../Core/GameConstants';
import { EventBus } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('BossHealthUI')
export class BossHealthUI extends Component {

    @property(Node)
    hpBarNode: Node = null!;      

    @property(ProgressBar)
    progressBar: ProgressBar = null!; 

    @property(ProgressBar)
    ghostBar: ProgressBar = null!; 

    @property(Label)
    bossNameLabel: Label = null!; 

    private readonly GHOST_FALL_SPEED = 2.0;   // 掉血时，白条缩短的速度
    private readonly GHOST_RISE_SPEED = 8.0;   // 回血/重置时，白条生长的速度




    protected onLoad(): void {
        this.node.active = false; 
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_SHOW_HP_BAR,this.bossShowHpBar,this);
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR,this.bossHideHpBar,this);
        EventBus.on(GameConstants.EVENT_TYPE.BOSS_HP_CHANGED,this.bossHPChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.bossHideHpBar, this);
    }


    bossShowHpBar(bossName: string = "冰霜之主") {
        this.node.active = true;
        this.bossNameLabel.string = bossName;
        this.progressBar.progress = 1;
        this.ghostBar.progress = 1;
    }

    bossHPChanged(ratio: number) {
        ratio = Math.max(0, Math.min(1,ratio));
        this.progressBar.progress = ratio;
    }

    protected update(dt: number): void {

        const target = this.progressBar.progress;
        const ghost = this.ghostBar.progress;
        const diff = target - ghost;

        if(Math.abs(diff) < 0.001){
            this.ghostBar.progress = target;
            return;
        }

        const speed = diff < 0?this.GHOST_FALL_SPEED:this.GHOST_RISE_SPEED;
        const t = Math.min(1, dt * speed);
        this.ghostBar.progress = ghost + diff * t; 

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


