import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react-vite";
import { buildColumnsStyle, InsetMap } from "./_shared";
import {
  MacrostratDataProvider,
  useLithologies,
  useMacrostratColumns,
} from "@macrostrat/data-provider";
import { useAPIResult } from "@macrostrat/ui-components";

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
    let styles: any[] = [buildColumnsStyle("#444")];
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

  const lithMap = useLithologies();

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
      const u1 = postProcessUnits(units, lithMap);
      for (const column of columns) {
        const col_id = column.properties.col_id;
        const info = u1.get(Number(col_id));
        const color = info?.color;
        map.setFeatureState(
          { source: "columns", id: col_id },
          {
            color,
            selected: color != null,
          },
        );
      }
    },
    [units, lithMap, columns],
  );

  return null;
}

interface UnitsDisplayInfo {
  col_id: number;
  units: UnitLong[];
  color: string;
  liths?: UnitLithology[];
  patternSpec?: string;
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
    res.set(col_id, {
      col_id,
      units: unitList,
      liths,
      color,
    });
  }

  return res;
}

import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import { FeatureCollection } from "geojson";
import { useMemo, useRef } from "react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { UnitLithology, UnitLong } from "@macrostrat/api-types";
import { flattenLithologies, getMixedColorForData } from "../units";

function ColumnsLayer() {
  const columns = useMacrostratColumns(1, false);

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

  // /** Set feature state for selected columns */
  // const selectedColumnRef = useRef(null);
  // const initialRenderRef = useRef(true);
  // useMapStyleOperator(
  //   (map) => {
  //     if (columns == null) return;
  //     const prevSelectedColumn = selectedColumnRef.current;
  //     if (selectedColumn == prevSelectedColumn) return;
  //     if (prevSelectedColumn != null) {
  //       // Deselect previous column
  //       map.setFeatureState(
  //         { source: "columns", id: prevSelectedColumn },
  //         { selected: false },
  //       );
  //     }
  //
  //     selectedColumnRef.current = selectedColumn;
  //
  //     // Select the current column
  //     map.setFeatureState(
  //       { source: "columns", id: selectedColumn },
  //       { selected: true },
  //     );
  //   },
  //   [selectedColumn, columns],
  //);

  return null;
}
