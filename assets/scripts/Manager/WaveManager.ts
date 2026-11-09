import { _decorator, Component, Node, Vec3 } from 'cc';
import { ENDLESS_LEVEL, LevelData, LEVELS, WaveData, WaveGroup } from '../Core/LevelConfig';
import { GameData } from '../Core/GameData';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { EnemyManager } from './EnemyPlaneManager';
import { FormationType, SpawnPosition } from '../Core/ConfigEnums';
const { ccclass, property } = _decorator;

// 运行时状态
interface RunningGroup {
    config: WaveGroup; //哪一组
    remain: number; //还剩多少只
    timer: number; //组内计时器
}

enum WaveState {
    IDLE,          //刚开局，闲置中
    WAITING,       // 等待这波开始（等 delay）
    SPAWNING,      // 正在按剧本刷怪（时间轴运转中）
    WAITING_CLEAR, // 怪刷完了，等玩家清空战场
    FINISHED       // 这波结束，准备进下一波
}

@ccclass('WaveManager')
export class WaveManager extends Component {

    private _waveState:WaveState = WaveState.IDLE;

    private _levelData:LevelData = null;   //关卡数据

    private _waveIndex: number = 0;       //波数
    private _waveData:WaveData = null;    //关卡中一波数据 
    private _waveDelayTimer = 0; // 波次延迟倒计时

    private _waveTime:number = 0; //一波计时器，计算一波占用总时长，用于控制group生成，
    private _runningGroups: RunningGroup[] = []; // 正在刷怪的组池

    private _aliveEnemies: number = 0;  // 场上活着几架
  
    private _loopCount: number = 0; //轮回次数

    private _spawnPosCache = new Vec3();



    protected onLoad(): void {
        this._levelData = GameData.isEndlessMode
        ? ENDLESS_LEVEL
        : LEVELS[GameData.selectedLevel - 1];

        // 如果关卡不存在，或者关卡的波次是空的，结束游戏
        if (!this._levelData || !this._levelData.waves || this._levelData.waves.length === 0) {
            console.error(`[WaveManager] 关卡数据异常或为空 levelId=${GameData.selectedLevel}`);
            this.enabled = false;
            return;
        }
        
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyDead,this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.onEnemyDead,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);

        this.enabled = false;
    }



    protected update(dt: number): void {
        switch(this._waveState){
            case WaveState.IDLE:
                break;
            case WaveState.WAITING:
                this._waveDelayTimer -= dt;
                if(this._waveDelayTimer <= 0){
                    this.beginSpawning();//波次延迟结束，开始生成
                }
                break;
            case WaveState.SPAWNING:
                this.updateSpawning(dt);
                break;
            case WaveState.WAITING_CLEAR:
                if(this._aliveEnemies <= 0){
                    this.endWave();//这波清理完成
                }
                break;
            case WaveState.FINISHED:
                break;
        }
        
    }

    private startNextWave() {
        this._waveData = this._levelData.waves[this._waveIndex];         //得到index波数据
        this._waveDelayTimer = this._waveData.delay;                   //每波间隔
        this._waveState = WaveState.WAITING;                       //切换为等待这波延迟状态
        ++this._waveIndex;
    }

    private beginSpawning(){
        this._runningGroups = []; // 正在运行组清零
        this._waveTime = 0;       // 波次时间轴归零
        const groups = this._waveData.groups;
        for(let i=0;i<groups.length;++i){
            const group = groups[i];
            this._runningGroups.push({
                config:group,
                remain:group.count,
                timer:0,
            });
        }

        this._waveState = WaveState.SPAWNING;
    }

    private updateSpawning(dt: number){
        this._waveTime += dt;//波内计时器
        for(let i=this._runningGroups.length - 1; i>=0 ;--i){//从末尾开始，这样移除就不用担心打乱顺序
            const group = this._runningGroups[i];
            if(this._waveTime < group.config.time){ //还未到这组生成时间
                continue;
            }
            group.timer -= dt;//组内计时器
            if(group.timer <= 0){
                if(group.config.spawnInterval === 0){//没有间隔
                    while(group.remain > 0) { //一次性生成完
                        this.spawnEnemy(group);
                        group.remain--;
                    }
                    const last = this._runningGroups.length - 1; //找到最后一组
                    this._runningGroups[i] = this._runningGroups[last];//将这组与最后一组移到这组位置，相当于删除这组                  
                    this._runningGroups.pop();

                }else{
                    this.spawnEnemy(group);//生成一个敌机
                    group.remain--;
                    if(group.remain <= 0){//这组敌机生成完了，移除生成组
                        const last = this._runningGroups.length - 1; //找到最后一组
                        this._runningGroups[i] = this._runningGroups[last];//将这组与最后一组移到这组位置，相当于删除这组                  
                        this._runningGroups.pop();

                    }else{
                        group.timer += group.config.spawnInterval;
                    }
                }
                
            }

        }

        if (this._runningGroups.length === 0) { //这组刷完
            this._waveState = WaveState.WAITING_CLEAR;//转移到等待玩家清理状态
        }
    }

   
    private spawnEnemy(group:RunningGroup) {   
        let success = false;
        const hpMultiplier = 1 + (this._loopCount * 0.6); // 每轮回一次，怪物血量增加
        const spawnPos = this.calculateFormationPos(group);//计算出的结果存入_spawnPosCache
        if(group.config.category === GameConstants.ENEMY_CATEGORY.BOSS){
            let bossType = group.config.enemyType;
            if (GameData.isEndlessMode) {
                const bossPool = [
                    GameConstants.BOSS_TYPE.WHALE_BOSS,
                    GameConstants.BOSS_TYPE.MACHINE_BOSS,
                    GameConstants.BOSS_TYPE.WHALE_BOSS,   // 双 Boss 后再回鲸鱼
                ];
                bossType = bossPool[this._loopCount % bossPool.length];
            }
            success = EnemyManager.instance.spawnBoss(bossType,hpMultiplier);
        }else{
            success = EnemyManager.instance.spawnNormalEnemy(group.config.enemyType,hpMultiplier, spawnPos,group.config.spawnPos);
        }
      
        if (success) {
            ++this._aliveEnemies;  //还存活的飞机数量+1
        }
    }

    private calculateFormationPos(group: RunningGroup):Vec3 | null{
        //总数 - 还未生成数，从而获得现在是第几个要生成的
        const config = group.config;
        const index = config.count - group.remain; 
        
        // 如果配置了阵型，优先计算阵型坐标
        if (config.formation && config.formation !== FormationType.NONE) {
            //初始位置
            const baseX = config.startX ?? 0;
            const baseY = config.startY ?? (GameData.viewH / 2 + 100); 
            //间隔
            const spacing = config.formationSpacing ?? 80; 

            //一字排开
            if (config.formation === FormationType.LINE) {
                //每个飞机距离 basex间隔offset，从index=0开始，从左向右排
                const offset = (index - (config.count - 1) / 2) * spacing;
                this._spawnPosCache.set(baseX + offset, baseY, 0);
            } 
            //v型阵
            else if (config.formation === FormationType.VSHAPE) {
                //offsetx和一字型一样排开
                const offsetX = (index - (config.count - 1) / 2) * spacing;
                //offsety，从左到右先高后低再高
                const offsetY = Math.abs(index - (config.count - 1) / 2) * spacing; 
                this._spawnPosCache.set(baseX + offsetX, baseY + offsetY, 0);
            }
        }else if(config.spawnPos === SpawnPosition.CUSTOM) {
             // 如果没有配阵型，根据 spawnPos 枚举来判断兜底坐标
            this._spawnPosCache.set(config.startX ?? 0, config.startY ?? 0, 0);
        }else{
            return null;
        }
        return this._spawnPosCache;

    }

    endWave(){
        if (this._waveIndex >= this._levelData.waves.length) { //判断是否完成所有波数
            if (GameData.isEndlessMode) {                     //判断是否无尽模式，是就循环
                this._waveIndex = 0;
                this._loopCount++;
                this.startNextWave();
            } else {
                EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_VICTORY);//不是无尽模式，就游戏胜利
                this._waveState = WaveState.FINISHED;
                this.enabled = false;
            }
        } else { 
            this.startNextWave();  //没结束就下一波
        }
    }

    private onStateChanged(state:string){
        const isPlaying = (state === GameConstants.GAME_STATE.PLAYING);

        if (isPlaying) {
            if(this._waveState === WaveState.IDLE){           //第一波初始化
                this.startNextWave();
            }
             this.enabled = true;                 // 恢复 update
        } else {
            this.enabled = false;                // 冻结 update
        }
    }

    onEnemyDead(){
       this._aliveEnemies = Math.max(0, this._aliveEnemies - 1);   //存活的飞机数量-1
    }

    private onGameReset(){
        this._waveState = WaveState.IDLE;
        this._waveIndex = 0;
        this._aliveEnemies = 0;
        this._waveDelayTimer = 0;
        this._runningGroups = []; 
        this._waveTime = 0;      
        this.enabled = false; // 关掉自己，等 PLAYING 状态来唤醒
        this._loopCount = 0;
    }



    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyDead,this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.onEnemyDead,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
    }
}


