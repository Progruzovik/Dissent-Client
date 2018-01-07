import Ship from "../../ship/Ship";
import { l } from "../../../localizer";
import * as game from "../../../game";
import * as PIXI from "pixi.js";

export default class ShipInfo extends game.UiLayer {

    private readonly txtName: PIXI.Text;
    private readonly content = new PIXI.Container();

    constructor(ship: Ship) {
        super();
        this.txtName = new PIXI.Text(ship.hull.name, { fill: "white", fontSize: 32, fontWeight: "bold" });
        this.txtName.anchor.set(game.CENTER, 1);
        this.addChild(this.txtName);

        const iconShip = ship.createIcon();
        iconShip.scale.set(2, 2);
        this.content.addChild(iconShip);
        const cardGuns = ship.createGunsCard();
        cardGuns.x = iconShip.width + game.INDENT;
        this.content.addChild(cardGuns);

        const barStrength = ship.createStrengthBar(iconShip.width);
        barStrength.y = iconShip.height;
        this.content.addChild(barStrength);

        const btnBack = new game.Button(l("back"));
        btnBack.y = cardGuns.height + game.INDENT;
        this.content.addChild(btnBack);
        this.content.pivot.set(this.content.width / 2, this.content.height / 2);
        this.addChild(this.content);

        btnBack.on(game.Event.BUTTON_CLICK, () => this.emit(game.Event.DONE));
    }

    resize(width: number, height: number) {
        this.content.position.set(width / 2, height / 2);
        this.txtName.position.set(width / 2, this.content.y - this.content.pivot.y - game.INDENT);
    }
}
