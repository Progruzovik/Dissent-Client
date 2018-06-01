import { ActionReceiver } from "./ActionReceiver"
import { Controls } from "./ui/Controls";
import { Field } from "./ui/Field";
import { LeftPanel } from "./ui/LeftPanel";
import { ProjectileService } from "./projectile/ProjectileService";
import { PopUp } from "./ui/PopUp";
import { Unit } from "./unit/Unit";
import { UnitService } from "./unit/UnitService";
import { WebSocketClient } from "../../WebSocketClient";
import { ActionType, LogEntry, Side } from "../../model/util";
import * as druid from "pixi-druid";
import * as PIXI from "pixi.js";

export class BattlefieldRoot extends druid.AbstractBranch {

    private contentWidth = 0;
    private contentHeight = 0;

    private readonly field: Field;
    private readonly leftPanel: LeftPanel;
    private readonly controls: Controls;

    private readonly actionReceiver: ActionReceiver;

    private unitPopUp: PopUp;

    constructor(fieldSize: druid.Point, playerSide: Side, log: LogEntry[], units: Unit[], asteroids: druid.Point[],
                clouds: druid.Point[], projectileService: ProjectileService, webSocketClient: WebSocketClient) {
        super();
        const unitService = new UnitService(playerSide, units, webSocketClient);

        this.field = new Field(fieldSize, units, asteroids, clouds, unitService, projectileService, webSocketClient);
        this.addChild(this.field);
        this.leftPanel = new LeftPanel(units, unitService);
        this.addChild(this.leftPanel);
        this.controls = new Controls(playerSide, log, unitService, webSocketClient);
        this.addChild(this.controls);
        unitService.emit(ActionType.NextTurn);
        this.actionReceiver = new ActionReceiver(this.field, this.controls, unitService, webSocketClient);

        unitService.on(UnitService.UNIT_MOUSE_OVER, (mousePos: PIXI.Point, unit: Unit) => {
            if (this.unitPopUp) {
                this.unitPopUp.destroy({ children: true });
            }
            this.unitPopUp = new PopUp(this.freeWidth, this.contentHeight, unit);
            this.addChild(this.unitPopUp);
        });
        unitService.on(UnitService.UNIT_MOUSE_OUT, (unit: Unit) => {
            if (this.unitPopUp && this.unitPopUp.unit == unit) {
                this.unitPopUp.destroy({ children: true });
                this.removeChild(this.unitPopUp);
                this.unitPopUp = null;
            }
        });
        this.field.on(Field.INTERACTION, () => {
            if (this.unitPopUp) {
                this.unitPopUp.destroy({ children: true });
                this.unitPopUp = null;
            }
        });
        this.actionReceiver.once(ActionType.BattleFinish, () => this.emit(druid.Event.DONE));
    }

    destroy(options?: PIXI.DestroyOptions | boolean) {
        this.actionReceiver.destroy();
        super.destroy(options);
    }

    protected onResize() {
        this.controls.resize(this.width, this.height);
        this.contentWidth = this.width;
        this.contentHeight = this.height - this.controls.buttonsHeight;

        this.leftPanel.resize(Field.CELL_SIZE.x, this.contentHeight);
        this.field.x = this.leftPanel.width;
        this.field.resize(this.width - this.field.x, this.height - this.controls.buttonsHeight);
        if (this.unitPopUp) {
            this.unitPopUp.resize(this.freeWidth, this.contentHeight);
        }
    }

    private get freeWidth(): number {
        return this.controls.log.isExpanded ? this.contentWidth - this.controls.log.width : this.contentWidth;
    }
}
