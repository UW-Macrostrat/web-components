import h from "@macrostrat/hyper";

import { ColumnNotesProvider } from "./units";

import { NotesColumn, SVG, type NoteData } from "@macrostrat/column-components";
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
  /** Called when a note is clicked */
  onClickNote?: (note: NoteData) => void;
  /** Px the connector continues past each end (see `NodeConnectorOptions`) */
  connectorOverhang?: number | [number, number];
  /** Draw the marker at a point note's height (default true) */
  showPointMarker?: boolean;
  /** Options for the label force layout (e.g. `nodeSpacing`) */
  forceOptions?: object;
  className?: string;
}

export function ColumnNotes({
  notes,
  width = 200,
  noteComponent,
  paddingLeft = 60,
  deltaConnectorAttachment,
  focusedNoteComponent,
  onClickNote,
  forceOptions,
  connectorOverhang,
  showPointMarker,
  className,
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
      h(SVG, { width, height: totalHeight, paddingH: 4, className }, [
        h(NotesColumn, {
          width,
          notes,
          noteComponent,
          paddingLeft,
          deltaConnectorAttachment,
          focusedNoteComponent,
          onClickNote,
          forceOptions,
          connectorOverhang,
          showPointMarker,
        }),
      ]),
      children,
    ],
  );
}
