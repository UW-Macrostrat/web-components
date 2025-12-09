import {
  DetritalSpectrumPlot,
  DetritalSeries,
  usePlotArea,
} from "@macrostrat/data-components";
import type { IUnit } from "../../units/types";
import hyper from "@macrostrat/hyper";
import { useDetritalMeasurements, MeasurementInfo } from "./provider";
import { useMemo } from "react";
import styles from "./index.module.sass";
import classNames from "classnames";
import { BaseMeasurementsColumn } from "../measurements";
import { group } from "d3-array";
import { ColumnAxisType } from "@macrostrat/column-components";
import {
  getUnitHeightRange,
  useMacrostratColumnData,
} from "@macrostrat/column-views";

const h = hyper.styled(styles);

interface DetritalItemProps {
  note: {
    data: MeasurementInfo[];
    unit?: IUnit;
  };
  spacing?: {
    below?: number;
    above?: number;
  };
  width?: number;
  height?: number;
  color?: string;
}

const isMatchingUnit = (meas, unit) => {
  return unit.unit_id == meas[0].unit_id;
};

function prepareDetritalData(
  data: MeasurementInfo[],
  units: IUnit[],
  axisType: ColumnAxisType,
) {
  // Group data by unit ID
  const data1 = group(data, (d) => d.unit_id);

  return Array.from(data1.entries())
    .map(([unit_id, data]) => {
      const unit = units.find((u) => u.unit_id === unit_id);
      if (unit == null) return null;
      const [height, top_height] = getUnitHeightRange(unit, axisType);
      return {
        height,
        top_height,
        data,
        id: unit_id,
      };
    })
    .filter(Boolean);
}

function DetritalColumn({ columnID, color = "magenta" }) {
  const data = useDetritalMeasurements({ col_id: columnID });

  const width = 400;
  const paddingLeft = 40;

  const spectrumWidth = width - paddingLeft;

  const noteComponent = useMemo(() => {
    return (props) => {
      return h(DetritalGroup, {
        width: spectrumWidth,
        height: 40,
        color,
        ...props,
      });
    };
  }, [width, color]);

  const { axisType, units } = useMacrostratColumnData();
  if (data == null || units == null) return null;

  const data1 = prepareDetritalData(data, units, axisType);

  return h(BaseMeasurementsColumn, {
    data: data1,
    noteComponent,
    isMatchingUnit,
    deltaConnectorAttachment: 20,
  });
}

function DepositionalAge({ unit }) {
  const { xScale, height } = usePlotArea();

  const { t_age, b_age } = unit;
  const x = xScale(t_age);
  const x1 = xScale(b_age);

  return h("rect.depositional-age", { x, width: x1 - x, y: 0, height });
}

function DetritalGroup(props: DetritalItemProps) {
  const { note, width, height, color, spacing } = props;
  const { data, unit } = note;

  const _color = color;

  const spaceBelow = spacing?.below ?? 100;
  const hideAxisLabels = spaceBelow < 60;

  return h(
    "div.detrital-group",
    { className: classNames({ "hide-axis": hideAxisLabels }) },
    [
      h(
        DetritalSpectrumPlot,
        { width, innerHeight: height, showAxisLabels: true, paddingBottom: 40 },
        [
          h.if(unit != null)(DepositionalAge, { unit }),
          data.map((d) => {
            return h(DetritalSeries, {
              bandwidth: 20,
              data: d.measure_value,
              color: _color,
            });
          }),
        ],
      ),
    ],
  );
}

export { DetritalColumn, DetritalGroup };
