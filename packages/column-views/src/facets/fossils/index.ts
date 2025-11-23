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
import { useCallback, useMemo } from "react";
import type { IUnit } from "../../units";
import styles from "./index.module.sass";
import { BaseMeasurementsColumn } from "@macrostrat/column-views";

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

const matchingUnit = (dz) => (d) => d.unit_id == dz[0].unit_id;

export function PBDBFossilsColumn({
  columnID,
  type = FossilDataType.Collections,
}: {
  columnID: number;
  type: FossilDataType;
}) {
  const data = useFossilData({ col_id: columnID, type });

  return h(BaseMeasurementsColumn, {
    data,
    noteComponent: FossilInfo,
    className: "fossil-collections",
    matchingUnit,
  });
}
