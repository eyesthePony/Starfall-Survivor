import { _decorator, Camera, Color, Component, EventMouse, EventTouch, Input, input, instantiate, Node, Prefab, resources, Sprite, SpriteFrame, sys, UITransform, Vec3 } from 'cc';
import { BuildingData, BUILDINGS } from '../Core/Config/BuildingConfig';
import { EventBus } from '../Core/Event/EventBus';
import { GameConstants} from '../Core/Event/GameConstants';
import { EconomyManager } from '../Core/Manager/EconomyManager';
import { MapManager } from './MapManager';
import { SavedBuildingData } from '../Core/Data/PlayerSaveData';
import { SaveManager } from '../Core/Manager/SaveManager';
import { BuildingCategory } from '../Core/Utils/ConfigEnums';
import { ProductionBuilding } from '../Entity/building/ProductionBuilding';
const { ccclass, property } = _decorator;

@ccclass('BuildManager')
export class BuildManager extends Component {
    
    @property(Camera) 
    public mainCamera: Camera = null!;

    @property(MapManager) 
    public mapManager: MapManager = null!;

    private _builtList: SavedBuildingData[] = []; 

    @property({ type: [SpriteFrame], tooltip: "所有建筑图片" })
    public buildingIcons: SpriteFrame[] = [];

    private _iconDict: Record<string, SpriteFrame> = {};

    @property(Prefab)
    baseBuildingPrefab: Prefab = null;

    private _currentGhost: Node = null!;
    private _isPlacing: boolean = false; 
    private _currentData: BuildingData = null!; 
    private _currentCol: number = 0;
    private _currentRow: number = 0;
    private _canPlaceNow: boolean = false; 
    
    // 标记当前是否正在按压（按住鼠标/手指）
    private _isPressing: boolean = false; 



    protected onLoad(): void {
        for (let i = 0; i < this.buildingIcons.length; ++i) {
            const sf = this.buildingIcons[i];
            this._iconDict[sf.name] = sf;
        }
    }

    public init(buildingsData: SavedBuildingData[]) {
        this.loadBuildings(buildingsData);
    }

    private loadBuildings(buildingsData: SavedBuildingData[]) {
        
        this._builtList = buildingsData || [];
        
        // 遍历存档，把建筑重新加载出来
        for(let i=this._builtList.length - 1; i >= 0;--i){
            const built = this._builtList[i];
            const config = BUILDINGS.find(b => b.id === built.id);
            if (!config) {
                console.warn(`[BuildManager] 未知建筑配置: ${built.id}`);
                continue;
            }

            const realBuilding = instantiate(this.baseBuildingPrefab);
            this._finalizeBuilding(realBuilding, config, built.col, built.row, built);
        }    
    }

    private _finalizeBuilding(node: Node, data: BuildingData, col: number, row: number, saved: SavedBuildingData) {
        node.name = `${data.id}_${col}_${row}`;
        node.parent = this.node;

        // 1. 挂载图标（在节点下body节点上挂图标）
        const bodyNode = node.getChildByName("body") || node;
        const sprite = bodyNode.getComponent(Sprite) || bodyNode.addComponent(Sprite);
        if (sprite && this._iconDict[data.icon]) {
            sprite.spriteFrame = this._iconDict[data.icon];
        }

        // 2.尺寸调整（2x2 或 1x1 的建筑）
        const ut = node.getComponent(UITransform);
        if (ut && this.mapManager.tileWidth > 0) {
            ut.width = data.width * this.mapManager.tileWidth;
            ut.height = data.height * this.mapManager.tileHeight;
        }

        // 3. 设置占格与定位
        this.mapManager.setBuildingOccupy(col, row, data.width, data.height);
        const worldPos = this.mapManager.getWorldPosByGrid(
            col + (data.width - 1) / 2, 
            row + (data.height - 1) / 2
        );
        node.setWorldPosition(worldPos);

        // 4. 挂载建筑逻辑（生产、居住）
        if (data.category === BuildingCategory.PRODUCER && data.levels) {
            let producer = node.getComponent(ProductionBuilding);
            if (!producer) producer = node.addComponent(ProductionBuilding);
            producer.init(data, saved.level || 1, saved.lastProduceTime || Date.now());
        }
    }

    protected onEnable() {
        EventBus.on(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, this.startPlacing, this);
        
        // 监听 按下、移动、抬起
        input.on(Input.EventType.MOUSE_DOWN, this.onPressStart, this);
        input.on(Input.EventType.TOUCH_START, this.onPressStart, this);
        
        input.on(Input.EventType.MOUSE_MOVE, this.onPressMove, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onPressMove, this);
        
        input.on(Input.EventType.MOUSE_UP, this.onPressEnd, this);
        input.on(Input.EventType.TOUCH_END, this.onPressEnd, this);

        EventBus.on(GameConstants.EVENT_TYPE.CONFIRM_BUILD_CLICK, this.onConfirmBuild, this);
        EventBus.on(GameConstants.EVENT_TYPE.CANCEL_BUILD_CLICK, this.cancelPlacing, this);
    }

    protected onDisable() {
        EventBus.off(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, this.startPlacing, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onPressStart, this);
        input.off(Input.EventType.TOUCH_START, this.onPressStart, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onPressMove, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onPressMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onPressEnd, this);
        input.off(Input.EventType.TOUCH_END, this.onPressEnd, this);
        EventBus.off(GameConstants.EVENT_TYPE.CONFIRM_BUILD_CLICK, this.onConfirmBuild, this);
        EventBus.off(GameConstants.EVENT_TYPE.CANCEL_BUILD_CLICK, this.cancelPlacing, this);
    }

    public startPlacing(data: BuildingData) {
        if (this._currentGhost) {
            this._currentGhost.destroy();
            this._currentGhost = null;
        }

  
         if (!this.baseBuildingPrefab) {
            console.warn(`[BuildManager] 缺少建筑预制体`);
            return;
        }

        this._currentData = data;
        this._isPlacing = true;

        this._currentGhost = instantiate(this.baseBuildingPrefab);
        this._currentGhost.parent = this.node;

        const bodyNode = this._currentGhost.getChildByName("body") || this._currentGhost;
        const sprite = bodyNode.getComponent(Sprite) || bodyNode.addComponent(Sprite);
        if (sprite && this._iconDict[data.icon]) {
            sprite.spriteFrame = this._iconDict[data.icon];
        }

        const ut = this._currentGhost.getComponent(UITransform);
        if (ut && this.mapManager.tileWidth > 0) {
            ut.width = data.width * this.mapManager.tileWidth;
            ut.height = data.height * this.mapManager.tileHeight;
        }

        const sprites = this._currentGhost.getComponentsInChildren(Sprite);
        for (let i = 0; i < sprites.length; ++i) {
            sprites[i].color = new Color(255, 255, 255, 150);
        }
        
    }

    public cancelPlacing() {
        if (this._currentGhost) {
            this._currentGhost.destroy();
            this._currentGhost = null;
        }
        this._isPlacing = false;
        this._currentData = null;
        this._isPressing = false;

        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.HIDE_BUILD_ACTION_PANEL);
    }

    // 1. 按下时（左键或手指按下）
    private onPressStart(event: EventMouse | EventTouch) {

        if (!this._isPlacing || !this._currentGhost) return;
        
        // 电脑端：如果不是左键，无视
        if (event instanceof EventMouse && event.getButton() !== EventMouse.BUTTON_LEFT) return;

        this._isPressing = true; // 开锁
        this._currentGhost.active = true; // 显示幽灵
        this.updateGhost(event.getLocation().x, event.getLocation().y);
        
        // 拖拽时，隐藏底部UI，把视野让出来
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.HIDE_BUILD_ACTION_PANEL);
    }

    // 2. 移动时
    private onPressMove(event: EventMouse | EventTouch) {
        //  核心防御：如果没按下（在裸移鼠标），或者没在建造模式，直接返回！建筑绝不跟随！
        if (!this._isPlacing || !this._isPressing || !this._currentGhost) return;
        
        this.updateGhost(event.getLocation().x, event.getLocation().y);
    }

    // 3. 抬起时
    private onPressEnd(event: EventMouse | EventTouch) {
        if (!this._isPlacing || !this._currentGhost) return;

        this._isPressing = false; // 上锁！此时无论鼠标怎么滑，建筑都不动了！
        
        // 松手时，最后更新一次坐标
        this.updateGhost(event.getLocation().x, event.getLocation().y);
        
        // 弹出底部确认/取消面板
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL, this._canPlaceNow);
    }

    private updateGhost(screenX: number, screenY: number) {
        if (!this._currentGhost || !this._currentData) return;

        const worldPos = this.mainCamera.screenToWorld(new Vec3(screenX, screenY, 0));
        const snapData = this.mapManager.getSnappedPosition(worldPos, this._currentData.width, this._currentData.height);

        this._currentGhost.setWorldPosition(snapData.pos);
        this._currentCol = snapData.col;
        this._currentRow = snapData.row;  

        this._canPlaceNow = this.mapManager.checkCanPlace(this._currentCol, this._currentRow, this._currentData.width, this._currentData.height);
        
        const sprites = this._currentGhost.getComponentsInChildren(Sprite);
        const targetColor = this._canPlaceNow ? new Color(255, 255, 255, 200) : new Color(255, 50, 50, 200);
        for (const sprite of sprites) {
            sprite.color = targetColor;
        }
    }     

    private onConfirmBuild() {
        if (!this._isPlacing || !this._currentGhost || !this._currentData) return;
        if (!this._canPlaceNow) return;
        
        const cost = this._currentData.cost;
        if (!EconomyManager.instance.spendGold(cost)) {
            console.log(`金币不足！建造需要 ${cost}，当前只有 ${EconomyManager.instance.gold}`);
            return; 
        }

        

        const sprites = this._currentGhost.getComponentsInChildren(Sprite);
        for (const sprite of sprites) {
            sprite.color = new Color(255, 255, 255, 255); 
        }
        const saved: SavedBuildingData = {
            id: this._currentData.id,
            col: this._currentCol,
            row: this._currentRow,
            level: 1,
            lastProduceTime: Date.now()
        };

        this._finalizeBuilding(this._currentGhost, this._currentData, this._currentCol, this._currentRow, saved);

        this._builtList.push(saved);
        this.saveBuildings();
        
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.HIDE_BUILD_ACTION_PANEL);

        this._currentGhost = null;
        this._currentData = null;
        this._isPlacing = false;
        this._isPressing = false;
    }

    // 保存数据到本地
    private saveBuildings() {
        SaveManager.instance.data.buildings = this._builtList;
        SaveManager.instance.save();
    }
}