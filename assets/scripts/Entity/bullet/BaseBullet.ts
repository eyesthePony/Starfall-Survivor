import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
import { _decorator, Collider2D, Component, Contact2DType, Vec3, view } from 'cc';
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

    private _direction: Vec3 = new Vec3(0, 1, 0);
    

    private _isDead: boolean = false;   // 防止重复回收

    onLoad() {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    // 新增：显式初始化
    public init(isPlayerBullet: boolean, dir: Vec3, damage: number, speed: number, startPos: Vec3) {
        this.playerBullet = isPlayerBullet;
        if(isPlayerBullet){
            this.getComponent(Collider2D).group = GameConstants.ITEM_GROUP.SELF_BULLET;
        }else{
            this.getComponent(Collider2D).group = GameConstants.ITEM_GROUP.ENEMY_BULLET
        }
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

    update(deltaTime: number) {
        if(this._isDead) return;
        const pos = this.node.position;
        this.node.setPosition(
            pos.x + this._direction.x * this.speed * deltaTime,
            pos.y + this._direction.y * this.speed * deltaTime,
            pos.z
        );

        
            // ========== 屏幕边界检测 飞出屏幕回收 ==========
        const w = GameData.screenWidth / 2;
        const h = GameData.screenHeight / 2;
        const margin = 300;   // ← 够大就行
        // 移动后重新取
        const cur = this.node.position;
        if (cur.x < -w - margin || cur.x > w + margin
        || cur.y < -h - margin || cur.y > h + margin) {
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BULLET_KILLED, this.node);
        }
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
        // 1. 先发战斗事件（GameManager 用）
        if (isSelf) {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, otherCollider.node, this.damage);
        } else {
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_BULLET_HIT, otherCollider.node, this.damage);
        }
 
         EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BULLET_KILLED, this.node);
    }

  


}