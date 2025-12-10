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
import {
  BaseMeasurementsColumn,
  mergeHeightRanges,
  ColumnMeasurementData,
} from "../measurements";
import { group } from "d3-array";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useMacrostratColumnData } from "../../data-provider";
import { getUnitHeightRange } from "../../prepare-units";

const h = hyper.styled(styles);

interface DetritalItemProps {
  note: DZMeasurementInfo;
  spacing?: {
    below?: number;
    above?: number;
  };
  width?: number;
  height?: number;
  color?: string;
}

interface DZMeasurementInfo extends ColumnMeasurementData<MeasurementInfo[]> {
  units: IUnit[];
}

function prepareDetritalData(
  data: MeasurementInfo[],
  units: IUnit[],
  axisType: ColumnAxisType,
) {
  /** Right now measurement data could be duplicated if there are multiple units linked to the same
   * measuremeta_id. THis happens because matches to units might be at a lower rank (e.g, if the column
   * contains Formations but the measurements are linked to a Group). To handle this, we group by measuremeta_id
   * and then create unique keys based on the set of units linked to each measurement.
   */

  // Group data by measuremeta_id
  const measurementsGrouped = group(data, (d) => d.measuremeta_id);

  const resMap = new Map<string, DZMeasurementInfo>();

  for (const measurements of measurementsGrouped.values()) {
    // Get a list of unique unit_ids for this measurement
    const unitIDs = new Set(measurements.map((m) => m.unit_id));
    const ids = Array.from(unitIDs);
    ids.sort();
    // Key is unique to the set of units
    const key = ids.join("-");

    if (!resMap.has(key)) {
      const unitData = ids
        .map((id) => {
          return units.find((u) => u.unit_id === id);
        })
        .filter(Boolean);

      const positions = unitData.map((unit) => {
        const [height, top_height] = getUnitHeightRange(unit, axisType);
        return { height, top_height };
      });

      // merge positions (note: we could also have multiple separate notes per measurement)
      const pos = mergeHeightRanges(positions, axisType);

      resMap.set(key, {
        id: key,
        data: [],
        units: unitData as IUnit[],
        ...pos,
      });
    }
    resMap.get(key)!.data.push(measurements[0]);
  }

  return Array.from(resMap.values());
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

  const data1 = useMemo(() => {
    if (data == null || units == null) return null;
    return prepareDetritalData(data, units, axisType);
  }, [data, units, axisType]);

  return h(BaseMeasurementsColumn, {
    data: data1,
    noteComponent,
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
  const { data, units } = note;

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
          units.map((unit) => {
            return h(DepositionalAge, { unit });
          }),
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
