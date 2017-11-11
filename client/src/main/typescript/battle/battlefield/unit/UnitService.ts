import Unit from "./Unit";
import WebSocketConnection from "../../WebSocketConnection";
import { ActionType, Side } from "../../util";
import * as game from "../../../game";
import * as PIXI from "pixi.js";

export default class UnitService extends PIXI.utils.EventEmitter {

    static readonly UNIT_MOUSE_OVER = "unitMouseOver";
    static readonly UNIT_MOUSE_OUT = "unitMouseOut";
    static readonly SHOT_CELL = "shotCell";
    static readonly TARGET_CELL = "targetCell";

    private readonly currentTargets = new Array<Unit>(0);

    constructor(private readonly currentPlayerSide: Side, readonly units: Unit[],
                private readonly webSocketConnection: WebSocketConnection) {
        super();
        for (const unit of this.units) {
            unit.on(game.Event.MOUSE_OVER, (e: PIXI.interaction.InteractionEvent) => {
                if (this.currentUnit.preparedGunId != -1 && this.currentUnit.side != unit.side && unit.strength > 0) {
                    unit.alpha = 0.75;
                }
                this.emit(UnitService.UNIT_MOUSE_OVER, e.data.global, unit);
            });
            unit.on(game.Event.CLICK, () => {
                if (this.currentTargets.indexOf(unit) != -1) {
                    webSocketConnection.shootWithCurrentUnit(this.currentUnit.preparedGunId, unit.cell);
                }
            });
            unit.on(game.Event.MOUSE_OUT, () => {
                if (unit.strength > 0) {
                    unit.alpha = 1;
                }
                this.emit(UnitService.UNIT_MOUSE_OUT);
            });

            unit.on(ActionType.Move, () => {
                this.emit(ActionType.Move);
                this.checkCurrentUnitActionPoints();
            });
            unit.on(ActionType.Shot, () => {
                this.emit(ActionType.Shot);
                this.checkCurrentUnitActionPoints();
            });
            unit.on(Unit.PREPARE_TO_SHOT, () => {
                webSocketConnection.requestShotAndTargetCells(unit.preparedGunId, c => {
                    this.emit(Unit.PREPARE_TO_SHOT);
                    for (const cell of c.shotCells) {
                        this.emit(UnitService.SHOT_CELL, cell);
                    }
                    for (const cell of c.targetCells) {
                        this.currentTargets.push(this.units
                            .filter(u => u.cell.x == cell.x && u.cell.y == cell.y)[0]);
                        this.emit(UnitService.TARGET_CELL, cell);
                    }
                });
            });
            unit.on(Unit.NOT_PREPARE_TO_SHOT, () => {
                this.currentTargets.length = 0;
                this.emit(Unit.NOT_PREPARE_TO_SHOT)
            });
            unit.on(Unit.DESTROY, () => this.units.splice(this.units.indexOf(unit), 1));
        }
    }

    get isCurrentPlayerTurn(): boolean {
        return this.currentPlayerSide == this.currentUnit.side;
    }

    get currentUnit(): Unit {
        return this.units[0];
    }

    nextTurn() {
        this.currentUnit.preparedGunId = -1;
        this.units.push(this.units.shift());
        this.currentUnit.makeCurrent();
        this.emit(ActionType.NextTurn, false);
    }

    private checkCurrentUnitActionPoints() {
        if (this.isCurrentPlayerTurn && this.currentUnit.actionPoints == 0) {
            this.webSocketConnection.endTurn();
        }
    }
}
