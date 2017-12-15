import Unit from "./unit/Unit";
import UnitService from "./unit/UnitService";
import { ActionType, Side } from "../util";
import * as game from "../../game";
import * as PIXI from "pixi.js";

export default class LeftUi extends game.UiLayer {

    private readonly bgQueue = new PIXI.Container();
    private readonly txtActionPoints = new PIXI.Text("", { align: "center", fill: "white",
        fontSize: 36, fontWeight: "bold", stroke: "blue", strokeThickness: 4 });

    constructor(playerSide: Side, private readonly unitService: UnitService) {
        super();
        unitService.unitQueue.forEach((u, i) => {
            const unitIcon = new game.Rectangle(Unit.WIDTH, Unit.HEIGHT, 0x444444);
            unitIcon.addChild(u.createIcon());
            unitIcon.y = Unit.HEIGHT * i;
            this.bgQueue.addChild(unitIcon);

            u.on(Unit.DESTROY, () => {
                this.bgQueue.removeChild(unitIcon);
                this.updateUnitSpritePositions();
            });
        });
        this.addChild(this.bgQueue);
        this.txtActionPoints.anchor.x = game.CENTER;
        this.txtActionPoints.x = this.bgQueue.width / 2;
        this.addChild(this.txtActionPoints);

        unitService.on(ActionType.Move, () => this.updateActionPointsValue());
        unitService.on(ActionType.Shot, () => this.updateActionPointsValue());
        unitService.on(ActionType.NextTurn, (isFirst: boolean) => {
            if (!isFirst) {
                this.bgQueue.setChildIndex(this.bgQueue.getChildAt(0), this.bgQueue.children.length - 1);
                this.updateUnitSpritePositions();
            }
            this.updateActionPointsValue();
        });
    }

    resize(width: number, height: number) {
        this.txtActionPoints.y = height - this.txtActionPoints.height;
    }

    private updateUnitSpritePositions() {
        this.bgQueue.children.forEach((c, i) => c.y = Unit.HEIGHT * i);
    }

    private updateActionPointsValue() {
        this.txtActionPoints.text = "ОД\n" + this.unitService.currentUnit.actionPoints
            + "/" + this.unitService.currentUnit.hull.actionPoints;
    }
}
