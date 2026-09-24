import { Meta } from "@storybook/react-vite";
import { TagSize, IntervalTag } from "../src";

export default {
  title: "Data components/Unit details/Interval tag",
  component: IntervalTag,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes,
  argsTypes: {
    interval: {
      control: "object",
    },
    size: {
      control: "select",
      options: Object.values(TagSize),
    },
    showAgeRange: {
      control: "boolean",
    },
    proportion: {
      control: { type: "number", min: 0, max: 1, step: 0.05 },
    },
    age: {
      control: "number",
    },
    multiLine: {
      control: "boolean",
    },
  },
} as Meta<any>;

const intervalData = [
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
];

export const Primary = {
  args: {
    interval: intervalData[1],
    size: TagSize.Small,
    showAgeRange: true,
  },
};

export const WithAgeRange = {
  args: {
    interval: intervalData[1],
    size: TagSize.Normal,
    showAgeRange: true,
  },
};

export const NormalSize = {
  args: {
    interval: intervalData[1],
    showAgeRange: true,
    size: TagSize.Normal,
    multiLine: false,
  },
};

export const Large = {
  args: {
    interval: intervalData[1],
    showAgeRange: true,
    size: TagSize.Large,
    multiLine: true,
  },
};

/** A position within the interval goes in the prefix ("base", "top" or a
 * percent), and the age at that position in the details. */
export const WithPosition = {
  args: {
    interval: intervalData[1],
    size: TagSize.Small,
    proportion: 0.25,
    age: 17.5,
  },
};

/** A base or top position, with the interval's range in the details. */
export const AtBase = {
  args: {
    interval: intervalData[1],
    size: TagSize.Small,
    proportion: 0,
    showAgeRange: true,
  },
};
