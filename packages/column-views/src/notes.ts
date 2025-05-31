import h from "@macrostrat/hyper";

import { ColumnNotesProvider } from "./units";

import { StaticNotesColumn, SVG } from "@macrostrat/column-components";
import { useCompositeScale, useMacrostratColumnData } from "./data-provider";

interface ColumnNotesProps {
  notes: any[];
  width?: number;
  noteComponent?: any;
  paddingLeft?: number;
  deltaConnectorAttachment?: number;
}

export function ColumnNotes({
  notes,
  width = 200,
  noteComponent,
  paddingLeft = 60,
  deltaConnectorAttachment,
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
    h(SVG, { width, height: totalHeight, paddingH: 4 }, [
      h(StaticNotesColumn, {
        width,
        notes,
        noteComponent,
        paddingLeft,
        deltaConnectorAttachment,
      }),
    ])
  );
}
