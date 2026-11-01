/**
 * 炮台阵型状态
 */
export enum TurretFormation {
    ATTACHED = 'attached',   // 挂载在 Boss 身上
    ORBITING = 'orbiting'    // 脱离本体，环绕玩家
}


//炮台发射子弹类型
export enum TriggerMode { MANUAL = 0, AUTO = 1 }   // 手动触发 / 自动循环
export enum AimMode     { BLIND  = 0, AIM  = 1 }   // 盲发（固定角） / 瞄准目标
export enum FireMode    { VOLLEY = 0, SEQUENCE = 1 } // 同时 / 依次