import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
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
  const inAccordion = useContext(AccordionContext);
  const headerRef = useRef<HTMLDivElement>(null);

  const onChange_ = () => {
    onChange();
    const opening = !isOpen;
    setOpen(opening);
    // In an accordion the header may be pinned at the bottom edge, where
    // expanding it would reveal its content below the fold — so bring the
    // section to its resting place at the top of the stack.
    if (opening && inAccordion) {
      revealSection(headerRef);
    }
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
          elementRef: headerRef,
          onChange: onChange_,
          expanded: isOpen,
          title,
          titleComponent,
        },
        [_helpText, sideComponent],
      ),
      h(
        Collapse as any,
        { isOpen, transitionDuration: collapseDuration },
        h("div.expansion-panel-content", children),
      ),
    ],
  );
}

/** A stack of `ExpansionPanel`s whose headers stay on screen: each pins to the
 * top of the scrolling container once its section has scrolled past, and to
 * the bottom until its section is reached. Opening a section scrolls it up to
 * the top of the stack. Pass the panels as direct children.
 */
export function ExpansionPanelAccordion({ className, children }) {
  return h(
    AccordionContext.Provider,
    { value: true },
    h("div.expansion-panel-accordion", { className }, children),
  );
}

/** Whether the enclosing panels are stacked as an accordion, which is what
 * makes opening one scroll it into place. */
const AccordionContext = createContext(false);

/** Matches the CSS transition Blueprint's `Collapse` uses, so the scroll can
 * wait for the section to finish opening. */
const collapseDuration = 200;

/** Scroll a section's header to the top of the accordion. `scroll-margin-top`
 * on the header is what keeps it clear of the headers already pinned there.
 *
 * The section animates open, so the scroller is not at its full height yet and
 * a scroll now stops short of the mark; move with the expansion, then again
 * once there is room to finish. */
function revealSection(headerRef: RefObject<HTMLElement | null>) {
  const scroll = () => {
    headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  scroll();
  setTimeout(scroll, collapseDuration);
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
    elementRef = null,
  } = props;

  let titleElement = null;
  if (title) {
    titleElement = h(titleComponent, { className: "title" }, title);
  }

  const icon = expanded ? "chevron-up" : "chevron-down";
  return h(
    "div.panel-subhead.expansion-panel-header",
    {
      ref: elementRef,
      className,
      onClick: onChange,
    },
    [
      titleElement,
      children,
      h(Button, {
        icon,
        className: "expansion-panel-toggle",
        minimal: true,
      }),
    ],
  );
}

export function ExpandableDetailsPanel(props) {
  let {
    title,
    children,
    value,
    headerElement,
    className,
    bodyClassName,
    expanded = false,
    setExpanded,
  } = props;
  const [isOpen, _setExpanded] = useState(expanded);
  const setIsOpen = setExpanded ?? _setExpanded;

  useEffect(() => {
    /** Sync provided props and state */
    if (expanded !== undefined) {
      setIsOpen(expanded);
    }
  }, [expanded]);

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
