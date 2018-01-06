import ShipsPanel from "./ShipsPanel";
import WebSocketClient from "../../WebSocketClient";
import Ship from "../../ship/Ship";
import { Status } from "../../util";
import { l } from "../../../localizer";
import * as game from "../../../game";

export default class Menu extends game.UiLayer {

    static readonly BATTLE = "battle";

    private status: Status;

    private readonly txtDissent = new PIXI.Text("Dissent", { fill: "white", fontSize: 48, fontWeight: "bold" });
    private readonly txtStatus = new PIXI.Text("", { fill: "white" });

    private readonly btnQueue = new game.Button();
    private readonly groupButtons = new PIXI.Container();

    readonly shipsPanel = new ShipsPanel();

    constructor(webSocketClient: WebSocketClient) {
        super();
        this.txtDissent.anchor.x = game.CENTER;
        this.addChild(this.txtDissent);
        this.txtStatus.anchor.x = game.CENTER;
        this.addChild(this.txtStatus);

        this.groupButtons.addChild(this.btnQueue);
        const btnScenario = new game.Button("PVE");
        btnScenario.x = this.btnQueue.width + game.INDENT;
        this.groupButtons.addChild(btnScenario);
        this.groupButtons.pivot.x = this.groupButtons.width / 2;
        this.addChild(this.groupButtons);

        this.addChild(this.shipsPanel);

        webSocketClient.on(WebSocketClient.STATUS, (status: Status) => {
            this.status = status;
            if (status == Status.InBattle) {
                this.emit(Menu.BATTLE);
            } else {
                this.updateStatus();
            }
        });
        this.btnQueue.on(game.Event.BUTTON_CLICK, () => {
            if (this.status == Status.Queued) {
                webSocketClient.removeFromQueue();
            } else {
                webSocketClient.addToQueue();
            }
        });
        btnScenario.on(game.Event.BUTTON_CLICK, () => webSocketClient.startScenario());
        this.shipsPanel.on(ShipsPanel.OPEN_INFO, (ship: Ship) => this.emit(ShipsPanel.OPEN_INFO, ship));
    }

    resize(width: number, height: number) {
        this.txtDissent.position.set(width / 2, game.INDENT * 3);
        this.txtStatus.position.set(width / 2, this.txtDissent.y + this.txtDissent.height + game.INDENT / 2);
        this.groupButtons.position.set(width / 2, this.txtStatus.y + this.txtStatus.height + game.INDENT);
        this.shipsPanel.resize(width);
        this.shipsPanel.y = this.groupButtons.y + this.groupButtons.height + game.INDENT * 2;
    }

    private updateStatus() {
        this.txtStatus.text = `${l("yourStatus")}: ${Status[this.status]}`;
        if (this.status == Status.Queued) {
            this.btnQueue.text = l("fromQueue");
        } else {
            this.btnQueue.text = "PVP";
        }
    }
}
