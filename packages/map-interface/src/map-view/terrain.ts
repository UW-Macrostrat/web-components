// This has been merged with code in @macrostrat/mapbox-react/src/terrain.ts:

import { enable3DTerrain as enable3DTerrainNew } from "@macrostrat/mapbox-react";

export function enable3DTerrain(map, shouldEnable, sourceID) {
  console.log(
    "Using deprecated signature for enable3DTerrain. Migrate to functions in the @macrostrat/mapbox-react package."
  );
  enable3DTerrainNew(map, shouldEnable, sourceID);
}
