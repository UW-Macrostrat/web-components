import type { Meta, StoryObj } from "@storybook/react";

import { FeedbackComponent } from "../src";
import { data, entityTypes } from "./test-data";
import h from "@macrostrat/hyper";

function FeedbackInterface({ data, types, lineHeight }) {
  const { entities = [], paragraph_text, model, model_run, source_text } = data;

  return h(FeedbackComponent, {
    entities,
    text: paragraph_text,
    model,
    entityTypes: createMap(types),
    sourceTextID: source_text,
    runID: model_run,
    lineHeight: `${lineHeight}em`,
  });
}
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Text extractions/Text extraction",
  component: FeedbackInterface,
};

export default meta;

// add more stories here
export const Primary: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    lineHeight: 2,
  },
};

function createMap(arr) {
  const out = new Map();
  for (const d of arr) {
    out.set(d.id, d);
  }
  return out;
}
