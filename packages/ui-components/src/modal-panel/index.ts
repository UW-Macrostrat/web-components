import { hyperStyled } from "@macrostrat/hyper";
import { Button } from "@blueprintjs/core";
import styles from "./main.module.sass";
import React from "react";

const h = hyperStyled(styles);

interface PanelHeaderProps {
  title: string | null;
  onClose: () => void;
  allowTitleWrap?: boolean;
  children?: React.ReactNode;
}

const PanelHeader = function (props: PanelHeaderProps) {
  const { title, onClose, children, allowTitleWrap = false } = props;
  return h("div.panel-header", [
    h.if(title != null)(
      "h1.title",
      { className: allowTitleWrap ? null : "overflow-hidden" },
      title,
    ),
    h.if(children != null)([h("div.expander"), children, h("div.extra-space")]),
    h(Button, { minimal: true, icon: "cross", onClick: onClose }),
  ]);
};

function MinimalModalPanel(props) {
  const { children, className, style, headerChildren, ...rest } = props;
  return h("div.panel-column", [
    h("div.panel.minimal", { className, style }, [
      h(PanelHeader, rest, headerChildren),
      h("div.panel-content", null, children),
    ]),
    h("div.expander"),
  ]);
}

export interface ModalPanelProps {
  title: string | null;
  onClose: () => void;
  children?: React.ReactNode;
  headerChildren?: React.ReactNode;
  style?: object;
  minimal?: boolean;
  className?: string;
}

function ModalPanel(props: ModalPanelProps) {
  const {
    children,
    className,
    style,
    minimal = false,
    headerChildren = null,
    ...rest
  } = props;
  if (minimal) {
    return h(MinimalModalPanel, {
      ...rest,
      children,
      headerChildren,
      className,
      style,
    });
  }
  return h("div.panel-column", [
    h("div.panel-container", [
      h("div.panel-container-inner", [
        h("div.panel-outer", [
          h("div.panel", { className, style }, [
            h(PanelHeader, rest, headerChildren),
            h("div.panel-content", null, children),
          ]),
          h("div.expander"),
        ]),
      ]),
    ]),
  ]);
}

const ContentPanel = (props) => h("div.content-panel", props);

export * from "./draggable-overlay";
export { ModalPanel, PanelHeader, ContentPanel };
