import { _decorator, Component, Node, Prefab,  SpriteFrame,  Vec3 } from 'cc';
import { PoolManager } from '../Core/PoolManager';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { BasePlane } from '../Entity/plane/BasePlane';
import { GameData } from '../Core/GameData';
import { BOSS_CONFIG } from '../Core/BossConfig';
import { BaseBoss } from '../Entity/plane/enemy/BaseBoss';
import { ENEMY_CONFIG } from '../Core/EnemyConfig';
import { EnemyPlane } from '../Entity/plane/enemy/EnemyPlane';
const { ccclass, property } = _decorator;

@ccclass('EnemyManager')
export class EnemyManager extends Component {

    private static _instance:EnemyManager = null;

    @property([Prefab]) 
    enemyPrefabs: Prefab[] = [];
    //存放图
    @property([SpriteFrame]) 
    enemyFrames: SpriteFrame[] = [];

    //预制体名字到预制体映射
    private _prefabDict: Record<string, Prefab> = {};
    //图名到图的映射
    private _spriteDict: Record<string, SpriteFrame> = {};

    @property(Prefab)
    bossPrefab: Prefab = null!;

    private _activeEnemies: BasePlane[] = [];//存活的敌人

   
    private topY = 0;
   

    onLoad() {
        EnemyManager._instance = this;

        //将所有预制体生成字典映射
        for (let i=0; i < this.enemyPrefabs.length; ++ i) {
            const p = this.enemyPrefabs[i];
            this._prefabDict[p.name] = p;
        }
        //所有图生成字典映射
        for (let i=0; i < this.enemyFrames.length; ++ i) {
            const f = this.enemyFrames[i];
            this._spriteDict[f.name] = f;
        }
        
        this.topY = GameData.viewH / 2;
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.onEnemyRecycle, this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyRecycle,this);
        EventBus.on(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, this.onHit, this);
        EventBus.on(GameConstants.EVENT_TYPE.REQUEST_HOMING_TARGET, this.onRequestTarget, this);
    }

    onDestroy() {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.onEnemyRecycle, this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyRecycle,this);
        EventBus.off(GameConstants.EVENT_TYPE.PLAYER_BULLET_HIT, this.onHit, this);
        EventBus.off(GameConstants.EVENT_TYPE.REQUEST_HOMING_TARGET, this.onRequestTarget, this);
    }

    static get instance():EnemyManager{
        return this._instance;
    }

    private onGameReset(){
        const enemies = this.node.children;  
        for(let i = enemies.length - 1;i >= 0;--i){
            PoolManager.instance.putNode(enemies[i]);
        }
        this._activeEnemies.length = 0; 
    }

    private onStateChanged(state:string){
        // 游戏开始，启动飞机
        if(state === GameConstants.GAME_STATE.PLAYING){
            this.setEnemiesEnabled(true);
        }else{//游戏暂停，关闭飞机。
            this.setEnemiesEnabled(false);
        }
    }

    private setEnemiesEnabled(isEnabled:boolean){
   
        for (let i = 0; i < this._activeEnemies.length; i++) {
            this._activeEnemies[i].setPaused(!isEnabled);
        }

        
    }



    private onEnemyRecycle(enemyNode: Node) {
        const plane = enemyNode.getComponent(BasePlane);
        const idx = this._activeEnemies.indexOf(plane);
        if (idx !== -1) {
            const last = this._activeEnemies.length - 1;
            this._activeEnemies[idx] = this._activeEnemies[last];
            this._activeEnemies.pop();
        }
        PoolManager.instance.putNode(enemyNode);
    }
    
   

    private onHit(enemyNode: Node, damage:number){
       const plane =  enemyNode.getComponent(BasePlane);
       if (!plane) return;
       plane.takeDamage(damage);
    }

    public spawnBoss(enemyType:string,hpMultiplier:number = 1){
        const cfg = BOSS_CONFIG[enemyType];
        if(!cfg)  {console.warn(`[EnemyManager] 未知 Boss: ${enemyType}`); return false; }

        if (!this.bossPrefab) {console.warn(`[EnemyManager] Boss预制体未赋值`);return false;}
        
        const node = PoolManager.instance.getNode(this.bossPrefab, this.node);
        const boss = node.getComponent(BaseBoss);
        if (!boss) { PoolManager.instance.putNode(node); return false; }
        boss.init(cfg, new Vec3(0, this.topY + 120, 0),hpMultiplier);
        this._activeEnemies.push(boss); // Boss 也是 BasePlane，直接塞进去！
        return true;   
    }

    public spawnNormalEnemy(enemyType:string,hpMultiplier:number = 1) {

        //====坐标生成======
        let spawnX = 0; // 默认 X 坐标为 0（屏幕中间）
        // 普通怪：随机 X，范围在屏幕内缩一点
        const halfW = 50;
        const minX = -GameData.viewW/ 2 + halfW;
        const maxX = GameData.viewW/ 2 - halfW;
        spawnX = minX + Math.random() * (maxX - minX);
      
        //通过小怪类型，读取小怪配置信息
        const cfg = ENEMY_CONFIG[enemyType];
        if (!cfg) { console.error("无此小怪配置", enemyType); return false; }

        //获取相应预制体
        const prefab = this._prefabDict[cfg.prefabName];
        if (!prefab) { console.error("无此小怪预制体", cfg.prefabName); return false; }

        const node = PoolManager.instance.getNode(prefab, this.node);
        const plane = node.getComponent(EnemyPlane);
        if (!plane) { PoolManager.instance.putNode(node); return false; }
        const pos = new Vec3(spawnX, this.topY + 100, 0);
        plane.init(cfg, pos, hpMultiplier, this._spriteDict[cfg.spriteName]);
        this._activeEnemies.push(plane);
        return true;
    }

     // 收到信号，算出敌人，把结果通过 callback 传回去！
    private onRequestTarget(pos: Vec3, callback: (target: Node) => void) {
        const closest = this.getClosestEnemy(pos);
        callback(closest); // 回调返回给子弹
    }

    // 算距离方法
    public getClosestEnemy(pos: Vec3): Node | null {
        let closestNode: Node | null = null;
        let minDistSqr = Number.MAX_VALUE; 

        // 直接遍历我们自己维护的数组
        for (let i = 0; i < this._activeEnemies.length; i++) {
            const plane = this._activeEnemies[i];
            
            // 防御：如果组件没了、节点没了、或者已经死了
            if (!plane || !plane.node.isValid || !plane.node.active || plane.isDead) {
                continue;
            }

            const enemyPos = plane.node.worldPosition;
            const dx = enemyPos.x - pos.x;
            const dy = enemyPos.y - pos.y;
            const distSqr = dx * dx + dy * dy;

            if (distSqr < minDistSqr) {
                minDistSqr = distSqr;
                closestNode = plane.node;
            }
        }
        return closestNode;
    }

    

    
}