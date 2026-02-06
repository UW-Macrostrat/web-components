import { Meta } from "@storybook/react-vite";
import { TagSize } from "./tag";
import { IntervalTag } from "./base";

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
