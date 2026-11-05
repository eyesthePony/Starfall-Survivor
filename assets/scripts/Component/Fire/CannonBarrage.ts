import { _decorator, Color, instantiate, Node, Prefab, resources, Sprite, Vec3} from 'cc';

import { Turret } from '../../Entity/plane/enemy/Turret';//引入士兵（小飞机）
import { BaseFire } from './BaseFire';
import{AimMode, FireMode, OrbitCenter, TriggerMode, TurretFormation} from '../../Core/ConfigEnums'
import { GameData } from '../../Core/GameData';
import { GameConstants } from '../../Core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('CannonBarrage')
export class CannonBarrage extends BaseFire {

    /**===========基类属性============
     *  public interval: number = 1.0;   // 同时开火间隔（秒）
     * 
     *  protected _timer:number = 0;       //同时开火计时器

        public damage:number = 100;     //子弹伤害

        public bulletSpeed:number = 150;  //子弹前进速度
 

        protected _shootDir:Vec3 = new Vec3(); //子弹发射方向

        protected _bulletType;  //子弹类型

        protected _isPlayerBullet:boolean = true;     //是否玩家子弹

        public weaponType: string = ''; // 武器的标签
     */


    //============炮台各各种配置===================
    private _turretPath:string = null;//预制体路径
    private _turretPrefab:Prefab = null;//预制体
    private _turretCount: number = 8;    // 炮塔总数
    private _cannonNodes: Node[] = [];       // 存放所有炮台节点
    private _turretScripts: Turret[] = [];   // 存放所有 Turret 脚本组件
    private _turretSprites: (Sprite | null)[] = []; // 缓存每个炮塔的贴图
    private _isSpawning: boolean = false;
    private static readonly COLOR_RED = new Color(255, 50, 50, 255);
    private static readonly COLOR_WHITE = new Color(255, 255, 255, 255);
    private _visualTimer: number = 0;
   

    //=============炮台攻击方式=====================
    private _seqInterval: number = 0.15;  // 一发间隔
    private _seqTimer: number = 0;        // 一发开火计时器
    private _seqIndex:number = -1;        //发射编号
    private _warnTime: number = -1; // 预警时间。如果小于0则自动计算
   

    private _triggerMode:TriggerMode = TriggerMode.IDLE; // 触发状态：IDLE 停火 / ONCE 打一轮 / CONTINUOUS 持续打
    private _fireMode: FireMode = FireMode.SEQUENCE;    // 发射方式：VOLLEY 同时齐射 / SEQUENCE 依次轮流开火


    //===========炮口旋转模式==============================
    private _aimMode: AimMode = AimMode.FIXED;  //炮口旋转模式
    private _aimSpeed: number = 90;      // SPIN/OSCILLATE 的角速度
    private _oscRange: number = 45;      // OSCILLATE 的摆幅（±度）
    private _oscPhase: number = 0;       // OSCILLATE 的相位
    private _fireAngle: number = 180;   // 盲射朝向 / 摆动中心


    //===========炮口移动模式==============================
    private _currentFormation: TurretFormation = TurretFormation.ATTACHED;//队形，圆圈，屏幕四周
    private _orbitCenter: OrbitCenter = OrbitCenter.SELF;   //围绕旋转，boss，屏幕中心
    private _radius: number = 150;          // 圈多大（ATTACHED / ORBITING 用）
    private _rotateSpeed: number = 0;       // 0 = 环绕圈上钉死
    private _currentAngle: number = 0;      // 环绕当前角度

    private _isMoving: boolean = false;
    private _moveTimer: number = 0;
    private _moveDuration: number = 0.6;
    private _startPositions: Vec3[] = [];


    //==========复用临时变量，避免多次new========
    //存放变换阵型后，每个turret的坐标
    private _targetVecs: Vec3[] = [];
    private _tempCenter = new Vec3();

    

    protected onDestroy(): void {
        this.clearCannons();   
    }

    public clear(){
        this.clearCannons();   

        // 换局/重建时复位配置默认值（同局内技能叠加不受影响）
        this._bulletType = GameConstants.BULLET_TYPE.BLUEBULLET;
        this._triggerMode = TriggerMode.IDLE;
        this._fireMode = FireMode.SEQUENCE;
        this._aimMode = AimMode.FIXED;
        this._rotateSpeed = 0;
        this._currentAngle = 0;
    }

    spawnCannons(){
        if (this._isSpawning) return;      // 已在生成中，忽略
        this._isSpawning = true;
        this.clearCannons();  
        if (!this._turretPath) {
            this._isSpawning = false;     // ← 没有路径也要重置
            return;
        }
  
        resources.load(this._turretPath, Prefab, (err, prefab) => {
            this._isSpawning = false; // 加载完后重置标志位
            if (err || !this.enabled) return;
            this._turretPrefab = prefab;
            this.createCannonNodes();
            this.setFormation(this._currentFormation, this._orbitCenter, this._radius, this._rotateSpeed);   
        });
        
    }

    private createCannonNodes() {
        if (!this._turretPrefab) return;
        for (let i = 0; i < this._turretCount; i++) {   
            const cannon = instantiate(this._turretPrefab);
            cannon.parent = this.node.parent;;                                  
            const script = cannon.getComponent(Turret);
            if (!script) { console.warn('[CannonBarrage] 缺少 Turret 组件'); cannon.destroy(); continue; }
            if (this._aimMode === AimMode.FIXED) {
                cannon.angle = this._fireAngle;
            }
            this._cannonNodes.push(cannon);
            const sprite = cannon.getComponentInChildren(Sprite);
            this._turretSprites.push(sprite);
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
        this._turretSprites.length = 0;   
        this._isMoving = false;
        this._seqIndex = -1;
        this._seqTimer = 0;
        this._timer = 0;

       
    }

    // CannonBarrage.ts 新增
    public reset(): void {
       // 只清瞬时运行时计数；阵型/瞄准/子弹类型等配置由 applyConfig 负责
        this._timer = 0;
        this._seqIndex = -1;
        this._seqTimer = 0;
        this._isMoving = false;
        this._moveTimer = 0;
    }

    public applyConfig(params?: Record<string, any>) {
        if (!params) return;
        if (params.aimMode !== undefined) {
            this._aimMode = params.aimMode;
            // 只有「配置要求进 FIXED」时才设一次角度
            if (params.aimMode === AimMode.FIXED) {
                const angle = params.fireAngle !== undefined ? params.fireAngle : this._fireAngle;
                for (let i = 0; i < this._turretScripts.length; i++) {
                    const t = this._turretScripts[i];
                    if (t && t.isValid) t.node.angle = angle;
                }
            }
        }

        if (params.formation !== undefined) {
            this.setFormation(params.formation, params.orbitCenter, params.radius, params.rotateSpeed);
        } else if (params.radius !== undefined || params.orbitCenter !== undefined || params.rotateSpeed !== undefined) {
            // 没换阵型，但改了阵型参数 → 用当前阵型重新排布
            this.setFormation(
                this._currentFormation,
                params.orbitCenter,
                params.radius,
                params.rotateSpeed
            );
        }

        if (params.triggerMode !== undefined) {
            const prev = this._triggerMode;
            this._triggerMode = params.triggerMode;
            if (params.triggerMode === TriggerMode.CONTINUOUS && prev !== TriggerMode.CONTINUOUS) {
                this._timer = 0;
                this._seqIndex = -1;
                this._seqTimer = 0;
            }
        }

        if (params.fireMode !== undefined && params.fireMode !== this._fireMode) {
            this._fireMode = params.fireMode;
            this._timer = 0;
            this._seqIndex = -1;
            this._seqTimer = 0;
        }

        if (params.damage !== undefined) this.damage = params.damage;
        if (params.bulletSpeed !== undefined) this.bulletSpeed = params.bulletSpeed;
        if (params.bulletType !== undefined) this._bulletType = params.bulletType;
        if (params.isPlayerBullet !== undefined) this._isPlayerBullet = params.isPlayerBullet;
        if (params.interval !== undefined) this.interval = params.interval;
        if (params.seqInterval !== undefined) this._seqInterval = params.seqInterval;
        if (params.aimSpeed !== undefined) this._aimSpeed = params.aimSpeed;
        if (params.oscRange !== undefined) this._oscRange = params.oscRange;
        if (params.fireAngle !== undefined) this._fireAngle = params.fireAngle;
        if (params.moveDuration !== undefined) this._moveDuration = params.moveDuration;
        if (params.warnTime !== undefined) this._warnTime = params.warnTime; 
        

        const pathChanged = params.turretPath && params.turretPath !== this._turretPath;
        const countChanged = params.turretCount !== undefined && params.turretCount !== this._turretCount;

        if (pathChanged) this._turretPath = params.turretPath;
        if (countChanged) this._turretCount = params.turretCount;

        // 路径/数量变了 → 重建；炮塔为空 + 有路径 → 也重建（对象池复用场景）
        const needSpawn = pathChanged || countChanged
            || (this._cannonNodes.length === 0 && !!this._turretPath);
        if (needSpawn) this.spawnCannons();
       

    }


    update(dt: number): void {
        this.updateFormation(dt);
        this.updateAim(dt);
        this.updateFire(dt);
        this.updateVisual(dt); // ：每帧统一刷新外观，再也不怕残留状态
    }

     private updateVisual(dt: number) {
        if (this._cannonNodes.length === 0) return;

        let warningIndex = -1;
        let progress = 0;

        if (this._triggerMode !== TriggerMode.IDLE && this._fireMode === FireMode.SEQUENCE) {
            let actualWarn = this._warnTime;
            if (actualWarn < 0) actualWarn = Math.min(0.4, this._seqInterval * 0.5);

            if (this._seqIndex >= 0 && this._seqTimer >= this._seqInterval - actualWarn) {
                warningIndex = this._seqIndex;
                progress = Math.min((this._seqTimer - (this._seqInterval - actualWarn)) / actualWarn, 1);
            }
        }

        this._visualTimer += dt;

        // 高频闪烁逻辑 (每秒 20 次)
        const isRed = Math.floor(this._visualTimer * 20) % 2 === 0;

        for (let i = 0; i < this._cannonNodes.length; i++) {
            const node = this._cannonNodes[i];
            const sprite = this._turretSprites[i];
            if (!node || !node.isValid) continue;

            if (i === warningIndex) {
                // 使用静态常量，零 GC 消耗
                if (sprite) {
                    sprite.color = isRed ? CannonBarrage.COLOR_RED : CannonBarrage.COLOR_WHITE;
                }

                let currentScale = 1.0 + (progress * 0.5); 
                if (isRed) currentScale += 0.15; 

                node.setScale(currentScale, currentScale, 1);
            } else {
                // 复原逻辑（如果是本来就正常的炮塔，甚至可以加个判断跳过赋值）
                if (node.scale.x !== 1) {
                    node.setScale(1, 1, 1);
                }
                if (sprite && sprite.color !== CannonBarrage.COLOR_WHITE) {
                    // 注意：颜色比较不能用 ===，这里直接赋值即可
                    sprite.color = CannonBarrage.COLOR_WHITE;
                }
            }
        }
    }


    //=======炮口移动=============
    private updateFormation(dt: number) {
        // ① 正在飞向目标，阵型变化
        if (this._isMoving) {
            this.updateMoveInterpolation(dt);//慢慢飞向目标
            return;
        }

        // 到位后，每帧按阵型重算位置，不是阵型变换，而是在阵型中移动
        this._currentAngle = (this._currentAngle + this._rotateSpeed * dt) % 360;//_rotateSpeed 为0时阵型静止不动
        this.computeTargetPositions();  //计算目标位置
        for (let i = 0; i < this._cannonNodes.length; i++) {
            const node = this._cannonNodes[i];
            if (node && node.isValid) node.setWorldPosition(this._targetVecs[i]); //设置每个炮口的新坐标
        }
        // 其他情况：到位了，不动
    }

    //每次移动距离
    private updateMoveInterpolation(dt: number) {
        this._moveTimer += dt;
        const progress = Math.min(this._moveTimer / this._moveDuration, 1);
        const eased = progress < 1 ? this.easeOutBack(progress) : 1;

         // 如果圆心是 Boss（比如 ATTACHED），Boss在动，终点也要跟着动！
        if (this._currentFormation === TurretFormation.ATTACHED) {
            this.computeTargetPositions();
        }

        for (let i = 0; i < this._cannonNodes.length; i++) {
            const node = this._cannonNodes[i];
            if (!node || !node.isValid) continue;
            const s = this._startPositions[i];
            const t = this._targetVecs[i];
            if (!s || !t) continue;   
            node.setWorldPosition(
                s.x + (t.x - s.x) * eased,
                s.y + (t.y - s.y) * eased,
                0
            );
        }

        if (progress >= 1) {
            this._isMoving = false;
            
        }
    }

    private easeOutBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    //计算不同阵型的目标位置
    private computeTargetPositions() {
        const angleStep = 360 / this._turretCount;

        while (this._targetVecs.length < this._turretCount) {
            this._targetVecs.push(new Vec3());
        }

        if (this._currentFormation === TurretFormation.SCATTERED) {
            this.computeScatteredPositions(); //分散到屏幕边角
            return;
        }

        

        // ATTACHED / ORBITING：都是"圆心 + 半径 × 角度"  围绕每个点的圆阵
        const center = this.resolveCenter();  //找到圆心
        for (let i = 0; i < this._turretCount; i++) {
            const rad = (this._currentAngle + i * angleStep) * Math.PI / 180;
            this._targetVecs[i].set(
                center.x + Math.cos(rad) * this._radius,
                center.y + Math.sin(rad) * this._radius,
                0
            );
        }
  
    }

    private computeScatteredPositions(){
       
    
        // 内缩 50 像素，避免炮塔一半在屏幕外
        const w = GameData.viewW - 50; 
        const h = GameData.viewH - 50;
        const corners: [number, number][] = [
            [25, h], [w, h], [w, 25], [25, 25], // 左下角稍微偏移 (25,25)
        ];

        // 周长总长（四条边）
        const segLen = [ w,  h,  w,  h];
        const total = 2 * (w + h);

  
        for (let i = 0; i < this._turretCount; i++) {
            // 第 i 个炮塔在周长上的比例（0~1）
            const t = ((i / this._turretCount) + this._currentAngle / 360) * total % total;

            // 找到 t 落在哪条边上
            let acc = 0, seg = 0;
            for (let s = 0; s < 4; s++) {
                if (t <= acc + segLen[s]) { seg = s; break; }
                acc += segLen[s];
            }

            const local = t - acc;
            const a = corners[seg];
            const b = corners[(seg + 1) % 4];
            const k = local / segLen[seg];

            this._targetVecs[i].set(
                a[0] + (b[0] - a[0]) * k,
                a[1] + (b[1] - a[1]) * k,
                0
            );
        }
          
    }

    private resolveCenter(): Vec3 {
        if (this._currentFormation === TurretFormation.ATTACHED) {
            return this.node.worldPosition;
        }
        if (this._orbitCenter === OrbitCenter.SELF) {
            return this.node.worldPosition;
        }
        if (this._orbitCenter === OrbitCenter.TARGET) {
            const t = GameData.currentTarget;
            return (t && t.isValid) ? t.worldPosition : this.node.worldPosition;
        }
        this._tempCenter.set(0, 0, 0);
        return this._tempCenter;   // SCREEN
    }


    public setFormation(formation: TurretFormation, center?: OrbitCenter, radius?: number, rotateSpeed?: number) {
        this._currentFormation = formation;
        if (center !== undefined) this._orbitCenter = center;
        if (radius !== undefined) this._radius = radius;
        if (rotateSpeed !== undefined) this._rotateSpeed = rotateSpeed;

        // 环绕角度归零，重新排布
        this._currentAngle = 0;

        // 记录起点，算终点，开始插值
        while (this._startPositions.length < this._cannonNodes.length) {
            this._startPositions.push(new Vec3());
        }
        for (let i = 0; i < this._cannonNodes.length; i++) {
            this._startPositions[i].set(this._cannonNodes[i].worldPosition);
        }
  
        this.computeTargetPositions();

        this._isMoving = true;
        this._moveTimer = 0;
    }




    //=========炮口旋转===========
    private updateAim(dt: number) {
        if(this._aimMode === AimMode.FIXED) return;
        if (this._aimMode === AimMode.SPIN) {
            this.updateSpin(dt);
        } else if (this._aimMode === AimMode.TARGET) {
            this.updateAimAtTarget();
        }else if(this._aimMode === AimMode.OSCILLATE){
            this.updateOscillate(dt);
        } else if (this._aimMode === AimMode.CENTER) { // 👈 新增
            this.updateAimAtCenter();
        }
    }

    

    updateSpin(dt){
        if (this._aimSpeed === 0) return;
        const delta = this._aimSpeed * dt;
        for (let i = 0; i < this._turretScripts.length; i++) {
            const turret = this._turretScripts[i];
            if (!turret || !turret.isValid) continue;
            turret.node.angle = (turret.node.angle + delta) % 360;
        }
    }

    protected getAimTarget(): Node | null {
        const t = GameData.currentTarget;
        return (t && t.isValid) ? t : null;
    }

    updateAimAtTarget(){
        const target = this.getAimTarget();
        if (!target ) return;   // 没目标不瞄，也不切 FIXED
        for(let i=0;i< this._turretScripts.length;++i){
            this._turretScripts[i].aimAt(target.worldPosition); 
        }
        this._aimMode = AimMode.FIXED;
    }

    private updateOscillate(dt: number) {
        if (this._aimSpeed === 0) return;

        this._oscPhase += this._aimSpeed * dt;
        if (this._oscPhase >= 360) this._oscPhase -= 360;   // 防精度漂移

        const rad = this._oscPhase * Math.PI / 180;
        const offset = Math.sin(rad) * this._oscRange;      // ±_oscRange
        const angle = this._fireAngle + offset;

        for (let i = 0; i < this._turretScripts.length; i++) {
            const turret = this._turretScripts[i];
            if (!turret || !turret.isValid) continue;
            turret.node.angle = angle;
        }
    }


    //瞄准屏幕中心
    private updateAimAtCenter() {
        // 根据你的世界坐标系计算中心点
        this._tempCenter.set(GameData.viewW / 2, GameData.viewH / 2, 0);
        
        for (let i = 0; i < this._turretScripts.length; i++) {
            const turret = this._turretScripts[i];
            if (turret && turret.isValid) {
                turret.aimAt(this._tempCenter);
            }
        }
    }





    //===========开火================
    updateFire(dt:number){
        if (this._turretScripts.length === 0) return;   //
        if(this._triggerMode === TriggerMode.IDLE) return; //停火
        if(this._fireMode === FireMode.VOLLEY){      //一起开火
            this.updateVOLLEY(dt);
        }else{
            this.updateSequence(dt);        //次序开火
        }
    }

    //同时开火
    private updateVOLLEY (dt: number){

         //判断是一次开火
        if (this._triggerMode === TriggerMode.ONCE) { //如果是一次开火，则结束开火模式
            this._triggerMode = TriggerMode.IDLE;
            this._timer = 0;       
        }else{
            this._timer += dt;
            if(this._timer < this.interval) return;
            this._timer -= this.interval;  //重置计时器
        }

        for(let i=0;i< this._turretScripts.length;++i){
            this._turretScripts[i].fire(this.damage,this._bulletType,this.bulletSpeed,this._isPlayerBullet);
        }
    }


    

    //依次发射
    private updateSequence(dt: number) {
        if(this._seqIndex < 0) {  //初始化
            this._seqTimer = 0;
            this._seqIndex = 0;
        }

        //计时开始
        this._seqTimer += dt;

        if(this._seqTimer < this._seqInterval) return;


        //获取当前要发射的炮台组件，并发射
        let turret:Turret = this._turretScripts[this._seqIndex];
        if (turret && turret.isValid) {
            turret.fire(this.damage,this._bulletType,this.bulletSpeed,this._isPlayerBullet);
        }
        ++this._seqIndex;

        //判断是否完成一轮发射
        if(this._seqIndex >= this._turretScripts.length){
            this._seqIndex = -1;
            if (this._triggerMode === TriggerMode.ONCE) { //如果是一次开火，则结束开火模式
                this._triggerMode = TriggerMode.IDLE;
            }
        }else{
            this._seqTimer -= this._seqInterval;  //重置计时器
        }
    }

    
    
}


