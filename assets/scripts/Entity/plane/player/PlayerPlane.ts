
import { _decorator, Node, view, EventTouch, UITransform, Vec3 } from 'cc';
import { BasePlane } from '../BasePlane';
import{BulletManager} from '../../../Manager/BulletManager';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
const { ccclass, property} = _decorator;

@ccclass('PlayerPlane')
export class PlayerPlane extends  BasePlane {

   
    @property(Node) 
    muzzle: Node = null!; // 枪口位置

    private halfW = 0;      // 飞机半宽
    private halfH = 0;      // 飞机半高
    private isSelected = false;
       // 默认1秒无敌，子类可以覆盖
    protected invincibiltyDuration:number = 1;
       //飞机无敌时间倒计时
    protected _invincibleTimer: number = 0;
   


    onLoad() {


        // 拿飞机自身的尺寸
        const ut = this.getComponent(UITransform)!;
        this.halfW = ut.width * ut.anchorX;         // 锚点左侧宽度
        this.halfH = ut.height * ut.anchorY;        // 锚点下侧高度

        this._shootDir = new Vec3(0, 1, 0);  // 飞机子弹方向

        // 注册触摸
        this.addTouchListeners();

        //游戏重开事件
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        //游戏状态变化事件，除了游玩状态，其他状态设enable为false
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
        //被敌方子弹击中事件
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_BULLET_HIT, this.onHit, this);

    }

    private onGameReset(){
        // 1. 显示玩家节点
        this.node.active = true;
        
        // 3. 重置逻辑状态
        this._isDead = false;
        this._fireTimer = 0;
        this.hp = this._maxHp; // 恢复满血
        this._invincibleTimer = 0
        
        // 4. 回到屏幕底部正中间
        this.node.setPosition(0, -GameData.screenHeight / 2 + 150, 0);
    }

    

    update(deltaTime: number) {
        if(this._isDead) return;
         // 无敌倒计时，基类统一处理
        if (this._invincibleTimer > 0) {
            this._invincibleTimer -= deltaTime;
        }
        // 执行基类update：无敌计时、开火计时、死亡判断
        super.update(deltaTime);
        
    }

    onStateChanged(state:string){
        const isPlaying = (state === GameConstants.GAME_STATE.PLAYING);

        if (isPlaying) {
            this.enabled = true;                 // 恢复 update（开火等逻辑）
            this.node.resumeSystemEvents(true);  // 恢复触摸响应
        } else {
            this.enabled = false;                // 冻结 update
            this.isSelected = false;             // 强制松开触摸状态
            this.node.pauseSystemEvents(true);   // 彻底屏蔽触摸，防止暂停时还能拖动飞机
        }
    }


    addTouchListeners(){
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    removeTouchListeners(){
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    

    private onTouchStart(e: EventTouch) {
        this.isSelected = true;
    }

    private onTouchMove(e: EventTouch) {
        if (!this.isSelected) return;

        // 直接拿本次触摸相对上次的位移（UI 坐标）
        const delta = e.getUIDelta();

        const pos = this.node.position;
        let newX = pos.x + delta.x;
        let newY = pos.y + delta.y;

        // 边界钳制
        const maxX = GameData.screenWidth/ 2 - this.halfW;
        const maxY = GameData.screenHeight / 2 - this.halfH;
        newX = Math.max(-maxX, Math.min(maxX, newX));
        newY = Math.max(-maxY, Math.min(maxY, newY));

        this.node.setPosition(newX, newY, pos.z);
    }

    private onTouchEnd() {
        this.isSelected = false;
    }

    shoot(){
        BulletManager.instance.spawnBullet(GameConstants.BULLET_TYPE.NORMAL,true, this.muzzle.worldPosition, this._shootDir, 10, 500);
    }

    onHit(playerNode: Node, damage:number){
        // 事件里传的 otherCollider.node 就是玩家节点，判断一下是不是自己
        if (playerNode !== this.node) return;
        this.takeDamage(damage);
    }

    public takeDamage(damage: number): void {
        if (this._invincibleTimer > 0) return;
        if (this.hp <= 0) return; 
        this.hp -= damage;
        this._invincibleTimer = this.invincibiltyDuration; 

        if (this.hp <= 0) {
            this.onDeath();
        }
    }

       // 虚方法，子类重写
    protected onDeath() {
        console.log('[Player] dead');
        this._isDead = true;  //  _isDead用来阻止 update 继续 shoot
        this.node.active = false;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_OVER);
    }


    onDestroy() {
        this.removeTouchListeners();
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED, this.onStateChanged, this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_BULLET_HIT, this.onHit, this);
    }
}