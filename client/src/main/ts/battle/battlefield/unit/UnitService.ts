import Unit from "./Unit";
import WebSocketClient from "../../../WebSocketClient";
import { ActionType, Gun, Side } from "../../../model/util";
import * as druid from "pixi-druid";
import * as PIXI from "pixi.js";

export default class UnitService extends PIXI.utils.EventEmitter {

    static readonly UNIT_MOUSE_OVER = "unitMouseOver";
    static readonly UNIT_MOUSE_OUT = "unitMouseOut";
    static readonly SHOT_CELL = "shotCell";
    static readonly TARGET_CELL = "targetCell";

    private readonly unitQueue: Unit[] = [];
    private targetCells: druid.Point[];
    private readonly currentTargets: Unit[] = [];

    constructor(private readonly playerSide: Side, units: Unit[],
                private readonly webSocketClient: WebSocketClient) {
        super();
        for (const unit of units) {
            if (unit.strength > 0) {
                this.unitQueue.push(unit);
                unit.on(druid.Event.CLICK, () => {
                    const index: number = this.currentTargets.indexOf(unit);
                    if (index != -1) {
                        webSocketClient.shootWithCurrentUnit(this.activeUnit.preparedGunId, this.targetCells[index]);
                    }
                });
                unit.on(ActionType.Move, () => {
                    this.emit(ActionType.Move);
                    this.tryToEndTurn();
                });
                unit.on(ActionType.Shot, (damage: number, gun: Gun, target: Unit) => {
                    this.emit(ActionType.Shot, damage, gun, unit, target);
                    this.tryToEndTurn();
                });
                unit.on(Unit.PREPARE_TO_SHOT, () => {
                    webSocketClient.requestGunCells(unit.preparedGunId, g => {
                        this.emit(Unit.PREPARE_TO_SHOT);
                        for (const cell of g.shotCells) {
                            this.emit(UnitService.SHOT_CELL, cell);
                        }
                        this.targetCells = g.targetCells;
                        this.currentTargets.length = 0;
                        for (const cell of this.targetCells) {
                            this.currentTargets.push(this.findUnitOnCell(cell));
                            this.emit(UnitService.TARGET_CELL, cell);
                        }
                    });
                });
                unit.on(Unit.NOT_PREPARE_TO_SHOT, () => this.emit(Unit.NOT_PREPARE_TO_SHOT));
                unit.once(Unit.DESTROY, () => {
                    this.unitQueue.splice(this.unitQueue.indexOf(unit), 1);
                    unit.off(druid.Event.CLICK);
                    unit.off(ActionType.Move);
                    unit.off(ActionType.Shot);
                    unit.off(Unit.PREPARE_TO_SHOT);
                    unit.off(Unit.NOT_PREPARE_TO_SHOT);
                });
            }

            unit.on(druid.Event.MOUSE_OVER, (e: PIXI.interaction.InteractionEvent) => {
                if (this.activeUnit.preparedGunId != Unit.NO_GUN_ID
                    && this.activeUnit.side != unit.side && unit.strength > 0) {
                    unit.alpha = 0.75;
                }
                this.emit(UnitService.UNIT_MOUSE_OVER, e.data.global, unit);
            });
            unit.on(druid.Event.MOUSE_OUT, () => {
                if (unit.strength > 0) {
                    unit.alpha = 1;
                }
                this.emit(UnitService.UNIT_MOUSE_OUT, unit);
            });
        }
    }

    get isCurrentPlayerTurn(): boolean {
        return this.playerSide == this.activeUnit.side;
    }

    get activeUnit(): Unit {
        return this.unitQueue[0];
    }

    findUnitOnCell(cell: druid.Point) {
        return this.unitQueue.filter(u => u.isOccupyCell(cell))[0];
    }

    nextTurn() {
        this.unitQueue.push(this.unitQueue.shift());
        this.activeUnit.activate();
        this.emit(ActionType.NextTurn);
    }

    private tryToEndTurn() {
        if (this.isCurrentPlayerTurn && this.activeUnit.actionPoints == 0) {
            this.webSocketClient.endTurn();
        }
    }
}
