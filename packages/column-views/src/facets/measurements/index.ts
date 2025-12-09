import h from "@macrostrat/hyper";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  BaseMeasurementsColumn,
  standardizeMeasurementHeight,
  TruncatedList,
} from "./base";
import { UnitLong } from "@macrostrat/api-types";
import { ColumnAxisType } from "@macrostrat/column-components";

export { BaseMeasurementsColumn, standardizeMeasurementHeight, TruncatedList };

function useSGPData({ col_id }) {
  const res = useAPIResult(
    "https://dev.macrostrat.org/api/pg/sgp_unit_matches",
    {
      col_id: `eq.${col_id}`,
    },
    (d) => d,
  );
  return res;
}

interface SGPSampleData {
  col_id: number;
  unit_id: number;
  sgp_samples: { name: string; id: number }[];
}

export function SGPMeasurementsColumn({ columnID, color = "magenta" }) {
  const data: SGPSampleData[] | null = useSGPData({ col_id: columnID });

  if (data == null) return null;

  return h(BaseMeasurementsColumn, {
    data,
    noteComponent: SGPSamplesNote,
  });
}

function SGPSamplesNote(props) {
  const { note } = props;
  const sgp_samples = note?.data?.sgp_samples;

  if (sgp_samples == null || sgp_samples.length === 0) return null;

  return h(TruncatedList, {
    className: "sgp-samples",
    data: sgp_samples,
    itemRenderer: (p) => h("span", p.data.name),
  });
}

function prepareSGPData(
  data: SGPSampleData[],
  units: UnitLong[],
  axisType: ColumnAxisType,
) {
  // Find matching units for samples
  return data
    .map((sample) => {
      const heightData = standardizeMeasurementHeight(
        { unit_id: sample.unit_id },
        units,
        axisType,
      );
      if (heightData == null) return null;
      return {
        ...heightData,
        data: sample,
        id: sample.unit_id,
      };
    })
    .filter(Boolean);
}
