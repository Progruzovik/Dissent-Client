import HangarData from "./model/HangarData";
import { l } from "../../localizer";
import { HyperNode } from "../util";
import * as druid from "pixi-druid";
import * as m from "mithril";

export default class IndexPage implements m.ClassComponent {

    constructor(private readonly hangarData: HangarData) {}

    oninit() {
        this.hangarData.on(druid.Event.UPDATE, () => m.redraw());
    }

    onremove() {
        this.hangarData.off(druid.Event.UPDATE);
    }

    view(): m.Children {
        const ships: HyperNode = {
            children: this.hangarData.ships.map((s, i) => {
                const imgShip: HyperNode = {
                    attrs: {
                        src: `../img/${s.hull.texture.name}.png`,
                        onclick: () => {
                            window.location.href = `#!/hangar/ship/${i}/`;
                        }
                    }
                };
                return m("img.interactive.block.interactive-yellow", imgShip.attrs);
            })
        };
        return m(".container.centered",
            m("h2", m("b", l("hangar"))),
            m("", ships.children)
        );
    }
};
