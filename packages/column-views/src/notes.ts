import h from "@macrostrat/hyper";

import { ColumnNotesProvider } from "./units";

import {
  StaticNotesColumn,
  NotesColumn,
  SVG,
} from "@macrostrat/column-components";
import { useCompositeScale, useMacrostratColumnData } from "./data-provider";
import type { ReactNode } from "react";

interface ColumnNotesProps {
  notes: any[];
  width?: number;
  noteComponent?: any;
  paddingLeft?: number;
  deltaConnectorAttachment?: number;
  children?: ReactNode;
}

export function ColumnNotes({
  notes,
  width = 200,
  noteComponent,
  paddingLeft = 60,
  deltaConnectorAttachment,
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
          editable: true,
        }),
      ]),
      children,
    ],
  );
}
