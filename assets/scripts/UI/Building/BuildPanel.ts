import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame } from 'cc';
import { BuildingData, BUILDINGS } from '../../Core/Config/BuildingConfig';
import { EventBus } from '../../Core/Event/EventBus';
import { GameConstants } from '../../Core/Event/GameConstants';
import { BuildItem } from '../../Entity/item/BuildItem';
const { ccclass, property } = _decorator;

@ccclass('BuildPanel')
export class BuildPanel extends Component {
    @property(Prefab) 
    itemPrefab: Prefab = null!;

    @property(Node) 
    contentNode: Node = null!; // 挂载了 Layout 的父节点

    @property(Node) 
    closeBtn: Node = null!;
    
    @property({ type: [SpriteFrame], tooltip: "按文件名自动建字典，顺序无所谓" })
    iconFrames: SpriteFrame[] = [];

    private _items: BuildItem[] = [];
    private _dataMap: Map<string, BuildingData> = new Map();
    private _iconDict: Record<string, SpriteFrame> = {};
    private _built: boolean = false;

    private _onItemClick = (id: string) => {
        const data = this._dataMap.get(id);
        if (!data) return;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, data);
        this.hide();
    };


    protected onLoad() {
        for (let i = 0; i < this.iconFrames.length; ++i) {
            const sf = this.iconFrames[i];
            this._iconDict[sf.name] = sf;
        }
        for (let i = 0; i < BUILDINGS.length; ++i) {
            this._dataMap.set(BUILDINGS[i].id, BUILDINGS[i]);
        }
        this.node.active = false; 
        this.closeBtn.on(Node.EventType.TOUCH_END, this.hide, this);
    }

    protected onDestroy(): void {
        this.closeBtn.off(Node.EventType.TOUCH_END, this.hide, this);
        this._items.length = 0;
        this._dataMap.clear();
    }

    // 公开方法，供外部调用
    public show() {
        if (!this._built) this.buildList();
        this.node.active = true;

    }

    public hide() {
        this.node.active = false;
    }

     private buildList() {
        this._built = true;
        for (let i = 0; i < BUILDINGS.length; ++i) {
            const data = BUILDINGS[i];
            const itemNode = instantiate(this.itemPrefab);
            itemNode.parent = this.contentNode;
            const item = itemNode.getComponent(BuildItem);
            if (!item) continue;

            item.buildingId = data.id;
            item.nameLabel.string = data.name;
            item.costLabel.string = `${data.cost} 金币`;
            item.iconSprite.spriteFrame = this._iconDict[data.icon] ?? null;
            item.setClickListener(this._onItemClick);

            this._items.push(item);
        }
    }
}