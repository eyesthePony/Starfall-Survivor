import { _decorator, Component, Label, Sprite, Button } from 'cc';
import { BuildingData } from '../../Core/BuildingConfig';
import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BuildItem')
export class BuildItem extends Component {
    @property(Label) nameLabel: Label = null!;
    @property(Label) costLabel: Label = null!;
    
    private _data: BuildingData = null!;

    // 初始化数据
    public init(data: BuildingData) {
        this._data = data;
        this.nameLabel.string = data.name;
        this.costLabel.string = data.cost + ' 金币';
        
        // 绑定点击事件
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick() {
        // 告诉系统，我要建造这个建筑
        // 注意这里要把建筑的宽、高、ID 一起传过去
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, this._data);
        
        // 同时关掉面板
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.CLOSE_BUILD_PANEL); 
    }

    protected onDestroy(): void {
         this.node.off(Button.EventType.CLICK, this.onClick, this);
    }
}