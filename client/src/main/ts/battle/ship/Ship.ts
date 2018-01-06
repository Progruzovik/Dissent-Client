import { Gun, Hull, ShipData } from "../util";
import * as game from "../../game";
import * as PIXI from "pixi.js";

export default class Ship implements ShipData {

    private _strength: number;

    readonly hull: Hull;
    readonly firstGun: Gun;
    readonly secondGun: Gun;

    constructor(data: ShipData) {
        this._strength = data.strength;
        this.hull = data.hull;
        this.firstGun = data.firstGun;
        this.secondGun = data.secondGun;
    }

    get strength(): number {
        return this._strength;
    }

    set strength(value: number) {
        if (value < 0) {
            this._strength = 0;
        } else if (value > this.hull.strength) {
            this._strength = this.hull.strength;
        } else {
            this._strength = value;
        }
    }

    createIcon(): PIXI.Container {
        return new PIXI.Sprite(PIXI.loader.resources[this.hull.texture.name].texture);
    }

    createGunsCard(): PIXI.Container {
        const result = new PIXI.Container();
        if (this.firstGun) {
            result.addChild(new PIXI.Text(this.firstGun.name, { fill: "white" }));
        }
        if (this.secondGun) {
            const txtSecondGun = new PIXI.Text(this.secondGun.name, { fill: "white" });
            txtSecondGun.x = result.width + game.INDENT;
            result.addChild(txtSecondGun);
        }
        return result;
    }

    createStrengthBar(width: number, height: number = 15, color: number = 0xff0000): game.ProgressBar {
        const result = new game.ProgressBar(width, height, color, game.BarTextConfig.Default, this.hull.strength);
        result.value = this.strength;
        return result;
    }
}
