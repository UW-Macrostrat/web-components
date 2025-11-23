import h from "@macrostrat/hyper";
import {
  FossilDataType,
  PBDBCollection,
  PBDBOccurrence,
  useFossilData,
} from "./provider";
import type { IUnit } from "../../units";
import { BaseMeasurementsColumn, TruncatedList } from "../base-sample-column";

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
