export interface SavedBuildingData {
    id: string;  // 建筑ID（比如 'farm'）
    col: number; // 列
    row: number; // 行
}

export interface PlayerSaveData {
    gold: number;
    buildings: SavedBuildingData[];
}
