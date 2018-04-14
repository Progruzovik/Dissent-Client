import { BattlePage } from "./menu/BattlePage";
import { IndexPage } from "./menu/hangar/IndexPage";
import { MissionPage } from "./menu/hangar/MissionPage";
import { PvpPage } from "./menu/hangar/PvpPage";
import { ShipPage } from "./menu/hangar/ShipPage";
import { HangarLayout } from "./menu/hangar/HangarLayout";
import { HangarService } from "./menu/hangar/service/HangarService";
import { StatusService } from "./menu/service/StatusService";
import { WebSocketClient } from "./WebSocketClient";
import { PageWrapper } from "./menu/util";
import { initClient } from "./request";
import { updateLocalizedData } from "./localizer";
import "skeleton-css/css/normalize.css";
import "skeleton-css/css/skeleton.css";
import "../css/global.css";
import * as m from "mithril";
import * as PIXI from "pixi.js";

document.title = "Dissent";
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.utils.skipHello();

initClient("en", s => {
    updateLocalizedData(s);
    const url: string = window.location.origin.replace("http", "ws");
    const webSocketClient = new WebSocketClient(`${url}/app/`);
    const statusData = new StatusService(webSocketClient);
    const hangarData = new HangarService(statusData, webSocketClient);

    const hangarLayout = new HangarLayout(hangarData, statusData);
    m.route(document.body, "/hangar/", {
        "/battle/": new BattlePage(statusData, webSocketClient),
        "/hangar/": new PageWrapper(hangarLayout, new IndexPage(hangarData), "hangar"),
        "/hangar/ship/:id/": new PageWrapper(hangarLayout, new ShipPage(hangarData), "hangar"),
        "/missions/": new PageWrapper(hangarLayout, new MissionPage(hangarData, webSocketClient), "missions"),
        "/pvp/": new PageWrapper(hangarLayout, new PvpPage(statusData, webSocketClient), "pvp")
    });
});
