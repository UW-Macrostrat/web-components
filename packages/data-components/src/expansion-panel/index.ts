import { useState } from "react";
import { Collapse, Button } from "@blueprintjs/core";
import h from "./main.module.sass";
import classNames from "classnames";

export function ExpansionPanel(props) {
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

  let _helpText = null;
  if (helpText) {
    _helpText = h("div.expansion-panel-subtext", helpText);
  }

  return h(
    "div.expansion-panel",
    {
      className: classNames(className, {
        expanded: isOpen,
        collapsed: !isOpen,
      }),
    },
    [
      h(
        ExpansionPanelHeader,
        {
          onChange: onChange_,
          expanded: isOpen,
          title,
          titleComponent,
        },
        [_helpText, sideComponent],
      ),
      h(
        Collapse as any,
        { isOpen },
        h("div.expansion-panel-content", children),
      ),
    ],
  );
}

export function SubExpansionPanel(props) {
  return h(ExpansionPanel, {
    ...props,
    className: "expansion-panel sub-expansion-panel",
    titleComponent: "h4",
  });
}

export function ExpansionPanelHeader(props) {
  const {
    expanded,
    children,
    onChange,
    className,
    title,
    titleComponent = "h3",
  } = props;
  const icon = expanded ? "chevron-up" : "chevron-down";
  return h(
    PanelSubhead,
    {
      className: classNames("expansion-panel-header", className),
      onClick: onChange,
      title,
      component: titleComponent,
    },
    [
      children,
      h(Button, {
        icon,
        className: "expansion-panel-toggle",
        minimal: true,
      }),
    ],
  );
}

export function PanelSubhead(props) {
  const { title, component = "h3", children, ...rest } = props;
  return h("div.panel-subhead", rest, [
    h(
      component,
      {
        className: "title",
      },
      title,
    ),
    children,
  ]);
}

export function ExpandableDetailsPanel(props) {
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
      { isOpen, className: "expandable-details-collapse" },
      h("div.expansion-body", { className: bodyClassName }, children),
    ),
  ]);
}
