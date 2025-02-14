import { useState } from "react";
import h from "@macrostrat/hyper";
import { Globe } from "@macrostrat/svg-map-components";
import { Button } from "@blueprintjs/core";
import { geoCentroid } from "d3-geo";
import { LandLayer } from "@macrostrat/svg-map-components";
import { Columns, CurrentColumn } from "./layers";
import classNames from "classnames";
import { useSpring, animated } from "react-spring";

const AnimatedGlobe = animated(Globe);

const MapViewFrame = (props) => {
  const [expanded, setExpanded] = useState(false);
  const className = classNames({ expanded }, "context-map");
  const { children, center, margin = 10 } = props;
  const baseSize = 250;
  const sz = expanded ? 450 : baseSize;

  let scale = sz / 2 - margin;
  if (expanded) {
    scale *= 3;
  }

  const targetProps = {
    width: sz,
    height: sz,
    scale,
  };

  const animationProps = useSpring(targetProps);

  return h(
    "div.map-placeholder",
    { style: { width: baseSize, height: baseSize } },
    [
      h(animated.div, { className, style: animationProps }, [
        h(
          AnimatedGlobe,
          {
            ...targetProps,
            margin,
            center,
            allowDrag: expanded,
            allowZoom: false,
            keepNorthUp: true,
            onClick() {
              setExpanded(true);
            },
          },
          [h(LandLayer), children]
        ),
        h.if(expanded)(Button, {
          className: "close-button",
          icon: "cross",
          minimal: true,
          onClick() {
            setExpanded(false);
          },
          intent: "danger",
        }),
      ]),
    ]
  );
};

export const AnimatedMapView = (props) => {
  const { currentColumn, setCurrentColumn, children, ...rest } = props;
  const center = geoCentroid(currentColumn);

  return h(MapViewFrame, { center, ...rest }, [
    h(Columns, { onClick: setCurrentColumn, ...rest }),
    children,
    h.if(currentColumn != null)(CurrentColumn, {
      feature: currentColumn,
    }),
  ]);
};
