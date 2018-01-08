import Projectile from "./projectile/Projectile";
import ProjectileService from "./projectile/ProjectileService";
import Unit from "./unit/Unit";
import UnitService from "./unit/UnitService";
import WebSocketClient from "../WebSocketClient";
import { ActionType, PathNode } from "../util";
import { l } from "../../localizer";
import * as game from "../../game";

export default class Field extends game.UiLayer {

    static readonly CELL_SIZE = new game.Point(64, 48);
    static readonly LINE_WIDTH = 1.5;
    static readonly PATH_MARK_COLOR = 0x555500;

    private paths: PathNode[][];

    private selectedMarks: MarksContainer;
    private readonly markCurrent = new Mark(0x005500);

    private readonly pathMarks = new PIXI.Container();
    private readonly markLayer = new PIXI.Container();
    private readonly pathLayer = new PIXI.Container();

    constructor(private readonly size: game.Point, units: Unit[], asteroids: game.Point[], clouds: game.Point[],
                private readonly unitService: UnitService, private readonly projectileService: ProjectileService,
                private readonly webSocketClient: WebSocketClient) {
        super();

        const bg = new game.Rectangle(0, 0);
        this.addChild(bg);
        for (let i = 0; i <= size.y; i++) {
            const line = new game.Line(size.x * Field.CELL_SIZE.x + Field.LINE_WIDTH, Field.LINE_WIDTH, 0x777777);
            line.y = i * Field.CELL_SIZE.y;
            this.addChild(line);
        }
        for (let i = 0; i <= size.y; i++) {
            const line = new game.Line(size.y * Field.CELL_SIZE.y + Field.LINE_WIDTH, Field.LINE_WIDTH, 0x777777);
            line.pivot.y = line.thickness;
            line.rotation = Math.PI / 2;
            line.x = i * Field.CELL_SIZE.x;
            this.addChild(line);
        }
        bg.width = this.width;
        bg.height = this.height;

        this.markLayer.addChild(this.markCurrent);
        this.addChild(this.markLayer);
        const objectsLayer = new PIXI.Container();
        for (const asteroid of asteroids) {
            const spriteAsteroid = new PIXI.Sprite(PIXI.loader.resources["asteroid"].texture);
            spriteAsteroid.x = asteroid.x * Field.CELL_SIZE.x;
            spriteAsteroid.y = asteroid.y * Field.CELL_SIZE.y;
            objectsLayer.addChild(spriteAsteroid);
        }
        for (const cloud of clouds) {
            const spriteCloud = new PIXI.Sprite(PIXI.loader.resources["cloud"].texture);
            spriteCloud.x = cloud.x * Field.CELL_SIZE.x;
            spriteCloud.y = cloud.y * Field.CELL_SIZE.y;
            objectsLayer.addChild(spriteCloud);
        }
        this.addChild(objectsLayer);
        this.addChild(this.pathLayer);
        const unitsLayer = new PIXI.Container();
        for (const unit of units) {
            unitsLayer.addChild(unit);
        }
        this.addChild(unitsLayer);

        unitService.on(ActionType.Move, () => this.updatePathsAndMarks());
        unitService.on(ActionType.Shot, () => this.updatePathsAndMarks());
        unitService.on(UnitService.SHOT_CELL, (cell: game.Point) => this.markLayer.addChild(new Mark(0x555555, cell)));
        unitService.on(UnitService.TARGET_CELL, (cell: game.Point) =>
            this.markLayer.addChild(new Mark(0x550000, cell)));
        unitService.on(Unit.PREPARE_TO_SHOT, () => this.removePathsAndMarksExceptCurrent());
        unitService.on(Unit.NOT_PREPARE_TO_SHOT, () => this.addCurrentPathMarks());
        unitService.on(ActionType.NextTurn, () => this.updatePathsAndMarks());
        projectileService.on(Projectile.NEW_SHOT, (projectile: Projectile) => this.addChild(projectile));
    }

    removePathsAndMarksExceptCurrent() {
        this.pathLayer.removeChildren();
        this.markLayer.removeChildren();
        this.markLayer.addChild(this.markCurrent);
    }

    private updatePathsAndMarks() {
        this.markCurrent.width = this.unitService.currentUnit.width - Field.LINE_WIDTH;
        this.markCurrent.height = this.unitService.currentUnit.height - Field.LINE_WIDTH;
        this.markCurrent.cell = this.unitService.currentUnit.cell;
        const unitWidth: number = this.unitService.currentUnit.ship.hull.width;
        const unitHeight: number = this.unitService.currentUnit.ship.hull.height;
        const activeAreaOffset: game.Point = this.unitService.currentUnit.findCenterCell();
        if (this.unitService.isCurrentPlayerTurn) {
            this.webSocketClient.requestPathsAndReachableCells(d => {
                this.paths = d.paths;
                this.pathMarks.removeChildren();
                for (const cell of d.reachableCells) {
                    const marks = new MarksContainer(cell, unitWidth, unitHeight);
                    const activeArea = new game.Rectangle(Field.CELL_SIZE.x, Field.CELL_SIZE.y);
                    activeArea.interactive = true;
                    activeArea.alpha = 0;
                    activeArea.x = activeAreaOffset.x * Field.CELL_SIZE.x;
                    activeArea.y = activeAreaOffset.y * Field.CELL_SIZE.y;
                    marks.addChild(activeArea);
                    marks.x = cell.x * Field.CELL_SIZE.x;
                    marks.y = cell.y * Field.CELL_SIZE.y;
                    this.pathMarks.addChild(marks);

                    activeArea.on(game.Event.MOUSE_OVER, () => this.showPath(marks));
                    activeArea.on(game.Event.CLICK, () => this.webSocketClient.moveCurrentUnit(cell));
                    activeArea.on(game.Event.MOUSE_OUT, () => {
                        if (this.selectedMarks == marks) {
                            marks.resetMarks();
                            this.selectedMarks = null;
                            this.pathLayer.removeChildren();
                        }
                    });
                }
                this.addCurrentPathMarks();
            });
        }
    }

    private showPath(marks: MarksContainer) {
        if (this.paths[marks.cell.x][marks.cell.y]) {
            if (this.selectedMarks != null) {
                this.selectedMarks.resetMarks();
            }
            this.selectedMarks = marks;
            this.selectedMarks.highlightMarks();
            this.pathLayer.removeChildren();
            this.pathMarks.setChildIndex(this.selectedMarks, this.pathMarks.children.length - 1);

            const pathOffset: game.Point = this.unitService.currentUnit.findCenterCell();
            let cell: game.Point = marks.cell;
            while (!(cell.x == this.unitService.currentUnit.cell.x && cell.y == this.unitService.currentUnit.cell.y)) {
                const previousCell: game.Point = this.paths[cell.x][cell.y].cell;
                let direction: Direction;
                if (cell.x == previousCell.x - 1) {
                    direction = Direction.Left;
                } else if (cell.x == previousCell.x + 1) {
                    direction = Direction.Right;
                } else if (cell.y == previousCell.y - 1) {
                    direction = Direction.Up;
                } else if (cell.y == previousCell.y + 1) {
                    direction = Direction.Down;
                }

                const pathLine = new game.Line(0, 4, 0x00aa00);
                pathLine.x = (cell.x + pathOffset.x + game.CENTER) * Field.CELL_SIZE.x;
                pathLine.y = (cell.y + pathOffset.y + game.CENTER) * Field.CELL_SIZE.y;
                const k = direction == Direction.Left || direction == Direction.Up ? 1 : -1;
                const destination = new PIXI.Point(pathLine.x, pathLine.y);
                if (direction == Direction.Left || direction == Direction.Right) {
                    pathLine.width = Field.CELL_SIZE.x;
                    destination.x += pathLine.width * k;
                } else if (direction == Direction.Up || direction == Direction.Down) {
                    pathLine.width = Field.CELL_SIZE.y;
                    destination.y += pathLine.width * k;
                }
                pathLine.direct(destination);
                this.pathLayer.addChild(pathLine);
                cell = previousCell;
            }
            const moveCost = `${this.paths[marks.cell.x][marks.cell.y].movementCost.toLocaleString()} ${l("ap")}`;
            const txtMoveCost = new PIXI.Text(moveCost, { fill: "white", fontSize: 12 });
            txtMoveCost.position.set(this.selectedMarks.x, this.selectedMarks.y);
            this.pathLayer.addChild(txtMoveCost);
        }
    }

    private addCurrentPathMarks() {
        this.removePathsAndMarksExceptCurrent();
        this.markLayer.addChildAt(this.pathMarks, 0);
    }
}

const enum Direction {
    Left, Right, Up, Down
}

class MarksContainer extends PIXI.Container {

    private readonly marks = new Array<Mark>(0);

    constructor(readonly cell: game.Point, width: number, height: number) {
        super();
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const mark = new Mark(Field.PATH_MARK_COLOR, new game.Point(i, j));
                this.marks.push(mark);
                this.addChild(mark);
            }
        }
    }

    highlightMarks() {
        for (const mark of this.marks) {
            mark.color = 0x005500;
        }
    }

    resetMarks() {
        for (const mark of this.marks) {
            mark.color = Field.PATH_MARK_COLOR;
        }
    }
}

class Mark extends game.Rectangle {

    private _cell: game.Point;

    constructor(color: number, cell?: game.Point) {
        super(Field.CELL_SIZE.x - Field.LINE_WIDTH, Field.CELL_SIZE.y - Field.LINE_WIDTH, color);
        if (cell) {
            this.cell = cell;
        }
    }

    get cell(): game.Point {
        return this._cell;
    }

    set cell(value: game.Point) {
        this._cell = value;
        this.x = value.x * Field.CELL_SIZE.x + Field.LINE_WIDTH;
        this.y = value.y * Field.CELL_SIZE.y + Field.LINE_WIDTH;
    }
}
