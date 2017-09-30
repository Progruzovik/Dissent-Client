import Unit from "./Unit";
import { getCellsForCurrentUnitShot, postCurrentUnitShot } from "../request";
import * as game from "../../game";

export default class UnitService extends PIXI.utils.EventEmitter {

    static readonly SHOT_CELL = "shotCell";
    static readonly TARGET_CELL = "targetCell";
    static readonly NEXT_TURN = "nextTurn";

    private readonly currentTargets = new Array<Unit>(0);

    constructor(readonly units: Unit[]) {
        super();
        this.currentUnit.makeCurrent();

        for (const unit of this.units) {
            unit.on(game.Event.MOUSE_OVER, () => {
                if (this.currentUnit.preparedGunNumber != -1
                    && this.currentUnit.side != unit.side && !unit.isDestroyed) {
                    unit.alpha = 0.75;
                }
            });
            unit.on(game.Event.CLICK, () => {
                if (this.currentTargets.indexOf(unit) != -1) {
                    postCurrentUnitShot(unit.cell);
                }
            });
            unit.on(game.Event.MOUSE_OUT, () => {
                if (!unit.isDestroyed) {
                    unit.alpha = 1;
                }
            });
            unit.on(Unit.MOVE, (oldPosition: PIXI.Point, newPosition: PIXI.Point) =>
                this.emit(Unit.MOVE, oldPosition, newPosition));
            unit.on(Unit.PREPARED_TO_SHOT, () => {
                getCellsForCurrentUnitShot(unit.preparedGunNumber, (shotCells, targetCells) => {
                    this.emit(Unit.PREPARED_TO_SHOT);
                    for (const cell of shotCells) {
                        this.emit(UnitService.SHOT_CELL, cell);
                    }
                    for (const cell of targetCells) {
                        this.currentTargets.push(this.units.filter(unit =>
                            unit.cell.x == cell.x && unit.cell.y == cell.y)[0]);
                        this.emit(UnitService.TARGET_CELL, cell);
                    }
                });
            });
            unit.on(Unit.SHOT, () => this.emit(Unit.SHOT, unit));
            unit.on(Unit.NOT_PREPARED_TO_SHOT, () => {
                this.currentTargets.length = 0;
                this.emit(Unit.NOT_PREPARED_TO_SHOT)
            });
            unit.on(Unit.DESTROY, () => {
                this.units.splice(this.units.indexOf(unit), 1);
                if (!this.units.some(activeUnit => unit.side == activeUnit.side)) {
                    this.emit(game.Event.DONE);
                }
            });
        }
    }

    get currentUnit(): Unit {
        return this.units[0];
    }

    nextTurn() {
        this.currentUnit.preparedGunNumber = -1;
        this.units.push(this.units.shift());
        this.currentUnit.makeCurrent();
        this.emit(UnitService.NEXT_TURN, this.currentUnit, false);
    }
}
