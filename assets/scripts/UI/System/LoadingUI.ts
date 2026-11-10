import { _decorator, Component, Label, ProgressBar, } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingUI')
export class LoadingUI extends Component {
    @property(ProgressBar) progressBar: ProgressBar = null!;
    @property(Label) percentLabel: Label = null!;
    @property(Label) tipsLabel: Label = null!;
    
    // 防止重复切场景
    private _isDone = false;

    protected onLoad(): void {
        this.node.active = false;
    }

    public show() {
        this.node.active = true;
        this.progressBar.progress = 0;
        this.percentLabel.string = "0%";
        this._isDone = false;
        if (this.tipsLabel) this.tipsLabel.string = "奎将来临...";
    }

   public updateProgress(current: number, total: number) {
        if (this._isDone) return;
        const percent = total > 0 ? Math.min(current / total, 1) : 0;
        const safePercent = Math.max(this.progressBar.progress, percent);
        this.progressBar.progress = safePercent;
        this.percentLabel.string = Math.floor(safePercent * 100) + "%";
    }

    public finish() {            // 加载完成：补满 100%
        this._isDone = true;
        this.progressBar.progress = 1;
        this.percentLabel.string = "100%";
    }

    public hide() {
        this.node.active = false;
    }
}