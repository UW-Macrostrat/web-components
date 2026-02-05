import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react-vite";
import { InsetMap } from "./_shared";
import {
  MacrostratDataProvider,
  useLithologies,
  useMacrostratColumns,
} from "@macrostrat/data-provider";
import { useAPIResult } from "@macrostrat/ui-components";
import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import { FeatureCollection } from "geojson";
import { useMemo, useRef } from "react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { Lithology, UnitLithology, UnitLong } from "@macrostrat/api-types";
import { flattenLithologies, getMixedColorForData } from "../units";
import { setupStyleImageManager, loadStyleImage } from "@macrostrat/map-styles";

import { getCSSVariable } from "@macrostrat/color-utils";
import { buildGeoJSONSource } from "@macrostrat/mapbox-utils";
import type { Style } from "mapbox-gl";
import { resolveID } from "../units/resolvers";
import pMap from "p-map";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Unit map",
  component: InsetMap,
  description: "A map of units through time",
  argTypes: {
    time: { control: "number", defaultValue: 100 },
    ageSpan: { control: "number", defaultValue: 0.05 },
  },
} as Meta<typeof InsetMap>;

export function UnitMap(props) {
  const overlayStyles = useMemo(() => {
    let styles: any[] = [buildUnitsStyle("#444")];
    return styles;
  }, []);

  return h(
    MacrostratDataProvider,
    {
      args: {
        time: 108,
        ageSpan: 5,
      },

      baseURL: "https://macrostrat.local/api/v2",
    },
    h(
      "div",
      h(
        InsetMap,
        {
          style: { width: "800px", height: "600px" },
          accessToken: mapboxToken,
          overlayStyles,
        },
        [h(MacrostratUnitsOverlay, props)],
      ),
    ),
  );
}

UnitMap.args = {
  time: 100,
  ageSpan: 0.05,
};

interface UnitsOverlayProps {
  time: number;
  ageSpan?: number;
  project?: number | number[];
}

function MacrostratUnitsOverlay(props: UnitsOverlayProps) {
  const { time, ageSpan = 0.05 } = props;
  const lithMap = useLithologies();
  const patternCacheRef = useRef(new Map<number, string>());

  useMapStyleOperator(
    (map) => {
      setupStyleImageManager(map);
    },
    [lithMap],
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
      handleUnitsUpdate(map, units, columns, lithMap);
    },
    [units, lithMap, columns],
  );

  return null;
}

async function handleUnitsUpdate(
  map,
  units: UnitLong[],
  columns: any[],
  lithMap: Map<number, Lithology>,
) {
  const u1 = postProcessUnits(units, lithMap);

  // synthesize patterns not yet in cache
  const patternSet = new Set<string>(
    u1
      .values()
      .map((d) => d.patternID)
      .filter((d) => d != null && !map.hasImage(d)),
  );

  const patterns = patternSet.values();

  const mapper = (patternID) =>
    loadStyleImage(map, patternID, { pixelRatio: 10 })
      .then(() => {
        console.log(`Loaded pattern ${patternID}`);
      })
      .catch((err) => {
        console.error(`Failed to load pattern ${patternID}:`, err);
      });
  // Load all pattern images
  await pMap(patterns, mapper, { concurrency: 5 });

  const colsWithPatterns = [];
  // Update feature states
  for (const column of columns) {
    const col_id = column.properties.col_id;
    const info = u1.get(Number(col_id));
    const color = info?.color;
    map.setFeatureState(
      { source: "columns", id: col_id },
      {
        color,
        shown: color != null,
        pattern: info?.patternID ?? "no-op",
      },
    );

    if (info?.patternID != null) {
      colsWithPatterns.push({
        type: "Feature",
        geometry: column.geometry,
        properties: {
          col_id,
          pattern: info.patternID,
        },
      });
    }

    // Set data for pattern layer
    const patternData: FeatureCollection = {
      type: "FeatureCollection",
      features: colsWithPatterns,
    };
    setGeoJSON(map, "column-patterns", patternData);
  }
}

interface UnitsDisplayInfo {
  col_id: number;
  units: UnitLong[];
  color: string;
  liths?: UnitLithology[];
  patternID?: string;
}

function postProcessUnits(
  units: UnitLong[],
  lithMap: Map<number, { color: string }>,
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

  const getColor = (data: UnitLithology): string | null => {
    return lithMap?.get(data.lith_id)?.color ?? null;
  };

  // Summarize units for display
  const res = new Map<number, UnitsDisplayInfo>();
  for (const [col_id, unitList] of unitsByColumn.entries()) {
    const liths = flattenLithologies(unitList.map((u) => u.lith));
    // Determine color
    const color = getMixedColorForData(liths, getColor);

    let patternID = null;
    let fgdcID = resolveID(unitList[0]);
    if (fgdcID != null) {
      patternID = `fgdc:${fgdcID}:#000000:transparent`;
    }

    res.set(col_id, {
      col_id,
      units: unitList,
      liths,
      color,
      patternID,
    });
  }

  return res;
}

function buildUnitsStyle(color: string): Style {
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

  return {
    sources: {
      columns: buildGeoJSONSource(),
      "column-patterns": buildGeoJSONSource(),
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
        id: "columns-fill-pattern",
        type: "fill",
        source: "column-patterns",
        paint: {
          "fill-pattern": ["get", "pattern"],
          "fill-opacity": 1,
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
}
