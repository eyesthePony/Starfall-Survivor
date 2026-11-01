import { _decorator, Component, Game, Node, Prefab, Vec3 } from 'cc';
import { BaseBullet } from '../Entity/bullet/BaseBullet';
import{PoolManager} from '../Core/PoolManager';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { Laser } from '../Entity/bullet/Laser';
const { ccclass, property } = _decorator;

@ccclass('BulletManager')
export class BulletManager extends Component {

    static instance: BulletManager = null!;   

    @property({ type: Prefab, tooltip: "玩家普通子弹" })
    normalPlayerBulletPrefab: Prefab = null!;

    @property({ type: Prefab, tooltip: "敌人普通子弹" })
    normalEnemyBulletPrefab: Prefab = null!;

    @property({ type: Prefab, tooltip: "冰霜子弹" })
    iceBulletPrefab: Prefab = null!;

    @property({ type: Prefab, tooltip: "激光" })
    leserPrefab: Prefab = null!;

    @property({ type: Prefab, tooltip: "追踪弹" })
    homingPrefab: Prefab = null!;

    private _activeBullets: BaseBullet[] = [];
    private _activeLasers: Laser[] = [];

    

    onLoad() {
        BulletManager.instance = this; 
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.BULLET_KILLED, this.onBulletRecycle, this);
    }

    private onGameReset(){
        for (let i = 0; i < this._activeBullets.length; i++) {
            const bullet = this._activeBullets[i].node;
            PoolManager.instance.putNode(bullet);
        }
        for (let i = 0; i < this._activeLasers.length; i++) {
            const laser = this._activeLasers[i].node;
            PoolManager.instance.putNode(laser);
        }
        this._activeBullets.length = 0;
        this._activeLasers.length = 0;
  
    }

    onStateChanged(state:string){
         // 游戏开始，启动定时器
        if(state === GameConstants.GAME_STATE.PLAYING){
            this.setBulletsEnabled(true);
        }else{
            this.setBulletsEnabled(false);
        }
    }

    private setBulletsEnabled(isEnabled:boolean){
        for (let i = 0; i < this._activeBullets.length; i++) {
            this._activeBullets[i].enabled = isEnabled;
        }
        for (let i = 0; i < this._activeLasers.length; i++) {
            this._activeLasers[i].enabled = isEnabled;
        }

    }

    
    public spawnBullet(bulletType:string,isPlayerBullet: boolean, spawnPos: Vec3, dir: Vec3, damage: number, speed: number,followTarget: Node = null): void {
        let bulletprefab = null;
        switch(bulletType){
            case GameConstants.BULLET_TYPE.ICE:
                bulletprefab = this.iceBulletPrefab; 
                break;
            case GameConstants.BULLET_TYPE.LASER:
                bulletprefab = this.leserPrefab; 
                break;
            case GameConstants.BULLET_TYPE.HOMING:
                bulletprefab = this.homingPrefab; 
                break;
            case GameConstants.BULLET_TYPE.NORMAL:
            default:
                if(isPlayerBullet){
                    bulletprefab = this.normalPlayerBulletPrefab; 
                }else{
                    bulletprefab = this.normalEnemyBulletPrefab;
                }

        }

        if(!bulletprefab) return;

        // 从 PoolManager 取，没有就新建
        let bulletNode = PoolManager.instance.getNode(bulletprefab, this.node);

         if (bulletType === GameConstants.BULLET_TYPE.LASER) {
            const laserComp = bulletNode.getComponent(Laser);
            if (laserComp) {
                laserComp.init(isPlayerBullet, dir, damage, speed, spawnPos,followTarget);
                this._activeLasers.push(laserComp);
                return;
            }
        } else {
            const bulletComp = bulletNode.getComponent(BaseBullet);
            if (bulletComp) {
                bulletComp.init(isPlayerBullet, dir, damage, speed, spawnPos);
                this._activeBullets.push(bulletComp); 
                return;
            }
        }
        // 兜底：组件缺失，直接回池，不留在场景
        PoolManager.instance.putNode(bulletNode);
        
    }

    // 收到BULLET_KILLED事件，回收子弹
    private onBulletRecycle(bulletNode: Node): void {
         // 👈 使用交换删除法，从数组中移除
        const bulletComp = bulletNode.getComponent(BaseBullet);
        if (bulletComp) {
            this.removeFast(this._activeBullets, bulletComp);
        }
        const laserComp = bulletNode.getComponent(Laser);
        if (laserComp) {
            this.removeFast(this._activeLasers, laserComp);
        }
        // 放回对应池子
        PoolManager.instance.putNode(bulletNode);

    }

    // 🌟 极致性能的数组删除法
    private removeFast<T>(arr: T[], item: T) {
        // 注意：这里的 indexOf 是 O(N) 查找。但在实战中，子弹寿命很短，数组通常只有几十个，极快。
        const index = arr.indexOf(item);
        if (index === -1) return;
        // 把最后一个元素移动到当前索引，然后 pop 掉末尾
        const lastIndex = arr.length - 1;
        arr[index] = arr[lastIndex];
        arr.pop(); 
    }

   

    onDestroy() {
        // EventBus是全局事件，不是节点组件事件，必须手动解绑！
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.BULLET_KILLED, this.onBulletRecycle, this);
    }


}


