import ActionReceiver from "./ActionReceiver"
import Controls from "./Controls";
import Field from "./Field";
import LeftUi from "./LeftUi";
import ProjectileService from "./projectile/ProjectileService";
import Unit from "./unit/Unit";
import UnitService from "./unit/UnitService";
import Window from "./unit/Window";
import WebSocketConnection from "../WebSocketConnection";
import { ActionType, Cell, Side } from "../util";
import * as game from "../../game";
import * as PIXI from "pixi.js";

export default class BattlefieldScreen extends game.Screen {

    constructor(fieldSize: Cell, currentPlayerSide: Side, asteroids: Cell[],
                clouds: Cell[], destroyedUnits: PIXI.Sprite[], units: Unit[],
                projectileService: ProjectileService, webSocketConnection: WebSocketConnection) {
        super();
        const unitService = new UnitService(currentPlayerSide, units, webSocketConnection);

        const field = new Field(fieldSize, asteroids, clouds,
            destroyedUnits, unitService, projectileService, webSocketConnection);
        this.content = field;
        this.leftUi = new LeftUi(currentPlayerSide, unitService);
        const controls = new Controls(unitService, webSocketConnection);
        this.bottomUi = controls;
        unitService.emit(ActionType.NextTurn, true);
        const actionReceiver = new ActionReceiver(field, controls, unitService, webSocketConnection);

        unitService.on(UnitService.UNIT_MOUSE_OVER, (mousePos: PIXI.Point, unit: Unit) => {
            const isLeft = mousePos.x > this.width - Window.WIDTH - Unit.WIDTH
                && mousePos.y < Window.HEIGHT + Unit.HEIGHT;
            this.frontUi = new Window(isLeft, unit);
        });
        unitService.on(UnitService.UNIT_MOUSE_OUT, () => {
            this.frontUi.destroy({ children: true });
            this.frontUi = null;
        });
        actionReceiver.once(ActionType.BattleFinish, () => this.emit(game.Event.DONE));
    }
}
