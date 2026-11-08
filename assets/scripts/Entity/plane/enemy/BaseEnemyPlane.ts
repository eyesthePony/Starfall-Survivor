import { _decorator,Sprite,SpriteFrame,UITransform, Vec3,  } from 'cc';
import { BasePlane } from '../BasePlane';
import { BulletManager } from '../../../Manager/BulletManager';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { EffectManager } from '../../../Core/EffectManager';
import { AudioManager } from '../../../Core/AudioManager';
import { EnemyData } from '../../../Core/EnemyConfig';
const { ccclass,property} = _decorator;

@ccclass('BaseEnemyPlane')
export class BaseEnemyPlane extends BasePlane  {
    

    //=====飞机子弹属性=======
    private _bulletType: string;
    private _bulletDamage: number;
    private _bulletSpeed: number;
    //======飞机贴图=========
    private _sprite: Sprite;

   
    


 
    onLoad() {

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
        this.expReward = cfg.expReward;
        this.ramDamage = cfg.damage;
        this.moveSpeed = cfg.speed;
        if (cfg.bulletType && cfg.fireInterval) {
            // 只有配置了子弹类型和间隔，才会开火
            this.fireCd = cfg.fireInterval;
            this._bulletType = cfg.bulletType;
            this._bulletDamage = cfg.bulletDamage ?? 1;
            this._bulletSpeed = cfg.bulletSpeed ?? 200;
        } else {
            // 没配子弹，直接变成哑巴
            this.fireCd = 999999; 
        }
        const s = cfg.scale ?? 1;
        this.node.setScale(s,s,1);
        if (this._sprite && sf) this._sprite.spriteFrame = sf;
        this._isDead = false;
        this._fireTimer = 0;
        this.enabled = true;
    }




    shoot(){
        if (!this._bulletType) return; 
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