

//===============turret==========

//====围绕旋转圆心=====
export enum OrbitCenter {
    SCREEN = 0,   // 屏幕中心
    SELF = 1,     // Boss 自己
    TARGET = 2,   // 玩家
}

//===队形=====
export enum TurretFormation {
    ATTACHED = 0,    // 挂在 Boss 身上
    ORBITING = 1,    // 围绕某个中心旋转
    SCATTERED = 2,   // 四散到屏幕边角
}

//=====开火====
export enum TriggerMode {
    IDLE,        //停止开火
    ONCE,        // 一次开火：打一轮回空闲
    CONTINUOUS,  // 持续开火：一直打
}

export enum FireMode    { VOLLEY = 0, SEQUENCE = 1 } // 同时 / 依次


//=========炮口转动======
export enum AimMode {
    FIXED = 0,    // 固定角度
    TARGET = 1,   // 瞄准目标
    SPIN = 2,     // 持续旋转扫描
    OSCILLATE = 3,  // 来回摆动
    CENTER = 4, //屏幕中心
    LOCK = 5, //锁定当前方向
}


//================levelConfig====================
//==============敌机阵型==============
export enum FormationType {
    NONE = 'none',                //无阵型
    LINE = "line",               // 一字长蛇
    VSHAPE = "vshape",           // V字阵
    RANDOM_SPREAD = "random_spread", // 散开
}

// ========== 敌机出生位置 ==========
export enum SpawnPosition {
    TOP = "top",           // 从顶部
    LEFT = "left",         // 从左侧
    RIGHT = "right",       // 从右侧
    RANDOM = "random",     // 顶部随机X
    CUSTOM = "custom",     // 完全由 startX/startY 决定
}




// ================= 经济与资源系统 =================
export enum ResourceType {
    GOLD = 'gold',
}

// ================= 建筑系统 =================
export enum BuildingCategory {
    PRODUCER = 'producer', // 生产建筑（农田、矿场）
    HOUSE = 'house',       // 住房/主基地
    DECOR = 'decor',       // 装饰物
    ROAD = 'road',
}

// 拖拽铺路的状态机
export enum RoadState {
    IDLE = 0,           // 未激活/普通建筑放置状态
    SELECTING_START,    // 阶段1：选起点，幽灵格子跟随鼠标
    DRAGGING,           // 阶段2：已定起点，正在拖拽画直线并显示预览
}
