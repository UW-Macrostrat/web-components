import h from "@macrostrat/hyper";
import {
  Feature,
  FeatureLayer,
  MapContext,
} from "@macrostrat/svg-map-components";
import { useAPIResult, useKeyHandler } from "@macrostrat/ui-components";
import chroma from "chroma-js";
import { ExtendedFeature, geoCentroid } from "d3-geo";
import { geoVoronoi } from "d3-geo-voronoi";
import { FeatureCollection, GeometryCollection, Polygon } from "geojson";
import { useContext, useEffect, useMemo } from "react";
import { feature } from "topojson-client";

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
    features: res.features.filter((d) => d.properties.unit_id != null),
  });
}

type ColumnProps = { col_id: number };

type ColumnFeature = ExtendedFeature<Polygon, ColumnProps>;

function processTopoJSON(res) {
  try {
    const { data } = res.success;
    const { features: f } = feature(data, data.objects.output) as any;
    return f;
  } catch (err) {
    console.error(err);
    return [];
  }
}
function ColumnFeatures(props) {
  const {
    features,
    onClick,
    color = "rgba(150,150,150, 1)",
    singleFeature = true,
  } = props;

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

function normalize(angle) {
  if (angle > Math.PI) {
    angle -= 2 * Math.PI;
  } else if (angle <= -Math.PI) {
    angle += 2 * Math.PI;
  }
  return angle;
}

function buildTriangulation(features) {
  console.log("Computing triangulation");
  const centroids = features.map(geoCentroid);
  const tri = geoVoronoi(centroids);
  return { centroids, tri };
}

function buildKeyMapping(neighbors, centroids, currentIndex, projection) {
  if (neighbors == null) return;

  const currentCentroid = projection(centroids[currentIndex]);

  let edgeAngles = neighbors.map((index) => {
    const centroid = projection(centroids[index]);
    const dx = centroid[0] - currentCentroid[0];
    const dy = centroid[1] - currentCentroid[1];
    return { col_index: index, angle: Math.atan2(dy, dx) };
  });

  edgeAngles.sort((d) => d.angle);

  function closestAngle(num) {
    // Find closest angle in array of neighbors
    let curr = edgeAngles[0];
    for (let next of edgeAngles) {
      if (
        Math.abs(normalize(num - next.angle)) <
        Math.abs(normalize(num - curr.angle))
      ) {
        curr = next;
      }
    }
    return curr.col_index;
  }

  return {
    37: closestAngle(Math.PI), // left
    38: closestAngle((3 * Math.PI) / 2), // up
    39: closestAngle(0), // right
    40: closestAngle(Math.PI / 2), // down
  };
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
      const { col_id } = features[nextColumnIx].properties;

      // @ts-ignore
      onChange({ col_id, ...projectArgs });
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

    //h(FeatureLayer, {features: tri.centers, useCanvas: false})
  ]);
}

function processGeoJSON(res) {
  return processGeoJSONBare(res?.success?.data);
}

function processGeoJSONBare(res) {
  return res?.features;
}

const processors = {
  topojson: processTopoJSON,
  geojson: processGeoJSON,
  geojson_bare: processGeoJSONBare,
};

function useColumnData({
  apiRoute = "/columns",
  status_code,
  project_id,
  format = "topojson",
}) {
  let all: boolean = undefined;
  if (status_code == null && project_id == null) {
    all = true;
  }

  const processor = processors[format];

  return useAPIResult(
    apiRoute,
    { format, all, status_code, project_id },
    processor
  );
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

  let features: any[] = useColumnData({
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
  processTopoJSON,
  ColumnCenters,
  ColumnFeatures,
  ColumnKeyboardNavigation,
  useColumnData,
};
