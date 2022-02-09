import {
  Navbar,
  Button,
  ButtonGroup,
  NavbarGroup,
  Alignment,
  Intent,
  Position,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.styl";
import { useReducer, useEffect } from "react";
import useElementDimensions from "use-element-dimensions";
import { useContext, createContext } from "react";
import { identity } from "fp-ts/lib/function";
import classNames from "classnames";
const h = hyper.styled(styles);

interface ThreeColumnLayoutProps {
  contextPanel: React.ReactNode;
  children: React.ReactNode;
  detailPanel: React.ReactNode;
  footer?: React.ReactNode;
  panelState: {
    [key in SidePanel]?: boolean;
  };
  title?: string;
  twoPanelBreakpoint?: number;
  preferredMainWidth?: number;
  expandedContext?: boolean;
  contextButtonPlacement?: "left" | "right";
}

enum SidePanel {
  Context = "context",
  Detail = "detail",
}

type PanelState = {
  [key in SidePanel]: boolean;
};
interface LayoutState {
  panelState: PanelState;
  keyPanel: SidePanel | null;
  isReduced: boolean;
}

type LayoutAction =
  | { type: "toggle-panel"; panel: SidePanel }
  | { type: "show-panel"; panel: SidePanel; shouldShow: boolean }
  | { type: "set-is-reduced"; value: boolean };

function openPanels(panelState: PanelState): Set<SidePanel> {
  const keys = Object.keys(panelState) as SidePanel[];
  return new Set(keys.filter((k) => panelState[k]));
}

const LayoutDispatchContext =
  createContext<React.Dispatch<LayoutAction>>(identity);

function useLayoutDispatch() {
  return useContext(LayoutDispatchContext);
}

function layoutReducer(state: LayoutState, action: LayoutAction) {
  let panel: SidePanel;
  let shouldShow: boolean;
  switch (action.type) {
    case "set-is-reduced":
      return { ...state, isReduced: action.value };
    case "show-panel":
      shouldShow = action.shouldShow;
    case "toggle-panel":
      panel = action.panel;
      shouldShow ??= !state.panelState[panel];
      const panelState = {
        ...state.panelState,
        [panel]: shouldShow,
      };
      let keyPanel = state.keyPanel;
      if (shouldShow) {
        keyPanel = panel;
      } else if (state.keyPanel == panel) {
        keyPanel = null;
      }
      const currentPanels = openPanels(panelState);
      if (currentPanels.size == 1) {
        keyPanel = currentPanels.values().next().value;
      }
      return { ...state, panelState, keyPanel };
  }
}

function buttonProps(
  panel: SidePanel,
  desiredState: PanelState,
  actualState: PanelState,
  dispatch: React.Dispatch<LayoutAction>
) {
  const active = desiredState[panel];
  const isActuallyShown = active && active == actualState[panel];
  return {
    active,
    minimal: true,
    intent: isActuallyShown ? Intent.PRIMARY : null,
    onClick() {
      dispatch({ type: "show-panel", panel, shouldShow: !isActuallyShown });
    },
  };
}

function ThreeColumnLayout(props: ThreeColumnLayoutProps) {
  const {
    contextPanel,
    detailPanel,
    title = "User interface",
    children,
    footer,
    panelState = {},
    twoPanelBreakpoint = 800,
    preferredMainWidth,
    expandedContext = false,
    contextButtonPlacement = Position.LEFT,
    ...rest
  } = props;

  let keyPanel = null;
  if (panelState.detail) {
    keyPanel = SidePanel.Detail;
  } else if (panelState.context) {
    keyPanel = SidePanel.Context;
  }

  const [layoutState, dispatch] = useReducer(
    layoutReducer,
    {
      panelState: { context: true, ...panelState },
      keyPanel,
      isReduced: false,
    },
    undefined
  );

  const [size, ref] = useElementDimensions();
  const [mainSize, mainRef] = useElementDimensions();

  const panelDesiredState = { ...layoutState.panelState, ...panelState };

  let panelActualState = { ...panelDesiredState };
  const nonKeyPanel =
    layoutState.keyPanel == SidePanel.Context
      ? SidePanel.Detail
      : SidePanel.Context;

  // We'd like the main panel to take up at least half the screen width
  const preferredMainPanelWidth =
    preferredMainWidth ??
    Math.max((size?.width ?? 0) * 0.5, twoPanelBreakpoint * 0.66);

  if (layoutState.isReduced) {
    panelActualState[nonKeyPanel] = false;
  }

  if (expandedContext) {
    panelActualState[SidePanel.Context] = true;
    panelActualState[SidePanel.Detail] = false;
  }

  useEffect(() => {
    if (openPanels(panelActualState).size <= 1) {
      return;
    }
    // Decide whether we need to reduce the layout ONLY when both panels are open
    const shouldReduce = mainSize?.width < preferredMainPanelWidth;
    dispatch({ type: "set-is-reduced", value: shouldReduce });
  }, [mainSize]);

  const contextButton = h.if(contextPanel != null)(Button, {
    icon: "projects",
    ...buttonProps(
      SidePanel.Context,
      panelDesiredState,
      panelActualState,
      dispatch
    ),
  });

  return h(
    LayoutDispatchContext.Provider,
    { value: dispatch },
    h(
      "div.user-interface",
      {
        ref,
        ...rest,
      },
      [
        h(Navbar, [
          h(Navbar.Group, [
            h.if(contextButtonPlacement == "left")([
              contextButton,
              h("div.spacer"),
            ]),
            h(Navbar.Heading, null, title),
          ]),
          h(NavbarGroup, { align: Alignment.RIGHT }, [
            h("div.spacer"),
            h(ButtonGroup, { minimal: true }, [
              h.if(contextButtonPlacement == "right")([contextButton]),
              h.if(detailPanel != null)(Button, {
                icon: "properties",
                ...buttonProps(
                  SidePanel.Detail,
                  panelDesiredState,
                  panelActualState,
                  dispatch
                ),
              }),
            ]),
          ]),
        ]),
        h("div.three-column", [
          h.if(contextPanel != null && panelActualState.context)(
            "div.column.context-column",
            { className: classNames({ expanded: expandedContext ?? false }) },
            contextPanel
          ),
          h.if(children != null)(
            "div.column.main-column",
            { ref: mainRef },
            children
          ),
          h.if(detailPanel != null && panelActualState.detail)(
            "div.column.detail-column",
            null,
            detailPanel
          ),
        ]),
        h.if(footer != null)("footer", null, footer),
      ]
    )
  );
}

ThreeColumnLayout.Panels = SidePanel;

export { ThreeColumnLayout, ThreeColumnLayoutProps, useLayoutDispatch };
