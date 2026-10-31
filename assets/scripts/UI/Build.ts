import { _decorator, Button, Component, } from 'cc';
import { GameConstants } from '../Core/GameConstants';
import { EventBus } from '../Core/EventBus';
import { BuildPanel } from './BuildPanel';
const { ccclass, property } = _decorator;

@ccclass('Build')
export class Build extends Component {

    @property(BuildPanel) 
    buildPanel: BuildPanel = null!;
    
    onLoad() {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    onDestroy() {
        this.node.off(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick() {
        this.buildPanel.show();
    }
}


