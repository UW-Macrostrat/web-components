import type { Meta, StoryObj } from "@storybook/react";

import { FeedbackComponent } from "../src";
import { data, entityTypes } from "./test-data";

function FeedbackInterface({ data, types }) {
  const { entities = [], paragraph_text, model, model_run, source_text } = data;

  return h(FeedbackComponent, {
    entities,
    text: paragraph_text,
    model,
    entityTypes: types,
    sourceTextID: source_text,
    runID: model_run,
  });
}
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Text extractions/Text extraction",
  component: FeedbackInterface,
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
  },
};
