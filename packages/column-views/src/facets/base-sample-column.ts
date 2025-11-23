import {
  ColumnNotes,
  getUnitHeightRange,
  useMacrostratColumnData,
} from "@macrostrat/column-views";
import { useCallback, useMemo } from "react";
import hyper from "@macrostrat/hyper";
import styles from "./base-sample-column.module.sass";
const h = hyper.styled(styles);

export interface BaseMeasurementsColumnProps<T> {
  data: T[];
  noteComponent?: any;
  width?: number;
  paddingLeft?: number;
  className?: string;
  // TODO: these props are confusing
  getUnitID?: (d: T) => number | string;
  matchingUnit?: (dz: T) => (d: any) => boolean;
}

export function BaseMeasurementsColumn({
  data,
  noteComponent,
  width = 500,
  paddingLeft = 40,
  className,
  getUnitID = (d) => d.unit_id,
  matchingUnit,
}: BaseMeasurementsColumnProps<any>) {
  const { axisType, units } = useMacrostratColumnData();

  const _matchingUnit =
    matchingUnit ??
    useCallback(
      (dz) => {
        return (d) => {
          return getUnitID(d) === dz.unit_id;
        };
      },
      [getUnitID],
    );

  const notes: any[] = useMemo(() => {
    if (data == null || units == null) return [];
    let unitRefData = Array.from(data.values())
      .map((d) => {
        return {
          data: d,
          unit: units.find(_matchingUnit(d)),
        };
      })
      .filter((d) => d.unit != null);

    unitRefData.sort((a, b) => {
      const v1 = units.indexOf(a.unit);
      const v2 = units.indexOf(b.unit);
      return v1 - v2;
    });

    return unitRefData.map((d) => {
      const { unit, data } = d;
      const heightRange = getUnitHeightRange(unit, axisType);

      return {
        top_height: heightRange[1],
        height: heightRange[0],
        data,
        unit,
        id: unit.unit_id,
      };
    });
  }, [data, units, matchingUnit]);

  if (data == null || units == null) return null;

  return h(
    "div",
    { className },
    h(ColumnNotes, {
      width,
      paddingLeft,
      notes,
      noteComponent,
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
