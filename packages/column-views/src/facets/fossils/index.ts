import h from "@macrostrat/hyper";
import {
  FossilDataType,
  PBDBCollection,
  PBDBOccurrence,
  useFossilData,
} from "./provider";
import type { IUnit } from "../../units";
import { BaseMeasurementsColumn, TruncatedList } from "../base-sample-column";
import { FlexRow, JSONView } from "@macrostrat/ui-components";
import { InternMap } from "d3-array";
import { ColumnAxisType, ColumnSVG } from "@macrostrat/column-components";
import { useMacrostratColumnData } from "@macrostrat/column-views";
import { UnitLong } from "@macrostrat/api-types";

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
  const data = useFossilData(columnID, type);

  return h(BaseMeasurementsColumn, {
    data,
    noteComponent: FossilInfo,
    className: "fossil-collections",
    matchingUnit,
  });
}

export function PBDBOccurrencesMatrix({ columnID }) {
  /* A column for a matrix of taxon occurrences displayed as a table beside the main column. This will
  eventually be extended with first/last occurrence markers and range bars.
   */
  const data = useFossilData(columnID, FossilDataType.Occurrences) as InternMap<
    number,
    PBDBOccurrence[]
  >;

  // convert the data to a map
  const occurrenceMap = new Map(data);

  const matrix = createOccurrenceMatrix(occurrenceMap);
  const col = useMacrostratColumnData();

  const { taxonUnitMap } = matrix;

  const padding = 5;
  const spacing = 8;

  const taxonEntries = Array.from(taxonUnitMap.entries());
  const taxon = taxonEntries.slice(0, 50); // limit to top 50 taxa

  return h(FlexRow, [
    h(
      ColumnSVG,
      { width: padding * 2 + spacing * taxon.length },
      h(
        "g",
        taxonEntries.map(([taxonName, unitSet], rowIndex) => {
          return h(TaxonOccurrenceEntry, {
            xPosition: padding + rowIndex * spacing,
            units: unitSet,
          });
        }),
      ),
    ),
    h(JSONView, { data: { matrix, column: col } }),
  ]);
}

type TaxonUnitMap = Map<string, Set<number>>;

interface OccurrenceMatrixData {
  occurrenceMap: Map<number, PBDBOccurrence[]>; // Map of unit IDs to occurrences (original data)
  taxonUnitMap: TaxonUnitMap; // Map of taxon names to sets of unit IDs
  taxonOccurrenceMap: Map<string, PBDBOccurrence[]>; // Map of taxon names to occurrences
}

function TaxonOccurrenceEntry({
  xPosition,
  units,
}: {
  xPosition: number;
  units: Set<number>;
}) {
  const col = useMacrostratColumnData();
  const height = col.totalHeight;
  return h(
    "g",
    { transform: `translate(${xPosition})` },
    col.sections.map((section) => {
      const { units: sectionUnits, scaleInfo } = section;

      const presenceUnits = accumulatePresenceDomains(
        sectionUnits,
        units,
        col.axisType,
      );

      console.log(presenceUnits);

      const { scale } = scaleInfo;

      return presenceUnits.map(([top, bottom]) => {
        return h("line", {
          y1: scale(top),
          y2: scale(bottom),
          stroke: "black",
          strokeWidth: 2,
        });
      });
    }),
  );
}

function accumulatePresenceDomains(
  unit: UnitLong[],
  presenceUnits: Set<number>,
  axisType: ColumnAxisType,
): Array<[number, number]> {
  const domains: Array<[number, number]> = [];
  let currentDomain: [number, number] | null = null;

  for (const u of unit) {
    if (presenceUnits.has(u.unit_id)) {
      if (currentDomain == null) {
        if (
          axisType == ColumnAxisType.DEPTH ||
          axisType == ColumnAxisType.HEIGHT
        ) {
          currentDomain = [u.t_pos, u.b_pos];
        } else {
          currentDomain = [u.t_age, u.b_age];
        }
      } else {
        if (
          axisType == ColumnAxisType.DEPTH ||
          axisType == ColumnAxisType.HEIGHT
        ) {
          currentDomain[1] = u.b_pos;
        } else {
          currentDomain[1] = u.b_age;
        }
      }
    } else {
      if (currentDomain != null) {
        domains.push(currentDomain);
        currentDomain = null;
      }
    }
  }

  if (currentDomain != null) {
    domains.push(currentDomain);
  }

  return domains;
}

function createOccurrenceMatrix(
  data: Map<number, PBDBOccurrence[]>,
): OccurrenceMatrixData {
  const taxonUnitMap = new Map<string, Set<number>>();
  const taxonOccurrenceMap = new Map<string, PBDBOccurrence[]>();

  for (const [unit_id, occurrences] of data.entries()) {
    for (const occ of occurrences) {
      const taxonName = occ.best_name ?? occ.taxon_name;
      if (!taxonUnitMap.has(taxonName)) {
        taxonUnitMap.set(taxonName, new Set());
        taxonOccurrenceMap.set(taxonName, []);
      }
      taxonUnitMap.get(taxonName).add(unit_id);
      taxonOccurrenceMap.get(taxonName).push(occ);
    }
  }

  // sort the taxon occurrence map by number of occurrences
  const sortedTaxa = Array.from(taxonUnitMap.entries()).sort((a, b) => {
    return b[1].size - a[1].size;
  });

  return {
    occurrenceMap: data,
    taxonUnitMap: new Map(sortedTaxa),
    taxonOccurrenceMap: taxonOccurrenceMap,
  };
}
