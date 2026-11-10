import { _decorator, Button, Component, Label, Sprite, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BuildItem')
export class BuildItem extends Component {
    @property(Label) nameLabel: Label = null!;
    @property(Label) costLabel: Label = null!;
    @property(Sprite) iconSprite: Sprite = null!;
    
    public buildingId: string = '';

    private _onClick: ((id: string) => void) | null = null;

    protected onLoad(): void {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Button.EventType.CLICK, this.onClick, this);
        this._onClick = null;
    }

    
    private onClick() {
        if (this.buildingId) this._onClick?.(this.buildingId);
    }

    public setClickListener(cb: (id: string) => void) {
        this._onClick = cb;
    }

}