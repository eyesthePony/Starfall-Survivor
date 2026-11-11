import { _decorator, Camera, Color, Component, EventMouse, EventTouch, Input, input, instantiate, Node, Prefab, resources, Sprite, SpriteFrame, sys, UITransform, Vec2, Vec3 } from 'cc';
import { BuildingData, BUILDINGS } from '../Core/Config/BuildingConfig';
import { EventBus } from '../Core/Event/EventBus';
import { GameConstants} from '../Core/Event/GameConstants';
import { EconomyManager } from '../Core/Manager/EconomyManager';
import { MapManager } from './MapManager';
import { SavedBuildingData } from '../Core/Data/PlayerSaveData';
import { SaveManager } from '../Core/Manager/SaveManager';
import { BuildingCategory, RoadState } from '../Core/Utils/ConfigEnums';
import { ProductionBuilding } from '../Entity/building/ProductionBuilding';
import { GameData } from '../Core/Data/GameData';
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

    private _lastScreenPos: Vec3 = new Vec3();
    private _hasValidPos: boolean = false;

    //道路修建
    private _roadState:RoadState = RoadState.IDLE;
    private _roadStartCol:number = 0;
    private _roadStartRow:number = 0;
    private _roadEndCol: number = -1;
    private _roadEndRow: number = -1;
    private _roadPreviewNodes: Node[] = [];

    private _tempScreenPos: Vec3 = new Vec3();
    private _tempWorldPos: Vec3 = new Vec3();
    private _tempEventPos:Vec2 = new Vec2();

    private static readonly COLOR_CAN_PLACE = new Color(255, 255, 255, 200);
    private static readonly COLOR_CANNOT_PLACE = new Color(255, 50, 50, 200);
    private static readonly COLOR_SOLID = new Color(255, 255, 255, 255);
     private static readonly COLOR_ROAD_PREVIEW = new Color(100, 200, 255, 150)
    private _ghostSprites: Sprite[] = []; 

    




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

        const bodyNode = node.getChildByName("body") || node;
        const sprite = bodyNode.getComponent(Sprite) || bodyNode.addComponent(Sprite);
        
        if (sprite && this._iconDict[data.icon]) {
            const sf = this._iconDict[data.icon];
            sprite.spriteFrame = sf;
            sprite.sizeMode = Sprite.SizeMode.TRIMMED;

            // 读取裁切后的真实宽度
            const imgWidth = sf.rect.width;           

            if (imgWidth > 0) {
                // 1. 宽度强制对齐格子宽度
                const targetWidth = data.width * this.mapManager.tileWidth;
                const scale = targetWidth / imgWidth;
                node.setScale(scale, scale, 1);

                // 2. 获取纯网格的绝对正中心点
                const worldPos = this.mapManager.getWorldPosByGrid(
                    col + (data.width - 1) / 2, 
                    row + (data.height - 1) / 2
                );

                worldPos.y -= (data.height * this.mapManager.tileHeight) / 2;
              
                node.setWorldPosition(worldPos);
            }
        }
        
        this.mapManager.setBuildingOccupy(col, row, data.width, data.height,data.category);

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
        this._isPressing = false;   


        this._currentGhost = instantiate(this.baseBuildingPrefab);
        this._currentGhost.parent = this.node;

        //=========幽灵建筑初始位置==============
        let targetScreenX = this._lastScreenPos.x;
        let targetScreenY = this._lastScreenPos.y;

         if (!this._hasValidPos) {
            this._tempScreenPos.set(GameData.viewW / 2, GameData.viewH / 2, 0);
        } else {
            this._tempScreenPos.set(targetScreenX, targetScreenY, 0);
        }

        
        // 1. 屏幕坐标 -> 世界坐标
        this.mainCamera.screenToWorld(this._tempScreenPos, this._tempWorldPos);

        // 2. 用 MapManager 算吸附点
        const snapData = this.mapManager.getSnappedPosition(this._tempWorldPos, data.width, data.height);

        const finalPos = snapData.pos;
        finalPos.y -= (data.height * this.mapManager.tileHeight) / 2;
        
        this._currentGhost.setWorldPosition(finalPos);


        //判断能否直接建造
        this._currentCol = snapData.col;
        this._currentRow = snapData.row;
        if (data.category === BuildingCategory.ROAD) {
            this._roadState = RoadState.SELECTING_START;
            this._canPlaceNow = this.mapManager.checkCanBuildRoad(this._currentCol, this._currentRow);
        } else {
            this._roadState = RoadState.IDLE;
            this._canPlaceNow = this.mapManager.checkCanPlace(this._currentCol, this._currentRow, data.width, data.height);
        }
       
        const bodyNode = this._currentGhost.getChildByName("body") || this._currentGhost;
        const sprite = bodyNode.getComponent(Sprite) || bodyNode.addComponent(Sprite);



        if (sprite && this._iconDict[data.icon]) {
            const sf = this._iconDict[data.icon];
            sprite.spriteFrame = sf;
            sprite.sizeMode = Sprite.SizeMode.TRIMMED;

            if (sf.rect.width > 0) {
                const targetWidth = data.width * this.mapManager.tileWidth;
                const scale = targetWidth / sf.rect.width;
                this._currentGhost.setScale(scale, scale, 1);
            }
        }

        this._ghostSprites = this._currentGhost.getComponentsInChildren(Sprite);
        const targetColor = this._canPlaceNow ? BuildManager.COLOR_CAN_PLACE : BuildManager.COLOR_CANNOT_PLACE;
        for (let i = 0; i < this._ghostSprites.length; ++i) {
            this._ghostSprites[i].color = targetColor;
        }
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL,this._canPlaceNow);
    }

    public cancelPlacing() {
        if (this._currentGhost) {
            this._currentGhost.destroy();
            this._currentGhost = null;
        }
        this.clearRoadPreview(); 
        this._isPlacing = false;
        this._currentData = null;
        this._isPressing = false;
        this._roadState = RoadState.IDLE;

        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.HIDE_BUILD_ACTION_PANEL);
    }

    // 1. 按下时（左键或手指按下）
    private onPressStart(event: EventMouse | EventTouch) {
        if (!this._isPlacing || !this._currentGhost) return;
        
        // 电脑端：如果不是左键，无视
        if (event instanceof EventMouse && event.getButton() !== EventMouse.BUTTON_LEFT) return;



        this._isPressing = true; // 开锁
        this._currentGhost.active = true; // 显示幽灵

        

        event.getLocation(this._tempEventPos);
        if (this._roadState === RoadState.DRAGGING) {
            this.updateRoadDrag(this._tempEventPos.x, this._tempEventPos.y);
            return;
        }
        this.updateGhost(this._tempEventPos.x,this._tempEventPos.y);
        
    }

    // 2. 移动时
    private onPressMove(event: EventMouse | EventTouch) {
        //  核心防御：如果没按下（在裸移鼠标），或者没在建造模式，直接返回！建筑绝不跟随！
        if (!this._isPlacing || !this._isPressing || !this._currentGhost) return;

        
        
        event.getLocation(this._tempEventPos);
        if (this._roadState === RoadState.DRAGGING) {
            this.updateRoadDrag(this._tempEventPos.x, this._tempEventPos.y);
            return;
        }
        this.updateGhost(this._tempEventPos.x,this._tempEventPos.y);
    }

    // 3. 抬起时
    private onPressEnd(event: EventMouse | EventTouch) {
        if (!this._isPlacing) {
            event.getLocation(this._tempEventPos);
            this._lastScreenPos.set(this._tempEventPos.x, this._tempEventPos.y, 0);
            this._hasValidPos = true;
        }
        if (!this._isPlacing || !this._currentGhost) return;

        this._isPressing = false; // 上锁！此时无论鼠标怎么滑，建筑都不动了！
        
        
        // 松手时，最后更新一次坐标
        event.getLocation(this._tempEventPos);
        if (this._roadState === RoadState.DRAGGING) {
            this.updateRoadDrag(this._tempEventPos.x, this._tempEventPos.y);
            return;
        }
        this.updateGhost(this._tempEventPos.x,this._tempEventPos.y);
        
        // 弹出底部确认/取消面板
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL, this._canPlaceNow);
    }

    private updateGhost(screenX: number, screenY: number) {
        if (!this._currentGhost || !this._currentData) return;

        this._tempScreenPos.set(screenX, screenY, 0);
        this.mainCamera.screenToWorld(this._tempScreenPos, this._tempWorldPos);
        const snapData = this.mapManager.getSnappedPosition(this._tempWorldPos, this._currentData.width, this._currentData.height);


        const finalPos = snapData.pos;
        finalPos.y -= (this._currentData.height * this.mapManager.tileHeight) / 2;
        this._currentGhost.setWorldPosition(finalPos);

        

        const prevCanPlace = this._canPlaceNow;

        this._currentCol = snapData.col;
        this._currentRow = snapData.row;
        if (this._currentData.category === BuildingCategory.ROAD) {
            this._canPlaceNow = this.mapManager.checkCanBuildRoad(this._currentCol, this._currentRow);
        } else {
            this._canPlaceNow = this.mapManager.checkCanPlace(
                this._currentCol, this._currentRow,
                this._currentData.width, this._currentData.height
            );
        }

        if (prevCanPlace !== this._canPlaceNow) {
            const targetColor = this._canPlaceNow ? BuildManager.COLOR_CAN_PLACE : BuildManager.COLOR_CANNOT_PLACE;
            for (let i = 0; i < this._ghostSprites.length; ++i) {
                this._ghostSprites[i].color = targetColor;
            }
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL, this._canPlaceNow);
        }
    }

    private updateRoadDrag(screenX: number, screenY: number){
        this._tempScreenPos.set(screenX, screenY, 0);
        this.mainCamera.screenToWorld(this._tempScreenPos, this._tempWorldPos);
        const snapData = this.mapManager.getSnappedPosition(this._tempWorldPos, 1, 1);

        let currCol = snapData.col;
        let currRow = snapData.row;

        // 🌟 核心约束：谁大锁死另一个
        const deltaCol = Math.abs(currCol - this._roadStartCol);
        const deltaRow = Math.abs(currRow - this._roadStartRow);

        if (deltaCol >= deltaRow) {
            currRow = this._roadStartRow; // 横向走
        } else {
            currCol = this._roadStartCol; // 纵向走
        }

        if (currCol === this._roadEndCol && currRow === this._roadEndRow) return;

        this._roadEndCol = currCol;
        this._roadEndRow = currRow;
        const isValid = this.refreshRoadPreview();
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.SHOW_BUILD_ACTION_PANEL, isValid);
    }

    private refreshRoadPreview(): boolean {
        this.clearRoadPreview();
        
        const points = this.mapManager.getGridLine(this._roadStartCol, this._roadStartRow, this._roadEndCol, this._roadEndRow);
        const sf = this._iconDict[this._currentData.icon];
        
        let isValid = true; // 🌟 标记整条线是否合法

        for (let i = 0; i < points.length; ++i) {
            const val = points[i];
            const col = Math.floor(val / 100);
            const row = val % 100;

            const canBuild = this.mapManager.checkCanBuildRoad(col, row);
            if (!canBuild) {
                isValid = false; // 只要碰到一个建筑，整条线就作废
            }

            const preview = instantiate(this.baseBuildingPrefab);
            preview.parent = this.node;
            
            const body = preview.getChildByName("body") || preview;
            const sprite = body.getComponent(Sprite) || body.addComponent(Sprite);
            
            if (sprite && sf) {
                sprite.spriteFrame = sf;
                sprite.sizeMode = Sprite.SizeMode.TRIMMED;
                sprite.color = canBuild ? BuildManager.COLOR_ROAD_PREVIEW : BuildManager.COLOR_CANNOT_PLACE; 
            }

            if (sf && sf.rect.width > 0) {
                const scale = this.mapManager.tileWidth / sf.rect.width;
                preview.setScale(scale, scale, 1);
            }

            const pos = this.mapManager.getWorldPosByGrid(col, row);
            pos.y -= this.mapManager.tileHeight / 2;
            preview.setWorldPosition(pos);

            this._roadPreviewNodes.push(preview);
        } 
        
        return isValid; // 🌟 返回结果
    }


    private clearRoadPreview(){
        for (let i = 0; i < this._roadPreviewNodes.length; ++i) {
            if (this._roadPreviewNodes[i]) {
                this._roadPreviewNodes[i].destroy();
            }
        }
        this._roadPreviewNodes.length = 0;
    }

     private buildRoadLine() {
        const points = this.mapManager.getGridLine(this._roadStartCol, this._roadStartRow, this._roadEndCol, this._roadEndRow);
        const cost = this._currentData.cost;
        let count = 0;

        for (let i = 0; i < points.length; ++i) {
            const val = points[i];
            const col = Math.floor(val / 100);
            const row = val % 100;

            if (this.mapManager.mapData[row][col] === 0) {
                if (EconomyManager.instance.spendGold(cost)) {
                    const node = instantiate(this.baseBuildingPrefab);
                    const saved: SavedBuildingData = { 
                        id: this._currentData.id, col: col, row: row, level: 1, lastProduceTime: Date.now() 
                    };
                    
                    this._finalizeBuilding(node, this._currentData, col, row, saved);
                    this._builtList.push(saved);
                    count++;
                } else {
                    console.log("金币不足，道路建造中断！");
                    break;
                }
            }
        }

        if (count > 0) this.saveBuildings();
        this.cancelPlacing(); // 建造完直接退出铺路模式
    }

    private onConfirmBuild() {
        if (!this._isPlacing || !this._currentGhost || !this._currentData) return;
         if (this._roadState != RoadState.IDLE){
             if (this._roadState === RoadState.SELECTING_START) {
                // 第一次点确定：进入画线模式
                // - 记录起点 (this._roadStartCol, this._roadStartRow) 
                this._roadStartCol = this._currentCol;
                this._roadStartRow = this._currentRow;
                //记录终点
                this._roadEndCol = this._currentCol;
                this._roadEndRow = this._currentRow;
                this._currentGhost.active = false;
                // - 把状态变成 RoadState.DRAGGING
                this._roadState = RoadState.DRAGGING;
                this.refreshRoadPreview(); 
                return;
            }else if(this._roadState === RoadState.DRAGGING){
                this.buildRoadLine();
                return;
            }
        }

        if (!this._canPlaceNow) return;
        
        const cost = this._currentData.cost;
        if (!EconomyManager.instance.spendGold(cost)) {
            console.log(`金币不足！建造需要 ${cost}，当前只有 ${EconomyManager.instance.gold}`);
            return; 
        }

        

        for (let i = 0; i < this._ghostSprites.length; ++i) {
            this._ghostSprites[i].color = BuildManager.COLOR_SOLID;
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