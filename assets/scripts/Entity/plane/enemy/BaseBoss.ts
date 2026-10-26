import { _decorator, BoxCollider2D, CircleCollider2D, Collider2D, Component, Node, resources, Sprite, SpriteFrame, Vec3,} from 'cc';
import { BasePlane } from '../BasePlane';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
import { BossConfigData, BossHitBoxConfig, BossPartConfig } from '../../../Core/BossConfig';
import { AnimatorMap, SkillMap } from '../../../Core/SkillMap';
import { BossEnterMove } from '../../../Component/Move/BossEnterMove';
const { ccclass, property } = _decorator;

@ccclass('BaseBoss')
export class BaseBoss extends BasePlane{

    //boss阶段
    protected _phaseIndex:number = 0;
    //所有需要弹幕的组件
    private _skillMap: Map<string, Component> = new Map();
    //boss配置数据，贴图，弹幕
    private _config:BossConfigData = null;

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
          
    }

    public init(cfg:BossConfigData , pos: Vec3) {
        if(!cfg){console.warn(`cfg为空`);return;}; 
        if (this._enterMove) this._enterMove.enabled = false; //避免入场时重开，进入pool，为true
        this._config = cfg;
        this.node.setPosition(pos);//设置初始位置
        const s = cfg.scale ?? 1;   //设置节点放缩
        this.node.setScale(s, s, 1);  
        this._isDead = false;      //死亡判断重置
        this._phaseIndex = 0;       //重置阶段
        this._isEntering = true; //重置开场 
        this.enabled = true;       
        this._maxHp = cfg.maxHp;   //初始化最大血量
        this.hp = this._maxHp;      //初始化现有血量
        this.assemble();          //组装贴图
        this.setupCollider();     // ←挂碰撞
        this.ensureSkills();      //获取弹幕组件
        
        this.enterScreen();      //开启入场动画
        
    }

    //构建碰撞体
    private setupCollider() {
        const hitBox: BossHitBoxConfig = this._config.hitBox;
        if (!hitBox) return;

        // 复用时先移除旧碰撞体（可能上次是 circle，这次是 box）
        const old = this.getComponent(Collider2D);
        if (old){
            old.enabled = false;
            old.destroy();
        } 

        let collider: Collider2D;
        if (hitBox.shape === 'circle') {
            const c = this.node.addComponent(CircleCollider2D);
            c.radius = hitBox.radius ?? 100;
            collider = c;
        } else {
            const b = this.node.addComponent(BoxCollider2D);
            b.size.set(hitBox.width ?? 100, hitBox.height ?? 100);
            collider = b;
        }

        collider.offset.set(hitBox.offsetX ?? 0, hitBox.offsetY ?? 0);
        collider.group = GameConstants.ITEM_GROUP.ENEMY_PLANE;   // 分组 4
        collider.sensor = true;   // 飞行射击游戏通常用 sensor，不做物理反弹
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
            resources.load(`${part.texture}/spriteFrame`,SpriteFrame,(err, sf) => {
                if (err) { console.error(`加载失败: ${part.texture}`, err);  node.destroy(); return; }
                if (!node.isValid) return;
                sp.spriteFrame = sf;
            });
            
            //赋予贴图动画
            if (part.animation) {
                const Cls = AnimatorMap[part.animation];
                if (Cls) node.addComponent(Cls);
                else console.warn(`[BaseBoss] 未知动画: ${part.animation}`);
            }       
            
        }
    }

    //加载弹幕、移动组件
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

        // 按阶段配置开关技能
    private activatePhase(index: number) {
        const phase = this._config.phases[index];
        if (!phase) { console.warn(`[BaseBoss] 阶段 ${index} 不存在`); return; }

        this._phaseIndex = index;
         // 先全关
        for (const comp of this._skillMap.values()) comp.enabled = false;

        // 再开当前阶段的
        for (const skill of phase.skills) {
            const comp = this._skillMap.get(skill.name);
            if (comp) {
                (comp as any).applyConfig?.(skill.params);   // ← 按当前阶段的 params 注入
                (comp as any).reset?.();          //初始化组件
                comp.enabled = true;
            }
        }
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
    setPaused(isEnabled: boolean) {

        if (!isEnabled) {
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
                const phase = this._config.phases[this._phaseIndex];  //当前节点所需组件恢复
                for (const skill of phase.skills) {                 
                    const comp = this._skillMap.get(skill.name);
                    if (comp) comp.enabled = true;
                }
            }
    }

    update(deltaTime: number) {

    }

    
    // 入场结束后
    protected onEnterComplete() {
        this.activatePhase(0);  //开启一阶段
    }

    
    // 掉血逻辑（通用）
    public takeDamage(damage: number) {
        if (this._isEntering || this._isDead) return;
        this.hp -= damage;
        if (this.hp <= 0) this.onDeath();
        else this.checkPhase();
    }

    //boss死亡，停掉所有组件
    protected onDeath(): void {
        if(this._isDead) return;
        this._isDead = true;
        this._skillMap.forEach(c => { if (c) c.enabled = false; });   // ← 加
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.node);
    }





}


