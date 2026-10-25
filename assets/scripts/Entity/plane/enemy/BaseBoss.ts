import { _decorator, BoxCollider2D, CircleCollider2D, Collider2D, Component, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3, view } from 'cc';
import { BasePlane } from '../BasePlane';
import { EventBus } from '../../../Core/EventBus';
import { GameConstants } from '../../../Core/GameConstants';
import { GameData } from '../../../Core/GameData';
import { BossConfigData, BossHitBoxConfig, BossPartConfig } from '../../../Core/BossConfig';
import { AnimatorMap, SkillMap } from '../../../Core/SkillMap';
const { ccclass, property } = _decorator;

@ccclass('BaseBoss')
export class BaseBoss extends BasePlane{

    //boss阶段
    protected _phaseIndex:number = 0;
    private _skillMap: Map<string, Component> = new Map();
    private _config:BossConfigData = null;

    //正在入场，boss无敌
    protected _isEntering = true;

    public init(cfg:BossConfigData , pos: Vec3) {
        if(!cfg){console.warn(`cfg为空`);return;};
        this._config = cfg;
        this.node.setPosition(pos);//设置初始位置
        const s = cfg.scale ?? 1;
        this.node.setScale(s, s, 1);  
        this._isDead = false;      //死亡判断重置
        this._phaseIndex = 0;       //重置阶段
        this._isEntering = true; //重置开场 
        this.enabled = true; 
        this._maxHp = cfg.maxHp;
        this.hp = this._maxHp
        this.assemble();
        this.setupCollider();     // ← 挂碰撞
        this.ensureSkills();
         // 清空可能残留的 Tween 动画
        tween(this.node).stop();
        
        this.enterScreen();
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
            node.parent = this.node;
            node.setPosition(part.x ?? 0, part.y ?? 0, 0);  
            const ps = part.scale ?? 1;
            node.setScale(ps, ps, 1);                         
            const sp = node.addComponent(Sprite);
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

    private ensureSkills() {

        this._skillMap.clear();
        // 收集 name → params（同一技能多阶段出现，取第一次）
        const skillParams = new Map<string, any>();
        for (const phase of this._config.phases) {
            for (const skill of phase.skills) {
                if (!skillParams.has(skill.name)) {
                    skillParams.set(skill.name, skill.params);
                }
            }
        }

        for (const [name, params] of skillParams) {
            const Cls = SkillMap[name];
            if (!Cls) { console.warn(`[BaseBoss] 未知技能: ${name}`); continue; }

            let comp: any = this.getComponent(Cls);
            if (!comp) comp = this.addComponent(Cls);

            comp.applyConfig?.(params);   // ← 注入参数
            comp.enabled = false;
            this._skillMap.set(name, comp);
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
            if (comp) comp.enabled = true;
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
        const targetY = GameData.screenHeight/ 2; 
        const targetPos = new Vec3(0, targetY - 220, 0);
        tween(this.node)
        .to(2, { position: targetPos }, { easing: 'sineOut' })
        .call(() => {
            this._isEntering = false; //入场结束，可以射击和被伤害了
            this.onEnterComplete();
        })
        .start();
    }

    update(deltaTime: number) {
    }

    
    // 留给子类重写：入场结束后干嘛？
    protected onEnterComplete() {
        this.activatePhase(0);
    }

    
    // 掉血逻辑（通用）
    public takeDamage(damage: number) {
        if (this._isEntering || this._isDead) return;
        this.hp -= damage;
        if (this.hp <= 0) this.onDeath();
        else this.checkPhase();
    }


    protected onDeath(): void {
        if(this._isDead) return;
        this._isDead = true;
        tween(this.node).stop(); 
        this._skillMap.forEach(c => { if (c) c.enabled = false; });   // ← 加
        EventBus.dispatchEvent(GameConstants.EVENT_TYPE.ENEMY_KILLED, this.node);
    }





}


