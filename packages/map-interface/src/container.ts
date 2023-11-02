import hyper from "@macrostrat/hyper";
import { HTMLDivProps } from "@blueprintjs/core";
import styles from "./main.module.sass";
import classNames from "classnames";
import { useTransition } from "transition-hook";
import {
  MapboxMapProvider,
  ZoomControl,
  useMapPosition,
} from "@macrostrat/mapbox-react";
import { ToasterContext } from "@macrostrat/ui-components";
import { MapBottomControls } from "./controls";
import { mapViewInfo, MapPosition } from "@macrostrat/mapbox-utils";
import { Card } from "@blueprintjs/core";

import { ReactNode } from "react";

const h = hyper.styled(styles);

type AnyElement = React.ReactNode | React.ReactElement | React.ReactFragment;

export const PanelCard = (props) =>
  h(Card, { ...props, className: classNames("panel-card", props.className) });

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
  fitViewport = true,
  showPanelOutlines = false,
  ...rest
}: {
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
  contextStackProps?: HTMLDivProps;
  detailStackProps?: HTMLDivProps;
  fitViewport?: boolean;
  showPanelOutlines?: boolean;
}) {
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
  const mainUIClassName = classNames(
    {
      "detail-panel-open": _detailPanelOpen,
      "map-context-open": contextPanelOpen,
    },
    `context-panel-${contextPanelTrans.stage}`,
    `map-context-${contextPanelTrans.stage}`,
    `detail-panel-${detailPanelTrans.stage}`,
    `map-detail-${detailPanelTrans.stage}`
  );

  return h(
    MapStyledContainer,
    {
      className: classNames("map-page", className, {
        "show-panel-outlines": showPanelOutlines,
        "fit-viewport": fitViewport,
      }),
    },
    [
      h("div.main-ui", { className: mainUIClassName, ...rest }, [
        h("div.context-stack", [
          navbar,
          h("div.context-panel-holder", [
            h.if(contextPanelTrans.shouldMount)([contextPanel]),
          ]),
          h("div.spacer"),
        ]),
        //h(MapView),
        children ?? mainPanel,
        h("div.detail-stack.infodrawer-container", detailStackProps, [
          detailPanel,
          h(ZoomControl, { className: "zoom-control" }),
          h("div.spacer"),
          mapControls,
        ]),
      ]),
      h("div.bottom", null, bottomPanel),
    ]
  );
}

const MapProviders = ({ children }) =>
  h(ToasterContext, h(MapboxMapProvider, children));

export const MapAreaContainer = (props) =>
  h(MapProviders, h(_MapAreaContainer, props));

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
