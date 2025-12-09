import hyper from "@macrostrat/hyper";
import styles from "./base.module.sass";
import { getPositionWithinUnit, getUnitHeightRange } from "../../prepare-units";
import { ColumnNotes } from "../../notes";
import { UnitLong } from "@macrostrat/api-types";
import { ColumnAxisType } from "@macrostrat/column-components";
const h = hyper.styled(styles);

type GetHeightRangeFn<T> = (
  data: T,
  unit: UnitLong | null,
  axisType: ColumnAxisType,
) => MeasurementHeightData;

export interface BaseMeasurementsColumnProps<T> {
  data: T[];
  noteComponent?: any;
  width?: number;
  paddingLeft?: number;
  className?: string;
  // TODO: these props are confusing
  getUnitID?: (d: T) => number | string;
  isMatchingUnit?: (d: T, unit: UnitLong) => boolean;
  getHeightRange?: GetHeightRangeFn<T>;
  deltaConnectorAttachment?: number;
}

export interface ColumnMeasurementData<T = any> extends MeasurementHeightData {
  data: T;
  id: string | number;
}

type MeasurementPositionInformation =
  | MeasurementHeightData
  | {
      unit_id: number;
      unit_rel_pos?: number;
    };

export function standardizeMeasurementHeight(
  pos: MeasurementPositionInformation,
  units: UnitLong[],
  axisType: ColumnAxisType,
): MeasurementHeightData | null {
  /** Get a standardized height representation from position information for
   * a measurement
   */
  if ("height" in pos) {
    return pos;
  }
  const unit = units.find((u) => u.unit_id === pos.unit_id);
  if (unit == null) {
    return null;
  }
  if (pos.unit_rel_pos != null) {
    const res = getPositionWithinUnit(pos.unit_rel_pos, unit, axisType);
    if (res == null) return null;
    return { height: res };
  } else {
    const [height, top_height] = getUnitHeightRange(unit, axisType);
    return { height, top_height };
  }
}

export function mergeHeightRanges(
  data: MeasurementHeightData[],
  axisType: ColumnAxisType,
): MeasurementHeightData {
  /** Merge multiple height ranges into a single range */
  const heights = [];

  for (const d of data) {
    heights.push(d.height);
    if (d.top_height != null) {
      heights.push(d.top_height);
    }
  }

  let height: number;
  let top_height: number;
  if (axisType === ColumnAxisType.AGE || axisType === ColumnAxisType.DEPTH) {
    height = Math.max(...heights);
    top_height = Math.min(...heights);
  } else {
    height = Math.min(...heights);
    top_height = Math.max(...heights);
  }

  if (top_height === height) {
    return { height };
  }
  return { height, top_height };
}

type MeasurementHeightData = {
  height: number;
  top_height?: number | null;
};

export function BaseMeasurementsColumn({
  data,
  noteComponent,
  width = 500,
  paddingLeft = 40,
  className,
  deltaConnectorAttachment,
}: BaseMeasurementsColumnProps<any>) {
  if (data == null) return null;

  return h(
    "div.measurements-column",
    { className },
    h(ColumnNotes, {
      width,
      paddingLeft,
      notes: data,
      noteComponent,
      deltaConnectorAttachment,
    }),
  );
}

interface TruncatedListProps {
  data: any[];
  className?: string;
  maxItems?: number;
  itemRenderer?: (props: { data: any }) => any;
}

export function TruncatedList({
  data,
  className,
  maxItems = 5,
  itemRenderer = (p) => h("span", p.data),
}: TruncatedListProps) {
  let tooMany = null;
  let d1 = data;
  if (data.length > maxItems) {
    const n = data.length - maxItems;
    d1 = data.slice(0, maxItems);
    tooMany = h("li.too-many", `and ${n} more`);
  }

  return h("ul.truncated-list", { className }, [
    d1.map((d, i) => {
      return h("li.element", { key: i }, h(itemRenderer, { data: d }));
    }),
    tooMany,
  ]);
}
