import type { Meta, StoryObj } from "@storybook/react-vite";

import { FeedbackComponent } from "../src";
import { data, entityTypes, data2, data3, entityTypes2 } from "./test-data";
import h from "@macrostrat/hyper";

function FeedbackInterface({ data, types, allowOverlap }) {
  const { entities = [], paragraph_text, model, model_run, source_text } = data;

  return h(FeedbackComponent, {
    entities,
    text: paragraph_text,
    model,
    entityTypes: createMap(types),
    sourceTextID: source_text,
    runID: model_run,
    allowOverlap,
  });
}
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Text extractions/Text extraction",
  component: FeedbackInterface,
};

export default meta;

// add more stories here
export const AllowOverlap: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    allowOverlap: true,
  },
};

export const NoAllowOverlap: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    allowOverlap: false,
  },
};

export const ShowMatches: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    allowOverlap: false,
  },
};

export const TestData2: StoryObj<{}> = {
  args: {
    data: data2,
    types: entityTypes2,
    allowOverlap: false,
  },
};

export const TestData3: StoryObj<{}> = {
  args: {
    data: data3,
    types: entityTypes2,
    allowOverlap: true,
  },
};

function createMap(arr) {
  const out = new Map();
  for (const d of arr) {
    out.set(d.id, d);
  }
  return out;
}
