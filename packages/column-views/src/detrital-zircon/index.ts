import {
  DetritalSpectrumPlot,
  DetritalSeries,
  usePlotArea,
} from "@macrostrat/data-components";
import { IUnit } from "@macrostrat/column-views";
import hyper from "@macrostrat/hyper";
import { useDetritalMeasurements, MeasurementInfo } from "./provider";
import { useMacrostratUnits } from "../data-provider";
import { ColumnNotes } from "../notes";
import { useMemo } from "react";
import styles from "./index.module.sass";

const h = hyper.styled(styles);

interface DetritalItemProps {
  note: {
    data: MeasurementInfo[];
    unit?: IUnit;
  };
  width?: number;
  height?: number;
}

function DepositionalAge({ unit }) {
  const { xScale, height } = usePlotArea();

  const { t_age, b_age } = unit;
  const x = xScale(t_age);
  const x1 = xScale(b_age);

  return h("rect.depositional-age", { x, width: x1 - x, y: 0, height });
}

function DetritalGroup(props: DetritalItemProps) {
  const { note, width, height } = props;
  const { data, unit } = note;
  const { geo_unit } = data[0];

  return h("div.detrital-group", [
    h(
      DetritalSpectrumPlot,
      { width, innerHeight: height, showAxisLabels: false },
      [
        h.if(unit != null)(DepositionalAge, { unit }),
        data.map((d) => {
          return h(DetritalSeries, {
            bandwidth: 20,
            data: d.measure_value,
          });
        }),
      ]
    ),
  ]);
}

const matchingUnit = (dz) => (d) => d.unit_id == dz[0].unit_id;

function DetritalColumn({ columnID }) {
  const data = useDetritalMeasurements({ col_id: columnID });
  const units = useMacrostratUnits();

  const notes: any[] = useMemo(() => {
    if (data == null || units == null) return [];
    let dzUnitData = Array.from(data.values());
    dzUnitData.sort((a, b) => {
      const v1 = units.findIndex(matchingUnit(a));
      const v2 = units.findIndex(matchingUnit(b));
      return v1 > v2;
    });

    const data1 = dzUnitData.map((d) => {
      const unit = units.find(matchingUnit(d));
      return {
        top_height: unit?.t_age,
        height: unit?.b_age,
        data: d,
        unit,
        id: unit?.unit_id,
      };
    });

    return data1.filter((d) => d.unit != null);
  }, [data, units]);

  const width = 400;
  const paddingLeft = 40;

  const noteComponent = useMemo(() => {
    return (props) => {
      return h(DetritalGroup, {
        width: width - paddingLeft,
        height: 40,
        ...props,
      });
    };
  }, [width]);

  if (data == null || units == null) return null;

  return h(ColumnNotes, {
    width,
    paddingLeft,
    notes,
    noteComponent,
    deltaConnectorAttachment: 20,
  });
}

export { DetritalColumn, DetritalGroup };
