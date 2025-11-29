import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  EditableMultilineText,
  EditableDateField,
  ModelEditor,
  ModelEditButton,
} from "../src/model-editor";
import h from "@macrostrat/hyper";
import "./stories.sass";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
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
      h("div.model-editor-example", [
        h(EditableMultilineText, { field: "title", className: "title-text" }),
        h(EditableMultilineText, { field: "description" }),
        h(EditableDateField, { field: "embargoDate" }),
        h(ModelEditButton),
      ]),
    ],
  );
}
