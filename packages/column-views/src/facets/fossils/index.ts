import hyper from "@macrostrat/hyper";
import {
  FossilDataType,
  PBDBCollection,
  PBDBOccurrence,
  useFossilData,
} from "./provider";
import type { IUnit } from "../../units";
import { BaseMeasurementsColumn, TruncatedList } from "../base-sample-column";
import { Box, useElementSize } from "@macrostrat/ui-components";
import { InternMap } from "d3-array";
import { ColumnAxisType, ColumnSVG } from "@macrostrat/column-components";
import {
  useMacrostratColumnData,
  useCompositeScale,
} from "../../data-provider";
import { UnitLong } from "@macrostrat/api-types";
import styles from "./index.module.sass";
import { useRef } from "react";

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
    isMatchingUnit,
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

  const col = useMacrostratColumnData();
  const matrix = createOccurrenceMatrix(col.units, occurrenceMap, col.axisType);

  const scale = useCompositeScale();

  const { taxonRanges } = matrix;

  const padding = 16;
  const spacing = 16;

  const taxonEntries = Array.from(taxonRanges.entries());
  //const taxon = taxonEntries.slice(0, 50); // limit to top 50 taxa

  const width = padding * 2 + spacing * taxonEntries.length;

  return h(Box, { className: "taxon-ranges", width, height: col.totalHeight }, [
    h(TaxonOccurrenceLabels, {
      taxonEntries,
      padding,
      spacing,
      scale,
    }),
    h(
      ColumnSVG,
      {
        width: padding * 2 + spacing * taxonEntries.length,
      },
      h(
        "g.taxa-occurrences-matrix",
        taxonEntries.map(([taxonName, ranges], rowIndex) => {
          const xPosition = padding + rowIndex * spacing;
          return h("g", { transform: `translate(${xPosition})` }, [
            ranges.map(([top, bottom]) => {
              return h("line", {
                y1: scale(top),
                y2: scale(bottom),
              });
            }),
          ]);
        }),
      ),
    ),
  ]);
}

function TaxonOccurrenceLabels({ taxonEntries, padding, spacing, scale }) {
  return h("div.taxon-labels", [
    taxonEntries.map(([taxonName, ranges], rowIndex) => {
      const top = ranges[0]?.[0] ?? 0;
      let topPx = scale(top) - 20;
      if (topPx < 200) topPx = 0;

      return h(TaxonLabel, {
        top: topPx,
        left: padding + rowIndex * spacing,
        taxonName,
      });
    }),
  ]);
}

function TaxonLabel({ top, left, taxonName }) {
  const ref = useRef();
  const textSize = useElementSize(ref);
  const labelWidth = textSize?.height ?? 200;
  return h(
    "div.taxon-label",
    {
      style: {
        top: `${top}px`,
        marginLeft: `${left}px`,
        "--label-width": `${labelWidth}px`,
      },
    },
    h("div.taxon-label-inner", h("div.taxon-label-text", { ref }, taxonName)),
  );
}

type TaxonUnitMap = Map<string, Set<number>>;

interface OccurrenceMatrixData {
  occurrenceMap: Map<number, PBDBOccurrence[]>; // Map of unit IDs to occurrences (original data)
  taxonUnitMap: TaxonUnitMap; // Map of taxon names to sets of unit IDs
  taxonOccurrenceMap: Map<string, PBDBOccurrence[]>; // Map of taxon names to occurrences
  taxonRanges: Map<string, [number, number][]>; // Map of taxon names to [top, bottom] pixel ranges
}

function TaxonOccurrenceEntry({
  xPosition,
  ranges,
  scale,
  name,
}: {
  xPosition: number;
  units: Set<number>;
}) {
  return h("g", { transform: `translate(${xPosition})` }, [
    ranges.map(([top, bottom]) => {
      return h("line", {
        y1: scale(top),
        y2: scale(bottom),
      });
    }),
  ]);
}

function createOccurrenceMatrix(
  units: UnitLong[],
  data: Map<number, PBDBOccurrence[]>,
  axisType: ColumnAxisType = ColumnAxisType.AGE,
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
    // Sort alphabetically by taxon name
    return b[0].localeCompare(a[0]);
  });

  const taxonRanges = new Map<string, [number, number][]>();
  for (const [taxonName, unitSet] of taxonUnitMap.entries()) {
    taxonRanges.set(
      taxonName,
      accumulatePresenceDomains(units, unitSet, axisType),
    );
  }

  return {
    occurrenceMap: data,
    taxonUnitMap: new Map(sortedTaxa),
    taxonOccurrenceMap: taxonOccurrenceMap,
    taxonRanges,
  };
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
