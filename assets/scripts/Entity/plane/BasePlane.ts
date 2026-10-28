import { _decorator, Component, Vec3} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BasePlane')
export class BasePlane extends Component {


    //飞机血量上限
    protected _maxHp = 100;

    //飞机当前血量
    @property
    hp: number = 100;
    //飞机移动速度
    @property
    moveSpeed: number = 100;
    //飞机每0.2秒开火
    @property
    fireCd: number = 0.2;


    //飞机是否死亡
    protected _isDead: boolean = false;

    //飞机开火倒计时
    protected _fireTimer: number = 0;
 

    //飞机子弹方向
    protected _shootDir:Vec3;

    public expReward: number = 10; // 击败敌机获取经验，默认给 10 点


    // 公开只读属性，外部可以查但改不了
    public get isDead(): boolean {
        return this._isDead;
    }

    // 对外受伤接口
    public takeDamage(damage: number) {
        if (this.hp <= 0) return; 
        this.hp -= damage;

        if (this.hp <= 0) {
            this.onDeath();
        }
    }

    // 虚方法，子类重写
    protected onDeath() {}

     // 虚方法，子类重写
    protected shoot(){}


    update(deltaTime: number) {
       
        this._fireTimer -= deltaTime;
    
        // 自动开火，子类重写 shoot() 就行
        if (!this._isDead && this._fireTimer <= 0) {
            this.shoot();
            this._fireTimer += this.fireCd;
        }
    }
}


