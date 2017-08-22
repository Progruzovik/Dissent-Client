import { Event } from "./constant"

export class MovableByMouse extends PIXI.Container {

    private isLeftMouseButtonDown = false;
    private mouseX = 0;
    private mouseY = 0;

    protected readonly content = new PIXI.Container();

    constructor(freeWidth: number, freeHeight: number) {
        super();
        this.interactive = true;

        this.on(Event.MOUSE_DOWN, (e: PIXI.interaction.InteractionEvent) => {
            this.isLeftMouseButtonDown = true;
            this.mouseX = e.data.global.x;
            this.mouseY = e.data.global.y;
        });
        this.on(Event.MOUSE_MOVE, (e: PIXI.interaction.InteractionEvent) => {
            if (this.isLeftMouseButtonDown) {
                this.content.x += e.data.global.x - this.mouseX;
                if (this.content.x > 0) {
                    this.content.x = 0;
                } else {
                    const leftBorder: number = freeWidth - this.content.width;
                    if (leftBorder > 0) {
                        this.content.x = 0;
                    } else if (this.content.x < leftBorder) {
                        this.content.x = leftBorder;
                    }
                }
                this.content.y += e.data.global.y - this.mouseY;
                if (this.content.y > 0) {
                    this.content.y = 0;
                } else {
                    const topBorder: number = freeHeight - this.content.height;
                    if (topBorder > 0) {
                        this.content.y = 0;
                    } else if (this.content.y < topBorder) {
                        this.content.y = topBorder;
                    }
                }
                this.mouseX = e.data.global.x;
                this.mouseY = e.data.global.y;
            }
        });
        this.on(Event.MOUSE_UP, () => this.isLeftMouseButtonDown = false);
        this.on(Event.MOUSE_OUT, () => this.isLeftMouseButtonDown = false);
    }
}
