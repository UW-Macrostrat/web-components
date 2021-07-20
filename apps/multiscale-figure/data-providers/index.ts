import h from "@macrostrat/hyper";
import { useState, useEffect } from "react";
import {
  useMeasurementData,
  MeasurementDataContext
} from "../../carbon-isotopes/data-provider";
import { useAPIResult } from "@macrostrat/ui-components";
import { MeasurementLong, UnitLong, ColumnSpec } from "@macrostrat/api-types";
import {
  alignMeasurementsToTargetColumn,
  filterMeasurements
} from "@macrostrat/api-utils";

/** This file defines subsidiary measurement data providers that transform
 * data requests into formats for column subsets.
 */

function AlignedMeasurementProvider(
  props: React.PropsWithChildren<{
    targetColumn: ColumnSpec;
    measureData?: MeasurementLong[];
  }>
) {
  const { children, targetColumn, measureData = useMeasurementData() } = props;
  // Higher-level measurement data provider
  const unitData: UnitLong[] = useAPIResult("/units", targetColumn);

  const [data, setData] = useState<any[] | null>(null);
  useEffect(() => {
    if (measureData == null || unitData == null) return;
    const res = alignMeasurementsToTargetColumn(
      measureData,
      unitData,
      targetColumn
    );
    setData(res);
  }, [measureData, unitData]);

  return h(MeasurementDataContext.Provider, {
    value: data,
    children
  });
}

function FilteredMeasurementProvider(
  props: React.PropsWithChildren<{ measureData?: MeasurementLong[] }>
) {
  const { children, measureData = useMeasurementData() } = props;

  let filteredMeasurements = filterMeasurements(
    measureData ?? [],
    d => d.sample_no.match(/^G3-/) != null
  );

  return h(MeasurementDataContext.Provider, {
    value: filterMeasurements,
    children
  });
}

export {
  AlignedMeasurementProvider,
  FilteredMeasurementProvider,
  useMeasurementData,
  ColumnSpec
};
