import { _decorator, Camera, Color, Component, EventMouse, EventTouch, Input, input, instantiate, Node, Prefab, resources, Sprite, sys, Vec3 } from 'cc';
import { BuildingData, BUILDINGS } from '../Core/Config/BuildingConfig';
import { EventBus } from '../Core/Event/EventBus';
import { GameConstants} from '../Core/Event/GameConstants';
import { BuildActionPanel } from '../UI/Build/BuildActionPanel';
import { EconomyManager } from '../Core/Manager/EconomyManager';
import { MapManager } from './MapManager';
import { SavedBuildingData } from '../Core/Data/PlayerSaveData';
import { SaveManager } from '../Core/Manager/SaveManager';
const { ccclass, property } = _decorator;

@ccclass('BuildManager')
export class BuildManager extends Component {
    
    @property(Camera) 
    public mainCamera: Camera = null!;

    @property(MapManager) 
    public mapManager: MapManager = null!;

    @property(BuildActionPanel) 
    public buildActionPanel: BuildActionPanel = null!;

    private _builtList: SavedBuildingData[] = []; 

    @property({ type: [Prefab], tooltip: "所有建筑预制体，name 要和配置 prefabName 一致" })
    buildingPrefabs: Prefab[] = [];

    private _prefabDict: Record<string, Prefab> = {};

    private _currentGhost: Node = null!;
    private _isPlacing: boolean = false; 
    private _currentData: BuildingData = null!; 
    private _currentCol: number = 0;
    private _currentRow: number = 0;
    private _canPlaceNow: boolean = false; 
    
    // 标记当前是否正在按压（按住鼠标/手指）
    private _isPressing: boolean = false; 

    protected onLoad(): void {
        for (let i = 0; i < this.buildingPrefabs.length; ++i) {
            const p = this.buildingPrefabs[i];
            if (p) this._prefabDict[p.name] = p;
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
            const prefab = this._prefabDict[config.prefabName];
            if (!prefab) {
                console.warn(`[BuildManager] 缺少建筑预制体: ${config.prefabName}`);
                continue;
            }

            this.mapManager.setBuildingOccupy(built.col, built.row, config.width, config.height);
            
            const realBuilding = instantiate(prefab);
            realBuilding.parent = this.node;
            
            // 恢复位置（注意 2.5D 的中心点偏移）
            const worldPos = this.mapManager.getWorldPosByGrid(
                built.col + (config.width - 1) / 2,
                built.row + (config.height - 1) / 2);
            realBuilding.setWorldPosition(worldPos);
            
            // 恢复名字，方便以后点击
            realBuilding.name = `${built.id}_${built.col}_${built.row}`;    
            
            
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

        const prefab = this._prefabDict[data.prefabName];
        if (!prefab) {
            console.warn(`[BuildManager] 缺少建筑预制体: ${data.prefabName}`);
            return;
        }

        this._currentData = data;
        this._isPlacing = true;

        this._currentGhost = instantiate(prefab);
        this._currentGhost.parent = this.node;

        const sprites = this._currentGhost.getComponentsInChildren(Sprite);
        for (let i = 0; i < sprites.length; ++i) {
            sprites[i].color = new Color(255, 255, 255, 150);
        }

        if (this.buildActionPanel) this.buildActionPanel.hide();
        
    }

    public cancelPlacing() {
        if (this._currentGhost) {
            this._currentGhost.destroy();
            this._currentGhost = null;
        }
        this._isPlacing = false;
        this._currentData = null;
        this._isPressing = false;
        if (this.buildActionPanel) this.buildActionPanel.hide();
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
        if (this.buildActionPanel) this.buildActionPanel.hide();
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
        if (this.buildActionPanel) {
            this.buildActionPanel.show();
            this.buildActionPanel.setConfirmState(this._canPlaceNow);
        }
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

        this.mapManager.setBuildingOccupy(this._currentCol, this._currentRow, this._currentData.width, this._currentData.height);

        const sprites = this._currentGhost.getComponentsInChildren(Sprite);
        for (const sprite of sprites) {
            sprite.color = new Color(255, 255, 255, 255); 
        }
        this._currentGhost.name = `${this._currentData.id}_${this._currentCol}_${this._currentRow}`;


        this._builtList.push({
            id: this._currentData.id,
            col: this._currentCol,
            row: this._currentRow
        });
        // 写入本地存储
        this.saveBuildings();
        
        if (this.buildActionPanel) this.buildActionPanel.hide();

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