import { getUnitHeightRange } from "../../prepare-units";
import { useMacrostratColumnData } from "../../data-provider";
import hyper from "@macrostrat/hyper";
import { PBDBCollection, useFossilData } from "./provider";
import { useMacrostratUnits } from "../../data-provider";
import { ColumnNotes } from "../../notes";
import { useMemo } from "react";
import type { IUnit } from "../../units";
import styles from "./index.module.sass";

const h = hyper.styled(styles);

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

  let d1 = data;

  let tooMany = null;
  if (data.length > 5) {
    const n = data.length - 5;
    d1 = data.slice(0, 5);
    tooMany = h("li.too-many", `and ${n} more`);
  }

  return h("ul.fossil-collections", [
    d1.map((d) => {
      return h("li.collection", { key: d.cltn_id }, [
        h(PBDBCollectionLink, { collection: d }),
      ]);
    }),
    tooMany,
  ]);
}

function PBDBCollectionLink({ collection }: { collection: PBDBCollection }) {
  return h(
    "a.link-id",
    {
      href: `https://paleobiodb.org/classic/basicCollectionSearch?collection_no=${collection.cltn_id}`,
    },
    collection.cltn_name
  );
}

const matchingUnit = (dz) => (d) => d.unit_id == dz.unit_id;

export function PBDBFossilsColumn({ columnID, color = "magenta" }) {
  const data = useFossilData({ col_id: columnID });
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
        color,
        ...props,
      });
    };
  }, [width, color]);

  if (data == null || units == null) return null;

  return h(
    "div.dz-spectra",
    h(ColumnNotes, {
      width,
      paddingLeft,
      notes,
      noteComponent,
    })
  );
}
