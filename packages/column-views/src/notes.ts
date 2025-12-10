import h from "@macrostrat/hyper";

import { ColumnNotesProvider } from "./units";

import { NotesColumn, SVG } from "@macrostrat/column-components";
import { useCompositeScale, useMacrostratColumnData } from "./data-provider";
import type { ComponentType, ReactNode } from "react";

interface ColumnNotesProps {
  notes: any[];
  width?: number;
  noteComponent?: any;
  paddingLeft?: number;
  deltaConnectorAttachment?: number;
  children?: ReactNode;
  focusedNoteComponent?: ComponentType<any> | null;
}

export function ColumnNotes({
  notes,
  width = 200,
  noteComponent,
  paddingLeft = 60,
  deltaConnectorAttachment,
  focusedNoteComponent,
  children,
}: ColumnNotesProps) {
  const { totalHeight } = useMacrostratColumnData();
  const scale = useCompositeScale();

  return h(
    ColumnNotesProvider,
    {
      scale,
      totalHeight,
      pixelScale: -1,
    },
    [
      h(SVG, { width, height: totalHeight, paddingH: 4 }, [
        h(NotesColumn, {
          width,
          notes,
          noteComponent,
          paddingLeft,
          deltaConnectorAttachment,
          focusedNoteComponent,
        }),
      ]),
      children,
    ],
  );
}
