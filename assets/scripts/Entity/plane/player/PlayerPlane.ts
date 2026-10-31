
import { _decorator, Node, view, EventTouch, UITransform, Vec3 } from 'cc';
import { BasePlane } from '../BasePlane';
import{BulletManager} from '../../../Manager/BulletManager';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
import { LaserFire } from '../../../Component/Fire/LaserFire';
import { BaseFire } from '../../../Component/Fire/BaseFire';
import { HomingFire } from '../../../Component/Fire/HomingFire';
import { CardConfigData } from '../../../Core/CardConfig';
const { ccclass, property} = _decorator;

@ccclass('PlayerPlane')
export class PlayerPlane extends  BasePlane {

    public static instance: PlayerPlane = null!;
    @property(Node) 
    muzzle: Node = null!; // 枪口位置

    private halfW = 0;      // 飞机半宽
    private halfH = 0;      // 飞机半高
    private isSelected = false;
       // 默认1秒无敌，子类可以覆盖
    protected invincibiltyDuration:number = 1;
       //飞机无敌时间倒计时
    protected _invincibleTimer: number = 0;

    public bulletDamage: number = 10;    // 子弹伤害
    public bulletSpeed: number = 500;    // 子弹速度
    public bulletCount: number = 1;      // 每次发射的子弹数量
    private bulletSpacing: number = 30; //并排的子弹间隔
    private _tempVec3:Vec3 = new Vec3(); 
    
    private _maxX: number = 0;
    private _maxY: number = 0;

    private _activeWeapons: BaseFire[] = [];



    onLoad() {
        PlayerPlane.instance = this;
        this._maxHp = GameData.playerMaxHp;
        this.hp = this._maxHp;
        // 拿飞机自身的尺寸
        const ut = this.getComponent(UITransform)!;
        this.halfW = ut.width * ut.anchorX;         // 锚点左侧宽度
        this.halfH = ut.height * ut.anchorY;        // 锚点下侧高度
        this._maxX = GameData.screenWidth / 2 - this.halfW;
        this._maxY = GameData.screenHeight / 2 - this.halfH;

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
        this._maxHp = GameData.playerMaxHp;
        this.hp = this._maxHp; // 恢复满血
        this._invincibleTimer = 0
         // ✅ 重开时，属性也要恢复初始值（非常重要！）
        this.bulletDamage = 10;
        this.bulletSpeed = 500;
        this.bulletCount = 1;
        this.fireCd = 0.2;
        // 4. 回到屏幕底部正中间
        this.node.setPosition(0, -GameData.screenHeight / 2 + 150, 0);
        //删除子弹组件
        for (let i = 0; i < this._activeWeapons.length; i++) {
            this._activeWeapons[i].destroy();
        }
        this._activeWeapons.length = 0; 
    }

     public applyUpgrade(cardData: CardConfigData) {
         // 1. 状态类卡（直接加属性）
        if (cardData.type === GameConstants.CARD_TYPE.STAT) {
            switch(cardData.id){
                case GameConstants.CARD_ID.DMG_UP:
                    this.bulletDamage += 100;
                    break;

                case GameConstants.CARD_ID.SPD_UP:
                    this.fireCd *= 0.5;
                    break;
                case GameConstants.CARD_ID.MOVE_UP:
                    this.bulletSpeed += 1000;
                    break;
                case GameConstants.CARD_ID.BULLET_UP:
                    this.bulletCount += 2;
                    break;

            }

            
            return;
        }
        // 2. 武器类卡（获得新武器）
        if (cardData.type === GameConstants.CARD_TYPE.WEAPON) {
            if (cardData.targetWeapon ===GameConstants.BULLET_TYPE.LASER) {
                let laser = this.getComponent(LaserFire);
                if (!laser) { // 防止重复挂载
                    laser = this.addComponent(LaserFire);
                    laser.applyConfig({ muzzleNode: this.muzzle, isPlayerBullet: true });
                    this._activeWeapons.push(laser);
                }
            } 
            else if (cardData.targetWeapon === GameConstants.BULLET_TYPE.HOMING) {
                let homing = this.getComponent(HomingFire);
                if (!homing) {
                    homing = this.addComponent(HomingFire);
                    homing.applyConfig({ muzzleNode: this.muzzle, isPlayerBullet: true });
                    this._activeWeapons.push(homing);
                }
            }
            return;
        }

        // 3. 强化类卡（升级已有武器）
        if (cardData.type === GameConstants.CARD_TYPE.UPGRADE) {
           // 直接遍历当前的武器数组，只要有这个标签，就执行强化！
            for (let i = 0; i < this._activeWeapons.length; i++) {
                const weapon = this._activeWeapons[i];
                if (weapon.weaponType === cardData.targetWeapon) {
                    weapon.onUpgrade(cardData.id);
                    break; // 找到了就跳出循环，性能极致
                }
            }
        }
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

        for (let i = 0; i < this._activeWeapons.length; i++) {
            this._activeWeapons[i].enabled = isPlaying;
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
        newX = Math.max(-this._maxX, Math.min(this._maxX, newX));
        newY = Math.max(-this._maxY, Math.min(this._maxY, newY));

        this.node.setPosition(newX, newY, pos.z);
    }

    private onTouchEnd() {
        this.isSelected = false;
    }

    shoot(){
        //子弹发射位置
        const basePos = this.muzzle.worldPosition;
        for (let i = 0; i < this.bulletCount; i++) {
            //由于多个子弹并排发射，计算每个子弹偏移中间子弹的位置
            const offsetX = (i - (this.bulletCount - 1) / 2) * this.bulletSpacing;
            //得到设置偏移位置
            const spawnPos = this._tempVec3.set(basePos.x + offsetX, basePos.y, basePos.z);
            BulletManager.instance.spawnBullet(GameConstants.BULLET_TYPE.NORMAL,
                true, 
                spawnPos, 
                this._shootDir, this.bulletDamage, this.bulletSpeed);
        }
       
    }

    onHit(playerNode: Node, damage:number){
        // 事件里传的 otherCollider.node 就是玩家节点，判断一下是不是自己
        if (playerNode !== this.node) return;
        this.takeDamage(damage);
    }

    public takeDamage(damage: number): void {
        if (this._invincibleTimer > 0) return;
        if (this.hp <= 0) return; 
        this.hp -= 1;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED,this.hp);
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
        if (PlayerPlane.instance === this) {
            PlayerPlane.instance = null!;
        }
    }
}