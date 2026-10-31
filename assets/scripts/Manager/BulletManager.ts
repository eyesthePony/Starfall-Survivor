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

    

    onLoad() {
        BulletManager.instance = this; 
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.BULLET_KILLED, this.onBulletRecycle, this);
    }

    private onGameReset(){
        const bullets = this.node.children;
        for(let i = bullets.length - 1; i>=0 ;--i){
            PoolManager.instance.putNode(bullets[i]);
        }
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
        const bullets = this.node.children;
        const length = bullets.length;
        for(let i=length-1;i>=0;--i){
            const bullet = bullets[i].getComponent(BaseBullet);
            if(bullet){
                bullet.enabled = isEnabled;
                continue; 
            }
            const laser = bullets[i].getComponent(Laser);
            if (laser) {
                laser.enabled = isEnabled;
            }
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
                return;
            }
        } else {
            const bulletComp = bulletNode.getComponent(BaseBullet);
            if (bulletComp) {
                bulletComp.init(isPlayerBullet, dir, damage, speed, spawnPos);
                return;
            }
        }
        // 兜底：组件缺失，直接回池，不留在场景
        PoolManager.instance.putNode(bulletNode);
        
    }

    // 收到BULLET_KILLED事件，回收子弹
    private onBulletRecycle(bulletNode: Node): void {
        // 放回对应池子
        PoolManager.instance.putNode(bulletNode);

    }

   

    onDestroy() {
        // EventBus是全局事件，不是节点组件事件，必须手动解绑！
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.BULLET_KILLED, this.onBulletRecycle, this);
    }


}


