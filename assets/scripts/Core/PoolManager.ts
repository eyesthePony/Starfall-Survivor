import { _decorator, instantiate, Node, NodePool, Prefab } from 'cc';

export class PoolManager {

    private _dictPool: any = {};
   

    private static  _instance:PoolManager = null;

    static get instance():PoolManager{
        if(!this._instance){
            this._instance = new PoolManager();
        }
        return this._instance;
    }

    // 销毁单例，关卡切换调用
    static destroyInstance() {
        if (this._instance) {
            this._instance.clearAllPool();
            this._instance = null;
        }
    }


    public getNode(prefab:Prefab, parent:Node){
        let name = prefab.name;
 
        let pool = null;
        let node = null;
        if(this._dictPool.hasOwnProperty(name)){
            pool = this._dictPool[name];
            if (pool.size() > 0) {
                node = pool.get();
            } else {
                node = instantiate(prefab);
            }
        }else{
            pool = new NodePool();
            this._dictPool[name] = pool;
            node = instantiate(prefab);
        }

        node.parent = parent;
        node.active = true;
        return node;

    }


    public putNode(node:Node){
        if(!node)   return;
        node.removeFromParent()

        let name = node.name;
   
        let pool = null;
        if(this._dictPool.hasOwnProperty(name)){
            pool = this._dictPool[name];
        }else{
            pool = new NodePool();
            this._dictPool[name] = pool;
        }
  
        node.active = false;
        pool.put(node);
    }

    public clearAllPool() {
        for (const key in this._dictPool) {
            this.clearPool(key);
        }
        this._dictPool = {};
    }

    public clearPool(name:string){
        if(this._dictPool.hasOwnProperty(name)){
            let pool = this._dictPool[name];
            pool.clear();
        }
    }

    public preLoadPrefab(prefab:Prefab, count:number){
        let name = prefab.name;
        let pool = new NodePool();
        this._dictPool[name] = pool;
        for(let i = 0; i < count; i++){
            let node = instantiate(prefab);
            node.active = false;
            pool.put(node);
        }
    }

    public destroyNode(node:Node){
        if(!node)   return;
        node.destroy();
    }
    
   
    
}


