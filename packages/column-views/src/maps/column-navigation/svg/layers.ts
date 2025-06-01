import h from "@macrostrat/hyper";
import {
  Feature,
  FeatureLayer,
  MapContext,
} from "@macrostrat/svg-map-components";
import { useAPIResult, useKeyHandler } from "@macrostrat/ui-components";
import chroma from "chroma-js";
import { ExtendedFeature } from "d3-geo";
import { Polygon } from "geojson";
import { useContext, useMemo } from "react";
import { useColumnFeatures } from "../../../data-provider";
import {
  buildKeyMapping,
  buildTriangulation,
} from "../utils/keyboard-navigation";

const defaultStyle = {
  fill: "rgb(239, 180, 249)",
  stroke: "magenta",
};

export function MeasurementsLayer(props) {
  const { style = defaultStyle, ...params } = props;
  const res: any = useAPIResult("/measurements", {
    ...params,
    format: "geojson",
    response: "light",
  });
  if (res == null) return null;

  return h(FeatureLayer, {
    useCanvas: false,
    style,
    features: res?.features.filter((d) => d.properties.unit_id != null) ?? [],
  });
}

type ColumnProps = { col_id: number };

type ColumnFeature = ExtendedFeature<Polygon, ColumnProps>;

function ColumnFeatures(props) {
  const {
    features,
    onClick,
    color = "rgba(150,150,150, 1)",
    singleFeature = true,
  } = props;

  console.log(features);

  const c = chroma(color);

  return h(
    FeatureLayer,
    {
      className: "columns",
      useCanvas: onClick == null,
      style: {
        fill: c.alpha(0.2).css(),
        stroke: c.alpha(0.4).css(),
      },
    },
    features.map((f) => {
      return h(Feature, {
        id: f.id ?? f.properties.col_id,
        onClick,
        feature: f,
      });
    })
  );
}

enum MacrostratStatusCode {
  InProcess = "in process",
}

interface ColumnNavProps {
  col_id: number;
  status_code?: MacrostratStatusCode;
  project_id?: number;
  onChange(col_id: number): void;
}

interface KeyboardNavProps extends ColumnNavProps {
  features: ColumnFeature[];
  showLayers: boolean;
}

function ColumnKeyboardNavigation(props: KeyboardNavProps) {
  /** Keyboard navigation of columns using a Delaunay triangulation */
  const {
    features = [],
    col_id = null,
    onChange,
    showLayers = false,
    ...projectArgs
  } = props;
  const { projection } = useContext(MapContext);
  const { centroids, tri } = useMemo(
    () => buildTriangulation(features),
    [features]
  );

  const currentIndex = useMemo(() => {
    return features.findIndex((d) => d.properties.col_id == col_id);
  }, [features, col_id]);

  const neighbors = tri.delaunay.neighbors[currentIndex];

  const keyMapping = useMemo(() => {
    return buildKeyMapping(neighbors, centroids, currentIndex, projection);
  }, [neighbors, currentIndex]);

  useKeyHandler(
    (event) => {
      const nextColumnIx = keyMapping[event.keyCode];
      if (nextColumnIx == null) return;
      // @ts-ignore
      onChange(features[nextColumnIx]);
    },
    [keyMapping]
  );

  if (neighbors == null) return null;
  const neighborFeatures = neighbors.map((d) => features[d]);

  return h.if(showLayers)([
    h(FeatureLayer, {
      features: tri.links().features,
      useCanvas: false,
      style: {
        stroke: "purple",
        fill: "transparent",
      },
    }),
    h(FeatureLayer, {
      features: neighborFeatures,
      useCanvas: false,
      style: {
        stroke: "rgb(93, 101, 212)",
        strokeWidth: 3,
        fill: "rgba(93, 101, 212, 0.5)",
      },
    }),
    h(FeatureLayer, {
      features: [
        {
          type: "Feature",
          geometry: {
            type: "MultiPoint",
            coordinates: centroids,
          },
        },
      ],
      useCanvas: false,
      style: {
        r: 1,
        fill: "purple",
      },
    }),
  ]);
}

interface ColumnExtraInfo {
  apiRoute?: string;
  color?: string;
  filterColumns?(d: ColumnFeature): boolean;
  showDebugLayers?: boolean;
  format?: "topojson" | "geojson";
}

const Columns = (props: ColumnNavProps & ColumnExtraInfo) => {
  const {
    apiRoute = "/columns",
    onChange,
    col_id = null,
    status_code,
    project_id,
    color,
    filterColumns,
    showDebugLayers = false,
    format = "topojson",
  } = props;

  let features: any[] = useColumnFeatures({
    apiRoute,
    status_code,
    project_id,
    format,
  }) as any;

  if (features == null) return null;

  if (filterColumns != null) {
    features = features.filter(filterColumns);
  }

  return h([
    h(ColumnKeyboardNavigation, {
      features,
      col_id,
      onChange,
      status_code,
      project_id,
      showLayers: showDebugLayers,
    }),
    h(ColumnFeatures, { features, onClick: onChange, color }),
  ]);
};

const ColumnCenters = (props: ColumnNavProps) => {
  return h(Columns, { apiRoute: "/defs/columns", ...props });
};

const CurrentColumn = (props) => {
  const { feature } = props;
  return h(FeatureLayer, {
    features: [feature],
    style: {
      fill: "rgba(255,0,0,0.4)",
      stroke: "rgba(255,0,0,0.6)",
      strokeWidth: 2,
    },
  });
};

export {
  Columns,
  CurrentColumn,
  ColumnCenters,
  ColumnFeatures,
  ColumnKeyboardNavigation,
};
