import FieldManager from "./FieldManager";
import Mark from "./Mark";
import Unit from "../unit/Unit";
import { CellStatus } from "./utils";
import * as game from "../../game";
import GunManager from "../gun/GunManager";

export default class Field extends game.MovableByMouse {

    static readonly LINE_WIDTH = 2;

    private readonly currentMark = new Mark(0x00FF00);
    private readonly pathMarks = new Array<Mark>(0);
    private readonly markLayer = new PIXI.Container();

    private readonly pathLayer = new PIXI.Container();

    constructor(private readonly gunManager: GunManager, private readonly fieldManager: FieldManager,
                freeWidth: number, freeHeight: number) {
        super(freeWidth, freeHeight);
        this.createCommonMarksForUnit(fieldManager.unitManager.currentUnit);

        this.addChild(new game.Rectangle(freeWidth, freeHeight, 0x111111));
        for (let i = 0; i <= fieldManager.rowsCount; i++) {
            const line = new game.Rectangle(fieldManager.colsCount * Unit.WIDTH + Field.LINE_WIDTH,
                Field.LINE_WIDTH, 0x777777);
            line.y = i * Unit.HEIGHT;
            this.content.addChild(line);
        }
        for (let i = 0; i <= fieldManager.colsCount; i++) {
            const line = new game.Rectangle(Field.LINE_WIDTH,
                fieldManager.rowsCount * Unit.HEIGHT + Field.LINE_WIDTH, 0x777777);
            line.x = i * Unit.WIDTH;
            this.content.addChild(line);
        }

        this.markLayer.addChild(this.currentMark);
        this.content.addChild(this.markLayer);
        this.content.addChild(this.pathLayer);
        for (const unit of fieldManager.unitManager.units) {
            this.content.addChild(unit);
        }
        this.addChild(this.content);

        this.fieldManager.on(FieldManager.PATHS_READY, (unit: Unit) => this.createCommonMarksForUnit(unit));
        this.fieldManager.on(FieldManager.PATH_LINE, (cell: PIXI.Point, direction: game.Direction) => {
            const pathLine = new game.Rectangle(5, 5, 0x00FF00);
            pathLine.x = cell.x * Unit.WIDTH;
            pathLine.y = cell.y * Unit.HEIGHT;
            let k = 0;
            if (direction == game.Direction.Left || direction == game.Direction.Right) {
                pathLine.width = Unit.WIDTH;
                pathLine.pivot.y = pathLine.height / 2;
                k = direction == game.Direction.Left ? 1 : -1;
                pathLine.x += pathLine.width / 2 * k;
                pathLine.y += Unit.HEIGHT / 2;
            } else if (direction == game.Direction.Down || direction == game.Direction.Up) {
                pathLine.height = Unit.HEIGHT;
                pathLine.pivot.x = pathLine.width / 2;
                pathLine.x += Unit.WIDTH / 2;
                k = direction == game.Direction.Down ? 1 : -1;
                pathLine.y += pathLine.height / 2 * k;
            }
            this.pathLayer.addChild(pathLine);
        });
        this.fieldManager.unitManager.on(Unit.PREPARED_TO_SHOT, (unit: Unit) => this.addTargetMarksForUnit(unit));
        this.fieldManager.unitManager.on(Unit.NOT_PREPARED_TO_SHOT, () => this.addCurrentPathMarks());
    }

    private removeAllMarksExceptCurrent() {
        this.markLayer.removeChildren();
        this.markLayer.addChild(this.currentMark);
    }

    private createCommonMarksForUnit(unit: Unit) {
        this.currentMark.cell = unit.cell;
        this.pathMarks.length = 0;
        for (const cell of this.fieldManager.findNeighborsForCell(unit.cell, unit.movementPoints)) {
            if (this.fieldManager.map[cell.x][cell.y] == CellStatus.Empty) {
                const pathMark = new Mark(0xFFFF00, cell);
                this.pathMarks.push(pathMark);

                pathMark.on(game.Event.MOUSE_OVER, () => {
                    this.fieldManager.preparePath(cell, unit.cell);
                    const pathEnd = new game.Rectangle(15, 15, 0x00FF00);
                    pathEnd.pivot.set(pathEnd.width / 2, pathEnd.height / 2);
                    pathEnd.x = (cell.x + game.CENTER) * Unit.WIDTH;
                    pathEnd.y = (cell.y + game.CENTER) * Unit.HEIGHT;
                    this.pathLayer.addChild(pathEnd);
                });
                pathMark.on(game.Event.CLICK, () => {
                    unit.path = this.fieldManager.currentPath;
                    this.pathLayer.removeChildren();
                    this.emit(game.Event.MOUSE_UP);
                    unit.once(game.Event.DONE, () => this.fieldManager.createPathsForUnit(unit));
                });
                pathMark.on(game.Event.MOUSE_OUT, () => this.pathLayer.removeChildren());
            }
        }
        this.addCurrentPathMarks();
    }

    private addCurrentPathMarks() {
        this.removeAllMarksExceptCurrent();
        for (const mark of this.pathMarks) {
            this.markLayer.addChild(mark);
        }
    }

    private addTargetMarksForUnit(unit: Unit) {
        this.removeAllMarksExceptCurrent();
        const targets: Unit[] = this.fieldManager.unitManager.units.filter(target => unit.canHit(target));
        for (const cell of this.fieldManager.findNeighborsForCell(
            unit.cell, this.gunManager.getRadius(unit.preparedGun))) {
            if (this.fieldManager.map[cell.x][cell.y] == CellStatus.Empty) {
                this.markLayer.addChild(new Mark(0xFFFFFF, cell));
            } else if (this.fieldManager.map[cell.x][cell.y] == CellStatus.Ship) {
                if (targets.some(target => target.col == cell.x && target.row == cell.y)) {
                    this.markLayer.addChild(new Mark(0xFF0000, cell));
                }
            }
        }
    }
}
