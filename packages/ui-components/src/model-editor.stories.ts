import type { Meta, StoryObj } from "@storybook/react";
import {
  EditableMultilineText,
  EditableDateField,
  ModelEditor,
  ModelEditButton,
} from "./model-editor";
import h from "@macrostrat/hyper";

import { LngLatCoords, LngLatProps } from "@macrostrat/map-interface";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<LngLatProps> = {
  title: "UI components/Model Editor",
  component: ModelEditorExample,
};

export default meta;

export function ModelEditorExample(props) {
  const data = {
    title: "Test dataset",
    description:
      "Taste-testing results for peanut butter and jellyfish sandwiches",
    embargoDate: new Date(),
  };

  return h(
    ModelEditor,
    {
      model: data,
      canEdit: true,
    },
    [
      h(EditableMultilineText, { field: "title" }),
      h(EditableMultilineText, { field: "description" }),
      h(EditableDateField, { field: "embargoDate" }),
      h(ModelEditButton),
    ]
  );
}
