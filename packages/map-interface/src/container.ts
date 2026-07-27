import classNames from "classnames";
import { useTransition } from "transition-hook";
import { addClassNames } from "@macrostrat/hyper";
import { HTMLDivProps, Card } from "@blueprintjs/core";
import {
  MapboxMapProvider,
  ZoomControl,
  useMapPosition,
} from "@macrostrat/mapbox-react";
import { ToasterContext } from "@macrostrat/ui-components";
import { mapViewInfo } from "@macrostrat/mapbox-utils";
import { ReactNode } from "react";
import h from "./main.module.sass";
import { MapBottomControls } from "./controls";

type AnyElement = React.ReactNode | React.ReactElement | React.ReactFragment;

export const PanelCard = (props) =>
  h(Card, { ...props, className: classNames("panel-card", props.className) });

interface ContextStackProps extends HTMLDivProps {
  adaptiveWidth: boolean;
  navbar: AnyElement;
}

export enum DetailPanelStyle {
  FIXED = "fixed",
  FLOATING = "floating",
}

export const MapAreaContainer = (props) =>
  h(MapProviders, h(_MapAreaContainer, props));

interface MapAreaContainerProps {
  navbar: AnyElement;
  children?: AnyElement;
  mapControls?: AnyElement;
  contextPanel?: AnyElement;
  contextStack?: AnyElement;
  mainPanel?: AnyElement;
  detailPanel?: AnyElement;
  bottomPanel?: AnyElement;
  className?: string;
  detailPanelOpen?: boolean;
  contextPanelOpen?: boolean;
  contextStackProps?: ContextStackProps | null;
  detailStackProps?: HTMLDivProps | null;
  detailPanelStyle: DetailPanelStyle;
  fitViewport?: boolean;
  showPanelOutlines?: boolean;
  preventMapInteraction?: boolean;
}

function _MapAreaContainer({
  children,
  className,
  navbar,
  contextPanel = null,
  detailPanel = null,
  detailPanelOpen,
  contextPanelOpen = true,
  bottomPanel = null,
  mainPanel,
  mapControls = h(MapBottomControls),
  contextStackProps = null,
  detailStackProps = null,
  detailPanelStyle = DetailPanelStyle.FLOATING,
  fitViewport = true,
  showPanelOutlines = false,
  preventMapInteraction = false,
  ...rest
}: MapAreaContainerProps) {
  const _detailPanelOpen = detailPanelOpen ?? detailPanel != null;
  const contextPanelTrans = useTransition(contextPanelOpen, 800);
  const detailPanelTrans = useTransition(_detailPanelOpen, 800);

  /*- We apply a custom style to the panel container when we are interacting
      with the search bar, so that we can block map interactions until search
      bar focus is lost.
    - We also apply a custom style when the infodrawer is open so we can hide
      the search bar on mobile platforms
    - These styles are doubly applied so we can have both namespaced and
      outside-accessible styles for each case.
  */
  const mainUIClassNames = classNames(
    "map-container",
    className,
    `detail-panel-${detailPanelStyle}`,
    `context-panel-${contextPanelTrans.stage}`,
    `map-context-${contextPanelTrans.stage}`,
    `detail-panel-${detailPanelTrans.stage}`,
    `map-detail-${detailPanelTrans.stage}`,
    {
      "detail-panel-open": _detailPanelOpen,
      "map-context-open": contextPanelOpen,
      "show-panel-outlines": showPanelOutlines,
      "fit-viewport": fitViewport,
    },
  );

  const mapControlsExt = h([
    h(ZoomControl, { className: "zoom-control" }),
    h("div.spacer"),
    mapControls,
  ]);

  const detailStackExt = h(
    "div.detail-stack.infodrawer-container",
    detailStackProps,
    [
      h("div.detail-panel-holder", null, detailPanel),
      h.if(detailPanelStyle == DetailPanelStyle.FLOATING)([mapControlsExt]),
    ],
  );

  let contextStack: ReactNode | null = null;
  if (navbar != null || contextPanel != null) {
    contextStack = h(ContextStack, { navbar, ...contextStackProps }, [
      h.if(contextPanelTrans.shouldMount)([contextPanel]),
    ]);
  }

  return h(MapStyledContainer, { className: mainUIClassNames }, [
    h("div.main-row", [
      h("div.map-ui", { ...rest }, [
        contextStack,
        children ?? mainPanel,
        h.if(detailPanelStyle == DetailPanelStyle.FLOATING)([detailStackExt]),
        h.if(detailPanelStyle == DetailPanelStyle.FIXED)(
          "div.map-control-stack",
          mapControlsExt,
        ),
      ]),
      h.if(detailPanelStyle == DetailPanelStyle.FIXED)([detailStackExt]),
    ]),
    h("div.bottom", null, bottomPanel),
  ]);
}

function ContextStack(props: ContextStackProps) {
  const { adaptiveWidth, navbar, children, ...rest } = props;
  const props1 = addClassNames(rest, { "adaptive-width": adaptiveWidth });
  return h("div.context-stack", props1, [
    h("div.navbar-holder", navbar),
    h("div.context-panel-holder", null, children),
    h("div.spacer"),
  ]);
}

const MapProviders = ({ children }) =>
  h(ToasterContext, h(MapboxMapProvider, children));

interface MapContainerProps {
  className?: string;
  children?: ReactNode;
}

export function MapStyledContainer({ className, children }: MapContainerProps) {
  const mapPosition = useMapPosition();
  if (mapPosition != null) {
    const { mapIsRotated, mapUse3D, mapIsGlobal } = mapViewInfo(mapPosition);
    className = classNames(className, {
      "map-is-rotated": mapIsRotated,
      "map-3d-available": mapUse3D,
      "map-is-global": mapIsGlobal,
    });
  }

  return h("div", { className }, children);
}

//const _MapPage = compose(HotkeysProvider, MapPage);
