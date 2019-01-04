import { Unit } from "../unit/Unit";
import { Side } from "../../../model/util";
import * as druid from "pixi-druid";
import { l } from "../../../localizer";

export class PopUp extends druid.Branch {

    static readonly WIDTH = 200;
    static readonly HEIGHT = 100;

    private readonly lineToWindow = new druid.Line(1, this.unit.frame.color);

    private readonly bgPopUp = new druid.Rectangle(PopUp.WIDTH, PopUp.HEIGHT, 0x333333);
    private readonly barStrength = this.unit.ship.createStrengthBar(this.bgPopUp.width);
    private readonly txtHittingChance: PIXI.Text;

    constructor(readonly unit: Unit, hittingChance?: number) {
        super();
        const unitBounds: PIXI.Rectangle = unit.getBounds();
        this.lineToWindow.position.set(unitBounds.x + unitBounds.width / 2, unitBounds.y);
        this.addChild(this.lineToWindow);

        const layoutWindow = new druid.HorizontalLayout(druid.Alignment.Center, 0);
        layoutWindow.addElement(new PIXI.Text(unit.ship.hull.name, { fill: 0xffffff, fontSize: 24 }));
        layoutWindow.addElement(unit.ship.createSprite());
        layoutWindow.addElement(this.barStrength);
        this.bgPopUp.addChild(layoutWindow);
        const frame = new druid.Frame(this.bgPopUp.width, this.bgPopUp.height, unit.frame.color);
        this.bgPopUp.addChild(frame);
        this.addChild(this.bgPopUp);
        if (hittingChance) {
            const text = `${l("HittingChance")}: ${Math.round(hittingChance * 100)}%`;
            this.txtHittingChance = new PIXI.Text(text, { fill: "white", fontSize: 14 });
            this.addChild(this.txtHittingChance);
        }

        unit.on(Unit.UPDATE_STATS, () => this.barStrength.value = this.unit.strength);
        this.on(druid.Event.RESIZE, (width: number) => {
            if (this.unit.side == Side.Left) {
                this.bgPopUp.x = druid.INDENT / 2;
            } else if (this.unit.side == Side.Right) {
                this.bgPopUp.x = width - this.bgPopUp.width - druid.INDENT / 2;
            }
            this.bgPopUp.y = druid.INDENT / 2;
            if (this.txtHittingChance) {
                this.txtHittingChance.position.set(this.bgPopUp.x, this.bgPopUp.y + this.bgPopUp.height);
            }
            this.lineToWindow.directTo(this.bgPopUp.x + this.bgPopUp.width / 2, this.bgPopUp.y + this.bgPopUp.height);
        });
    }

    destroy(options?: PIXI.DestroyOptions | boolean ) {
        this.unit.off(Unit.UPDATE_STATS);
        super.destroy(options);
    }
}
