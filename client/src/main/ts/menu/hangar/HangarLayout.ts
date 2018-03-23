import HangarData from "./model/HangarData";
import StatusData from "../model/StatusData";
import { HyperNode } from "../util";
import { l } from "../../localizer";
import { Status } from "../../model/util";
import * as css from "../../../css/hangar.css";
import * as druid from "pixi-druid";
import * as m from "mithril";

export default class HangarLayout implements m.ClassComponent {

    constructor(private readonly hangarData: HangarData, private readonly statusData: StatusData) {}

    oninit() {
        this.statusData.on(druid.Event.UPDATE, () => m.redraw());
    }

    onremove() {
        this.statusData.off(druid.Event.UPDATE);
    }

    view(vnode: m.Vnode<any>): m.Children {
        if (this.statusData.currentStatus == Status.InBattle) {
            window.location.href = "#!/battle/";
            return null;
        }

        const isDisabled: boolean = this.statusData.currentStatus == Status.Queued;
        const btnHangar: HyperNode = {
            attrs: {
                disabled: isDisabled || vnode.attrs.location == "hangar" ? "disabled" : "",
                type: "button",
                onclick: () => {
                    window.location.href = "#!/hangar/"
                }
            }
        };
        const btnMissions: HyperNode = {
            attrs: {
                disabled: isDisabled || vnode.attrs.location == "missions" ? "disabled" : "",
                type: "button",
                onclick: () => {
                    window.location.href = "#!/missions/"
                }
            }
        };
        const btnPvp: HyperNode = {
            attrs: {
                disabled: isDisabled || vnode.attrs.location == "pvp" ? "disabled" : "",
                type: "button",
                onclick: () => {
                    window.location.href = "#!/pvp/"
                }
            }
        };

        const rightPanel: HyperNode = {
            attrs: {
                class: this.hangarData.rightPanelContent ? css.rightPanel : ""
            },
            children: this.hangarData.rightPanelContent
        };

        return m("",
            m(".light-grey.title.centered", m("i.title-text", "Dissent [tech demo]")),
            m(`.${css.grid}`,
                m(`.${css.content}`, vnode.children),
                m(`.${css.controls}.centered`,
                    m("button", btnHangar.attrs, l("hangar")),
                    m("button", btnMissions.attrs, l("missions")),
                    m("button", btnPvp.attrs, l("pvp"))
                ),
                m("", rightPanel.attrs, rightPanel.children)
            )
        );
    }
}
