import {
  Navbar,
  Button,
  ButtonGroup,
  NavbarGroup,
  Alignment,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.styl";
import { useState } from "react";
const h = hyper.styled(styles);

interface ThreeColumnLayoutProps {
  contextPanel: React.ReactElement;
  children: React.ReactNode;
  detailPanel: React.ReactElement;
  footer?: React.ReactNode;
  title?: string;
}

function ThreeColumnLayout(props: ThreeColumnLayoutProps) {
  const {
    contextPanel,
    detailPanel,
    title = "User interface",
    children,
    footer,
    ...rest
  } = props;

  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [detailPanelOpen, setDetailPanelOpen] = useState(true);

  return h(
    "div.user-interface",
    {
      ...rest,
    },
    [
      h(Navbar, [
        h(Navbar.Group, [h(Navbar.Heading, null, title)]),
        h(NavbarGroup, { align: Alignment.RIGHT }, [
          h(ButtonGroup, { minimal: true }, [
            h(Button, {
              icon: "projects",
              active: contextPanelOpen,
              onClick() {
                setContextPanelOpen(!contextPanelOpen);
              },
            }),
            h(Button, {
              icon: "properties",
              active: detailPanelOpen,
              onClick() {
                setDetailPanelOpen(!detailPanelOpen);
              },
            }),
          ]),
        ]),
      ]),
      h("div.three-column", [
        h.if(contextPanel != null && contextPanelOpen)(
          "div.column.context-column",
          null,
          contextPanel
        ),
        h("div.column.main-column", null, children),
        h.if(detailPanel != null && detailPanelOpen)(
          "div.column.detail-column",
          null,
          detailPanel
        ),
      ]),
      h.if(footer != null)("footer", null, footer),
    ]
  );
}

export { ThreeColumnLayout, ThreeColumnLayoutProps };
