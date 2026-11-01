// Component/Fire/CannonBarrage.ts
import { _decorator, Node, Vec3, Prefab, instantiate, resources } from 'cc';
import { BaseFire } from './BaseFire';
import { Turret } from '../../Entity/plane/enemy/Turret'; 
import { GameData } from '../../Core/GameData';
import { AimMode, FireMode, TriggerMode, TurretFormation,  } from '../../Core/ConfigEnums';
const { ccclass, property } = _decorator;

// 👈 私有移动状态机
enum MoveState {
    NONE,
    MOVING_TO_ATTACHED,// 正在移动到挂载位置
    MOVING_TO_ORBIT   // 正在移动到绕行位置
}

@ccclass('CannonBarrage')
export class CannonBarrage extends BaseFire {
    
    private _turretPrefab: Prefab = null!; //士兵预制体
    private _turretPath: string = '';       //预制体路径
    private _turretCount: number = 8;       //士兵数量
    private _attachRadius: number = 150;    //士兵挂载在 Boss 身上的半径
    private _orbitRadius: number = 250;    //士兵绕 Boss 旋转的半径
    private _rotateSpeed: number = 45;      //士兵围绕旋转的速度（度/秒）
    private _fireAngle: number = 180;       // 炮口朝向角度（0度朝上，90度朝右，180度朝下，270度朝左）
    private _triggerMode: TriggerMode = TriggerMode.MANUAL;
    private _aimMode: AimMode = AimMode.BLIND;
    private _fireMode: FireMode = FireMode.VOLLEY;

    private _followTarget: boolean = true; 

    private _cannonNodes: Node[] = [];       // 存放所有炮台节点
    private _turretScripts: Turret[] = [];   // 存放所有 Turret 脚本组件
    
    private _currentFormation: TurretFormation = TurretFormation.ATTACHED; // 当前阵型（挂载或绕行）
    private _isFormationReady: boolean = false;          // 阵型是否已经就绪（挂载或绕行完成）
    private _currentAngle: number = 0;          // 当前旋转角度（仅在绕行阵型时使用）

    private _moveState: MoveState = MoveState.NONE;  // 当前移动状态机（挂载或绕行的过渡动画）
    private _moveTimer: number = 0;                 // 移动计时器（用于过渡动画）
    private _moveDuration: number = 0.8;         // 移动过渡动画的持续时间（秒）
    private _startPositions: Vec3[] = [];  // 存放移动过渡动画的起始位置
    private _targetPositions: Vec3[] = []; // 存放移动过渡动画的目标位置

    private _orbitCenter: Vec3 = new Vec3();   // 环绕圈中心快照

    private _seqGap: number = 0;        // 一轮打完后的间隙（秒）
    private _seqGapTimer: number = 0;   // 间隙倒计时

   


    private _seqIndex: number = -1;            // 当前轮到第几个炮台
    private _seqTimer: number = 0;            // 开火间隔倒计时
    private _seqInterval: number = 0.15;      // 每个炮台开火的间隔时间（秒

    // 纯参数驱动的自动开火
    update(deltaTime: number) {
        if (this._cannonNodes.length === 0) return; // 没有炮台节点，直接返回

        this.updateFormation(deltaTime);   // 移动过渡
        this.updateOrbit(deltaTime);       // 环绕
        this.updateAutoFire(deltaTime);    // 自动触发判断
        this.updateSequence(deltaTime);    // 依次开火推进判断
        
    }

    // ① 移动过渡：还在移动就推进
    private updateFormation(deltaTime: number) {
        if (this._moveState === MoveState.NONE) return;
        this.updateFormationMove(deltaTime);
    }

    // ② 环绕：阵型是 ORBITING 且已就绪才跑
    private updateOrbit(deltaTime: number) {
        if (this._currentFormation !== TurretFormation.ORBITING) return;
        if (!this._isFormationReady) return;
        this.updateOrbitPosition(deltaTime);
    } 
    
    // ③ 自动触发判断：AUTO + 计时到才触发
    private updateAutoFire(deltaTime: number) {
        if (this._triggerMode !== TriggerMode.AUTO) return; 
        
       // SEQUENCE：一轮打完 → 等 seqGap → 下一轮
        if (this._fireMode === FireMode.SEQUENCE) {
            if (this._seqIndex >= 0) return;              // 正在打
            if (this._seqGapTimer > 0) {
                this._seqGapTimer -= deltaTime;
                return;
            }
            this.beginSequence();
            return;
        }

        // VOLLEY：按 interval 齐射
        if (this.interval <= 0) return;
        this._timer += deltaTime;
        if (this._timer < this.interval) return;
        this._timer -= this.interval;
        this.executeFire();
    }

    // ④ 依次开火推进判断：正在依次打才推进
    private updateSequence(deltaTime: number) {
        if (this._seqIndex < 0) return;
        this._seqTimer -= deltaTime;
        if (this._seqTimer > 0) return;
        this.fireOne(this._turretScripts[this._seqIndex]);
        this._seqIndex++;
        if (this._seqIndex >= this._turretScripts.length) {
            this._seqIndex = -1;
            this._seqGapTimer = this._seqGap;   // ← 一轮结束，开始计间隙
        } else {
            this._seqTimer = this._seqInterval;
        }
    }

    // ⑤ 编排：依次 or 齐射
    private executeFire() {
        if (this._fireMode === FireMode.SEQUENCE) {        // 依次开火
            this.beginSequence();
            return;
        }
        for (let i = 0; i < this._turretScripts.length; i++) { // 齐射开火
            this.fireOne(this._turretScripts[i]);
        }
    }

    // ⑥ 依次防重入
    private beginSequence() {
        if (this._seqIndex >= 0) return;  // 已经在依次开火中，防止重入
        this._seqIndex = 0;              // 开始依次开火
        this._seqTimer = 0;              // 立即开火第一个炮台
    }

    // ⑦ 执行：瞄准判断 + 开火（齐射/依次共用）
    private fireOne(turret: Turret) {
        if (!turret || !turret.isValid) return;

        // 不跟随 + 环绕阵型 → 朝圈心打（不管 aimMode 是什么）
        if (!this._followTarget && this._currentFormation === TurretFormation.ORBITING) {
            turret.aimAt(this._orbitCenter);
        } else if (this._aimMode === AimMode.AIM) {
            const target = GameData.currentTarget;
            if (!target || !target.isValid) return;
            turret.aimAt(target.worldPosition);
        } else {
            turret.node.angle = this._fireAngle;
        }

        turret.fire(this.damage, this._bulletType, this.bulletSpeed, this._isPlayerBullet);
    }

  

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        
        if (params.damage !== undefined) this.damage = params.damage;  //子弹伤害
        if (params.bulletSpeed !== undefined) this.bulletSpeed = params.bulletSpeed;//子弹速度
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;  //子弹类型
        if (params.interval !== undefined) this.interval = params.interval; //开火间隔
        if (params.turretCount !== undefined) this._turretCount = params.turretCount; //炮台数量
        if (params.attachRadius !== undefined) {
            const changed = this._attachRadius !== params.attachRadius;
            this._attachRadius = params.attachRadius;
            // 当前是 ATTACHED 且已就位 → 重新走一次收缩/展开动画
            if (changed
                && this._currentFormation === TurretFormation.ATTACHED
                && this._moveState === MoveState.NONE
                && this._cannonNodes.length > 0) {
                this.setFormationAttached();
            }
        }//炮台挂载半径
        if (params.seqGap !== undefined) this._seqGap = params.seqGap;
        if (params.orbitRadius !== undefined) this._orbitRadius = params.orbitRadius;   //炮台绕行半径
        if (params.rotateSpeed !== undefined) this._rotateSpeed = params.rotateSpeed;    //炮台绕行速度
        if (params.turretPrefabPath) this._turretPath = params.turretPrefabPath;        //炮台预制体路径
        if (params.fireAngle !== undefined) this._fireAngle = params.fireAngle;//炮口朝向角度

        if (params.isPlayerBullet !== undefined) this._isPlayerBullet = params.isPlayerBullet;//是否为玩家子弹
        if (params.followTarget !== undefined) this._followTarget = params.followTarget;
        
        
        if (params.triggerMode !== undefined) {
            this._triggerMode = params.triggerMode;//触发模式（手动、自动）
            this._timer = 0
        }
        if (params.aimMode !== undefined) this._aimMode = params.aimMode;//瞄准模式（盲射、瞄准）
        if (params.fireMode !== undefined) this._fireMode = params.fireMode;//开火模式（同时、依次）
        if (params.seqInterval !== undefined) this._seqInterval = params.seqInterval;//依次开火的间隔时间

        if (params.formation !== undefined) {
            if (params.formation === TurretFormation.ATTACHED) this.setFormationAttached();// 挂载阵型
            else if (params.formation === TurretFormation.ORBITING) this.setFormationOrbit();// 绕行阵型
        }

        if (params.cmd !== undefined) this.executeFire();

        
    }

    protected onEnable() {
        if (this._cannonNodes.length === 0) this.spawnCannons();
    }

    protected onDisable() {
       
    }

    protected onDestroy() {
        this.clearCannons();     // 组件真正被销毁时才清
    }

    public clear() { this.clearCannons(); } // 对外提供清理方法

    private spawnCannons() {
        this.clearCannons();  
        if (this._turretPath) {
            resources.load(this._turretPath, Prefab, (err, prefab) => {
                if (err || !this.enabled) return;
                this._turretPrefab = prefab;
                this.createCannonNodes();   
                this.setFormationAttached(); 
            });
        }
    }

    private createCannonNodes() {
        if (!this._turretPrefab) return;
        for (let i = 0; i < this._turretCount; i++) {   
            const cannon = instantiate(this._turretPrefab);
            cannon.parent = this.node;                                  
            const script = cannon.getComponent(Turret);
            if (!script) { console.warn('[CannonBarrage] 缺少 Turret 组件'); cannon.destroy(); continue; }
            this._cannonNodes.push(cannon);
            this._turretScripts.push(script);
        }
    }

    private clearCannons() {
        for (let i = 0; i < this._cannonNodes.length; i++) {
            const cannon = this._cannonNodes[i];
            if (cannon && cannon.isValid) cannon.destroy(); 
        }
        this._cannonNodes.length = 0;
        this._turretScripts.length = 0;
        this._isFormationReady = false;
        this._moveState = MoveState.NONE;
        this._seqIndex = -1;
        this._seqTimer = 0;
        this._seqGapTimer = 0; 
    }

    private updateFormationMove(deltaTime: number) {
        this._moveTimer += deltaTime;
        let progress = Math.min(this._moveTimer / this._moveDuration, 1);// 进度百分比（0~1）
        
        // 缓动公式
        let eased = progress;  
        if (this._moveState === MoveState.MOVING_TO_ATTACHED) {   // 使用正弦缓动函数
            eased = Math.sin((progress * Math.PI) / 2); // sineOut
        } else {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2); // backOut
        }

        for (let i = 0; i < this._cannonNodes.length; i++) {
            const cannon = this._cannonNodes[i];
            if (!cannon || !cannon.isValid) continue;

            const start = this._startPositions[i];
            const target = this._targetPositions[i];
            const x = start.x + (target.x - start.x) * eased;
            const y = start.y + (target.y - start.y) * eased;

            if (this._moveState === MoveState.MOVING_TO_ATTACHED) {
                cannon.setPosition(x, y, 0);
            } else {
                cannon.setWorldPosition(x, y, 0);
            }
        }

        if (progress >= 1) {
            this._moveState = MoveState.NONE;
            if (this._currentFormation === TurretFormation.ORBITING) {
                this._isFormationReady = true;
            }
        }
    }


    public setFormationAttached() {
        this._currentFormation = TurretFormation.ATTACHED;
        this._isFormationReady = false;
        this._moveState = MoveState.MOVING_TO_ATTACHED;
        this._moveTimer = 0;
        this._moveDuration = 0.5;
        this._startPositions.length = 0;
        this._targetPositions.length = 0;

        for (let i = 0; i < this._cannonNodes.length; i++) {
            const cannon = this._cannonNodes[i];
            if (!cannon || !cannon.isValid) continue;

            const currentWorldPos = cannon.worldPosition.clone();
            cannon.parent = this.node; 
            cannon.worldPosition = currentWorldPos; 

            this._startPositions.push(cannon.position.clone());

            const angle = (360 / this._turretCount) * i;
            const rad = angle * Math.PI / 180;
            this._targetPositions.push(new Vec3(
                Math.cos(rad) * this._attachRadius,
                Math.sin(rad) * this._attachRadius, 0
            ));
        }
    }

    public setFormationOrbit() {
        this._currentFormation = TurretFormation.ORBITING;
        this._isFormationReady = false;
        this._currentAngle = 0;

        const target = GameData.currentTarget;
        if (!target || !target.isValid) return;
        const targetPos = target.worldPosition;
        this._orbitCenter.set(targetPos.x, targetPos.y, 0);  

        this._moveState = MoveState.MOVING_TO_ORBIT;
        this._moveTimer = 0;
        this._moveDuration = 0.8;
        this._startPositions.length = 0;
        this._targetPositions.length = 0;

        for (let i = 0; i < this._cannonNodes.length; i++) {
            const cannon = this._cannonNodes[i];
            if (!cannon || !cannon.isValid) continue;

            this._startPositions.push(cannon.worldPosition.clone());

            const currentWorldPos = cannon.worldPosition.clone();
            cannon.parent = this.node.parent; 
            cannon.worldPosition = currentWorldPos; 

            const angle = (360 / this._turretCount) * i;
            const rad = angle * Math.PI / 180;
            this._targetPositions.push(new Vec3(
                targetPos.x + Math.cos(rad) * this._orbitRadius,
                targetPos.y + Math.sin(rad) * this._orbitRadius, 0
            ));
        }
    }

    private updateOrbitPosition(deltaTime: number) {
        const target = GameData.currentTarget;
        if (!target || !target.isValid) return;
        const targetPos = target.worldPosition;

        // 不跟随：位置用快照中心，只更新炮口
        if (!this._followTarget) {
            for (let i = 0; i < this._turretScripts.length; i++) {
                const t = this._turretScripts[i];
                if (t && t.isValid) t.aimAt(this._orbitCenter);
            }
            return;
        }

        this._currentAngle += this._rotateSpeed * deltaTime;
        const angleStep = 360 / this._turretCount;

        for (let i = 0; i < this._cannonNodes.length; i++) {
            const cannon = this._cannonNodes[i];
            const turret = this._turretScripts[i];
            if (!cannon || !cannon.isValid || !turret) continue;

            const rad = (this._currentAngle + i * angleStep) * Math.PI / 180;
            const posX = targetPos.x + this._orbitRadius * Math.cos(rad);
            const posY = targetPos.y + this._orbitRadius * Math.sin(rad);

            cannon.setWorldPosition(posX, posY, 0);
            turret.aimAt(targetPos);
        }
    }

   

    
}