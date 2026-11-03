import { _decorator, AnimationClip, BoxCollider2D, CircleCollider2D, Animation, Component, Node, resources, Sprite, SpriteFrame, Tween, Vec3,} from 'cc';
import { BasePlane } from '../BasePlane';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
import { BossConfigData, BossHitBoxConfig, BossPartConfig, BossPhaseConfig, SkillConfig } from '../../../Core/BossConfig';
import { AnimatorMap, SkillMap } from '../../../Core/SkillMap';
import { BossEnterMove } from '../../../Component/Move/BossEnterMove';
const { ccclass, property } = _decorator;

@ccclass('BaseBoss')
export class BaseBoss extends BasePlane{

    //boss阶段
    protected _phaseIndex:number = 0;
    //所有需要弹幕的组件
    private _skillMap: Map<string, Component> = new Map();
    //当前阶段数据的组件数据缓存
    private _currentPhaseData:BossPhaseConfig = null;
    //根据时间执行的组件
    private _delayedTasks: { timer: number, callback: () => void }[] = [];
    //boss配置数据，贴图，弹幕
    private _config:BossConfigData = null;

    private _phaseLoopTimer:number = 0; // 阶段循环总倒计时
    

    //boss入场动画
    private _enterMove: BossEnterMove | null = null

    //正在入场，boss无敌
    protected _isEntering = true;

    protected onLoad() {
        //获得入场组件
        this._enterMove = this.getComponent(BossEnterMove);
        if (!this._enterMove) {
            this._enterMove = this.addComponent(BossEnterMove);
        }
        this._enterMove.enabled = false;   // 等 play() 再启用
        this.expReward = 1000;
          
    }

    public init(cfg:BossConfigData , pos: Vec3,hpMultiplier:number = 1) {
        if(!cfg){console.warn(`cfg为空`);return;}; 
         this._skillMap.forEach(c => 
        {  if (c) {
            c.enabled = false;
            (c as any).clear?.();
        } });
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR);
        if (this._enterMove) this._enterMove.enabled = false; //避免入场时重开，进入pool，为true
        this._config = cfg;
        this.node.setPosition(pos);//设置初始位置
        const s = cfg.scale ?? 1;   //设置节点放缩
        this.node.setScale(s, s, 1);  
        this._isDead = false;      //死亡判断重置
        this._phaseIndex = 0;       //重置阶段
        this._isEntering = true; //重置开场 
        this.enabled = true;       
        this._maxHp = cfg.maxHp * hpMultiplier;   //初始化最大血量
        this.hp = this._maxHp;      //初始化现有血量
        this.expReward = 1000;

         // 重置时间轴状态
        this._delayedTasks.length = 0;
        this._phaseLoopTimer = 0;

        this.assemble();          //组装贴图
        this.setupCollider();     // ←挂碰撞
        this.ensureSkills();      //获取弹幕组件
        
        this.enterScreen();      //开启入场动画
        
    }

    //构建碰撞体
    private setupCollider() {
        const hitBox: BossHitBoxConfig = this._config.hitBox;
        if (!hitBox) return;

        // 提前获取好组件（如果是第一次，用 addComponent；之后直接从节点拿）
        let box = this.getComponent(BoxCollider2D);
        let circle = this.getComponent(CircleCollider2D);

        if (!box) box = this.node.addComponent(BoxCollider2D);
        if (!circle) circle = this.node.addComponent(CircleCollider2D);

        // 默认先全关
        box.enabled = false;
        circle.enabled = false;

        if (hitBox.shape === 'circle') {
            circle.radius = hitBox.radius ?? 100;
            circle.offset.set(hitBox.offsetX ?? 0, hitBox.offsetY ?? 0);
            circle.group = GameConstants.ITEM_GROUP.ENEMY_PLANE;
            circle.sensor = true;
            circle.enabled = true; // 👈 激活
        } else {
            box.size.set(hitBox.width ?? 100, hitBox.height ?? 100);
            box.offset.set(hitBox.offsetX ?? 0, hitBox.offsetY ?? 0);
            box.group = GameConstants.ITEM_GROUP.ENEMY_PLANE;
            box.sensor = true;
            box.enabled = true; // 👈 激活
        }
    }


    //组装贴图
    assemble(){
        const parts:BossPartConfig[] = this._config.parts;
        this.node.destroyAllChildren();

        let length = parts.length;
        for(let i=0;i<length;++i){
            //创建贴图节点
            const part = parts[i];
            const node = new Node(part.name);
            //设置父节点为baseboss
            node.parent = this.node;
            //设置贴图初始位置
            node.setPosition(part.x ?? 0, part.y ?? 0, 0);  
            //放缩贴图
            const ps = part.scale ?? 1;
            node.setScale(ps, ps, 1);      
            //将图片组件加入贴图节点           
            const sp = node.addComponent(Sprite);
            //设置大小模式
            sp.sizeMode = Sprite.SizeMode.TRIMMED;
        
            //加载贴图并赋予节点
        if (!part.animClipPath) {
            resources.load(`${part.texture}/spriteFrame`, SpriteFrame, (err, sf) => {
                if (err) { console.error(`加载失败: ${part.texture}`, err); node.destroy(); return; }
                if (!node.isValid) return;
                sp.spriteFrame = sf;
            });
        }
            
            //赋予贴图动画
        if (part.animClipPath) {
            // 走序列帧动画：不 load 单张图，直接挂 Animation 播循环 Clip
            resources.load(part.animClipPath, AnimationClip, (err, clip) => {
                    if (err) { console.error(`加载动画失败: ${part.animClipPath}`, err); node.destroy(); return; }
                    if (!node.isValid) return;
                    const anim = node.addComponent(Animation);
                    anim.defaultClip = clip;
                    anim.playOnLoad = true;
                    anim.play();
                });
        }else if (part.animation) {
                const Cls = AnimatorMap[part.animation];
                if (Cls) node.addComponent(Cls);
                else console.warn(`[BaseBoss] 未知动画: ${part.animation}`);
            }       
            
        }
    }

    //加载所有弹幕、移动组件，存放到缓存
    private ensureSkills() {
        this._skillMap.clear();
        // 收集组件name，不重复
        const needed = new Set<string>();
        for (const phase of this._config.phases) {
            for (const skill of phase.skills) needed.add(skill.name);
        }

        for (const name of needed) {
            const Cls = SkillMap[name];  //获取Component的名称
            if (!Cls) { console.warn(`[BaseBoss] 未知技能: ${name}`); continue; }

            let comp: any = this.getComponent(Cls);  //获取组件或者添加
            if (!comp) comp = this.addComponent(Cls);

            comp.enabled = false;
            this._skillMap.set(name, comp);   //添加入本地Map
        }
        
    }
      // 统一的时间轴重置方法
    private resetPhaseTimeline(phase: BossPhaseConfig) {
        const needed = new Set(phase.skills.map(s => s.name));
        for (const [name, c] of this._skillMap) {
            if (c && !needed.has(name)) c.enabled = false;
        }
        // 1. 重置队列，并获取本轮最大耗时
        const maxEndTime = this.preparePhaseSkills(phase);

        // 2. 根据配置设置循环计时器
        if (phase.loop) {
            this._phaseLoopTimer = maxEndTime + (phase.loopDelay ?? 0.5);
        } else {
            this._phaseLoopTimer = 0;
        }
    }

    // 1.按阶段配置开关技能
    private activatePhase(index: number) {
        const phase = this._config.phases[index]; 
        if (!phase) { console.warn(`[BaseBoss] 阶段 ${index} 不存在`); return; }

        this._phaseIndex = index;
        this._currentPhaseData = phase; 

        // 👈 调用统一重置方法
        this.resetPhaseTimeline(phase);
    }

    // 2. 准备技能队列（重点在这里，不用数组索引）
    private preparePhaseSkills(phase: BossPhaseConfig): number {
        
        this._delayedTasks.length = 0; // 清空上一轮的残留
        let maxEndTime = 0;            // 记录本阶段的最晚结束时间

        //========== 遍历当前阶段的技能配置，按 delay 分发 ==========
        const length = phase.skills.length;
        for (let i = 0; i < length; i++) {
            const skill = phase.skills[i];
            const delay = skill.delay ?? 0;
            // 如果技能有 duration 参数（比如位移耗时），也拿来算
            const duration = skill.params?.duration ?? 0; 

            // 1. 顺便计算最晚结束时间
            if (delay + duration > maxEndTime) {
                maxEndTime = delay + duration;
            }

            // 立刻生效的技能直接执行
            if (delay <= 0) {
                this.activateSkill(skill);
            } 
            // 有延迟的技能，塞进队列等倒计时
            else {
                this._delayedTasks.push({ 
                    timer: delay, 
                    callback: () => this.activateSkill(skill) 
                });
            }
        }
        return maxEndTime;
    }

     // 统一激活单个技能的方法
    private activateSkill(skill: SkillConfig) {
        const comp = this._skillMap.get(skill.name);//获得组件
        if (!comp) return;

        // 注入参数
        (comp as any).reset?.(); 
        (comp as any).applyConfig?.(skill.params);            
        
        // 激活组件
        comp.enabled = true;

       
    }

    // 血量变化时判断是否进下一阶段
    protected checkPhase() {
        const ratio = this.hp / this._maxHp;
        const total = this._config.phases.length;

        // 2 阶段：50% 进二阶段；3 阶段：66% / 33%
        for (let i = this._phaseIndex + 1; i < total; ++i) {
            if (ratio <= 1 - i / total) {
                this.activatePhase(i);
                break;              // 一次只进一级
            }
        }
    }

   
    protected enterScreen() {
        // 2秒慢慢飘进来
        // 停在距离屏幕顶端往下大约 200 像素的位置
        // 假设屏幕中心是 0，顶部就是 height / 2
        const targetY = GameData.screenHeight / 2;
        const target = new Vec3(0, targetY - 220, 0);
        this._enterMove?.play(2, target, () => {
            this._isEntering = false;
            this.onEnterComplete();  //入场完成后，需要做什么
        });
    }

    //游戏暂停，暂停所有组件
    setPaused(isPaused: boolean) {
        super.setPaused(isPaused);
        if (isPaused) {
            this.suspend();
        } else {
            this.resume();
        }
    }

    private suspend(){
        if (this._enterMove) this._enterMove.enabled = false;   // 入场停
        for (const c of this._skillMap.values()) if (c) c.enabled = false;

    }

    private resume(){
        if (this._isEntering) {
                if (this._enterMove) this._enterMove.enabled = true; // 入场恢复
            } else {
                // 精准唤醒：只唤醒当前阶段还在激活状态的组件
                const phase = this._config.phases[this._phaseIndex];
                for (const skill of phase.skills) {
                    const comp = this._skillMap.get(skill.name);
                    
                        if (comp) comp.enabled = true;
                    
                }
            }
    }

    update(deltaTime: number) {
            if (this._isDead || this._isEntering) return; // 入场或死亡时，时间轴冻结

             // 如果两边都是空的，直接一帧返回，连后面的循环都不进！
            if (this._delayedTasks.length === 0 && this._phaseLoopTimer <= 0) {
                return;
            }

            // 1. 处理延迟任务队列
            for (let i = this._delayedTasks.length - 1; i >= 0; i--) {
                const task = this._delayedTasks[i];
                task.timer -= deltaTime;
                if (task.timer <= 0) {
                    task.callback(); 
                    if (this._delayedTasks[i] === task) {
                        this._delayedTasks.splice(i, 1); 
                    }   
                }
            }

            // 2. 处理阶段循环
            if (this._phaseLoopTimer > 0) {
                this._phaseLoopTimer -= deltaTime;
                if (this._phaseLoopTimer <= 0) {
  
                    
                    // 重新走一遍时间轴重置，自动算好下一轮的循环时间
                    if (this._currentPhaseData) {
                        this.resetPhaseTimeline(this._currentPhaseData);
                    }
                }
            }                                                
    }

    
    // 入场结束后
    protected onEnterComplete() {
        this.activatePhase(0);  //开启一阶段
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BOSS_SHOW_HP_BAR,this._config.name,this._maxHp);
    }

    
    // 掉血逻辑（通用）
    public takeDamage(damage: number) {
        if (this._isEntering || this._isDead) return;
        this.hp -= damage;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BOSS_HP_CHANGED,this.hp);
        if (this.hp <= 0) this.onDeath();
        else this.checkPhase();
    }

    //boss死亡，停掉所有组件
    protected onDeath(): void {
        if(this._isDead) return;
        this._isDead = true;
        this._skillMap.forEach(c => {  if (c) {
            c.enabled = false;
            (c as any).clear?.();
        } });   
        this._delayedTasks.length = 0;
        this._phaseLoopTimer = 0;
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.node);
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.BOSS_HIDE_HP_BAR);
    }





}


