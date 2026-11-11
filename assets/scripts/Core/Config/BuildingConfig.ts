import { BuildingCategory, ResourceType } from "../Utils/ConfigEnums";

export interface BuildingLevelData {
    upgradeCost: number;       // 升级花费
    productionCycle: number;   // 生产周期（几秒产一次）
    productionAmount: number;  // 生产数量（每次产多少）
    productionType: ResourceType; // 生产种类（产什么资源）
}

export interface BuildingData {
    id: string;
    name: string;
    width: number;
    height: number;
    cost: number;
    icon: string;
    category: BuildingCategory;
    levels?: BuildingLevelData[];
}

export const BUILDINGS: BuildingData[] = [
    { id: 'road', name: '道路', width: 1, height: 1, cost: 10, icon: 'road', category: BuildingCategory.ROAD},
    { id: 'base', name: '主基地', width: 2, height: 2, cost: 1000,  icon: 'base', category: BuildingCategory.HOUSE },
    { 
        id: 'field', name: '农田', width: 1, height: 1, cost: 100,  icon: 'field', category: BuildingCategory.PRODUCER,
        levels: [
            { upgradeCost: 150, productionCycle: 3, productionAmount: 10, productionType: ResourceType.GOLD },
        ]
    },
  
];