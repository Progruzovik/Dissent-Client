import { Cell } from "../request";
import * as game from "../../game";

export default class Beam extends game.Actor {

    private remainingFrames = 12;

    constructor(to: Cell, from: Cell) {
        super();
        const dx: number = to.x - from.x, dy: number = to.y - from.y;
        this.addChild(new game.Rectangle(0xFF0000, Math.sqrt(dx * dx + dy * dy), 2));
        this.rotation = Math.atan2(dy, dx);
        this.pivot.y = this.height / 2;
        this.position.set(from.x, from.y);
    }

    protected update() {
        if (this.remainingFrames > 0) {
            this.remainingFrames--;
        } else {
            this.emit(game.Event.DONE);
            this.destroy();
        }
    }
}
