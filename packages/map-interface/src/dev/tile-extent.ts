import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import { tileToGeoJSON } from "@mapbox/tilebelt";
import { setGeoJSON } from "@macrostrat/mapbox-utils";

type TileIndex = { x: number; y: number; z: number };

export function TileExtentLayer({
  tile,
  color = "red",
}: {
  tile: TileIndex | null;
  color?: string;
}) {
  useMapStyleOperator(
    (map) => {
      const style = map.getStyle();
      if (style.layers == null) return;
      style.layers = style.layers.filter((l) => l.id != "tile-extent");
      if (tile == null) {
        return map.setStyle(style);
      }
      const { x, y, z } = tile;
      const extent = tileToGeoJSON([x, y, z]);

      setGeoJSON(map, "tile-extent", extent as any);

      if (map.getLayer("tile-extent") != null) {
        // If the layer already exists, we can just update it
        map.removeLayer("tile-extent");
      }

      map.addLayer({
        id: "tile-extent",
        type: "line",
        source: "tile-extent",
        paint: {
          "line-color": color,
          "line-width": 2,
        },
      });
    },
    [color, tile],
  );
  return null;
}
