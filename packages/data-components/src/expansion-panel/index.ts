import { useState } from "react";
import { Collapse, Icon, Button } from "@blueprintjs/core";
import h from "./main.module.sass";
import classNames from "classnames";
import { PanelSubhead } from "./headers";

function ExpansionPanelSummary(props) {
  const { expanded, children, onChange, className, title, titleComponent } =
    props;
  const icon = expanded ? "chevron-up" : "chevron-down";
  return h(
    PanelSubhead,
    {
      className: classNames("expansion-panel-header", className),
      onClick: onChange,
      title,
      component: titleComponent,
    },
    [children, h(Icon, { icon, className: "expansion-panel-icon" })],
  );
}

function ExpansionPanelBase(props) {
  let {
    title,
    titleComponent = "h3",
    children,
    expanded,
    helpText,
    onChange = () => {},
    sideComponent = null,
    className,
  } = props;
  const [isOpen, setOpen] = useState(expanded || false);

  const onChange_ = () => {
    onChange();
    setOpen(!isOpen);
  };

  return h(
    "div.expansion-panel-base",
    {
      className: classNames(className, {
        expanded: isOpen,
        collapsed: !isOpen,
      }),
    },
    [
      h(
        ExpansionPanelSummary,
        {
          onChange: onChange_,
          expanded: isOpen,
          title,
          titleComponent,
        },
        h("div.expansion-summary-title-help", [
          h("span.expansion-panel-subtext", helpText),
          " ",
          sideComponent,
        ]),
      ),
      h(Collapse, { isOpen }, h("div.expansion-children", null, children)),
    ],
  );
}

export function InfoPanelSection(props) {
  let { title, children, className, headerElement = null } = props;
  return h("div.info-panel-section", { className }, [
    h("div.panel-subhead", null, headerElement ?? h("h3", title)),
    h("div.panel-content", null, children),
  ]);
}

function ExpansionPanel(props) {
  return h(ExpansionPanelBase, {
    ...props,
    className: "expansion-panel",
  });
}

function SubExpansionPanel(props) {
  return h(ExpansionPanelBase, {
    ...props,
    className: "expansion-panel sub-expansion-panel",
    titleComponent: "h4",
  });
}

function ExpandableDetailsPanel(props) {
  let { title, children, value, headerElement, className, bodyClassName } =
    props;
  const [isOpen, setIsOpen] = useState(false);
  headerElement ??= h([h("div.title", title), value]);
  return h("div.expandable-details", { className }, [
    h("div.expandable-details-main", [
      headerElement,
      h("div.expandable-details-toggle", [
        h(Button, {
          small: true,
          minimal: true,
          active: isOpen,
          onClick: () => setIsOpen(!isOpen),
          icon: "more",
        }),
      ]),
    ]),
    h(
      Collapse as any,
      { isOpen },
      h("div.expansion-body", { className: bodyClassName }, children),
    ),
  ]);
}

export {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpandableDetailsPanel,
  SubExpansionPanel,
  PanelSubhead,
};
