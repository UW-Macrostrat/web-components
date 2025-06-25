import { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  LithologyTag as _LithologyTag,
  LithologyList as _LithologyList,
  LithologyTagFeature,
} from "./lithology-tag";
import { TagSize } from "./tag";
import {
  DataField as _DataField,
  IntervalField as _IntervalField,
} from "./base";
import {
  useAPIResult,
  useToaster,
  ToasterContext,
} from "@macrostrat/ui-components";

export default {
  title: "Data components/Unit details",
  component: _LithologyTag,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes,
  decorators: [
    (Story) => {
      return h(ToasterContext, {}, h(Story));
    },
  ],
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

const LithologyTag = _LithologyTag as any;

LithologyTag.args = {
  data: {
    name: "Sandstone",
    color: "#f4a460",
    lith_id: 1,
  },
  expandOnHover: false,
  size: "normal",
  onClick: (e) => {
    console.log("Clicked lith id:", e.lith_id);
  },
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
    features: new Set([LithologyTagFeature.Proportion]),
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
    features: new Set([
      LithologyTagFeature.Attributes,
      LithologyTagFeature.Proportion,
    ]),
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
    onClickItem: (e) => {
      console.log("Clicked lith id:", e.lithId);
    },
  });
}

export function LithologyListClickable() {
  const toaster = useToaster();
  const liths = useAPIResult(
    "https://dev.macrostrat.org/api/v2/defs/lithologies",
    {
      lith_class: "sedimentary",
    },
    (res) => res.success.data
  );

  if (liths == null) {
    return h("div", "Loading lithologies...");
  }

  return h(_LithologyList, {
    lithologies: liths,
    onClickItem: (e, data) => {
      toaster.show({
        message: `Clicked lith ID: ${data.lith_id}`,
        intent: "success",
      });
    },
  });
}

export function LithologyListWithLinks() {
  const liths = useAPIResult(
    "https://dev.macrostrat.org/api/v2/defs/lithologies",
    {
      lith_class: "sedimentary",
    },
    (res) => res.success.data
  );

  if (liths == null) {
    return h("div", "Loading lithologies...");
  }

  return h(_LithologyList, {
    lithologies: liths,
    getItemHref(data) {
      return `https://dev.macrostrat.org/lex/lithology/${data.lith_id}`;
    },
  });
}
