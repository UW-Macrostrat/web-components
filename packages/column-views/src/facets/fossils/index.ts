import hyper from "@macrostrat/hyper";
import {
  FossilDataType,
  PBDBCollection,
  PBDBEntity,
  PBDBOccurrence,
  useFossilData,
} from "./provider";
import type { CompositeColumnScale, IUnit } from "../../units";
import {
  BaseMeasurementsColumn,
  ColumnMeasurementData,
  MeasurementHeightData,
  standardizeMeasurementHeight,
  groupNotesByPixelDistance,
  TruncatedList,
} from "../measurements";
import { ColumnAxisType } from "@macrostrat/column-components";
import {
  useCompositeScale,
  useMacrostratColumnData,
} from "../../data-provider";
import { UnitLong } from "@macrostrat/api-types";
import styles from "./taxon-ranges.module.sass";
import { getPositionWithinUnit, getUnitHeightRange } from "../../prepare-units";
import { scaleLinear } from "d3-scale";

export * from "./taxon-ranges";

const h = hyper.styled(styles);

export { FossilDataType };

export function PBDBFossilsColumn({
  columnID,
  type = FossilDataType.Collections,
}: {
  columnID: number;
  type: FossilDataType;
}) {
  const data = useFossilData(columnID, type);
  const { axisType, units } = useMacrostratColumnData();
  const scale = useCompositeScale();

  if (data == null || units == null || scale == null) return null;

  const data1 = preparePBDBData(data, units, scale, axisType);

  return h(BaseMeasurementsColumn, {
    data: data1,
    noteComponent: FossilInfo,
    focusedNoteComponent: FossilInfo,
    className: "fossil-collections",
  });
}

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
  focused?: boolean;
}

function FossilInfo(props: FossilItemProps) {
  const { note, maxItems, focused = false } = props;
  const { data } = note;
  // Sort collections by name
  data.sort((a, b) => {
    const nameA = a.best_name ?? a.cltn_name ?? "";
    const nameB = b.best_name ?? b.cltn_name ?? "";
    return nameA.localeCompare(nameB);
  });

  return h(TruncatedList, {
    data,
    className: "fossil-collections",
    itemRenderer: PBDBCollectionLink,
    maxItems: focused ? Infinity : (maxItems ?? 5),
  });
}

const FocusedFossilInfo = (props: FossilItemProps) =>
  h(FossilInfo, { ...props, maxItems: Infinity });

function PBDBCollectionLink({
  data,
}: {
  data: PBDBCollection | PBDBOccurrence;
}) {
  /** A link to a PBDB collection that handles either an occurrence or collection object */
  return h(
    "a.link-id",
    {
      href: `https://paleobiodb.org/app/collections#display=col:${data.cltn_id}`,
      target: "_blank",
      onClick(e) {
        e.stopPropagation();
      },
    },
    data.best_name ?? data.cltn_name,
  );
}

interface PreparePBDBDataOptions {
  /** If set, group close notes within this distance (in pixels in display space)
   * into a single note. If a number is provided, that number is used as the distance,
   * otherwise a default of 5 pixels is used.
   */
  groupCloseNotes?: boolean | number;
}

function preparePBDBData<T extends PBDBEntity>(
  data: T[],
  units: UnitLong[],
  scale: CompositeColumnScale,
  axisType: ColumnAxisType,
  options?: { groupCloseNotes?: boolean | number },
) {
  /** Prepare PBDB fossil data for display in a measurements column */
  const { groupCloseNotes = true } = options ?? {};
  const groupDistance =
    typeof groupCloseNotes === "number" ? groupCloseNotes : 10;

  // Map of data to its defined height ranges
  const dataMap = new Map<string, ColumnMeasurementData<T[]>>();

  // Todo: if we wanted, we could add a step where we group notes that are too close together here...

  for (const d of data) {
    const range = getHeightRangeForPBDBEntity(d, units, axisType);

    if (range == null) continue;
    const { height, top_height } = range;
    // compose the key based on height info
    let key = `${height}`;
    if (top_height != null) {
      key += `-${top_height}`;
    }

    // Group by height key
    if (!dataMap.has(key)) {
      dataMap.set(key, {
        height,
        top_height: top_height ?? height,
        data: [],
        id: key,
      });
    }
    dataMap.get(key)!.data.push(d);
  }

  return groupNotesByPixelDistance(
    Array.from(dataMap.values()),
    scale,
    axisType,
    groupDistance,
  );
}

function getHeightRangeForPBDBEntity<T extends PBDBEntity>(
  d: T,
  units: UnitLong[],
  axisType: ColumnAxisType,
): MeasurementHeightData | null {
  let height: number | null = null;
  if (d.slb != null && d.slu == "mbsf") {
    // Meters below sea floor - special case for eODP where we have
    // specific depth data referenced
    height = Number(d.slb);
    if (axisType === ColumnAxisType.DEPTH) {
      // Data is already in depth units
      return { height };
    }
  }
  if (d.unit_id == null) return null;
  if (height != null) {
    // If we have both height and unit info, we need to adjust the height
    // to fit whatever scale type we're using.
    // TODO: we could improve how this works by having concurrent age and
    // height scales, which would allow us to do this without having to
    // reference to a specific unit.
    const unit = units.find((u) => u.unit_id === d.unit_id);
    if (unit == null) return null;
    const relHeight = getRelativePositionInUnit(
      height,
      unit,
      ColumnAxisType.DEPTH,
    );
    if (relHeight == null) return null;
    height = getPositionWithinUnit(relHeight, unit, axisType);
    return { height };
  }
  // We can just get the height within the unit, clipped to the unit boundaries
  return standardizeMeasurementHeight({ unit_id: d.unit_id }, units, axisType);
}

function getRelativePositionInUnit<T extends PBDBEntity>(
  pos: number,
  unit: UnitLong,
  axisType: ColumnAxisType,
): number | null {
  // This is the inverse of getPositionWithinUnit
  const heights = getUnitHeightRange(unit, axisType, false);
  const scale = scaleLinear(heights).domain([0, 1]);
  const relPos = scale.invert(pos);
  if (relPos < 0 || relPos > 1) return null;
  return relPos;
}
