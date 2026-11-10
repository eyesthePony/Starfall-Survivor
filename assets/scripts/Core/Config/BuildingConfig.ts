

// BuildingConfig.ts
export interface BuildingData {
    id: string;
    name: string;
    width: number;
    height: number;
    cost: number;
    prefabName: string;  
    icon: string;
}

export const BUILDINGS: BuildingData[] = [
    { id: 'base', name: '主基地', width: 2, height: 2, cost: 1000,prefabName: 'base' ,icon: 'base'},
    { id: 'farm', name: '农田', width: 1, height: 1, cost: 100,prefabName: 'farm', icon: 'farm' },
  
];