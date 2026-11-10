
import { _decorator, assetManager, Button, Component, director, Node } from 'cc';
import { GameConstants } from '../../Core/Event/GameConstants';
import { GameData } from '../../Core/Data/GameData';
import { LoadingUI } from './LoadingUI';
const { ccclass, property } = _decorator;


@ccclass('StartPanel')
export class StartPanel extends Component {
    @property(Node) loadingPanel: Node = null!; 


    @property([Button]) normalLevelButtons: Button[] = []; // 普通关卡按钮，索引0就是第1关
    @property(Button) endlessModeButton: Button = null!;  // 无尽模式按钮单独拿出来

    private _loading = false;
    private _loadingUI: LoadingUI = null;

    onLoad() {
        // 只在这里执行一次全局初始化！
        GameData.init();

         // 1. 绑定普通关卡（for循环，索引+1就是关卡ID）
        for (let i = 0; i < this.normalLevelButtons.length; i++) {
            const levelId = i + 1; 
            this.normalLevelButtons[i].node.on(Button.EventType.CLICK, () => {
                this.startGame(levelId, false); 
            }, this);
        }

        // 2. 绑定无尽模式
        if (this.endlessModeButton) {
            this.endlessModeButton.node.on(Button.EventType.CLICK, () => {
                this.startGame(1, true); 
            }, this);
        }

        if (this.loadingPanel) {
            this._loadingUI = this.loadingPanel.getComponent(LoadingUI);
        }
    }

    // 统一的开局逻辑
    public startGame(levelId: number, isEndless: boolean) {
        if (this._loading) {return;} 
        this._loading = true;

        GameData.selectedLevel = levelId;
        GameData.isEndlessMode = isEndless;

        this.node.active = false;
        this._loadingUI?.show();

        director.preloadScene(GameConstants.GAME_SCENE.BATTLE);
        assetManager.loadBundle('boss', (err, bundle) => {
            if (err || !bundle) {
                console.error('boss 分包加载失败', err);
                this._loadingUI?.hide();
                this.node.active = true;
                this._loading = false;
                return;
            }

            // 分包内目录，和你搬迁后的结构一一对应
            const dirs = ['prefabs', 'textures', 'animations'];
            const dirProgress: number[] = dirs.map(() => 0);
            let done = 0;

            dirs.forEach((dir, idx) => {
                bundle.preloadDir(dir,
                    (finished, total) => {
                        // 每个目录独立记进度，总进度取平均，避免跨目录互相覆盖回弹
                        dirProgress[idx] = total > 0 ? finished / total : 0;
                        const avg = dirProgress.reduce((s, v) => s + v, 0) / dirs.length;
                        this._loadingUI?.updateProgress(Math.round(avg * 100), 100);
                    },
                    (preErr) => {
                        done++;
                        if (preErr) console.warn('预载目录失败', dir, preErr);
                        if (done === dirs.length) {
                            this._loadingUI?.finish();
                            if (this.loadingPanel) {
                                director.addPersistRootNode(this.loadingPanel);
                            }
                            director.loadScene(GameConstants.GAME_SCENE.BATTLE);
                        }
                    });
            });
        });
    }
}