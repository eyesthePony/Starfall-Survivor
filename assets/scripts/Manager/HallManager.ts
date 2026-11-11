import { _decorator, Component, Node } from 'cc';
import { SaveManager } from '../Core/Manager/SaveManager';
import { EconomyManager } from '../Core/Manager/EconomyManager';
import { MapManager } from './MapManager';
import { BuildManager } from './BuildManager';
const { ccclass, property } = _decorator;

@ccclass('HallManager')
export class HallManager extends Component {

    @property(MapManager) 
    mapManager: MapManager = null!;

    @property(BuildManager) 
    buildManager: BuildManager = null!;
    
    start() {
        SaveManager.instance.clear();
        const saveData = SaveManager.instance.data;
        EconomyManager.instance.init(saveData.gold);
        this.mapManager.init();
        this.buildManager.init(saveData.buildings);
    }

    
}


