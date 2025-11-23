import { getUnitHeightRange } from "../../prepare-units";
import { useMacrostratColumnData } from "../../data-provider";
import hyper from "@macrostrat/hyper";
import {
  FossilDataType,
  PBDBCollection,
  PBDBOccurrence,
  useFossilData,
} from "./provider";
import { ColumnNotes } from "../../notes";
import { useMemo } from "react";
import type { IUnit } from "../../units";
import styles from "./index.module.sass";
import { useCallback } from "react";

const h = hyper.styled(styles);

export { FossilDataType };

interface FossilItemProps {
  note: {
    data: PBDBCollection[];
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

function FossilInfo(props: FossilItemProps) {
  const { note, spacing } = props;
  const { data, unit } = note;

  return h(TruncatedList, {
    data,
    className: "fossil-collections",
    itemRenderer: PBDBCollectionLink,
  });
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

function PBDBCollectionLink({
  data,
}: {
  data: PBDBCollection | PBDBOccurrence;
}) {
  /** A link to a PBDB collection that handles either an occurrence or collection object */
  return h(
    "a.link-id",
    {
      href: `https://paleobiodb.org/classic/basicCollectionSearch?collection_no=${data.cltn_id}`,
    },
    data.best_name ?? data.cltn_name,
  );
}

const matchingUnit = (dz) => (d) => d.unit_id == dz.unit_id;

export function PBDBFossilsColumn({
  columnID,
  type = FossilDataType.Collections,
}: {
  columnID: number;
  type: FossilDataType;
}) {
  const data = useFossilData({ col_id: columnID, type });

  const { axisType, units } = useMacrostratColumnData();

  const notes: any[] = useMemo(() => {
    if (data == null || units == null) return [];
    let unitRefData = Array.from(data.values())
      .map((d) => {
        return {
          data: d,
          unit: units.find(matchingUnit(d[0])),
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
  }, [data, units]);

  const width = 500;
  const paddingLeft = 40;

  const noteComponent = useMemo(() => {
    return (props) => {
      return h(FossilInfo, {
        ...props,
      });
    };
  }, [width]);

  if (data == null || units == null) return null;

  return h(
    "div.dz-spectra",
    h(ColumnNotes, {
      width,
      paddingLeft,
      notes,
      noteComponent,
    }),
  );
}

export interface BaseMeasurementsColumnProps<T> {
  data: T[];
  noteComponent?: any;
  width?: number;
  paddingLeft?: number;
  className?: string;
  getUnitID?: (d: T) => number | string;
}

export function BaseMeasurementsColumn({
  data,
  noteComponent,
  width = 500,
  paddingLeft = 40,
  className,
  getUnitID = (d) => d.unit_id,
}: BaseMeasurementsColumnProps<any>) {
  const { axisType, units } = useMacrostratColumnData();

  const matchingUnit = useCallback(
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
          unit: units.find(matchingUnit(d)),
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
