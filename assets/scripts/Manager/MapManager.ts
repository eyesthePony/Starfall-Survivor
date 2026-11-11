import { _decorator, Component, instantiate, Prefab, UITransform, Vec3 } from 'cc';
import { GameData } from '../Core/Data/GameData';
import { BuildingCategory } from '../Core/Utils/ConfigEnums';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {
    @property(Prefab) grassPrefab: Prefab = null!; 

    public tileWidth: number = 134;
    public tileHeight: number = 67;

    private mapCols: number = 10; 
    private mapRows: number = 10;
    private readonly SCALE = 1; 


    public mapData: number[][] = []; //记录格子占用状态

    public tileVisualOffsetY: number = 7.5;

    private _tempNodeSpace: Vec3 = new Vec3();
    private _tempSnapLocal: Vec3 = new Vec3();
    private _tempWorldSpace: Vec3 = new Vec3();
    private _tempSnapResult = { pos: this._tempWorldSpace, col: 0, row: 0 };
    private _uiTransform: UITransform = null!;
    private _tempLineCache: number[] = [];

    public init() {
        this.generateGround();
    }

    private generateGround() {
        this.node.removeAllChildren();

        const tempNode = instantiate(this.grassPrefab);
        
        this._uiTransform = this.node.getComponent(UITransform)!;
        const spriteUT = tempNode.getComponentInChildren(UITransform);
        
        if (spriteUT) {
            this.tileWidth = spriteUT.width * this.SCALE; 
            this.tileHeight = this.tileWidth / 2; 
            this.tileVisualOffsetY = (spriteUT.height - this.tileHeight) / 2;
        }
        tempNode.destroy();

        for (let row = 0; row < this.mapRows; row++) {
            this.mapData[row] = [];
            for (let col = 0; col < this.mapCols; col++) {
                this.mapData[row][col] = 0; //设为空地
                const tile = instantiate(this.grassPrefab);
                tile.parent = this.node;

                // 缩放空节点，里面的图会跟着缩
                tile.setScale(this.SCALE, this.SCALE, 1);

                //从左上向右下铺
                //posx，从0到col，然后从-1到col-1，
                const posX = (col - row) * (this.tileWidth / 2);
                //posy从0到-col，然后从-1到-（col+1）
                const posY = -(col + row) * (this.tileHeight / 2);
                this._tempSnapLocal.set(posX, posY, 0);
                tile.setPosition(this._tempSnapLocal);
            }
        }
        
        this.node.setPosition(0, GameData.viewH / 4, 0);
    }

        // 检查某个区域能不能放
    public checkCanPlace(baseCol: number, baseRow: number, width: number, height: number): boolean {
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const checkRow = baseRow + r;
                const checkCol = baseCol + c;
                
                // 越界检查
                if (checkRow >= this.mapRows || checkCol >= this.mapCols) return false;
                
                // 重叠检查（如果数组里已经是 1，说明被占了）
                if (this.mapData[checkRow][checkCol] !== 0) return false;
            }
        }
        return true;
    }

    public checkCanBuildRoad(col, row) {
        if (col < 0 || col >= this.mapCols || row < 0 || row >= this.mapRows) return false;
        return this.mapData[row][col] === 0 || this.mapData[row][col] === 2;
    }

        // 确认建造，把占用的格子标记为 1
    public setBuildingOccupy(baseCol: number, baseRow: number, width: number, height: number,category?: BuildingCategory) {
        const type = (category === BuildingCategory.ROAD) ? 2 : 1;
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                this.mapData[baseRow + r][baseCol + c] = type;
            }
        }
    }    
    
    public getGridLine(startCol: number, startRow: number, endCol: number, endRow: number){
        this._tempLineCache.length = 0; 
        const deltaCol = Math.abs(startCol- endCol);
        const deltaRow = Math.abs(startRow - endRow);
        let sx = startCol < endCol ? 1 : -1;
        let sy = startRow < endRow ? 1 : -1;
        let err = deltaCol - deltaRow;
        while (true) {
            this._tempLineCache.push(startCol * 100 + startRow);
            
            if (startCol === endCol && startRow === endRow) break;
            let e2 = 2 * err;
            if (e2 > -deltaRow ) { err -= deltaRow ; startCol += sx; }
            if (e2 < deltaCol) { err += deltaCol; startRow += sy; }
        }

        return this._tempLineCache;
    }

   public getSnappedPosition(worldPos: Vec3, width: number = 1, height: number = 1): { pos: Vec3, col: number, row: number }  {
        this._uiTransform.convertToNodeSpaceAR(worldPos, this._tempNodeSpace);
        let localPos = this._tempNodeSpace;

        let col = (localPos.x / (this.tileWidth / 2) - localPos.y / (this.tileHeight / 2)) / 2;
        let row = (-localPos.x / (this.tileWidth / 2) - localPos.y / (this.tileHeight / 2)) / 2;

        let roundCol = Math.round(col);
        let roundRow = Math.round(row);

        // 边界限制：扣除建筑的宽高，防止建筑物半个身子跑到地图外面
        roundCol = Math.max(0, Math.min(roundCol, this.mapCols - width));
        roundRow = Math.max(0, Math.min(roundRow, this.mapRows - height));

        // 【重点】算 2x2 的中心点
        // 如果鼠标指在 (0,0)，2x2 的中心其实是在 (0.5, 0.5) 的位置
        const centerCol = roundCol + (width - 1) / 2;
        const centerRow = roundRow + (height - 1) / 2;

        const snapX = (centerCol - centerRow) * (this.tileWidth / 2);
        const snapY = -(centerCol + centerRow) * (this.tileHeight / 2) + this.tileVisualOffsetY;

        this._tempSnapLocal.set(snapX, snapY, 0);
        this._uiTransform.convertToWorldSpaceAR(this._tempSnapLocal, this._tempWorldSpace);

        this._tempSnapResult.col = roundCol;
        this._tempSnapResult.row = roundRow;
    
        // 返回三个东西：算好的世界坐标，以及左上角的基准行列
        return this._tempSnapResult;
    }

    getWorldPosByGrid(centerCol: number, centerRow: number):Vec3{

        const snapX = (centerCol - centerRow) * (this.tileWidth / 2);
        const snapY = -(centerCol + centerRow) * (this.tileHeight / 2) + this.tileVisualOffsetY;

        this._tempSnapLocal.set(snapX, snapY, 0);
    

        this._uiTransform.convertToWorldSpaceAR(this._tempSnapLocal, this._tempWorldSpace);
        return this._tempWorldSpace;
    }
     
}