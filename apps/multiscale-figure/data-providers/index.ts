import h from "@macrostrat/hyper";
import { useState } from "react";
import {
  useMeasurementData,
  MeasurementDataContext
} from "../../carbon-isotopes/data-provider";
import {
  ColumnSpec,
  buildMacrostratMeasurements
} from "./reclassify-measurements";
import { apiBaseURL } from "../config";
import { useAsyncEffect, useAPIResult } from "@macrostrat/ui-components";
import { MeasurementLong, filterMeasurements } from "./filter-measurements";

function MacrostratMeasurementProvider(
  props: React.PropsWithChildren<{ source: ColumnSpec; target: ColumnSpec }>
) {
  const { children, source, target } = props;

  const [data, setData] = useState<any[] | null>(null);
  useAsyncEffect(
    async function() {
      const res = await buildMacrostratMeasurements(apiBaseURL, source, target);
      setData(res.success.data);
    },
    [source, target]
  );

  return h(MeasurementDataContext.Provider, {
    value: data,
    children
  });
}

function FilteredMeasurementProvider(
  props: React.PropsWithChildren<ColumnSpec>
) {
  const { children, ...params } = props;
  const res: MeasurementLong[] = useAPIResult("/measurements", {
    ...params,
    show_values: true,
    response: "long"
  });

  let data = [];

  if (res != null) {
    for (const meas of res) {
      let newVal = filterMeasurements(meas);
      if (newVal != null) data.push(newVal);
    }
  }

  return h(MeasurementDataContext.Provider, {
    value: data,
    children
  });
}

export {
  MacrostratMeasurementProvider,
  FilteredMeasurementProvider,
  useMeasurementData,
  ColumnSpec
};
