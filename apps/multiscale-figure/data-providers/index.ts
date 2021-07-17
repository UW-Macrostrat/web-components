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
import { useAsyncEffect } from "@macrostrat/ui-components";

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

export { MacrostratMeasurementProvider, useMeasurementData, ColumnSpec };
