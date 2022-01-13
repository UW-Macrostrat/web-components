import h from "@macrostrat/hyper";
import { geoCentroid } from "d3-geo";
import { ResizableMapFrame } from "common/column-map";
import {
  ColumnKeyboardNavigation,
  ColumnFeatures,
  useColumnData,
  CurrentColumn
} from "common/map/layers";
import { useMemo } from "react";

function useFilteredColumns({ apiRoute, status_code, project_id }) {
  const features = useColumnData({ apiRoute, status_code, project_id });

  return useMemo(() => {
    let completedColumns = [];
    let emptyColumns = [];

    for (const col of features ?? []) {
      if (col.properties.t_units > 0) {
        completedColumns.push(col);
      } else {
        emptyColumns.push(col);
      }
    }
    return [completedColumns, emptyColumns];
  }, [features]);
}

const ColumnMapView = props => {
  const { currentColumn, setCurrentColumn, children, ...rest } = props;
  const center = geoCentroid?.(currentColumn);

  const { apiRoute = "/columns", status_code, project_id, color } = props;

  const col_id = currentColumn?.properties?.col_id;

  const [completedColumns, emptyColumns] = useFilteredColumns({
    apiRoute,
    status_code,
    project_id
  });

  return h(ResizableMapFrame, { center, className: "column-map", ...rest }, [
    h(ColumnKeyboardNavigation, {
      features: completedColumns,
      col_id,
      onChange: setCurrentColumn,
      status_code,
      project_id,
      showLayers: false
    }),
    h(ColumnFeatures, {
      features: emptyColumns,
      color: "#888",
      onClick: setCurrentColumn
    }),
    h(ColumnFeatures, {
      features: completedColumns,
      onClick: setCurrentColumn,
      color
    }),
    h.if(currentColumn != null)(CurrentColumn, {
      feature: currentColumn
    })
  ]);
};

export default ColumnMapView;
