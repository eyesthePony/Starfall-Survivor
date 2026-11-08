import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
import { _decorator, Collider2D, Component, Contact2DType, SpriteFrame,Sprite, Vec3 } from 'cc';
import { BasePlane } from '../plane/BasePlane';
import { GameData } from '../../Core/GameData';
const { ccclass, property } = _decorator;

@ccclass('BaseBullet')
export class BaseBullet extends Component {
    @property({ tooltip: "子弹速度" })
    public speed: number = 200;

    @property({ tooltip: "子弹伤害" })
    public damage: number = 100;



    @property({ tooltip: "是否是玩家子弹" })
    public playerBullet: boolean = true;

    protected _direction: Vec3 = new Vec3(0, 1, 0);
    

    protected _isDead: boolean = false;   // 防止重复回收

    private _collider: Collider2D = null;

    private _halfW = 0;
    private _halfH = 0;
    private _sprite: Sprite = null;

    onLoad() {
        this._halfW = GameData.viewW / 2;
        this._halfH = GameData.viewH / 2;
        this._collider = this.getComponent(Collider2D);
        if (this._collider) {
            this._collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
        this._sprite = this.node.getChildByName("body")?.getComponent(Sprite);
    }

    // 新增：显式初始化
    public init(isPlayerBullet: boolean, dir: Vec3, damage: number, speed: number, startPos: Vec3,sf:SpriteFrame) {
        this.playerBullet = isPlayerBullet;

        if (this._collider) {
            this._collider.group = isPlayerBullet? GameConstants.ITEM_GROUP.SELF_BULLET: GameConstants.ITEM_GROUP.ENEMY_BULLET;
        }

     
        if (this._sprite && sf)this._sprite.spriteFrame = sf;
           
       
        this.damage = damage;
        this.speed = speed;
        this._direction.set(dir);
        this.node.setWorldPosition(startPos);  


        const angleRad = Math.atan2(this._direction.y, this._direction.x);
        const angleDeg = angleRad * 180 / Math.PI;
        
        // 减去 90 度，因为美术素材默认是朝上的
        this.node.angle = angleDeg - 90; 
        this._isDead = false;
        this.enabled = true; 
    }

    protected move(deltaTime:number){
        const pos = this.node.position;
        const nx = pos.x + this._direction.x * this.speed * deltaTime;
        const ny = pos.y + this._direction.y * this.speed * deltaTime;
        this.node.setPosition(nx, ny, pos.z);
    }

    /**
         * 这里使用局部坐标position来判断出界
         * 由于bullet是bulletmanger子节点，position就是相对于bulletmanger的坐标
         * 不过由于bulletmanger对齐了canvas的坐标，所以相当于相对于canavs的坐标
         * 目前能用
    */
    protected checkOutOfBounds(){
        const MARGIN = 30;   // 按子弹贴图半径取 20~40
        const pos = this.node.position;
        if (pos.x < -this._halfW - MARGIN || pos.x > this._halfW + MARGIN ||
            pos.y < -this._halfH - MARGIN || pos.y > this._halfH + MARGIN) { 
                this._isDead = true;
                EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BULLET_KILLED, this.node);
            }   
    }

    update(deltaTime: number) {
        if(this._isDead) return;
        this.move(deltaTime);
        this.checkOutOfBounds();
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        //如果子弹以及碰撞过一次了，不再碰撞
        if(this._isDead) return;
        
        //判断是否撞击敌方。没有就返回
        const isSelf = selfCollider.group === GameConstants.ITEM_GROUP.SELF_BULLET
                    && otherCollider.group === GameConstants.ITEM_GROUP.ENEMY_PLANE;
        const isEnemy = selfCollider.group === GameConstants.ITEM_GROUP.ENEMY_BULLET
                     && otherCollider.group === GameConstants.ITEM_GROUP.SELF_PLANE;
                    

        if (!isSelf && !isEnemy) return;

        //判断敌方是否已死，主要防止子弹射速太快，敌人被上个子弹打死还没回收，就被下一个子弹碰到
        const target = otherCollider.getComponent(BasePlane);
        if (target && target.isDead) {
            return; // 对方已经死了，子弹穿过去
        }

        this._isDead = true;
        //  先发回收子弹事件，再发命中事件
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BULLET_KILLED, this.node);
        if (isSelf) {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, otherCollider.node, this.damage);
        } else {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_BULLET_HIT, otherCollider.node, this.damage);
        }
 
    }

  


}