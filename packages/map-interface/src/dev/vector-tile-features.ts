import { Spinner, Switch, Button, Intent } from "@blueprintjs/core";
import { useMapRef, useMapStatus } from "@macrostrat/mapbox-react";
import mapboxgl from "mapbox-gl";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { useCallback, useEffect, useRef, useState } from "react";
import { JSONView } from "@macrostrat/ui-components";
import { group } from "d3-array";
import { ExpansionPanel } from "../expansion-panel";

const h = hyper.styled(styles);

export function FeatureProperties({ data, ...rest }) {
  // Instead of managing hover state with CSS, we use a state variable,
  // so that the button re-renders when the state changes
  const [showControls, setShowControls] = useState(false);
  const onMouseEnter = useCallback(() => setShowControls(true), []);
  const onMouseLeave = useCallback(() => setShowControls(false), []);

  return h("div.feature-properties", { onMouseEnter, onMouseLeave }, [
    h.if(showControls)("div.controls", h(CopyJSONButton, { data })),
    h(JSONView, {
      data,
      hideRoot: true,
      ...rest,
    }),
  ]);
}

export function FeatureRecord({ feature }) {
  const props = feature.properties;
  return h("div.feature-record", [
    h.if(Object.keys(props).length > 0)(FeatureProperties, { data: props }),
  ]);
}

function CopyJSONButton({ data }) {
  const [copied, setCopied] = useState(false);
  return h(Button, {
    icon: copied ? "tick" : "clipboard",
    intent: copied ? Intent.SUCCESS : Intent.NONE,
    minimal: true,
    small: true,
    onClick() {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
    },
  });
}

/** This component wraps queryRenderedFeatures to get features at a given location */
export function FeatureSelectionHandler({
  selectedLocation,
  setFeatures,
  radius = 2,
}: {
  selectedLocation: mapboxgl.LngLat;
  setFeatures: (features: mapboxgl.MapboxGeoJSONFeature[]) => void;
  radius?: number;
}) {
  const mapRef = useMapRef();
  const isLoading = useMapStatus((s) => s.isLoading);
  const isInitialized = useMapStatus((s) => s.isInitialized);
  const prevLocation = useRef(null);
  const prevFeatures = useRef([]);

  useEffect(() => {
    const map = mapRef?.current;
    if (map == null) return;
    if (selectedLocation == null) {
      setFeatures(null);
      return;
    }

    if (!isInitialized) return;

    const hasPreviouslyLoadedFeatures = prevFeatures.current.length > 0;

    const locationMemo = JSON.stringify(selectedLocation);
    if (locationMemo == prevLocation.current && hasPreviouslyLoadedFeatures)
      return;

    prevLocation.current = locationMemo;

    // Don't update if the location hasn't changed
    //if (selectedLocation == prevLocation) return;

    const r = radius;
    const pt = map.project(selectedLocation);

    const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
      [pt.x - r, pt.y - r],
      [pt.x + r, pt.y + r],
    ];
    const features = map.queryRenderedFeatures(bbox);
    prevFeatures.current = features ?? [];
    setFeatures(features);
  }, [isInitialized, selectedLocation, isLoading]);

  return null;
}

function FeatureHeader({ feature }) {
  return h("div.feature-header", [
    h("h3", [
      h(KeyValue, { label: "Source", value: feature.source }),
      h(KeyValue, { label: "Source layer", value: feature.sourceLayer }),
    ]),
  ]);
}

function KeyValue({ label, value }) {
  return h("span.key-value", [h("span.key", label), h("code.value", value)]);
}

function LoadingAwareFeatureSet({ features, sourceID }) {
  const map = useMapRef();
  if (map?.current == null) return null;
  const [isLoaded, setIsLoaded] = useState(false);

  const sourceFeatures = features.filter((d) => d.source == "burwell");

  useEffect(() => {
    if (sourceFeatures.length > 0) {
      setIsLoaded(true);
      return;
    }

    const isLoaded = map.current.isSourceLoaded(sourceID);
    setIsLoaded(isLoaded);
    if (!isLoaded) {
      map.current.once("sourcedata", (e) => {
        if (e.sourceId == sourceID) {
          setIsLoaded(true);
        }
      });
    }
  }, [map.current, sourceID, sourceFeatures.length]);

  if (!isLoaded) return h(Spinner);
  return h(Features, { features: sourceFeatures });
}

export function TileInfo({ feature, showExtent, setShowExtent }) {
  if (feature == null) return null;
  const size = feature._vectorTileFeature._pbf.length;
  return h("div.tile-info", [
    h("h3", "Tile"),
    h("div.tile-index", [
      h(KeyValue, { label: "x", value: feature._x }),
      h(KeyValue, { label: "y", value: feature._y }),
      h(KeyValue, { label: "z", value: feature._z }),
    ]),
    h("div.spacer"),
    h(KeyValue, { label: "Size", value: formatSize(size) }),
    h(Switch, {
      label: "Show extent",
      alignIndicator: "right",
      checked: showExtent,
      onChange() {
        setShowExtent(!showExtent);
      },
    }),
  ]);
}

function formatSize(size: number) {
  if (size > 1000000)
    return h(UnitNumber, { value: size / 1000000, unit: "Mb" });
  if (size > 1000) return h(UnitNumber, { value: size / 1000, unit: "Kb" });
  return `${size} bytes`;
}

function UnitNumber({ value, unit, precision = 1 }) {
  return h("span.unit-number", [
    h("span.number", value.toFixed(precision)),
    h("span.unit", unit),
  ]);
}

export function FeaturePanel({
  features,
  focusedSource = null,
  focusedSourceTitle = null,
}) {
  if (features == null) return null;

  let focusedSourcePanel = null;
  let filteredFeatures = features;
  let title = "Features";

  if (focusedSource != null) {
    title = "Basemap features";
    focusedSourcePanel = h(
      ExpansionPanel,
      {
        title: focusedSourceTitle ?? "Macrostrat features",
        className: "macrostrat-features",
        expanded: true,
      },
      [
        h(LoadingAwareFeatureSet, {
          features,
          sourceID: focusedSource,
        }),
      ],
    );
    filteredFeatures = features.filter((d) => d.source != focusedSource);
  }

  return h("div.feature-panel", [
    focusedSourcePanel,
    h(
      ExpansionPanel,
      { title, className: "basemap-features", expanded: focusedSource == null },
      [
        h(FeatureGroups, {
          features: filteredFeatures,
        }),
      ],
    ),
  ]);
}

function FeatureGroups({ features }) {
  /** Group features by source and sourceLayer */
  if (features == null) return null;

  const groups = group(features, (d: any) => `${d.source} - ${d.sourceLayer}`);

  return h(
    "div.feature-groups",
    Array.from(groups).map(([key, features]) => {
      return h("div.feature-group", [
        h(FeatureHeader, { feature: features[0] }),
        h(Features, { features }),
      ]);
    }),
  );
}

export function Features({ features }) {
  return h(
    "div.features",
    features.map((feature, i) => h(FeatureRecord, { key: i, feature })),
  );
}
