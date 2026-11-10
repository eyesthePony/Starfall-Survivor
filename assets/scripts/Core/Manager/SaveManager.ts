import { sys } from "cc";
import { PlayerSaveData } from "../Data/PlayerSaveData";

export class SaveManager{

    private static _instance: SaveManager = null;

    private readonly SAVE_KEY = 'STARFALL_SAVE_DATA';

    private _data: PlayerSaveData = null!;


    public static get instance(): SaveManager {
        if (!this._instance) {
            this._instance = new SaveManager();
        }
        return this._instance;
    }

    private constructor() {
        this.load();
    }

    public load(){
        const str = sys.localStorage.getItem(this.SAVE_KEY);
        if (!str) {
            this._data = {
                gold: 1000,
                buildings: [],
            };
            return; 
        }
        
        let parsedData = null;
        try {
            parsedData = JSON.parse(str) as PlayerSaveData;
        } catch (e) {
            console.error("❌ 存档损坏，解析失败，将当做新玩家处理", e);
        }

        if (parsedData) {
            this._data = parsedData;
            if (!parsedData.buildings) {
                parsedData.buildings = []; 
            }
        } else {
            this._data = {
                gold: 1000,
                buildings: [] ,
            };
        }
    }

    public get data(): PlayerSaveData {
        return this._data;
    }

    public save() {
        try {
            const str = JSON.stringify(this._data);
            sys.localStorage.setItem(this.SAVE_KEY, str);
        } catch (e) {
            console.error("❌ 存档写入失败", e);
        }
    }

    public clear() {
        sys.localStorage.removeItem(this.SAVE_KEY);
        this._data = { gold: 1000 , buildings: [] ,};
    }
    
}


