import { _decorator, Component, EventTouch, EventMouse, input, Input, Vec3, Camera } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraDrag')
export class CameraDrag extends Component {

    // 边界限制
    @property minX = -3000;
    @property maxX = 3000;
    @property minY = -3000;
    @property maxY = 3000;

    // ✅ 缩放限制（正交相机高度，值越小画面越大）
    @property minOrthoHeight = 200;  // 最大放大极限
    @property maxOrthoHeight = 2000; // 最大缩小极限

    private _isDragging = false;
    private _lastTouchPos = new Vec3();
    
    private _lastDistance = 0;
    private _isZooming = false;
    private _camera: Camera = null!;

    protected onLoad() {
        // 获取相机组件
        this._camera = this.getComponent(Camera)!;
        if (!this._camera) {
            console.error("CameraDrag 必须挂在带有 Camera 组件的节点上！");
        }
    }

    protected onEnable() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    protected onDisable() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    // ================== 鼠标滚轮缩放 ==================
    private onMouseWheel(event: EventMouse) {
        const scrollY = event.getScrollY();
        if (scrollY === 0 || !this._camera) return;

        let targetHeight = this._camera.orthoHeight;
        
        // 滚轮值无论多大，我们都按固定比例缩放（10%）
        if (scrollY > 0) {
            targetHeight *= 0.9;  // 放大视野
        } else {
            targetHeight *= 1.1;  // 缩小视野
        }

        this.applyZoom(targetHeight);
    }

    // ================== 触摸（手指）处理 ==================
    private onTouchStart(event: EventTouch) {
        const touches = event.getAllTouches();
        
        if (touches.length === 2) {
            this._isZooming = true;
            this._isDragging = false;
            this._lastDistance = this.getDistance(touches[0].getLocation(), touches[1].getLocation());
        } else if (touches.length === 1) {
            this._isZooming = false;
            this._isDragging = true;
            const loc = event.getLocation();
            this._lastTouchPos.set(loc.x, loc.y, 0);
        }
    }

    private onTouchMove(event: EventTouch) {
        const touches = event.getAllTouches();

        if (this._isZooming && touches.length === 2 && this._camera) {
            const currentDistance = this.getDistance(touches[0].getLocation(), touches[1].getLocation());
            const delta = currentDistance - this._lastDistance;
            
            if (delta !== 0) {
                let targetHeight = this._camera.orthoHeight - (delta * 2); // 触摸缩放灵敏度
                this.applyZoom(targetHeight);
                this._lastDistance = currentDistance;
            }
        } else if (this._isDragging && touches.length === 1) {
            const loc = event.getLocation();
            const dx = loc.x - this._lastTouchPos.x;
            const dy = loc.y - this._lastTouchPos.y;
            
            let newX = this.node.position.x - dx;
            let newY = this.node.position.y - dy;

            newX = Math.max(this.minX, Math.min(this.maxX, newX));
            newY = Math.max(this.minY, Math.min(this.maxY, newY));

            this.node.setPosition(newX, newY, this.node.position.z);
            this._lastTouchPos.set(loc.x, loc.y, 0);
        }
    }

    private onTouchEnd(event: EventTouch) {
        const touches = event.getAllTouches();
        if (touches.length < 2) this._isZooming = false;
        if (touches.length === 0) this._isDragging = false;
    }

    private getDistance(p1: any, p2: any): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ================== 核心：应用相机高度缩放 ==================
    private applyZoom(targetHeight: number) {
        if (!this._camera) return;
        
        // 限制范围，防止无限制缩放
        targetHeight = Math.max(this.minOrthoHeight, Math.min(this.maxOrthoHeight, targetHeight));
        
        // ✅ 修改正交高度
        this._camera.orthoHeight = targetHeight;
    }
}