import h from "@macrostrat/hyper";
import { useCallback } from "react";
import {
  ColumnAxisType,
  NotesColumn,
  type ColumnDivision,
  type NoteData,
  type NotesColumnProps,
} from "@macrostrat/column-components";
import type { IUnit } from "./types";
import React from "react";
import { useCompositeScale, useMacrostratColumnData } from "../data-provider";
import {
  type CompositeColumnScale,
  getUnitHeightRange,
} from "../prepare-units";
import { groupUnitsByLabel, type LabelGroup } from "./label-groups";

interface UnitDataProps extends NotesColumnProps {
  left?: number;
  transform?: string;
  nameForDivision?(obj: IUnit): string;
  noteComponent?: React.ComponentType<any>;
  shouldRenderNote?(div: ColumnDivision | IUnit, index: number): boolean;
  divisions?: IUnit[];
  minimumHeight?: number;
  scale?: CompositeColumnScale;
  /** One note for each run of touching units that share a name (default true) */
  coalesceLabels?: boolean;
}

interface UnitNote extends NoteData {
  height: number;
  top_height: number;
  data: IUnit;
  id: number;
  /** Every unit the note labels; `data` is the topmost */
  units: IUnit[];
}

function noteForDivision(
  div: IUnit,
  opts: { axisType: ColumnAxisType; nameForDivision?: (obj: IUnit) => string },
): UnitNote {
  const { axisType } = opts;

  const [height, top_height] = getUnitHeightRange(div, axisType);

  const nameForDivision = opts.nameForDivision ?? defaultNameFunction;

  return {
    height,
    top_height,
    data: div,
    id: div.unit_id,
    note: nameForDivision(div),
    units: [div],
  };
}

function noteForLabelGroup(group: LabelGroup<IUnit>): UnitNote {
  const [height, top_height] = group.heightRange;
  const top = group.units[0];
  return {
    height,
    top_height,
    data: top,
    id: top.unit_id,
    note: group.label,
    units: group.units,
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
    nameForDivision,
    minimumHeight = 0,
    divisions = units,
    coalesceLabels = true,
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
  const toLabel = divisions.filter(shouldRenderNote);
  let notes: UnitNote[];
  if (coalesceLabels) {
    // Merged before the height filter, so a run of thin units can earn a note
    notes = groupUnitsByLabel(toLabel, {
      axisType,
      scale,
      nameForUnit: nameForDivision ?? defaultNameFunction,
      joinOverlapping: true,
    }).map(noteForLabelGroup);
  } else {
    notes = toLabel.map((d: IUnit) =>
      noteForDivision(d, { axisType, nameForDivision }),
    );
  }
  notes = notes.filter(minimumHeightFilter);

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

export interface UnitNamesProps extends UnitDataProps {
  paddingLeft?: number;
  width: number;
  onClickNote?: (note: any) => void;
}

function UnitNameNote(props: { note: UnitNote }) {
  const { note } = props;
  return h("p.col-note-label", note.note);
}

export function UnitNamesColumn(props: UnitNamesProps) {
  const { noteComponent = UnitNameNote, ...rest } = props;
  return h(UnitDataColumn, {
    noteComponent,
    ...rest,
  });
}

export { defaultNameFunction, noteForDivision, UnitDataColumn };
