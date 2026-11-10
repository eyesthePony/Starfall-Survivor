import { _decorator, Button, Component, director } from 'cc';
import { GameConstants } from '../../Core/Event/GameConstants';
import { PoolManager } from '../../Core/Manager/PoolManager';
const { ccclass} = _decorator;

@ccclass('Quit')
export class Quit extends Component {
    onLoad() {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }
    onDestroy() {
        this.node.off(Button.EventType.CLICK, this.onClick, this);
    }
    private onClick() {
        PoolManager.instance.clearAllPool(); // 清空子弹、敌机的内存
        // 直接切回大厅场景，引擎会自动销毁当前战斗场景的所有节点
        director.loadScene(GameConstants.GAME_SCENE.HALL); 
    }
}


