import { _decorator, Component, Node, Prefab, view, Vec3 } from 'cc';
import { PoolManager } from '../Core/PoolManager';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { BasePlane } from '../Entity/plane/BasePlane';
import { GameData } from '../Core/GameData';
import { BOSS_CONFIG } from '../Core/BossConfig';
import { BaseBoss } from '../Entity/plane/enemy/BaseBoss';
const { ccclass, property } = _decorator;

@ccclass('EnemyManager')
export class EnemyManager extends Component {

    private static _instance:EnemyManager = null;

    @property(Prefab)
    normalEnemyPrefab: Prefab = null!;

    @property(Prefab)
    bossPrefab: Prefab = null!;

    @property({ tooltip: "生成间隔（秒）" })
    spawnRate = 1;

   
    private topY = 0;
   

    onLoad() {
        EnemyManager._instance = this;

        this.topY = GameData.screenHeight / 2;
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.onEnemyRecycle, this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyRecycle,this);
        EventBus.on(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, this.onHit, this);
    }

    static get instance():EnemyManager{
        return this._instance;
    }

    private onGameReset(){
        const enemies = this.node.children;  
        for(let i = enemies.length - 1;i >= 0;--i){
            PoolManager.instance.putNode(enemies[i]);
        }
    }

    private onStateChanged(state:string){
        // 游戏开始，启动飞机
        if(state === GameConstants.GAME_STATE.PLAYING){
            this.setEnemiesEabled(true);
        }else{//游戏暂停，关闭飞机。
            this.setEnemiesEabled(false);
        }
    }

    private setEnemiesEabled(isEnabled:boolean){
        const enemies = this.node.children;

        for(let i = enemies.length - 1;i >= 0;--i){
            const enemy = enemies[i].getComponent(BasePlane);
            if(enemy){
                enemy.enabled = isEnabled;
            }
            const boss = enemies[i].getComponent(BaseBoss);
            if (boss) boss.setPaused(isEnabled);   
        }
    }

    private onEnemyRecycle(enemyNode: Node) {
        PoolManager.instance.putNode(enemyNode);
    }
    
   

    private onHit(enemyNode: Node, damage:number){
       const plane =  enemyNode.getComponent(BasePlane);
       if (!plane) return;
       plane.takeDamage(damage);
    }

    public spawnBoss(enemyType:string){
        const cfg = BOSS_CONFIG[enemyType];
        if(!cfg)  {console.warn(`[EnemyManager] 未知 Boss: ${enemyType}`); return false; }

        if (!this.bossPrefab) {console.warn(`[EnemyManager] Boss预制体未赋值`);return false;}
        
        const node = PoolManager.instance.getNode(this.bossPrefab, this.node);
        const boss = node.getComponent(BaseBoss);
        
        boss.init(cfg, new Vec3(0, this.topY + 120, 0));
        return true;   
    }

    public spawnNormalEnemy(enemyType:string) {
        let prefabToSpawn:Prefab = null;
        let spawnX = 0; // 默认 X 坐标为 0（屏幕中间）

        
        prefabToSpawn = this.normalEnemyPrefab;
        // 普通怪：随机 X，范围在屏幕内缩一点
        const halfW = 50;
        const minX = -GameData.screenWidth/ 2 + halfW;
        const maxX = GameData.screenWidth / 2 - halfW;
        spawnX = minX + Math.random() * (maxX - minX);
      
            

        if (!prefabToSpawn) return;

        const enemy = PoolManager.instance.getNode(prefabToSpawn, this.node);
        const plane = enemy.getComponent(BasePlane);

        const position = new Vec3(spawnX, this.topY + 100, 0);
        // 从屏幕顶外面生成
        plane.init(position);
    }

    

    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.onEnemyRecycle, this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyRecycle,this);
        EventBus.off(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, this.onHit, this);
    }
}