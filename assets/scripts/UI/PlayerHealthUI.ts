import { _decorator, Color, Component, instantiate, Node, Prefab, Sprite } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameConstants } from '../Core/GameConstants';
import { GameData } from '../Core/GameData';
const { ccclass, property } = _decorator;

@ccclass('PlayerHealthUI')
export class PlayerHealthUI extends Component {

    @property(Prefab)
    blockPrefab: Prefab = null!; // 拖入你的方块预制体

    private _maxHp:number = 5;

    private _blockNodes: Node[] = [];

    //定义颜色
    private _emptyColor = new Color(80, 80, 80, 255); // 掉血：深灰色

    protected onLoad(): void {
        EventBus.on(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED, this.onHpChanged, this);
        EventBus.on(GameConstants.EVENT_TYPE.GAME_RESET, this.init, this); // 监听重开
        this.init();
    }

    public init(){
        this._maxHp = GameData.playerMaxHp;
        this._blockNodes = []; // 清空旧数组
        this.node.removeAllChildren(); // 把场景里旧的方块节点全部删掉，防残留
        for (let i = 0; i < this._maxHp; ++i) {
            const block = instantiate(this.blockPrefab);
            block.parent = this.node;
            this._blockNodes.push(block);
        }
    }

    onHpChanged(curHp:number){
        if(curHp < 0) return;
        const sprite = this._blockNodes[curHp].getComponent(Sprite);
        if (sprite) {
            sprite.color = this._emptyColor; // 没血了，灰色
        }
    }
    

    protected onDestroy(): void {
        EventBus.off(GameConstants.EVENT_TYPE.PLAYER_HP_CHANGED, this.onHpChanged, this);
        EventBus.off(GameConstants.EVENT_TYPE.GAME_RESET, this.init, this);
    }

}


