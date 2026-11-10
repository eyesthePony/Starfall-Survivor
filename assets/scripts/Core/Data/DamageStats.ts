// Core/DamageStats.ts
export interface WeaponStat {
    name: string;
    damage: number;
}

export class DamageStats {


    public isDirty: boolean = false; 
    // 用字典存：{ "普通子弹": 1500, "激光射线": 3000 }
    private _stats: Record<string, number> = {};

    private static _instance: DamageStats = null!;
    public static get instance(): DamageStats {
        if (!this._instance) {
            this._instance = new DamageStats();
        }
        return this._instance;
    }


    // 记一笔账
    public addDamage(weaponName: string, damage: number) {
        if (!this._stats[weaponName]) {
            this._stats[weaponName] = 0;
        }
        this._stats[weaponName] += damage;
        
        // 👈 只要加了伤害，就标记为脏（有变化）
        this.isDirty = true; 
    }

    // 获取排好序的榜单（从高到低）
    public getRankedStats(): WeaponStat[] {
        const result: WeaponStat[] = [];
        for (const name in this._stats) {
            result.push({ name: name, damage: this._stats[name] });
        }
        // 按伤害从大到小排
        result.sort((a, b) => b.damage - a.damage);
        return result;
    }

    // 游戏重开时清空
    public clear() {
        this._stats = {};
        this.isDirty = true; // 清空也算有变化
    }
}