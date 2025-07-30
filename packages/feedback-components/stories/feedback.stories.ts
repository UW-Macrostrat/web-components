import type { Meta, StoryObj } from "@storybook/react-vite";

import { FeedbackComponent } from "../src";
import { data, entityTypes, data2, data3, entityTypes2 } from "./test-data";
import h from "@macrostrat/hyper";

function FeedbackInterface({
  data,
  types,
  allowOverlap,
  matchLinks,
  view,
  autoSelect,
}) {
  const { entities = [], paragraph_text, model, model_run, source_text } = data;

  return h(FeedbackComponent, {
    entities,
    text: paragraph_text,
    model,
    entityTypes: createMap(types),
    sourceTextID: source_text,
    runID: model_run,
    allowOverlap,
    view,
    matchLinks,
    autoSelect,
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

const lexURL = "https://dev.macrostrat.org/lex";

export const MatchLinks: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    allowOverlap: true,
    matchLinks: {
      lithology: `${lexURL}/lithology`,
      strat_name: `${lexURL}/strat-names`,
      lith_att: `${lexURL}/lith-atts`,
      concept: `${lexURL}/strat-name-concepts`,
      interval: `${lexURL}/intervals`,
    },
  },
};

export const NoAllowOverlap: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    allowOverlap: false,
  },
};

export const ViewOnly: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    allowOverlap: false,
    view: true,
    matchLinks: {
      lithology: `${lexURL}/lithology`,
      strat_name: `${lexURL}/strat-names`,
      lith_att: `${lexURL}/lith-atts`,
      concept: `${lexURL}/strat-name-concepts`,
      interval: `${lexURL}/intervals`,
    },
  },
};

export const AutoSelect: StoryObj<{}> = {
  args: {
    data,
    types: entityTypes,
    matchLinks: {
      lithology: `${lexURL}/lithology`,
      strat_name: `${lexURL}/strat-names`,
      lith_att: `${lexURL}/lith-atts`,
      concept: `${lexURL}/strat-name-concepts`,
      interval: `${lexURL}/intervals`,
    },
    autoSelect: ["sandstone", "structure"],
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
