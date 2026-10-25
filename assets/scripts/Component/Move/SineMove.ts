import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SineMove')
export class SineMove extends Component {

    private _amplitude = 80;
    private _frequency = 1.5;
    private _time = 0;
    private _baseX = 0;
    private _baseY = 0;
    
    onEnable(){
        this._time = 0;
        this._baseX = this.node.position.x;   // ← 记录当前 X
        this._baseY = this.node.position.y;   // ← 记录当前 Y，不是 0
    }

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.amplitude !== undefined) this._amplitude = params.amplitude;
        if (params.frequency !== undefined) this._frequency = params.frequency;
    }


    protected update(dt: number): void {
        
        this._time += dt * this._frequency * Math.PI * 2;
        this._time %= (Math.PI * 2);

        let offsetX = Math.sin(this._time) * this._amplitude;
        this.node.setPosition(this._baseX + offsetX,this._baseY,0); 
    }
}


