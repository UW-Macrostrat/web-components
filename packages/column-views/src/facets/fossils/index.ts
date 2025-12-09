import hyper from "@macrostrat/hyper";
import {
  FossilDataType,
  PBDBCollection,
  PBDBEntity,
  PBDBOccurrence,
  useFossilData,
} from "./provider";
import type { IUnit } from "../../units";
import {
  BaseMeasurementsColumn,
  ColumnMeasurementData,
  standardizeMeasurementHeight,
  TruncatedList,
} from "../measurements";
import { group } from "d3-array";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useMacrostratColumnData } from "../../data-provider";
import { UnitLong } from "@macrostrat/api-types";
import styles from "./taxon-ranges.module.sass";
export * from "./taxon-ranges";

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
  const { note } = props;
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

const isMatchingUnit = (meas, unit) => unit.unit_id == meas[0].unit_id;

function preparePBDBData<T extends PBDBEntity>(
  data: T[],
  units: UnitLong[],
  axisType: ColumnAxisType,
  grouped: boolean = true,
) {
  /** Prepare PBDB fossil data for display in a measurements column */
  if (grouped) {
    return preparePBDBDataGrouped(data, units, axisType);
  }

  const dataMap = new Map<string, ColumnMeasurementData<T>>();

  console.log("Preparing PBDB data", data);

  for (const d of data) {
    const key = d.slb;
    const height = Number(d.slb);
    if (!dataMap.has(key)) {
      dataMap.set(key, {
        height,
        data: [],
        id: key,
      });
    }
    dataMap.get(key)!.data.push(d);
  }

  return Array.from(dataMap.values());
}

function preparePBDBDataGrouped<T extends PBDBEntity>(
  data: T[],
  units: UnitLong[],
  axisType: ColumnAxisType,
) {
  /** Prepare PBDB fossil data for display in a measurements column */
  // First, group data by unit ID

  const data1 = group(data, (d) => d.unit_id);

  return Array.from(data1.entries())
    .map(([unit_id, data]) => {
      const heightRange = standardizeMeasurementHeight(
        { unit_id },
        units,
        axisType,
      );
      if (heightRange == null) return null;
      return {
        ...heightRange,
        data,
        id: Number(unit_id),
      };
    })
    .filter((d) => d != null);
}

export function PBDBFossilsColumn({
  columnID,
  type = FossilDataType.Collections,
}: {
  columnID: number;
  type: FossilDataType;
}) {
  const data = useFossilData(columnID, type);
  const { axisType, units } = useMacrostratColumnData();

  if (data == null || units == null) return null;

  const data1 = preparePBDBData(data, units, axisType, false);

  return h(BaseMeasurementsColumn, {
    data: data1,
    noteComponent: FossilInfo,
    className: "fossil-collections",
    isMatchingUnit,
  });
}
