import h from "@macrostrat/hyper";
import { useContext } from "react";
import {
  ColumnContext,
  ColumnAxisType,
  NotesColumn,
  NotesColumnProps
} from "@macrostrat/column-components";
import { INote } from "@macrostrat/column-components";
import { IUnit } from "./types";
import React from "packages/ui-components/node_modules/@types/react";

interface UnitDataProps extends NotesColumnProps {
  left?: number;
  transform: string;
  noteComponent: React.ComponentType<any>;
  shouldRenderNote?(note: INote, index: number, array: INote[]): boolean;
  divisions?: IUnit[];
}
interface UnitNamesProps extends Omit<UnitDataProps, "noteComponent"> {
  nameForDivision?(obj: IUnit): string;
}

function noteForDivision(div: IUnit, { axisType: ColumnAxisType }): INote {
  let key: string;
  switch (ColumnAxisType) {
    case "age":
      key = "age";
    case "depth":
    case "height":
      key = "pos";
  }
  return {
    height: div[`b_${key}`],
    top_height: div[`t_${key}`],
    data: div,
    id: div.unit_id
  };
}

const defaultNameFunction = div => {
  return div.unit_name
    .replace("Mbr", "Member")
    .replace("Fm", "Formation")
    .replace("Gp", "Group");
};

function UnitDataColumn(props: UnitDataProps) {
  const ctx = useContext(ColumnContext);
  const {
    left,
    noteComponent,
    shouldRenderNote = () => true,
    divisions = ctx?.divisions,
    ...rest
  } = props;

  if (divisions == null) return null;
  const notes: INote[] = divisions
    .filter(shouldRenderNote)
    .map(d => noteForDivision(d, { axisType: ctx.axisType }));

  return h(NotesColumn, {
    transform: `translate(${left || 0})`,
    editable: false,
    noteComponent,
    notes,
    forceOptions: {
      nodeSpacing: 1
    },
    ...rest
  });
}

const UnitNamesColumn = (props: UnitNamesProps) => {
  const { nameForDivision = defaultNameFunction, ...rest } = props;

  const NoteComponent = props => {
    const { note } = props;
    return h("p.col-note-label", nameForDivision(note.data));
  };

  return h(UnitDataColumn, { noteComponent: NoteComponent, ...rest });
};

export {
  UnitNamesColumn,
  defaultNameFunction,
  noteForDivision,
  UnitDataColumn,
  UnitNamesProps
};
