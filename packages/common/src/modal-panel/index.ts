import { hyperStyled } from "@macrostrat/hyper";
import { Button } from "@blueprintjs/core";
import styles from "./main.module.styl";

const h = hyperStyled(styles);

interface PanelHeaderProps {
  title: string | null;
  onClose: () => void;
  children?: React.ReactNode;
}

const PanelHeader = function(props: PanelHeaderProps) {
  const { title, onClose, children } = props;
  return h("div.panel-header", [
    h.if(title != null)("h1.title", null, title),
    h.if(children != null)([h("div.expander"), children]),
    h("div.expander"),
    h(Button, { minimal: true, icon: "cross", onClick: onClose })
  ]);
};

function ModalPanel(props) {
  const { children, className, style, ...rest } = props;
  return h("div.panel-column", [
    h("div.panel-container", [
      h("div.panel-container-inner", [
        h("div.panel-outer", [
          h("div.panel", { className, style }, [
            h(PanelHeader, rest),
            h("div.panel-content", null, children)
          ]),
          h("div.expander")
        ])
      ])
    ])
  ]);
}

const ContentPanel = props => h("div.content-panel", props);

export { ModalPanel, PanelHeader, ContentPanel };
