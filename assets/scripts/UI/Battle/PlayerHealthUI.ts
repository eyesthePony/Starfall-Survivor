import { _decorator, Component, Node, ProgressBar, } from 'cc';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';

const { ccclass, property } = _decorator;

@ccclass('PlayerHealthUI')
export class PlayerHealthUI extends Component {

   

    @property(Node)
    hpBarNode: Node = null!;      
    
    @property(ProgressBar)
    progressBar: ProgressBar = null!; 

    @property(ProgressBar)
    ghostBar: ProgressBar = null!; 

    private readonly GHOST_FALL_SPEED = 3.5;   

    private readonly GHOST_RISE_SPEED = 5.0;   

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED, this.onHpChanged, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.init, this); // 监听重开
        this.init();
    }

    public init(){
        this.node.active = true;
        this.progressBar.progress = 1;
        this.ghostBar.progress = 1;
    }

    onHpChanged(ratio:number){
        if (!this.node.active || !this.progressBar) return;
        ratio = Math.max(0, Math.min(1, ratio));
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

    

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED, this.onHpChanged, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.init, this);
    }

}


