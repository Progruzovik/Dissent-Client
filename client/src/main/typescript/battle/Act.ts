import ActionService from "./ActionService"
import Controls from "./Controls";
import Field from "./Field";
import Queue from "./Queue";
import ProjectileService from "./projectile/ProjectileService";
import Unit from "./unit/Unit";
import UnitService from "./unit/UnitService";
import { ActionType, Cell, Side } from "./request";
import * as game from "../game";

export default class Act extends game.Act {

    private readonly queue: Queue;
    private readonly controls: Controls;
    private readonly field: Field;

    constructor(width: number, height: number, actionsCount: number, fieldSize: PIXI.Point,
                currentPlayerSide: Side, asteroids: Cell[], units: Unit[], projectileService: ProjectileService) {
        super(width, height);
        const actionService = new ActionService(actionsCount);
        const unitService = new UnitService(units);

        this.queue = new Queue(currentPlayerSide, unitService);
        this.field = new Field(fieldSize, unitService, projectileService, asteroids);
        this.content = this.field;
        this.leftUi = this.queue;
        this.controls = new Controls(unitService);
        this.bottomUi = this.controls;
        this.resize();
        unitService.emit(UnitService.NEXT_TURN, unitService.currentUnit, true);

        actionService.on(ActionType.NextTurn.toString(), () => unitService.nextTurn());
        unitService.once(game.Event.DONE, () => this.emit(game.Event.DONE));
    }

    protected resizeUi() {
        this.controls.resize(this.width);
        this.queue.height = this.height - this.controls.height;
    }
}
