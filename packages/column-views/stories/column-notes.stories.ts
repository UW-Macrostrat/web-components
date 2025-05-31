import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";

import "@macrostrat/style-system";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";
import { ColumnNotes } from "../src";

const h = hyper.styled(styles);

type Story = StoryObj<typeof StandaloneColumn>;

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Column notes",
  component: StandaloneColumn,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabels: true,
  },
};

export default meta;

export function ColumnWithNotes() {
  return h(
    StandaloneColumn,
    {
      id: 483,
      showLabelColumn: false,
      width: 200,
      columnWidth: 200,
      unitComponentProps: {
        nColumns: 5,
      },
    },
    h(Notes, { width: 300 })
  );
}

function Notes({ width = 200 }) {
  const notes = [
    {
      height: 100,
      top_height: 50,
      note: "This is a note",
    },
    {
      height: 150,
      top_height: 80,
      note: "This is a second note",
      id: "note-1",
    },
    {
      height: 220,
      top_height: 180,
      note: "This is another note",
      id: "note-2",
    },
    {
      height: 50,
      note: "This is a third note",
      id: "note-3",
    },
    {
      height: 100,
      top_height: 80,
      note: "This is an overlapping note",
      id: "note-4",
    },
  ];

  return h(ColumnNotes, { notes, width });
}
