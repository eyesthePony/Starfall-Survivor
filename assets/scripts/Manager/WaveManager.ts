import { _decorator, Component, Node } from 'cc';
import { LevelData, LEVELS, WaveData } from '../Core/LevelConfig';
import { GameData } from '../Core/GameData';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { EnemyManager } from './EnemyPlaneManager';
const { ccclass, property } = _decorator;

@ccclass('WaveManager')
export class WaveManager extends Component {

    private _levelData:LevelData = null;   //关卡数据
    private _waveIndex: number = 0;       //波数
    private _waveData:WaveData = null;    //一波数据
    private _toSpawn: number = 0;        // 这波还剩几架没刷
    private _aliveEnemies: number = 0;  // 场上活着几架
    private _spawnTimer = 0;     // 刷怪倒计时
    private _waveDelayTimer = 0; // 波次延迟倒计时
    

    protected onLoad(): void {
        const levelId = GameData.selectedLevel - 1;
        this._levelData = LEVELS[levelId];
        
        EventBus.on(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyDead,this);
        EventBus.on(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.onEnemyDead,this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
    }



    protected update(dt: number): void {

        if(this._waveDelayTimer > 0){       //场上的敌人小于等于1就开始波数倒计时

            this._waveDelayTimer -= dt;     //波数来临倒计时

        }else if(this._toSpawn > 0){        //这波敌人还未生成完
            this._spawnTimer -= dt;        //倒计时结束，生成一个敌人
            if(this._spawnTimer <= 0){     
                this.spawnEnemy();
            }
        }else {
            if(this._aliveEnemies > 0) return;    //如果还存活的飞机大于1，就先不下一波
            if(this._waveIndex >= this._levelData.waves.length){    //没波了 游戏结束
                EventBus.dispatchEvent(GameConstants.EVENT_TYPE.GAME_VICTORY);
                return ;
            }
            this.startNextWave();    //下一波
        }
    }

    private startNextWave() {
        this._waveData = this._levelData.waves[this._waveIndex];   //得到index波数据
        this._spawnTimer = this._waveData.spawnInterval;                  //这波得到每个飞机生产间隔
        this._waveDelayTimer = this._waveData.delay;                     //得到这波与上一波时间间隔
        this._toSpawn = this._waveData.count;                            //得到这波要生产飞机总数
        ++this._waveIndex;                                    //波数+1
    }

    private spawnEnemy() {   
        if(this._waveData.category === GameConstants.ENEMY_CATEGORY.BOSS){
            EnemyManager.instance.spawnBoss(this._waveData.enemyType);
        }else{
            EnemyManager.instance.spawnNormalEnemy(this._waveData.enemyType);
        }
       
        --this._toSpawn;    //还需要生成的飞机-1
        ++this._aliveEnemies;  //还存活的飞机数量+1
        this._spawnTimer += this._waveData.spawnInterval; // 重置计时器
    }

    private onStateChanged(state:string){
        const isPlaying = (state === GameConstants.GAME_STATE.PLAYING);

        if (isPlaying) {
            this.enabled = true;                 // 恢复 update
            if(this._waveIndex === 0){           //第一波初始化
                this.startNextWave();
            }
        } else {
            this.enabled = false;                // 冻结 update
        }
    }

    onEnemyDead(){
        --this._aliveEnemies;   //存活的飞机数量-1
    }

    private onGameReset(){
       this._waveIndex = 0;
        this._toSpawn = 0;
        this._aliveEnemies = 0;
        this._spawnTimer = 0;
        this._waveDelayTimer = 0;
        this.enabled = false; // 关掉自己，等 PLAYING 状态来唤醒
    }



    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_STATE_CHANGED,this.onStateChanged,this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_ESCAPED,this.onEnemyDead,this);
        EventBus.off(GameConstants.EVENT_TYPE.ENEMY_KILLED,this.onEnemyDead,this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
    }
}


