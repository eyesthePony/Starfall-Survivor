import { _decorator,Sprite,SpriteFrame,UITransform, Vec3,  } from 'cc';
import { BasePlane } from '../BasePlane';
import { BulletManager } from '../../../Manager/BulletManager';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { EffectManager } from '../../../Core/EffectManager';
import { AudioManager } from '../../../Core/AudioManager';
import { GameData } from '../../../Core/GameData';
import { EnemyData } from '../../../Core/EnemyConfig';
const { ccclass,property} = _decorator;

@ccclass('EnemyPlane')
export class EnemyPlane extends BasePlane  {
    
    private halfH = 0;      // 飞机半高
    private bottomY = 0;
    //=====飞机子弹属性=======
    private _bulletType: string;
    private _bulletDamage: number;
    private _bulletSpeed: number;
    //======飞机贴图=========
    private _sprite: Sprite;

   
    


 
    onLoad() {

        this.bottomY = -GameData.viewH / 2;   //底部的Y坐标

        const ut = this.getComponent(UITransform)!; //获取飞机的组件
        this.halfH = ut.height / 2;                 //飞机高度的一半

        this._shootDir = new Vec3(0, -1, 0);  // 飞机子弹方向向下
        this._sprite = this.node.getChildByName("body")?.getComponent(Sprite);

    }

    /**
     * 
     * 初始化飞机
     */
    public init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame) {
        this.node.setPosition(position);
        this._maxHp = cfg.maxHp * hpMultiplier;
        this.hp = this._maxHp;
        this.moveSpeed = cfg.speed;
        this.fireCd = cfg.fireInterval ?? 1;
        this._bulletType = cfg.bulletType ?? GameConstants.BULLET_TYPE.YELLOWBULLET
        this._bulletDamage = cfg.bulletDamage ?? 1;
        this._bulletSpeed = cfg.bulletSpeed ?? 200;
        const s = cfg.scale ?? 1;
        this.node.setScale(s,s,1);
        if (this._sprite && sf) this._sprite.spriteFrame = sf;
        this._isDead = false;
        this._fireTimer = 0;
        this.enabled = true;
    }


    update(deltaTime: number) {
        if(this._isDead) return;
        // 执行基类update：无敌计时、开火计时、死亡判断
        super.update(deltaTime);

        /**
         * 这里使用局部坐标position来判断出界
         * 由于enemy是enemymanger子节点，position就是相对于enemymanger的坐标
         * 不过由于enemymanger对齐了canvas的坐标，所以相当于相对于canavs的坐标
         * 目前能用
         */
        const cur = this.node.position;
        const newY = cur.y - this.moveSpeed * deltaTime;
        this.node.setPosition(cur.x, newY, cur.z);

        if (newY - this.halfH < this.bottomY) {
            this._isDead = true;
            EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_ESCAPED, this.node);
            return;
        }
    }



    shoot(){
        BulletManager.instance.spawnBullet(this._bulletType,false, this.node.worldPosition, this._shootDir, this._bulletDamage,this._bulletSpeed);
    }


    

    protected onDeath(): void {
        if(this._isDead) return;
        this._isDead = true;
        const pos = this.node.worldPosition.clone(); //获取当前世界坐标，避免节点回收后，坐标得不到。
        EffectManager.instance.play(GameConstants.EFFECT_TYPE.EXPLOSION, pos ,2);
        AudioManager.instance.playOneShot(GameConstants.AUDIO_TYPE.BOOM,1);
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.node);
    }

    
}