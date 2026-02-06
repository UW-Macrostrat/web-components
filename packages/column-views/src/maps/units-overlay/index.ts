import {
  useLithologies,
  useMacrostratColumns,
} from "@macrostrat/data-provider";
import { useAPIResult } from "@macrostrat/ui-components";
import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import { FeatureCollection } from "geojson";
import { useMemo } from "react";
import { mergeStyles, setGeoJSON } from "@macrostrat/mapbox-utils";
import { UnitLithology, UnitLong } from "@macrostrat/api-types";
import { flattenLithologies, getMixedColorForData } from "../../units";
import { getBestFGDCPatternForLithologyList } from "../../units/resolvers";
import { setupStyleImageManager, loadStyleImage } from "@macrostrat/map-styles";

import { asChromaColor, getCSSVariable } from "@macrostrat/color-utils";
import { buildGeoJSONSource } from "@macrostrat/mapbox-utils";
import type { Style } from "mapbox-gl";
import pMap from "p-map";

export interface UnitsOverlayProps {
  time: number;
  ageSpan?: number;
  project?: number | number[];
  patterns?: boolean;
}

export function MacrostratUnitsOverlay(props: UnitsOverlayProps) {
  const { time, ageSpan = 0.05, patterns = false } = props;
  const lithMap = useLithologies();

  useMapStyleOperator(
    (map) => {
      if (!patterns) return;
      setupStyleImageManager(map, { verbose: false });
    },
    [patterns],
  );

  const params = useMemo(() => {
    let project: number[] | undefined;
    if (Number.isFinite(props.project)) {
      project = [props.project as number];
    } else if (!Array.isArray(props.project)) {
      project = undefined;
    }
    // Project can only be a single project for now
    const projectCompat =
      project != null && project.length > 0 ? project[0] : undefined;

    return {
      age_bottom: time + ageSpan / 2,
      age_top: time - ageSpan / 2,
      response: "long",
      project: projectCompat,
    };
  }, [time, ageSpan, props.project]);

  const units: UnitLong[] = useAPIResult("/units", params);
  const columns = useMacrostratColumns(params.project, false);

  // Set up basic columns layer
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
    [columns],
  );

  useMapStyleOperator(
    (map) => {
      if (units == null || columns == null || lithMap == null) {
        return;
      }

      const getColorForLithology = (data: UnitLithology): string | null => {
        return lithMap?.get(data.lith_id)?.color ?? null;
      };

      const unitsMap = postProcessUnits(units, getColorForLithology);
      handleUnitsLayerUpdate(map, unitsMap, columns);
      if (patterns) {
        handlePatternOverlayUpdate(
          map,
          unitsMap,
          columns,
          getColorForLithology,
        ).then(() => {});
      }
    },
    [units, lithMap, columns, patterns],
  );

  return null;
}

function handleUnitsLayerUpdate(
  map,
  unitsMap: Map<number, UnitsDisplayInfo>,
  columns: any[],
) {
  // Update feature states
  for (const column of columns) {
    const col_id = column.properties.col_id;
    const info = unitsMap.get(Number(col_id));
    const color = info?.color;
    map.setFeatureState(
      { source: "columns", id: col_id },
      {
        color,
        shown: color != null,
      },
    );
  }
}

async function handlePatternOverlayUpdate(
  map,
  unitsMap: Map<number, UnitsDisplayInfo>,
  columns: any[],
  getColor: LithologyColorGetter,
) {
  // synthesize patterns not yet in cache

  const colsWithPatterns = [];
  const patternIDs = new Set<string>();
  // Update feature states
  for (const column of columns) {
    const col_id = column.properties.col_id;
    const info = unitsMap.get(Number(col_id));
    if (info == null) continue;
    const pattern = getPatternSpec(info?.liths, getColor);
    if (pattern == null) continue;

    colsWithPatterns.push({
      type: "Feature",
      geometry: column.geometry,
      properties: {
        col_id,
        pattern,
      },
    });
    patternIDs.add(pattern);
  }

  const patternsToLoad = patternIDs.values().filter((d) => !map.hasImage(d));

  const mapper = async (patternID) => {
    try {
      await loadStyleImage(map, patternID, { pixelRatio: 10 });
    } catch (e) {}
  };
  // Load all pattern images
  await pMap(patternsToLoad, mapper, { concurrency: 5 });

  // Set data for pattern layer
  // This is inefficient but the only way to set per-feature patterns in Mapbox
  const patternData: FeatureCollection = {
    type: "FeatureCollection",
    features: colsWithPatterns,
  };
  setGeoJSON(map, "column-patterns", patternData);
}

const cachedColors = new Map<string, string>();

function getDarkenedColor(color: string): string {
  /** Memoized function to get a darkened version of a color for pattern use */
  if (cachedColors.has(color)) {
    return cachedColors.get(color);
  }
  const c1 = asChromaColor(color).set("hsl.l", 0.4).set("hsl.s", 0.8).hex();
  cachedColors.set(color, c1);
  return c1;
}

interface UnitsDisplayInfo {
  col_id: number;
  units: UnitLong[];
  color: string;
  liths: UnitLithology[];
}

type LithologyColorGetter = (val: UnitLithology) => string | null;

function postProcessUnits(
  units: UnitLong[],
  getColor: LithologyColorGetter,
): Map<number, UnitsDisplayInfo> {
  // Group by col_id
  const unitsByColumn: Map<number, UnitLong[]> = new Map();
  for (const unit of units) {
    const col_id = Number(unit.col_id);
    if (!unitsByColumn.has(col_id)) {
      unitsByColumn.set(col_id, [unit]);
    } else {
      unitsByColumn.set(col_id, [...unitsByColumn.get(col_id), unit]);
    }
  }

  // Summarize units for display
  const res = new Map<number, UnitsDisplayInfo>();
  for (const [col_id, unitList] of unitsByColumn.entries()) {
    const liths = flattenLithologies(unitList.map((u) => u.lith));
    res.set(col_id, {
      col_id,
      units: unitList,
      liths,
      color: getMixedColorForData(liths, getColor),
    });
  }

  return res;
}

function getPatternSpec(
  liths: UnitLithology[],
  getColor: LithologyColorGetter,
): string | null {
  const patternData = getBestFGDCPatternForLithologyList(liths);
  if (patternData == null) return null;
  let { patternID, lith } = patternData;
  const color = getDarkenedColor(getColor(lith));
  return `fgdc:${patternID}:${color}:transparent`;
}

type UnitsStyleOptions = {
  color?: string;
  patterns?: boolean;
};

export function buildUnitsStyle(opts: UnitsStyleOptions = {}): Style {
  const { color = null, patterns = false } = opts;

  let columnBaseColor: any =
    color ?? getCSSVariable("--text-subtle-color", "black");
  const columnSelectedColor = getCSSVariable("--selection-color", "purple");

  // If color is in the feature state or geojson properties, use that as second choice

  let columnColor = [
    "coalesce",
    ["feature-state", "color"],
    ["get", "color"],
    columnBaseColor,
  ];

  const baseStyle: Style = {
    sources: {
      columns: buildGeoJSONSource(),
    },
    version: 8,
    layers: [
      {
        id: "columns-fill",
        type: "fill",
        source: "columns",
        paint: {
          "fill-color": columnColor,
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "shown"], false],
            0.8,
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0.1,
          ],
        },
      },
      {
        id: "columns-line",
        type: "line",
        source: "columns",
        paint: {
          "line-color": columnColor,
          "line-width": 1,
          "line-opacity": 0.5,
        },
      },
      {
        id: "columns-points",
        type: "circle",
        source: "columns",
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "shown"], false],
            columnColor,
            columnBaseColor,
          ],
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "shown"], false],
            0.8,
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0.1,
          ],
        },
        filter: ["==", "$type", "Point"],
      },
    ],
  };

  if (!patterns) {
    return baseStyle;
  }

  const patternStyle: Style = {
    sources: {
      "column-patterns": buildGeoJSONSource(),
    },
    layers: [
      {
        id: "columns-fill-pattern",
        type: "fill",
        source: "column-patterns",
        paint: {
          "fill-pattern": ["get", "pattern"],
          "fill-opacity": 1,
        },
      },
    ],
  };

  return mergeStyles(baseStyle, patternStyle);
}
