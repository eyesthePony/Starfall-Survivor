import { _decorator, Button, Component, director } from 'cc';
import { GameConstants } from '../Core/GameConstants';
import { GameData } from '../Core/GameData';
const { ccclass,property } = _decorator;

@ccclass('Start')
export class Start extends Component {
    @property
    levelId:number = 1;

    @property
    isEndlessMode:boolean = false;

    

    onLoad() {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    onDestroy() {
        this.node.off(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick() {
        GameData.selectedLevel = this.levelId;
        GameData.isEndlessMode = this.isEndlessMode;
        director.loadScene(GameConstants.GAME_SCENE.BATTLE);
    }
}


