export interface SavedBuildingData {
    id: string;  // 建筑ID（比如 'farm'）
    col: number; // 列
    row: number; // 行
    level?: number;       // 建筑等级（默认 1 级）
    lastProduceTime?: number; // 上次结算收益的时间戳
}

export interface PlayerSaveData {
    gold: number;
    buildings: SavedBuildingData[];
}
