import { _decorator, Animation, Component, Prefab, Vec3 } from 'cc';
import { EventBus } from '../Event/EventBus';
import { GameConstants } from '../Event/GameConstants';
import { PoolManager } from './PoolManager';
const { ccclass, property } = _decorator;

@ccclass('EffectManager')
export class EffectManager extends Component {

    static instance:EffectManager = null;

    @property({ type: [Prefab], tooltip: "把所有特效Prefab拖进来，代码里按文件名调用" })
    effectPrefabs: Prefab[] = [];

    private _map: Map<string, Prefab> = new Map();

    onLoad(){
        EffectManager.instance = this;
        for (const p of this.effectPrefabs) {
            this._map.set(p.name, p);
        }

        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
       
    }

    private onGameReset(){
        const effects = this.node.children;
        for (let i = effects.length - 1; i >= 0; i--) {
            PoolManager.instance.putNode(effects[i]);
        }
    }


    play(name: string, pos: Vec3, scale: number = 1){

        const prefab = this._map.get(name);

        if (!prefab) {
            console.warn(`EffectManager 找不到名为 [${name}] 的特效 Prefab！`);
            return;
        }
   
        const effectNode = PoolManager.instance.getNode(prefab,this.node);
        effectNode.setWorldPosition(pos);
        effectNode.setScale(scale, scale, 1);

        const anim = effectNode.getComponent(Animation)!;
        if(!anim){
            console.warn(`anime  [${name}] 为空`);
            return;
        }
        
        // ==========================================
        // 2. 播放动画
        // ==========================================
        anim.stop(); // 防复用残留状态
        anim.play();
        
        if (!anim.defaultClip) { PoolManager.instance.putNode(effectNode); return; }
        const waitTime = anim.defaultClip.duration;
        

        // ==========================================
        // 3. 定时回收（绝不用 anim.on 匿名函数，会内存泄漏）
        // ==========================================
        // 假设动画时长 0.6 秒，用 scheduleOnce 延迟回收
         this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid && effectNode.active) {
                PoolManager.instance.putNode(effectNode);
            }
        }, waitTime);

    }

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET,this.onGameReset,this);
    }

}


