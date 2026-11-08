import { _decorator, Vec3, SpriteFrame } from 'cc';
import { BaseEnemyPlane } from './BaseEnemyPlane';
import { GameData } from '../../../Core/GameData';
import { EnemyData } from '../../../Core/EnemyConfig';
const { ccclass } = _decorator;

@ccclass('DiveEnemy')
export class DiveEnemy extends BaseEnemyPlane {
    private _dir: Vec3 = new Vec3();

    init(cfg: EnemyData, position: Vec3, hpMultiplier: number, sf: SpriteFrame) {
        super.init(cfg, position, hpMultiplier, sf);
    }

    update(deltaTime: number) {
        if (this.isDead) return;
        super.update(deltaTime); // 自动开火（被禁言了）

        // 锁定玩家，一路狂飙
        if (GameData.currentTarget && GameData.currentTarget.isValid) {
            const targetPos = GameData.currentTarget.position;
            const myPos = this.node.position;
            this._dir.set(targetPos.x - myPos.x, targetPos.y - myPos.y, 0).normalize();

            const nx = myPos.x + this._dir.x * this.moveSpeed * deltaTime;
            const ny = myPos.y + this._dir.y * this.moveSpeed * deltaTime;
            this.node.setPosition(nx, ny, 0);

            // 头朝向玩家
            this.node.angle = Math.atan2(this._dir.y, this._dir.x) * 180 / Math.PI - 90;
        } else {
            // 玩家死了就往下飞
            const cur = this.node.position;
            this.node.setPosition(cur.x, cur.y - this.moveSpeed * deltaTime, 0);
        }
    }
}