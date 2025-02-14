import h from "@macrostrat/hyper";
import { useContext, useCallback } from "react";
import {
  ColumnContext,
  ColumnAxisType,
  NotesColumn,
  NotesColumnProps,
} from "@macrostrat/column-components";
import type { ColumnDivision } from "@macrostrat/column-components";
import { IUnit, transformAxisType } from "./types";
import React from "react";

interface UnitDataProps extends NotesColumnProps {
  left?: number;
  transform?: string;
  noteComponent?: React.ComponentType<any>;
  shouldRenderNote?(div: ColumnDivision | IUnit, index: number): boolean;
  divisions?: IUnit[];
  minimumHeight?: number;
}

type UnitNote = {
  height: number;
  top_height: number;
  data: IUnit;
  id: number;
};

function noteForDivision(
  div: IUnit,
  opts: { axisType: ColumnAxisType }
): UnitNote {
  const { axisType } = opts;

  const key = transformAxisType(axisType);
  return {
    height: div[`b_${key}`],
    top_height: div[`t_${key}`],
    data: div,
    id: div.unit_id,
  };
}

const defaultNameFunction = (div) => {
  return div.unit_name
    .replace("Mbr", "Member")
    .replace("Fm", "Formation")
    .replace("Gp", "Group");
};

function UnitDataColumn_(props: UnitDataProps) {
  const ctx = useContext(ColumnContext);
  const {
    left,
    noteComponent,
    shouldRenderNote = (note: ColumnDivision | IUnit, i: number) => true,
    minimumHeight = 0,
    divisions = ctx?.divisions,
    ...rest
  } = props;

  const { scale } = ctx;

  const minimumHeightFilter = useCallback(
    (d) => {
      if (minimumHeight == 0) return true;
      const dy = Math.abs(scale(d.top_height) - scale(d.height));
      return dy > minimumHeight;
    },
    [scale, minimumHeight]
  );

  if (divisions == null) return null;
  const notes: UnitNote[] = divisions
    .filter(shouldRenderNote)
    .map((d: IUnit) => noteForDivision(d, { axisType: ctx.axisType }))
    .filter(minimumHeightFilter);

  return h(NotesColumn, {
    transform: `translate(${left || 0})`,
    editable: false,
    noteComponent,
    notes,
    forceOptions: {
      nodeSpacing: 1,
    },
    ...rest,
  });
}

const UnitDataColumn = React.memo(UnitDataColumn_);

interface UnitNamesProps extends UnitDataProps {
  nameForDivision?(obj: IUnit): string;
  paddingLeft?: number;
  width: number;
}

export function UnitNamesColumn(props: UnitNamesProps) {
  const {
    nameForDivision = defaultNameFunction,
    noteComponent,
    ...rest
  } = props;

  const NoteComponent = (props) => {
    const { note } = props;
    return h("p.col-note-label", nameForDivision(note.data));
  };

  return h(UnitDataColumn, {
    noteComponent: noteComponent ?? NoteComponent,
    ...rest,
  });
}

export type { UnitNamesProps };
export { defaultNameFunction, noteForDivision, UnitDataColumn };
