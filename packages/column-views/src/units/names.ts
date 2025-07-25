import h from "@macrostrat/hyper";
import { useCallback, useMemo } from "react";
import {
  ColumnAxisType,
  NotesColumn,
  NotesColumnProps,
} from "@macrostrat/column-components";
import type { ColumnDivision } from "@macrostrat/column-components";
import { IUnit } from "./types";
import React from "react";
import { getUnitHeightRange } from "../prepare-units/utils";
import { CompositeColumnScale } from "./composite";
import { useCompositeScale, useMacrostratColumnData } from "../data-provider";

interface UnitDataProps extends NotesColumnProps {
  left?: number;
  transform?: string;
  noteComponent?: React.ComponentType<any>;
  shouldRenderNote?(div: ColumnDivision | IUnit, index: number): boolean;
  divisions?: IUnit[];
  minimumHeight?: number;
  scale?: CompositeColumnScale;
}

type UnitNote = {
  height: number;
  top_height: number;
  data: IUnit;
  id: number;
};

function noteForDivision(
  div: IUnit,
  opts: { axisType: ColumnAxisType },
): UnitNote {
  const { axisType } = opts;

  const [height, top_height] = getUnitHeightRange(div, axisType);

  return {
    height,
    top_height,
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
  const { axisType, units } = useMacrostratColumnData();
  const scale = useCompositeScale();
  const {
    left = 0,
    noteComponent,
    shouldRenderNote = (note: ColumnDivision | IUnit, i: number) => true,
    minimumHeight = 0,
    divisions = units,
    ...rest
  } = props;

  const minimumHeightFilter = useCallback(
    (d) => {
      if (minimumHeight == 0) return true;
      const dy = Math.abs(scale(d.top_height) - scale(d.height));
      return dy > minimumHeight;
    },
    [scale, minimumHeight],
  );

  if (divisions == null) return null;
  const notes: UnitNote[] = divisions
    .filter(shouldRenderNote)
    .map((d: IUnit) => noteForDivision(d, { axisType }))
    .filter(minimumHeightFilter);

  return h(NotesColumn, {
    transform: `translate(${left})`,
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
  onClickNote?: (note: any) => void;
}

export function UnitNamesColumn(props: UnitNamesProps) {
  const {
    nameForDivision = defaultNameFunction,
    noteComponent,
    ...rest
  } = props;

  const defaultNoteComponent = useMemo(
    () => (props) => {
      const { note } = props;
      return h("p.col-note-label", nameForDivision(note.data));
    },
    [nameForDivision],
  );

  return h(UnitDataColumn, {
    noteComponent: noteComponent ?? defaultNoteComponent,
    ...rest,
  });
}

export type { UnitNamesProps };
export { defaultNameFunction, noteForDivision, UnitDataColumn };
