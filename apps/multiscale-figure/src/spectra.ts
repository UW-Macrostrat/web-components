import h from "@macrostrat/hyper";
import { useColumnDivisions } from "@macrostrat/column-components";
import { useMeasurementData } from "../../carbon-isotopes/data-provider";

function getMeasureValues(measures) {
  let res = [];
  for (const meas of measures) {
    res = res.concat(meas.measure_value);
  }
  return res;
}

function IsotopesSpectrum({
  unit_id,
  parameter
}: {
  unit_id: number;
  parameter: string;
}) {
  const measures = useMeasurementData() ?? [];
  const unitMeasures = measures.filter(
    d => d.unit_id == unit_id && d.measurement == parameter
  );
  console.log(unitMeasures);

  const values = getMeasureValues(unitMeasures);
  console.log(values);
  return null;
}

function IsotopesSpectraColumn(props: { children?: React.ReactNode }) {
  const divisions = useColumnDivisions();

  console.log(divisions);
  return h(
    "div",
    divisions.map(d => {
      return h(IsotopesSpectrum, { unit_id: d.unit_id, parameter: "D13C" });
    })
  );
}

export { IsotopesSpectraColumn };
