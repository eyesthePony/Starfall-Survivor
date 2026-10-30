import { _decorator, Component,Node, Prefab, instantiate, Vec3, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {
    @property(Prefab) grassPrefab: Prefab = null!; 

    private tileWidth: number = 0;
    private tileHeight: number = 0;

    private mapCols: number = 10; 
    private mapRows: number = 10;
    private readonly SCALE = 0.3; 

    protected start() {
        this.generateGround();
    }

    private generateGround() {
        this.node.removeAllChildren();

        const tempNode = instantiate(this.grassPrefab);
        
     
        const spriteUT = tempNode.getComponentInChildren(UITransform);
        
        if (spriteUT) {
      
            this.tileWidth = (spriteUT.width * this.SCALE) - 30; 
            this.tileHeight = (spriteUT.height * this.SCALE) - 30; 
            console.log("真实间距:", this.tileWidth, this.tileHeight);
        }
        tempNode.destroy();

        for (let row = 0; row < this.mapRows; row++) {
            for (let col = 0; col < this.mapCols; col++) {
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


     
}