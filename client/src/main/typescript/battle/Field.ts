import Mark from "./Mark";
import ProjectileService from "./projectile/ProjectileService";
import Unit from "./unit/Unit";
import { getCurrentReachableCells, postCurrentUnitCell, Cell, getCurrentPaths, getCellsForCurrentUnitShot } from "./request";
import * as game from "../game";
import UnitService from "./unit/UnitService";

export default class Field extends PIXI.Container {

    static readonly LINE_WIDTH = 1.5;

    readonly currentPath = new Array<game.Direction>(0);
    private paths: Cell[][];

    private readonly currentMark = new Mark(0x00FF00);
    private readonly pathMarks = new Array<Mark>(0);
    private readonly markLayer = new PIXI.Container();
    private readonly pathLayer = new PIXI.Container();

    constructor(private readonly size: Cell, private readonly projectileService: ProjectileService,
                private readonly unitService: UnitService, fieldObjects: Cell[]) {
        super();

        const bg = new game.Rectangle();
        this.addChild(bg);
        for (let i = 0; i <= size.y; i++) {
            const line = new game.Rectangle(0x777777, size.x * Unit.WIDTH + Field.LINE_WIDTH, Field.LINE_WIDTH);
            line.y = i * Unit.HEIGHT;
            this.addChild(line);
        }
        for (let i = 0; i <= size.y; i++) {
            const line = new game.Rectangle(0x777777,
                Field.LINE_WIDTH, size.y * Unit.HEIGHT + Field.LINE_WIDTH);
            line.x = i * Unit.WIDTH;
            this.addChild(line);
        }
        for (const object of fieldObjects) {
            const spriteAsteroid = new PIXI.Sprite(PIXI.loader.resources["asteroid"].texture);
            spriteAsteroid.x = object.x * Unit.WIDTH;
            spriteAsteroid.y = object.y * Unit.HEIGHT;
            this.addChild(spriteAsteroid);
        }
        bg.width = this.width;
        bg.height = this.height;

        this.markLayer.addChild(this.currentMark);
        this.addChild(this.markLayer);
        this.addChild(this.pathLayer);
        for (const unit of unitService.units) {
            this.addChild(unit);
        }

        this.projectileService.on(Unit.SHOT, (projectile: game.Actor) => this.addChild(projectile));
        this.unitService.on(UnitService.NEXT_TURN, () => this.getPathsForCurrentUnit());
        this.unitService.on(Unit.PREPARED_TO_SHOT, (unit: Unit) => {
            getCellsForCurrentUnitShot(unit.preparedGunNumber, (shotCells, targetCells) => {
                this.removeAllMarksExceptCurrent();
                for (const cell of shotCells) {
                    this.markLayer.addChild(new Mark(0xFFFFFF, cell));
                }
                for (const cell of targetCells) {
                    if (this.unitService.units.some(unit =>
                            unit.cell.x == cell.x && unit.cell.y == cell.y)) {
                        this.markLayer.addChild(new Mark(0xFF0000, cell));
                    }
                }
            });
        });
        this.unitService.on(Unit.NOT_PREPARED_TO_SHOT, () => this.addCurrentPathMarks());
    }

    private getPathsForCurrentUnit() {
        getCurrentPaths(paths => {
            this.paths = paths;
            this.createCommonMarksForUnit(this.unitService.currentUnit);
        });
    }

    private preparePath(markCell: Cell, unitCell: PIXI.Point) {
        this.currentPath.length = 0;
        if (this.paths[markCell.x][markCell.y]) {
            let cell: Cell = markCell;
            while (!(cell.x == unitCell.x && cell.y == unitCell.y)) {
                const previousCell: Cell = this.paths[cell.x][cell.y];
                let direction: game.Direction;
                if (cell.x == previousCell.x - 1) {
                    direction = game.Direction.Left;
                } else if (cell.x == previousCell.x + 1) {
                    direction = game.Direction.Right;
                } else if (cell.y == previousCell.y - 1) {
                    direction = game.Direction.Up;
                } else if (cell.y == previousCell.y + 1) {
                    direction = game.Direction.Down;
                }
                this.currentPath.push(direction);

                const pathLine = new game.Rectangle(0x00FF00, 5, 5);
                pathLine.x = cell.x * Unit.WIDTH;
                pathLine.y = cell.y * Unit.HEIGHT;
                let k = 0;
                if (direction == game.Direction.Left || direction == game.Direction.Right) {
                    pathLine.width = Unit.WIDTH;
                    pathLine.pivot.y = pathLine.height / 2;
                    k = direction == game.Direction.Left ? 1 : -1;
                    pathLine.x += pathLine.width / 2 * k;
                    pathLine.y += Unit.HEIGHT / 2;
                } else if (direction == game.Direction.Up || direction == game.Direction.Down) {
                    pathLine.height = Unit.HEIGHT;
                    pathLine.pivot.x = pathLine.width / 2;
                    pathLine.x += Unit.WIDTH / 2;
                    k = direction == game.Direction.Up ? 1 : -1;
                    pathLine.y += pathLine.height / 2 * k;
                }
                this.pathLayer.addChild(pathLine);

                cell = previousCell;
            }
        }
    }

    private removeAllMarksExceptCurrent() {
        this.markLayer.removeChildren();
        this.markLayer.addChild(this.currentMark);
    }

    private createCommonMarksForUnit(unit: Unit) {
        getCurrentReachableCells(reachableCells => {
            this.currentMark.cell = unit.cell;
            this.pathMarks.length = 0;
            for (const cell of reachableCells) {
                const pathMark = new Mark(0xFFFF00, cell);
                this.pathMarks.push(pathMark);

                pathMark.on(game.Event.MOUSE_OVER, () => {
                    this.preparePath(cell, unit.cell);
                    const pathEnd = new game.Rectangle(0x00FF00, 15, 15);
                    pathEnd.pivot.set(pathEnd.width / 2, pathEnd.height / 2);
                    pathEnd.x = (cell.x + game.CENTER) * Unit.WIDTH;
                    pathEnd.y = (cell.y + game.CENTER) * Unit.HEIGHT;
                    this.pathLayer.addChild(pathEnd);
                });
                pathMark.on(game.Event.CLICK, () => {
                    postCurrentUnitCell(cell, () => {
                        unit.path = this.currentPath;
                        this.pathLayer.removeChildren();
                        this.emit(game.Event.MOUSE_UP);
                        unit.once(Unit.MOVE, () => this.getPathsForCurrentUnit());
                    });
                });
                pathMark.on(game.Event.MOUSE_OUT, () => this.pathLayer.removeChildren());
            }
            this.addCurrentPathMarks();
        });
    }

    private addCurrentPathMarks() {
        this.removeAllMarksExceptCurrent();
        for (const mark of this.pathMarks) {
            this.markLayer.addChild(mark);
        }
    }
}