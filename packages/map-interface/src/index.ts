import hyper from "@macrostrat/hyper";
import { HTMLDivProps } from "@blueprintjs/core";
import styles from "./main.module.sass";
import classNames from "classnames";
import { useTransition } from "transition-hook";
import { MapboxMapProvider, ZoomControl } from "@macrostrat/mapbox-react";
import { ToasterContext } from "@macrostrat/ui-components";
import { MapBottomControls } from "./controls";
import { mapViewInfo, MapPosition } from "@macrostrat/mapbox-utils";

import { ReactNode } from "react";

export * from "./location-panel";
export * from "./context-panel";
export * from "./styles";

export function MapInterface() {
  return h("div", "Hello world");
}

const h = hyper.styled(styles);

type AnyElement = React.ReactNode | React.ReactElement | React.ReactFragment;

export function MapAreaContainer({
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
  mapPosition = null,
  ...rest
}: {
  navbar: AnyElement;
  children?: AnyElement;
  mapControls?: AnyElement;
  contextPanel?: AnyElement;
  mainPanel?: AnyElement;
  detailPanel?: AnyElement;
  bottomPanel?: AnyElement;
  className?: string;
  detailPanelOpen?: boolean;
  contextPanelOpen?: boolean;
  contextStackProps?: HTMLDivProps;
  detailStackProps?: HTMLDivProps;
  mapPosition?: MapPosition;
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
  const _className = classNames(
    {
      searching: false,
      "detail-panel-open": _detailPanelOpen,
      "map-context-open": _detailPanelOpen,
    },
    `context-panel-${contextPanelTrans.stage}`,
    `map-context-${contextPanelTrans.stage}`,
    `detail-panel-${detailPanelTrans.stage}`,
    `map-detail-${detailPanelTrans.stage}`
  );

  return h(
    ToasterContext,
    h(MapboxMapProvider, [
      h(
        MapStyledContainer,
        { className: classNames("map-page", className), mapPosition },
        [
          h("div.main-ui", { className: _className, ...rest }, [
            h("div.context-stack", contextStackProps, [
              navbar,
              h.if(contextPanelTrans.shouldMount)([contextPanel]),
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
      ),
    ])
  );
}

interface MapContainerProps {
  className?: string;
  mapPosition?: MapPosition;
  children?: ReactNode;
}

export function MapStyledContainer({
  className,
  mapPosition,
  children,
}: MapContainerProps) {
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

export * from "./map-view";
//const _MapPage = compose(HotkeysProvider, MapPage);
