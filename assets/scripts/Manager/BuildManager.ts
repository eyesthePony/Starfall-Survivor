import { _decorator, Camera, Component, EventMouse, EventTouch, Input, input, instantiate, Node, Prefab, UITransform, Vec3, view } from 'cc';
import { MapManager } from './MapManager';
import { GameConstants } from '../Core/GameConstants';
import { EventBus } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('BuildManager')
export class BuildManager extends Component {
    

    @property(Camera)
    public mainCamera:Camera = null;

    @property(Prefab)
    public commandCenetr:Prefab = null;

    private _currentGhost:Node = null;
    
    private _isPlacing = false; // 是否在建造模式


     protected onEnable() {
        EventBus.on(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, this.startPlacing, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onConfirmBuild, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onConfirmBuild, this);
    }

    protected onDisable() {
        EventBus.off(GameConstants.EVENT_TYPE.START_PLACING_BUILDING, this.startPlacing, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onConfirmBuild, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onConfirmBuild, this);
    }

    // 由 UI 按钮调用：进入建造模式
    public startPlacing(buildingIndex: number) {
        this._currentGhost = instantiate(this.commandCenetr);
        this._currentGhost.parent = this.node;
        this._isPlacing = true;
    }

    // 取消建造（比如按了右键或点 UI 取消按钮）
    public cancelPlacing() {
       
    }

    private onMouseMove(event: EventMouse) {
        if (this._isPlacing) this.updateGhost(event.getLocation().x, event.getLocation().y);
    }

    private onTouchMove(event: EventTouch) {
        if (this._isPlacing) this.updateGhost(event.getLocation().x, event.getLocation().y);
    }

    private updateGhost(screenX: number, screenY: number) {
  
        if (!this._currentGhost) return;

        // 1. 把鼠标的屏幕坐标扔给相机
        const uiPos = new Vec3(screenX, screenY, 0);
        
        // 2. 相机直接吐给你完美精准的世界坐标
        const worldPos = this.mainCamera.screenToWorld(uiPos);

        // 3. 直接设置给幽灵建筑
        this._currentGhost.setWorldPosition(worldPos);                            
    }

    // 确认建造
    private onConfirmBuild(event: EventMouse | EventTouch) {
        this._isPlacing = false;
    }

}


