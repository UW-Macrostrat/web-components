import { useMapStyleOperator, useOverlayStyle } from "@macrostrat/mapbox-react";
import { buildColumnsStyle } from "../styles";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { FeatureCollection } from "geojson";

export function BaseColumnsLayer({ enabled = true, color, columns }) {
  useOverlayStyle(
    () => (enabled ? buildColumnsStyle(color) : null),
    [enabled, color],
  );

  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };

      setGeoJSON(map, "columns", data);
    },
    [columns, enabled],
  );
  return null;
}
