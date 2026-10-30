

export class GameConstants {

    // ========== 事件名称 ==========
    public static EVENT_TYPE = {
         // ========== 战斗实体相关 ==========
         //子弹
        BULLET_KILLED: "bulletKilled",           // 子弹节点回收
        REMOVE_BULLET: "removeBullet",           // 从数组移除子弹
        PLAYER_BULLET_HIT: "playerBulletHit",    // 我方子弹击中
        ENEMY_BULLET_HIT: "enemyBulletHit",      // 敌方子弹击中
        //敌机
        ENEMY_KILLED: "enemyKilled",             //飞机被玩家消灭死亡(加分)
        ENEMY_ESCAPED: "enemyEscaped",  // 敌机飞出底部（不加分）
        LEVEL_UP:'levelUp',         //玩家升级
        
        
       

        // ========== 游戏流程 状态切换 ==========
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
        GAME_STATE_CHANGED:'GAME_STATE_CHANGED',//游戏状态切换了
   


        // ========== 数据与 UI 刷新 ==========
        PLAYER_HP_CHANGED: "playerHpChanged", //玩家血量改变
        PLAYER_DIED: "playerDied",            //玩家死亡
        SCORE_CHANGED: "scoreChanged",        //分数改变
        BOSS_SHOW_HP_BAR: "bossShowHpBar",   //boss显示血条
        BOSS_HIDE_HP_BAR: "bossHideHpBar",   // boss隐藏血条
        BOSS_HP_CHANGED: "bossHpChanged",    // boss血量改变
        EXP_CHANGED:'expChanged',        //经验改变
        SHOW_UPGRADE_PANEL:"showUpgradePanel", //显示选卡界面
        CARD_SELECTED:"cardSelected" ,      //选择了卡片


        START_PLACING_BUILDING: "startPlacingBuilding", // 开始放置建筑 (传参: buildingId 或 index)
        CANCEL_PLACING_BUILDING: "cancelPlacingBuilding", // 取消放置建筑
    };

    public static CARD_ID = {
        DMG_UP: 'dmg_up',
        SPD_UP: 'spd_up',
        BULLET_UP:'bullet_up',
        MOVE_UP:'move_up',
    };

    //gamemanager里的游戏状态变量，作为GAME_STATE_CHANGED的参数传递给其他模块。
    public static GAME_STATE = {
        READY:'ready' ,
        PLAYING: 'playing' ,
        OVER:'over',
        PAUSE:'pause',
        VICTORY:"victory",
        UPGRADING: 'upgrading',   // 升级选卡导致的暂停
    }

    //游戏界面分类
    public static GAME_SCENE = {
        HALL: 'HallScene',
        BATTLE: 'BattleScene'
    }

    //敌机类型
    public static ENEMY_CATEGORY = {
        NORMAL:'normal',
        BOSS:'boss',
    }

    //普通敌机类型
    public static ENEMY_TYPE = {
        NORMAL:'normal',
    }

    //boss敌机类型
    public static BOSS_TYPE = {
        ICE_BOSS: "ice_boss",
    }

    //子弹类型
    public static BULLET_TYPE = {
        NORMAL:'normal',
        ICE:'ice',
    }

    
    //特效类型
    public static EFFECT_TYPE = {
        EXPLOSION: "explosion", //普通爆炸
    };

    //音乐类型
    public static AUDIO_TYPE = {
        BGM:"bgm",
        BOOM:"boom",
        BULLET:"bullet",
    };

    //boss行为类型
    public static BOSS_SKILL = {
        SINE_MOVE:"SineMove",
        RING_FIRE:"RingFire",
        SPIRAL_FIRE:"SpiralFire",
    };

    //动画类型
    public static ANIMATOR_TYPE = {
        SPIN_ANIMATOR : "SpinAnimator",
        FLOAT_ANIMATOR : "FloatAnimator",
        PULSE_ANIMATOR : "PulseAnimator",
    }

    // ========== 子弹阵营碰撞/分组 ==========
    public static ITEM_GROUP = {
        ENEMY_BULLET: 8,     // 敌方子弹组
        SELF_BULLET: 16,      // 我方子弹组
        ENEMY_PLANE: 4,      // 敌机组
        SELF_PLANE: 2,       // 我方机组
    };


}


