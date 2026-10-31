import { _decorator, Component, Collider2D, Contact2DType, UITransform, Vec3, tween, UIOpacity, BoxCollider2D, Node } from 'cc';
import { EventBus } from '../../Core/EventBus';
import { GameConstants } from '../../Core/GameConstants';
import { BasePlane } from '../../Entity/plane/BasePlane';
import { DamageStats } from '../../Core/DamageStats';
const { ccclass, property } = _decorator;

@ccclass('Laser')
export class Laser extends Component {
    @property({ tooltip: "激光单次伤害（会按间隔扣除）" }) 
    public damage: number = 20;
    
    @property({ tooltip: "激光最大长度" }) 
    public maxLength: number = 1500; 

    @property({ tooltip: "激光持续时间(秒)" }) 
    public duration: number = 1.0; 

    @property({ tooltip: "伤害结算间隔(秒)" }) 
    public damageInterval: number = 0.1; 

    private _isDead: boolean = false;
    private playerBullet: boolean = true;
    
    // 记录当前正在被激光照射的敌人
    private _enemiesInLaser: Set<Node> = new Set(); 
    private _damageTimer: number = 0;
    private _lifeTimer: number = 0;
    private _opacity: UIOpacity = null; // 缓存透明度组件
    private _boxCollider: BoxCollider2D = null;


    // 用来记录要跟随的飞机节点
    private _followTarget: Node = null; 

    protected onLoad() {
        this._boxCollider = this.getComponent(BoxCollider2D);
        if ( this._boxCollider) {
             this._boxCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            // 👈 监听离开事件，敌人走出去后就不再扣血
             this._boxCollider.on(Contact2DType.END_CONTACT, this.onEndContact, this); 
        }

         // 👈 必须加上这一行！先获取，没有就添加一个
        this._opacity = this.getComponent(UIOpacity) || this.addComponent(UIOpacity);
    }

    protected onEnable() {

        // 👈 核心防御：恢复的一瞬间，强制刷新一次位置！
        if (this._followTarget && this._followTarget.isValid) {
            this.node.setWorldPosition(this._followTarget.worldPosition);
        }
    }

    public init(isPlayerBullet: boolean, dir: Vec3, damage: number, speed: number, startPos: Vec3,followNode: Node = null) {
        this.playerBullet = isPlayerBullet;
        
        if (this._boxCollider) {
            if(isPlayerBullet){
                this._boxCollider.group = GameConstants.ITEM_GROUP.SELF_BULLET;
            }else{
                this._boxCollider.group = GameConstants.ITEM_GROUP.ENEMY_BULLET;
            }
        }

        this.damage = damage;
        this._isDead = false;
        this._enemiesInLaser.clear(); 
        this._damageTimer = 0;
        this._lifeTimer = 0; 
        this._followTarget = followNode; // 记录飞机节点

        this.node.setWorldPosition(startPos);

        // 1. 旋转
        const angleRad = Math.atan2(dir.y, dir.x);
        this.node.angle = (angleRad * 180 / Math.PI) - 90;

        const bodyNode = this.node.children[0]; 
        if (bodyNode) {
            const bodyUT = bodyNode.getComponent(UITransform);
            if (bodyUT) {
                // 也可以把宽度设大一点，比如 40，显得更粗
                bodyUT.setContentSize(40, this.maxLength); 
            }
        }

        // 2. 拉长
        const ut = this.getComponent(UITransform);
        if (ut) {
            ut.height = this.maxLength;
        }

        // 3. 同步拉长碰撞体
        if (this._boxCollider) {
             // 宽度可以设宽一点，比如 40
            this._boxCollider.size.set(40, this.maxLength); 
            this._boxCollider.offset.set(0, this.maxLength / 2); 
            this._boxCollider.apply(); 
        }

        
        
         // 4. 重置透明度
        if (this._opacity) {
            this._opacity.opacity = 255;
        }
    }

    // 持续伤害的核心逻辑：每帧检查时间，到点就AOE
    update(deltaTime: number) {
        if (this._isDead) return;

        // 如果设置了跟随目标，每一帧都把激光的位置同步到飞机上！
        if (this._followTarget && this._followTarget.isValid) {
            this.node.setWorldPosition(this._followTarget.worldPosition);
        }

        // 1. 生命周期倒计时
        this._lifeTimer += deltaTime;

         // 计算当前的透明度（前80%时间满透明，后20%时间渐隐）
        if (this._opacity) {
            const fadeStartTime = this.duration * 0.8;
            if (this._lifeTimer > fadeStartTime) {
                // 剩下的时间（0 到 1 之间）
                const fadeProgress = (this._lifeTimer - fadeStartTime) / (this.duration * 0.2); 
                this._opacity.opacity = 255 * (1 - fadeProgress);
            }
        }

        
        if (this._lifeTimer >= this.duration) {
            this.destroyLaser();
            return;
        }

        this._damageTimer += deltaTime;
        if (this._damageTimer >= this.damageInterval) {
            this._damageTimer = 0;
            this.dealDamage();
        }
    }

    private dealDamage() {
        if (this._enemiesInLaser.size === 0) return;

        // 遍历当前在激光里的所有敌人
        this._enemiesInLaser.forEach(enemyNode => {
            // 防御：如果敌人已经被别的子弹打死了，跳过
             if (!enemyNode.active || !enemyNode.isValid) {
                this._enemiesInLaser.delete(enemyNode);
                return;
            }
            
            const target = enemyNode.getComponent(BasePlane);
            // 如果血量见底了，也删掉
            if (target && target.isDead) {
                this._enemiesInLaser.delete(enemyNode);
                return;
            }


            // 扣血
            if (this.playerBullet) {
                EventBus.dispatchEvent(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, enemyNode, this.damage);
                DamageStats.instance.addDamage("激光射线", this.damage);
            } else {
                EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_BULLET_HIT, enemyNode, this.damage);
            }
        });
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        if (this._isDead) return;
        
        const isSelf = selfCollider.group === GameConstants.ITEM_GROUP.SELF_BULLET && otherCollider.group === GameConstants.ITEM_GROUP.ENEMY_PLANE;
        const isEnemy = selfCollider.group === GameConstants.ITEM_GROUP.ENEMY_BULLET && otherCollider.group === GameConstants.ITEM_GROUP.SELF_PLANE;

        if (!isSelf && !isEnemy) return;

        // 进入激光范围，加入列表
        this._enemiesInLaser.add(otherCollider.node);
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        if (this._isDead) return;
        
        // 离开激光范围，从列表中移除
        if (this._enemiesInLaser.has(otherCollider.node)) {
            this._enemiesInLaser.delete(otherCollider.node);
        }
    }

    private destroyLaser() {
        if (this._isDead) return;
        this._isDead = true;
        this._enemiesInLaser.clear();
        this._followTarget = null; // 清空目标，防止对象池复用时乱跟
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BULLET_KILLED, this.node);
    }

    protected onDestroy() {

        if (this._boxCollider) {
            this._boxCollider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this._boxCollider.off(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }
}