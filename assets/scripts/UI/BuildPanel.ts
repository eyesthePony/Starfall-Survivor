import { _decorator, Component, Prefab, instantiate, Node } from 'cc';
import { BuildingData,BUILDINGS } from '../Core/BuildingConfig';
import { BuildItem } from '../Entity/item/BuildItem';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('BuildPanel')
export class BuildPanel extends Component {
    @property(Prefab) itemPrefab: Prefab = null!;
    @property(Node) contentNode: Node = null!; // 挂载了 Layout 的父节点
    @property(Node) closeBtn: Node = null!;

    protected onLoad() {
        this.node.active = false; 
        this.closeBtn.on(Node.EventType.TOUCH_END, this.hide, this);
        EventBus.on(GameConstants.EVENT_TYPE.CLOSE_BUILD_PANEL, this.hide, this);
    }

    protected onDestroy(): void {
        this.closeBtn.off(Node.EventType.TOUCH_END, this.hide, this);
        EventBus.off(GameConstants.EVENT_TYPE.CLOSE_BUILD_PANEL, this.hide, this);
    }

    // 公开方法，供外部调用
    public show() {
        this.node.active = true;
        this.refreshList(); // 刷新列表
    }

    public hide() {
        this.node.active = false;
    }

    private refreshList() {
        this.contentNode.removeAllChildren(); // 清空旧列表

        // 遍历配置表，动态生成
        for (let i = 0; i < BUILDINGS.length; i++) {
            const data = BUILDINGS[i];
            const itemNode = instantiate(this.itemPrefab);
            itemNode.parent = this.contentNode;
            
            // 获取脚本并传入数据
            const itemScript = itemNode.getComponent(BuildItem);
            if (itemScript) {
                itemScript.init(data);
            }
        }
    }
}