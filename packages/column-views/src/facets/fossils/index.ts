import { IUnit } from "@macrostrat/column-views";
import hyper from "@macrostrat/hyper";
import { FossilDataType, PBDBCollection, useFossilData } from "./provider";
import { useMacrostratUnits } from "../../data-provider";
import { ColumnNotes } from "../../notes";
import { useMemo } from "react";
import styles from "./index.module.sass";
import classNames from "classnames";

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

  const spaceBelow = spacing?.below ?? 100;

  return h("ul.fossil-collections", [
    d1.map((d) => {
      return h("li.collection", [h(PBDBCollectionLink, { collection: d })]);
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

const matchingUnit = (dz) => (d) => d.unit_id == dz[0].unit_id;

export function PBDBFossilsColumn({ columnID, color = "magenta" }) {
  const data = useFossilData({ col_id: columnID });
  const units = useMacrostratUnits();

  const notes: any[] = useMemo(() => {
    if (data == null || units == null) return [];
    let dzUnitData = Array.from(data.values());
    dzUnitData.sort((a, b) => {
      const v1 = units.findIndex(matchingUnit(a));
      const v2 = units.findIndex(matchingUnit(b));
      return v1 > v2;
    });

    const data1 = dzUnitData.map((d) => {
      const unit = units.find(matchingUnit(d));
      return {
        top_height: unit?.t_age,
        height: unit?.b_age,
        data: d,
        unit,
        id: unit?.unit_id,
      };
    });

    return data1.filter((d) => d.unit != null);
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
