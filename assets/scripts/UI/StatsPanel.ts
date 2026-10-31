import { _decorator, Component, Node, Prefab, instantiate, Label, Button, tween, Vec3, UITransform } from 'cc';
import { DamageStats } from '../Core/DamageStats';
const { ccclass, property } = _decorator;

@ccclass('StatsPanel')
export class StatsPanel extends Component {
    @property(Prefab) itemPrefab: Prefab = null!;
    @property(Node) contentNode: Node = null!;
    @property(Node) toggleBtn: Node = null!; 

    private _isOpen: boolean = false;
    private _isAnimating: boolean = false;
    private _openPos: Vec3 = new Vec3();
    private _closePos: Vec3 = new Vec3();
    
    private _refreshTimer: number = 0; // 👈 新增：刷新计时器

    protected onLoad() {
        this._openPos = this.node.position.clone();
        const ut = this.node.getComponent(UITransform);
        const panelWidth = ut ? ut.width : 500; 
        this._closePos = new Vec3(this._openPos.x + panelWidth + 50, this._openPos.y, this._openPos.z);
        
        this.node.setPosition(this._closePos);
        this.node.active = false;

        if (this.toggleBtn) {
            this.toggleBtn.on(Button.EventType.CLICK, this.togglePanel, this);
        }
    }

    // 👈 新增：用 update 实现平滑刷新，不卡顿
    update(deltaTime: number) {
        // 1. 如果面板关着，或者正在播放动画，就不要刷新
        if (!this._isOpen || this._isAnimating) return;

        // 2. 计时器累加
        this._refreshTimer += deltaTime;
        
        // 3. 每 0.2 秒检查一次数据有没有变化
        if (this._refreshTimer >= 0.2) {
            this._refreshTimer = 0; // 重置计时
            
            // 4. 只有数据真的变了（打中敌人了），才重新画 UI
            if (DamageStats.instance.isDirty) {
                this.refreshStats();
                DamageStats.instance.isDirty = false; // 画完，标记为干净
            }
        }
    }

    private togglePanel() {
        if (this._isAnimating) return; 
        this._isOpen = !this._isOpen;
        this._isAnimating = true;

        if (this._isOpen) {
            this.node.active = true;
            this.node.setPosition(this._closePos); 
            
            // 👈 展开时，强制刷新一次，并把状态重置
            this.refreshStats(); 
            DamageStats.instance.isDirty = false; 
            this._refreshTimer = 0;

            tween(this.node)
                .to(0.3, { position: this._openPos }, { easing: 'backOut' })
                .call(() => { this._isAnimating = false; })
                .start();
        } else {
            tween(this.node)
                .to(0.3, { position: this._closePos }, { easing: 'sineIn' })
                .call(() => {
                    this.node.active = false;
                    this._isAnimating = false;
                })
                .start();
        }
    }

    private refreshStats() {
        this.contentNode.removeAllChildren();
        const ranked = DamageStats.instance.getRankedStats();
        
        if (ranked.length === 0) return;
        
        for (let i = 0; i < ranked.length; i++) {
            this.addItem(ranked[i].name, ranked[i].damage);
        }
    }

    private addItem(name: string, damage: number) {
        const node = instantiate(this.itemPrefab);
        node.parent = this.contentNode;
        const nameLabel = node.children[0]?.getComponent(Label);
        const dmgLabel = node.children[1]?.getComponent(Label);
        if (nameLabel) {
            console.log(name);
            nameLabel.string = name;
        }
        if (dmgLabel){
            console.log(damage);
            dmgLabel.string = `伤害: ${damage}`;
        } 
    }
}