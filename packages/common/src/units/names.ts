import h from "@macrostrat/hyper";
import { useContext } from "react";
import {
  ColumnContext,
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
  shouldRenderNote?(note: INote): boolean;
  divisions?: IUnit[];
}
interface UnitNamesProps extends Omit<UnitDataProps, "noteComponent"> {
  nameForDivision?(obj: IUnit): string;
}

function noteForDivision(div: IUnit): INote {
  return {
    height: div.b_age,
    top_height: div.t_age,
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
  const {
    left,
    noteComponent,
    shouldRenderNote = () => true,
    divisions = useContext(ColumnContext)?.divisions,
    ...rest
  } = props;

  if (divisions == null) return null;
  const notes: INote[] = divisions
    .filter(shouldRenderNote)
    .map(noteForDivision);

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
