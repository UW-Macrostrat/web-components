import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react-vite";
import { buildColumnsStyle, InsetMap } from "./_shared";
import {
  MacrostratDataProvider,
  useMacrostratColumns,
} from "@macrostrat/data-provider";
import { useAPIResult } from "@macrostrat/ui-components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Unit map",
  component: InsetMap,
  description: "A map of units through time",
} as Meta<typeof InsetMap>;

export function UnitMap() {
  const overlayStyles = useMemo(() => {
    let styles: any[] = [buildColumnsStyle("dodgerblue")];
    return styles;
  }, []);

  return h(
    MacrostratDataProvider,
    { baseURL: "https://macrostrat.local/api/v2" },
    h(
      "div",
      h(
        InsetMap,
        {
          style: { width: "800px", height: "600px" },
          accessToken: mapboxToken,
          overlayStyles,
        },
        [h(MacrostratUnitsOverlay, { time: 100 })],
      ),
    ),
  );
}

interface UnitsOverlayProps {
  time: number;
  ageSpan?: number;
  project?: number | number[];
}

function MacrostratUnitsOverlay(props: UnitsOverlayProps) {
  const { time, ageSpan = 2 } = props;

  let project: number[] | undefined;
  if (Number.isFinite(props.project)) {
    project = [props.project as number];
  } else if (!Array.isArray(project)) {
    project = undefined;
  }
  // Project can only be a single project for now
  const projectCompat =
    project != null && project.length > 0 ? project[0] : undefined;

  const queryParams: Record<string, any> = {
    age_bottom: time - ageSpan / 2,
    age_top: time + ageSpan / 2,
    response: "long",
    project: projectCompat,
  };

  const units = useAPIResult("/units", queryParams);

  console.log(units);

  const columns = useMacrostratColumns(projectCompat, false);

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

  return null;
}

interface UnitsDisplayInfo {
  col_id: number;
  units: UnitLong[];
  color: string;
  patternSpec?: string;
}

function postProcessUnits(units: UnitLong[]): Record<number, UnitsDisplayInfo> {
  // Group by col_id
  const unitsByColumn: Record<number, UnitLong[]> = {};
  for (const unit of units) {
    const col_id = unit.col_id;
    if (!(col_id in unitsByColumn)) {
      unitsByColumn[col_id] = [];
    }
    unitsByColumn[col_id].push(unit);
  }

  // Summarize units for display
}

import { useMapStyleOperator } from "@macrostrat/mapbox-react";
import { FeatureCollection } from "geojson";
import { useMemo, useRef } from "react";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { UnitLong } from "@macrostrat/api-types";

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
