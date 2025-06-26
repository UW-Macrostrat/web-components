import { Component, ReactNode } from "react";
import h, { classed } from "@macrostrat/hyper";
import { Button, Collapse } from "@blueprintjs/core";

const HeaderButton = classed(Button, "ms-header-button");

type CollapsePanelProps = {
  storageID?: string;
  title: string;
  headerRight: ReactNode;
  children?: ReactNode;
};

type CollapsePanelState = {
  isOpen: boolean;
};

export class CollapsePanel extends Component<
  CollapsePanelProps,
  CollapsePanelState
> {
  static defaultProps = {
    title: "Panel",
    // `storageID` prop allows storage of state in
    // localStorage or equivalent.
    storageID: null,
  };

  constructor(props: CollapsePanelProps) {
    super(props);
    this.state = { isOpen: false };
  }

  componentWillMount() {
    // Set open state from local storage if it is available
    const { storageID } = this.props;
    if (storageID == null) {
      return;
    }
    const isOpen = this.savedState()[storageID];
    if (isOpen == null) {
      return;
    }
    return this.setState({ isOpen });
  }

  /*
  Next functions are for state management
  across pages, if storageID prop is passed
  */
  savedState() {
    try {
      const st = window.localStorage.getItem("collapse-panel-state");
      return JSON.parse(st) || {};
    } catch (error) {
      return {};
    }
  }

  checkLocalStorage() {
    // Set open state from local storage if it is available
    const { storageID } = this.props;
    if (storageID == null) {
      return;
    }
    let isOpen = this.savedState()[storageID] || null;
    if (isOpen == null) {
      isOpen = false;
    }
    return this.setState({ isOpen });
  }

  componentDidUpdate(
    prevProps: CollapsePanelProps,
    prevState: CollapsePanelState,
  ) {
    // Refresh object in local storage
    const { storageID } = this.props;
    if (storageID == null) {
      return;
    }
    const { isOpen } = this.state;
    if (isOpen === prevState.isOpen) {
      return;
    }
    const s = this.savedState();
    s[storageID] = isOpen;
    const j = JSON.stringify(s);
    return window.localStorage.setItem("collapse-panel-state", j);
  }

  render() {
    let { title, children, storageID, headerRight, ...props } = this.props;
    const { isOpen } = this.state;

    const icon = isOpen ? "collapse-all" : "expand-all";
    const onClick = () => this.setState({ isOpen: !isOpen });

    if (headerRight == null) {
      headerRight = null;
    }

    return h("div.collapse-panel", props, [
      h("div.panel-header", [
        h(HeaderButton, { icon, minimal: true, onClick, fill: true }, [
          h("h2", title),
          h("span.expander"),
        ]),
        headerRight,
      ]),
      h(Collapse, { isOpen }, children),
    ]);
  }
}
