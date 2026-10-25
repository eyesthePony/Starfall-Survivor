

export class GameConstants {

    // ========== 事件名称 ==========
    public static EVENT_TYPE = {
        // 子弹相关
        BULLET_KILLED: "bulletKilled",           // 子弹节点回收
        REMOVE_BULLET: "removeBullet",           // 从数组移除子弹
        PLAYER_BULLET_HIT: "playerBulletHit",    // 我方子弹击中
        ENEMY_BULLET_HIT: "enemyBulletHit",      // 敌方子弹击中
        ENEMY_KILLED: "enemyKilled",             //飞机被玩家消灭死亡(加分)
        ENEMY_ESCAPED: "enemyEscaped",  // 敌机飞出底部（不加分）
        PLAYER_HP_CHANGED: "playerHpChanged" , // 玩家血变了 (curHp, maxHp)
        PLAYER_DIED: "playerDied" ,       // 玩家死了（播特效用）  
        SCORE_CHANGED: "scoreChanged" ,    // 分数变了 

        // 游戏流程 状态切换
        GAME_START: 'GAME_START',           // 开始游戏
        GAME_OVER: 'GAME_OVER',             // 玩家死
        GAME_RESTART:'GAME_RESTART',       //游戏重开
        GAME_RESUME:'GAME_RESUME',         //游戏继续
        GAME_PAUSE:'GAME_PAUSE',           //游戏暂停
        GAME_VICTORY: 'GAME_VICTORY',       // 胜利
        GAME_RESET: 'GAME_RESET',          // 游戏重设，gamemanager收到GAME_RESTART后，发送重设消息给bulletmanager，enemiesmanaget，player
        GAME_QUIT: 'GAME_QUIT',             // 退出
        GAME_REVIVE: 'GAME_REVIVE',         // 复活
        GAME_SETTLE: 'GAME_SETTLE',         // 结算
        GAME_STATE_CHANGED:'GAME_STATE_CHANGED' //游戏状态切换了
    };

    //gamemanager里的游戏状态变量，作为AME_STATE_CHANGED的参数传递给其他模块。
    public static GAME_STATE = {
         READY:'ready' ,
         PLAYING: 'playing' ,
         OVER:'over',
         PAUSE:'pause',
    }

    public static GAME_SCENE = {
        HALL: 'HallScene',
        BATTLE: 'BattleScene'
    }

    public static ENEMY_CATEGORY = {
        NORMAL:'normal',
        BOSS:'boss',
    }

    //敌机类型
    public static ENEMY_TYPE = {
        NORMAL:'normal',
    }

    public static BOSS_TYPE = {
        ICE_BOSS: "ice_boss",
    }

    public static BULLET_TYPE = {
        NORMAL:'normal',
    }

    

    public static EFFECT_TYPE = {
        EXPLOSION: "explosion", //普通爆炸
    };

    public static AUDIO_TYPE = {
        BGM:"bgm",
        BOOM:"boom",
        BULLET:"bullet",
    };

    public static BOSS_SKILL = {
        SINE_MOVE:"SineMove",
        RING_FIRE:"RingFire",
        SPIRAL_FIRE:"SpiralFire",
    };

    public static ANIMATOR_TYPE = {
        SPIN_ANIMATOR : "SpinAnimator",
        FLOAT_ANIMATOR : "FloatAnimator",
        PULSE_ANIMATOR : "PulseAnimator",
    }

    // ========== 子弹阵营/分组 ==========
    public static ITEM_GROUP = {
        ENEMY_BULLET: 8,     // 敌方子弹组
        SELF_BULLET: 16,      // 我方子弹组
        ENEMY_PLANE: 4,      // 敌机组
        SELF_PLANE: 2,       // 我方机组
    };


}


