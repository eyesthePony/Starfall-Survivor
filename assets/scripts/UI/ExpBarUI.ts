import { _decorator, Component, Label, Node, ProgressBar, tween } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('ExpBarUI')
export class ExpBarUI extends Component {
    
    @property(Label)
    levelLabel: Label = null!;

    @property(ProgressBar)
    expProgress: ProgressBar = null!;

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.EXP_CHANGED, this.expChanged, this); //经验条ui更新数据
        this.expProgress.progress = 0;
    }

    expChanged(level: number, progress: number){
        this.levelLabel.string = `Lv.${level}`;
        // 用 tween 让进度条平滑过渡过去，而不是瞬间跳变
        tween(this.expProgress)
            .to(0.2, { progress: progress })
            .start();
    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.EXP_CHANGED, this.expChanged, this);
    }
}


