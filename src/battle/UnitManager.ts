import Unit from "./Unit";
import * as game from "../game";

export default class UnitManager extends PIXI.utils.EventEmitter {

    static readonly NEXT_TURN = "nextTurn";

    private readonly destroyedUnits: Unit[] = [];

    constructor(private readonly units: Unit[]) {
        super();
        for (const unit of this.units) {
            unit.on(game.Event.MOUSE_OVER, () => {
                if (this.getCurrentUnit().checkPreparedToShot()) {
                    unit.alpha = 0.75;
                }
            });
            unit.on(game.Event.CLICK, () => {
                if (this.getCurrentUnit().checkPreparedToShot()) {
                    this.getCurrentUnit().shoot(unit);
                }
            });
            unit.on(game.Event.MOUSE_OUT, () => {
                if (this.getCurrentUnit().checkPreparedToShot()) {
                    unit.alpha = 1;
                }
            });
            unit.on(Unit.DESTROY, () => {
                this.units.splice(this.units.indexOf(unit), 1);
                this.destroyedUnits.push(unit);
                if (!this.units.some((activeUnit: Unit) => unit.checkLeft() == activeUnit.checkLeft())) {
                    this.emit(game.Event.FINISH);
                }
            });
        }
    }

    getCurrentUnit(): Unit {
        return this.units[0];
    }

    getUnits(): Unit[] {
        return this.units;
    }

    findReachableUnitsForCurrent(): Unit[] {
        const result: Unit[] = this.units.filter(
            (unit: Unit) => this.getCurrentUnit().checkReachable(unit.getCol(), unit.getRow()));
        return result.concat(this.destroyedUnits.filter(
            (unit: Unit) => this.getCurrentUnit().checkReachable(unit.getCol(), unit.getRow())));
    }

    nextTurn() {
        if (this.getCurrentUnit().checkPreparedToShot()) {
            this.getCurrentUnit().setPreparedToShot(false);
        }
        this.units.push(this.units.shift());
        this.emit(UnitManager.NEXT_TURN, this.getCurrentUnit());
    }
}
