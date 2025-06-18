import { useContext } from "react";
import h from "@macrostrat/hyper";
import { MapContext } from "./context";
import { CanvasLayer, MapCanvasContext } from "./canvas-layer";
import { geoPath } from "d3-geo";

export interface IFeature {
  id: number | string;
  geometry: object;
  properties?: object;
}

interface IFeatureProps {
  feature: IFeature;
  onClick(feature: IFeature): void;
  pointRadius?: number;
  [key: string]: any;
}

function CanvasFeature({ geometry, style, pointRadius = 2 }) {
  const { projection } = useContext(MapContext);
  const { context } = useContext(MapCanvasContext);
  if (context != null) {
    if (style?.fill != null) {
      context.fillColor = style.fill;
    }
    if (style?.stroke != null) {
      context.strokeColor = style.stroke;
    }
    const pathRenderer = geoPath(projection, context).pointRadius(pointRadius);

    pathRenderer(geometry);
  }
  return null;
}

function Feature(props: IFeatureProps) {
  const { feature, pointRadius = 2, onClick, id: _id, style, ...rest } = props;
  const { inCanvas } = useContext(MapCanvasContext);
  const { geometry, properties } = feature;
  const id = _id ?? feature.id;
  const { projection, renderPath } = useContext(MapContext);
  //const renderPath = geoPath(projection);

  let pathRenderer = renderPath;
  if ("pointRadius" in renderPath) {
    try {
      pathRenderer = renderPath.pointRadius(pointRadius);
    } catch (err) {
      console.error(err);
    }
  }

  if (inCanvas) {
    return h(CanvasFeature, { geometry, style, pointRadius });
  } else {
    const d = pathRenderer(geometry as any);
    return h("path.feature", {
      className: `feature-${id}`,
      style,
      ...rest,
      d,
      onClick: () => {
        if (onClick == null) return;
        return onClick(feature);
      },
    });
  }
}

type IFeatureLayerProps = React.PropsWithChildren<{
  geometry?: object;
  features?: IFeature[];
  useCanvas?: boolean;
  [k: string]: any;
}>;

const FeatureLayer = (props: IFeatureLayerProps) => {
  const { useCanvas, features, geometry, children, ...rest } = props;

  let newChildren = null;
  if (features != null) {
    newChildren = features.map((feature, i) => h(Feature, { feature, key: i }));
  } else if (geometry != null) {
    newChildren = h(Feature, { feature: { id: 0, geometry } });
  }

  console.log(newChildren)

  const el = useCanvas ? CanvasLayer : "g";

  return h(el, rest, [children, newChildren]);
};

FeatureLayer.defaultProps = {
  useCanvas: false,
};

export { FeatureLayer, Feature };
