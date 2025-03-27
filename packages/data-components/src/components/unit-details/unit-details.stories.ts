import { Meta, StoryObj } from "@storybook/react";
import h from "@macrostrat/hyper";
import { LithologyTag as _LithologyTag } from "./lithology-tag";
import { TagSize } from "./base-tag";
import {
  DataField as _DataField,
  IntervalField as _IntervalField,
  LithologyList as _LithologyList,
} from "./index";

export default {
  title: "Data components/Unit details",
  component: _LithologyTag,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<any>;

export function DataField() {
  return h(_DataField, {
    label: "Amount of radness",
    value: 50,
    unit: "rad",
  });
}

export function IntervalField() {
  return h(_IntervalField, {
    intervals: [
      {
        id: 1,
        b_age: 10,
        t_age: 0,
        name: "Quaternary",
        color: "blue",
        rank: 1,
      },
      {
        id: 2,
        b_age: 20,
        t_age: 10,
        name: "Neogene",
        color: "green",
        rank: 2,
      },
    ],
  });
}

const LithologyTag = _LithologyTag;

LithologyTag.args = {
  data: {
    name: "Sandstone",
    color: "#f4a460",
    lith_id: 1,
  },
  expandOnHover: false,
  size: "normal",
};

export { LithologyTag };

export const LithologyTagWithProportion = {
  args: {
    data: {
      name: "Shale",
      color: "#708090",
      lith_id: 2,
      prop: 0.5,
    },
    showProportion: true,
    size: "normal",
  },
};

export const LithologyTagWithAtts = {
  args: {
    data: {
      name: "shale",
      color: "#708090",
      lith_id: 8,
      prop: 0.125,
      atts: ["red", "purple"],
    },
    showProportion: true,
    showAttributes: true,
    size: TagSize.Normal,
  },
};

export function LithologyList() {
  return h(_LithologyList, {
    lithologies: [
      {
        name: "Sandstone",
        color: "#f4a460",
        lith_id: 1,
      },
      {
        name: "Shale",
        color: "#708090",
        lith_id: 2,
      },
    ],
  });
}
