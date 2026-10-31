import { _decorator, Component,Node, Prefab, instantiate, Vec3, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {
    @property(Prefab) grassPrefab: Prefab = null!; 

    private tileWidth: number = 0;
    private tileHeight: number = 0;

    private mapCols: number = 10; 
    private mapRows: number = 10;
    private readonly SCALE = 1; 
    private _gap = 0;

    public mapData: number[][] = []; //记录格子占用状态

    protected start() {
        this.generateGround();
    }

    private generateGround() {
        this.node.removeAllChildren();

        const tempNode = instantiate(this.grassPrefab);
        
     
        const spriteUT = tempNode.getComponentInChildren(UITransform);
        
        if (spriteUT) {
      
            this.tileWidth = (spriteUT.width * this.SCALE) - this._gap; 
            this.tileHeight = (spriteUT.height * this.SCALE) - this._gap; 
            console.log("真实间距:", this.tileWidth, this.tileHeight);
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

                const posX = (col - row) * (this.tileWidth / 2);
                const posY = -(col + row) * (this.tileHeight / 2);
                tile.setPosition(new Vec3(posX, posY, 0));
            }
        }
        
        this.node.setPosition(0, 200, 0); 
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

        // 确认建造，把占用的格子标记为 1
    public setBuildingOccupy(baseCol: number, baseRow: number, width: number, height: number) {
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                this.mapData[baseRow + r][baseCol + c] = 1;
            }
        }
    }                                       

   public getSnappedPosition(worldPos: Vec3, width: number = 1, height: number = 1): { pos: Vec3, col: number, row: number }  {
        const uiTransform = this.node.getComponent(UITransform);
        let localPos = uiTransform.convertToNodeSpaceAR(worldPos);

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
        const snapY = -(centerCol + centerRow) * (this.tileHeight / 2);

        const snapLocalPos = new Vec3(snapX, snapY, 0);
    
        // 返回三个东西：算好的世界坐标，以及左上角的基准行列
        return {
            pos: uiTransform.convertToWorldSpaceAR(snapLocalPos),
            col: roundCol,
            row: roundRow
        };
    }

    getWorldPosByGrid(centerCol: number, centerRow: number):Vec3{

        const snapX = (centerCol - centerRow) * (this.tileWidth / 2);
        const snapY = -(centerCol + centerRow) * (this.tileHeight / 2);

        const snapLocalPos = new Vec3(snapX, snapY, 0);
    
        const uiTransform = this.node.getComponent(UITransform);
        return uiTransform.convertToWorldSpaceAR(snapLocalPos);
    }
     
}