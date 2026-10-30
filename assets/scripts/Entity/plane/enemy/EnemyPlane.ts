import { _decorator, UITransform, Vec3, view } from 'cc';
import { BasePlane } from '../BasePlane';
import { BulletManager } from '../../../Manager/BulletManager';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { EffectManager } from '../../../Core/EffectManager';
import { AudioManager } from '../../../Core/AudioManager';
import { GameData } from '../../../Core/GameData';
const { ccclass} = _decorator;

@ccclass('EnemyPlane')
export class EnemyPlane extends BasePlane  {
    
    private halfH = 0;      // 飞机半高
    private bottomY = 0;

    


    /**
     * 获得屏幕尺寸和底部Y来判断出界
     *获取飞机尺寸来判断飞机出界
     */
    onLoad() {
   

        this.bottomY = -GameData.screenHeight / 2;   //底部的Y坐标

        const ut = this.getComponent(UITransform)!; //获取飞机的组件
        this.halfH = ut.height / 2;                 //飞机高度的一半

        this._shootDir = new Vec3(0, -1, 0);  // 飞机子弹方向向下

    }

    /**
     * 
     * 初始化飞机
     */
    public init(position: Vec3) {
        this.node.setPosition(position);//设置初始位置
        this._maxHp = 10;          //设置血量上限
        this.hp = 10;              //设置血量
        this._isDead = false;      //死亡判断重置
        this._fireTimer = 0;          //开火时间
        this.fireCd = 1;         //开火间隔
        this._shootDir.y = -1;
        this.enabled = true; 
    }

    update(deltaTime: number) {
        if(this._isDead) return;
        // 执行基类update：无敌计时、开火计时、死亡判断
        super.update(deltaTime);

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
        BulletManager.instance.spawnBullet(GameConstants.BULLET_TYPE.NORMAL,false, this.node.worldPosition, this._shootDir, 10, 500);
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