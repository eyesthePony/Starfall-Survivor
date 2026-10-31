import { Prefab } from "cc";

// BuildingConfig.ts
export interface BuildingData {
    id: string;
    name: string;
    width: number;
    height: number;
    cost: number;
    prefabPath: string;  // 新增：用来生成真正的建筑
}

export const BUILDINGS: BuildingData[] = [
    { id: 'base', name: '主基地', width: 2, height: 2, cost: 1000,prefabPath: 'prefabs/buildings/base' },
    { id: 'farm', name: '农田', width: 1, height: 1, cost: 100,prefabPath: 'prefabs/buildings/base'  },
    { id: 'turret', name: '炮塔', width: 1, height: 1, cost: 300,prefabPath: 'prefabs/buildings/base'  },
];