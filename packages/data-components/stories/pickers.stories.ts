/**
 * Pickers for controlled vocabularies: lithologies (with their proportions
 * and attributes) and environments as rows of tags, and a chronostratigraphic
 * position (an interval, a position within it, a derived age, an optional
 * timescale constraint).
 *
 * The chosen items are the tags themselves. Select one (click, or focus and
 * Enter) to open its details editor; Delete removes it; the arrow keys move
 * between tags. Every story but "Custom vocabularies" reads its vocabularies
 * from the `MacrostratDataProvider`, which is how the pickers are meant to be
 * used.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { Switch } from "@blueprintjs/core";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import {
  EnvironmentPicker,
  type EnvironmentValue,
  type IntervalPosition,
  IntervalPositionEditor,
  LithologyPicker,
  type PickerItem,
  TagDetailsEditor,
  TagPicker,
  type UnitLithologyValue,
  macrostratProportionTerms,
  ngsProportionTerms,
  ProportionEditor,
  resolveLithologyProportions,
} from "../src/pickers";
import { Tag, TagSize } from "../src/components/unit-details/tag";
import h from "./pickers.stories.module.sass";

const meta: Meta<any> = {
  title: "Data components/Pickers",
  parameters: { layout: "padded" },
  decorators: [
    (StoryFn) =>
      h(MacrostratDataProvider, { baseURL: "https://macrostrat.org/api/v2" }, [
        h(StoryFn),
      ]),
  ],
};

export default meta;

/* --------------------------------------------------------- starting values */

const unitLithologies: UnitLithologyValue[] = [
  { lith_id: 10, name: "sandstone", prop: 0.6, atts: ["fine"] },
  { lith_id: 8, name: "shale", prop: 0.4 },
  { lith_id: 30, name: "limestone" },
];

const unitEnvironments: EnvironmentValue[] = [
  { environ_id: 1, name: "peritidal" },
];

/* ----------------------------------------------------------------- stories */

/** Selecting a lithology opens a menu: add a proportion, add attributes, or
 * remove it. The proportion and attributes are then drawn on the tag. */
export const Lithologies: StoryObj<any> = {
  render: () => h(LithologyDemo, { detailsMode: "popover" }),
};

/** The same picker with `detailsMode: "inline"`: the selected lithology's
 * fields are laid out below the picker instead of in a popover, and its
 * attributes are a picker of their own. */
export const LithologiesInline: StoryObj<any> = {
  render: () => h(LithologyDemo, { detailsMode: "inline" }),
};

/** An environment carries nothing of its own, so there is no editor to
 * open: a selected environment is followed by its ✕. */
export const Environments: StoryObj<any> = {
  render() {
    const [envs, setEnvs] = useState<EnvironmentValue[]>(unitEnvironments);
    return h(Story, { state: envs }, [
      h(Example, {
        title: "Environments",
        children: h(EnvironmentPicker, { value: envs, onChange: setEnvs }),
      }),
    ]);
  },
};

/** An interval, with the position within it drawn in its tag. Selecting the
 * tag opens the position control inline, as a nested control with no header
 * (its ✕ drops the position), and puts the interval's own ✕ after the tag;
 * the caret changes the interval, keeping the position. */
export const IntervalPositions: StoryObj<any> = {
  render() {
    const [base, setBase] = useState<IntervalPosition>({
      int_id: 94,
      int_name: "Devonian",
      prop: 0.25,
    });
    const [top, setTop] = useState<IntervalPosition>({
      int_id: 84,
      int_name: "Carboniferous",
      prop: null,
    });
    const [calibration, setCalibration] = useState<IntervalPosition>({
      int_id: null,
      prop: null,
    });
    return h(Story, { state: { base, top, calibration } }, [
      h(Example, {
        title: "Base of unit",
        note: "Select the tag to set the position within the interval.",
        children: h(IntervalPositionEditor, { value: base, onChange: setBase }),
      }),
      h(Example, {
        title: "Top of unit, within one timescale",
        note: "The timescale is imposed from outside, so it is shown by name and only its intervals are offered. A position added here starts at the interval's top.",
        children: h(IntervalPositionEditor, {
          value: top,
          onChange: setTop,
          timescale: { timescale_id: 3, timescale: "international periods" },
          defaultProportion: 1,
        }),
      }),
      h(Example, {
        title: "A calibration, with a choice of timescale",
        note: "`timescaleChoice` offers the provider's timescales to narrow the intervals. Its position control opens in a popover.",
        children: h(IntervalPositionEditor, {
          value: calibration,
          onChange: setCalibration,
          timescaleChoice: true,
          detailsMode: "popover",
        }),
      }),
    ]);
  },
};

/** Proportions set as terms as well as numbers. Each picker's proportion
 * editor offers a vocabulary of abundances; the tag shows the term, and with
 * `resolveProportions` every change also carries each lithology's share of
 * the whole (`comp_prop`), summed to one as Macrostrat's backend does it. */
export const ProportionVocabularies: StoryObj<any> = {
  render() {
    // Resolved from the start, as every change resolves them
    const [macrostrat, setMacrostrat] = useState<UnitLithologyValue[]>(() =>
      resolveLithologyProportions([
        {
          lith_id: 10,
          name: "sandstone",
          prop_term: macrostratProportionTerms[0],
        },
        { lith_id: 8, name: "shale", prop_term: macrostratProportionTerms[1] },
        { lith_id: 30, name: "limestone", prop: 0.1 },
      ]),
    );
    const [ngs, setNGS] = useState<UnitLithologyValue[]>(() =>
      resolveLithologyProportions([
        { lith_id: 10, name: "sandstone", prop_term: ngsProportionTerms[3] },
        { lith_id: 9, name: "siltstone", prop_term: ngsProportionTerms[6] },
        { lith_id: 8, name: "shale", prop_term: ngsProportionTerms[9] },
      ]),
    );
    return h(Story, { state: { macrostrat, ngs } }, [
      h(Example, {
        title: "Macrostrat major/minor, or a percentage",
        note: "Major and minor are weighted five to one; a percentage is taken as given, and the terms share what it leaves.",
        children: [
          h(LithologyPicker, {
            value: macrostrat,
            onChange: setMacrostrat,
            proportions: { terms: macrostratProportionTerms },
            resolveProportions: true,
          }),
          h(ResolvedShares, { value: macrostrat }),
        ],
      }),
      h(Example, {
        title: "NGS abundance terms only",
        note: '`numeric: false`: a proportion is one of the terms. "All" implies 100%.',
        children: [
          h(LithologyPicker, {
            value: ngs,
            onChange: setNGS,
            proportions: { numeric: false, terms: ngsProportionTerms },
            resolveProportions: true,
          }),
          h(ResolvedShares, { value: ngs }),
        ],
      }),
    ]);
  },
};

/** Without removal: `removable: false` on the picker takes the ✕ off its
 * header and Delete off its tags, and `clearable: false` on the proportions
 * does the same for a proportion once it is set — it can be changed, but not
 * taken away. Lithologies can still be added. */
export const WithoutRemoval: StoryObj<any> = {
  render() {
    const [liths, setLiths] = useState<UnitLithologyValue[]>(() =>
      resolveLithologyProportions([
        {
          lith_id: 10,
          name: "sandstone",
          prop_term: macrostratProportionTerms[0],
        },
        { lith_id: 8, name: "shale", prop_term: macrostratProportionTerms[1] },
      ]),
    );
    return h(Story, { state: liths }, [
      h(Example, {
        title: "Lithology",
        children: h(LithologyPicker, {
          value: liths,
          onChange: setLiths,
          removable: false,
          proportions: { terms: macrostratProportionTerms, clearable: false },
          resolveProportions: true,
        }),
      }),
    ]);
  },
};

/** The pickers with large tags. */
export const LargeTags: StoryObj<any> = {
  render() {
    const [liths, setLiths] = useState<UnitLithologyValue[]>(unitLithologies);
    const [envs, setEnvs] = useState<EnvironmentValue[]>(unitEnvironments);
    const [base, setBase] = useState<IntervalPosition>({
      int_id: 94,
      int_name: "Devonian",
      prop: 0.25,
    });
    return h(Story, { state: { liths, envs, base } }, [
      h(Example, {
        title: "Lithology",
        children: h(LithologyPicker, {
          value: liths,
          onChange: setLiths,
          size: TagSize.Large,
        }),
      }),
      h(Example, {
        title: "Environment",
        children: h(EnvironmentPicker, {
          value: envs,
          onChange: setEnvs,
          size: TagSize.Large,
        }),
      }),
      h(Example, {
        title: "Base of unit",
        children: h(IntervalPositionEditor, {
          value: base,
          onChange: setBase,
          size: TagSize.Large,
        }),
      }),
    ]);
  },
};

/** Every picker without `onChange`: the value as a viewer draws it. */
export const ReadOnly: StoryObj<any> = {
  render: () =>
    h(Story, [
      h(Example, {
        title: "Lithology",
        children: h(LithologyPicker, { value: unitLithologies }),
      }),
      h(Example, {
        title: "Environment",
        children: h(EnvironmentPicker, { value: unitEnvironments }),
      }),
      h(Example, {
        title: "Base of unit",
        children: h(IntervalPositionEditor, {
          value: { int_id: 94, int_name: "Devonian", prop: 0.25 },
        }),
      }),
    ]),
};

/** Vocabularies passed as props override the provider for that picker —
 * here a short list of lithologies and attributes, and two timescales' worth
 * of intervals. Nothing is fetched for them. */
export const CustomVocabularies: StoryObj<any> = {
  render() {
    const [editable, setEditable] = useState(true);
    const [liths, setLiths] = useState<UnitLithologyValue[]>([
      {
        lith_id: 1,
        name: "sandstone",
        prop: 0.6,
        atts: ["fine-grained"],
      },
      { lith_id: 2, name: "shale", prop: 0.4 },
    ]);
    const [envs, setEnvs] = useState<EnvironmentValue[]>([
      { environ_id: 1, name: "fluvial" },
    ]);
    const [position, setPosition] = useState<IntervalPosition>({
      int_id: 4,
      int_name: "Devonian",
      prop: 0.25,
    });
    const change = <T>(fn: T) => editableOnly(editable, fn);
    return h(Story, { state: { liths, envs, position } }, [
      h(Switch, {
        label: "Editable",
        checked: editable,
        onChange: () => setEditable(!editable),
      }),
      h(Example, {
        title: "Lithology",
        children: h(LithologyPicker, {
          lithologies: fixtures.lithologies,
          lithAttributes: fixtures.lithAttributes,
          value: liths,
          onChange: change(setLiths),
        }),
      }),
      h(Example, {
        title: "Environment",
        children: h(EnvironmentPicker, {
          environments: fixtures.environments,
          value: envs,
          onChange: change(setEnvs),
        }),
      }),
      h(Example, {
        title: "Base of unit",
        children: h(IntervalPositionEditor, {
          intervals: fixtures.intervals,
          timescales: fixtures.timescales,
          timescaleChoice: true,
          value: position,
          onChange: change(setPosition),
        }),
      }),
    ]);
  },
};

/** The pattern the Macrostrat pickers are built from, over a vocabulary of
 * its own: a `TagPicker` whose selected tag opens a `TagDetailsEditor` of
 * sections. Each section is a menu action in a popover and a field inline. */
export const TagDetailsEditorPattern: StoryObj<any> = {
  render() {
    const [inline, setInline] = useState(false);
    const [value, setValue] = useState<MineralItem[]>([
      { ...minerals[0], abundance: 0.7 },
      { ...minerals[3] },
    ]);
    let detailsMode: "popover" | "inline" = "popover";
    if (inline) detailsMode = "inline";

    const update = (id: MineralItem["id"], patch: Partial<MineralItem>) =>
      setValue(value.map((d) => (d.id === id ? { ...d, ...patch } : d)));

    return h(Story, { state: value }, [
      h(Switch, {
        label: "Inline details",
        checked: inline,
        onChange: () => setInline(!inline),
      }),
      h(Example, {
        title: "Minerals",
        note: "A made-up vocabulary with one section, abundance. The tag draws the abundance once it is set.",
        children: h(TagPicker<MineralItem>, {
          items: minerals,
          value,
          onChange: setValue,
          detailsMode,
          placeholder: "Add mineral",
          renderTag: (item) => h(MineralTag, { item }),
          renderDetails: (ctx) => {
            const current = value.find((d) => d.id === ctx.item.id);
            let summary: string | null = null;
            if (current?.abundance != null) {
              summary = `${Math.round(current.abundance * 100)}%`;
            }
            return h(TagDetailsEditor, {
              mode: ctx.mode,
              title: ctx.item.name,
              color: ctx.item.color,
              onRemove: ctx.remove,
              sections: [
                {
                  key: "abundance",
                  label: "Abundance",
                  addLabel: "Add abundance",
                  icon: "percentage",
                  summary,
                  editor: h(ProportionEditor, {
                    value: { prop: current?.abundance ?? null, term: null },
                    options: { numeric: true },
                    autoFocus: ctx.mode === "popover",
                    onChange: ({ prop }) =>
                      update(ctx.item.id, { abundance: prop }),
                  }),
                  onRemove: () => update(ctx.item.id, { abundance: null }),
                },
              ],
            });
          },
        }),
      }),
    ]);
  },
};

/* ------------------------------------------------------------ story chrome */

function LithologyDemo({ detailsMode }: { detailsMode: "popover" | "inline" }) {
  const [liths, setLiths] = useState<UnitLithologyValue[]>(unitLithologies);
  return h(Story, { state: liths }, [
    h(Example, {
      title: "Lithology",
      note: "Select a lithology to edit it; Delete removes it.",
      children: h(LithologyPicker, {
        value: liths,
        onChange: setLiths,
        detailsMode,
      }),
    }),
  ]);
}

/** The resolved composition, as the story's own readout. */
function ResolvedShares({ value }: { value: UnitLithologyValue[] }) {
  return h("p.story-note", [
    "Resolved: ",
    value
      .map((d) => `${d.name} ${Math.round((d.comp_prop ?? 0) * 100)}%`)
      .join(", "),
  ]);
}

/** A story's frame: its examples, and the state they edit. */
function Story({ children, state }: { children: ReactNode; state?: any }) {
  return h("div.story", [
    children,
    h.if(state !== undefined)("pre.state", JSON.stringify(state, null, 2)),
  ]);
}

/** Story chrome around one component: a heading and a note that belong to
 * the story, and the component itself in a dashed box. */
function Example({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return h("div.example", [
    h("h4", title),
    h.if(note != null)("p.story-note", note),
    h("div.component", children),
  ]);
}

/* ------------------------------------------------------ pattern vocabulary */

type MineralItem = PickerItem & { abundance?: number | null };

const minerals: MineralItem[] = [
  { id: "qtz", name: "quartz", color: "#e8e3d3", description: "silicate" },
  { id: "fsp", name: "feldspar", color: "#e9b9a0", description: "silicate" },
  { id: "cal", name: "calcite", color: "#c9e3f2", description: "carbonate" },
  { id: "dol", name: "dolomite", color: "#d8cdea", description: "carbonate" },
  { id: "py", name: "pyrite", color: "#d9c56b", description: "sulfide" },
];

function MineralTag({ item }: { item: MineralItem }) {
  let details: string | undefined;
  if (item.abundance != null) {
    details = `${Math.round(item.abundance * 100)}%`;
  }
  return h(Tag, {
    name: item.name,
    color: item.color ?? undefined,
    details,
    size: TagSize.Small,
  });
}

function editableOnly<T>(editable: boolean, fn: T): T | undefined {
  if (!editable) return undefined;
  return fn;
}

/* ---------------------------------------------------------------- fixtures */

function lith(lith_id, name, color, cls, type) {
  return { lith_id, name, color, class: cls, type };
}

function env(environ_id, name, color, cls, type) {
  return { environ_id, name, color, class: cls, type };
}

function interval(int_id, name, b_age, t_age, color, timescale) {
  return { int_id, name, b_age, t_age, color, timescales: [timescale] };
}

const fixtureTimescales = [
  { timescale_id: 1, timescale: "international periods" },
  { timescale_id: 2, timescale: "North American land mammal ages" },
];

const [ics, nalma] = fixtureTimescales;

const fixtures = {
  lithologies: [
    lith(1, "sandstone", "#f4d47c", "sedimentary", "siliciclastic"),
    lith(2, "shale", "#9aa9b8", "sedimentary", "siliciclastic"),
    lith(3, "limestone", "#8fc7e8", "sedimentary", "carbonate"),
    lith(4, "dolomite", "#b7a6d6", "sedimentary", "carbonate"),
    lith(5, "basalt", "#6d6d6d", "igneous", "volcanic"),
  ],
  lithAttributes: [
    { lith_att_id: 1, name: "fine-grained", type: "grains" },
    { lith_att_id: 2, name: "coarse-grained", type: "grains" },
    { lith_att_id: 3, name: "cross-bedded", type: "bedform" },
    { lith_att_id: 4, name: "laminated", type: "bedform" },
    { lith_att_id: 5, name: "fossiliferous", type: "sed structure" },
  ],
  environments: [
    env(1, "fluvial", "#8ccf7a", "non-marine", "fluvial"),
    env(2, "deltaic", "#b8e07a", "marginal marine", "deltaic"),
    env(3, "shallow marine", "#6bb3e0", "marine", "carbonate"),
  ],
  timescales: fixtureTimescales,
  intervals: [
    interval(1, "Cambrian", 538.8, 486.85, "#7FA056", ics),
    interval(2, "Ordovician", 486.85, 443.1, "#009270", ics),
    interval(3, "Silurian", 443.1, 419.62, "#B3E1B6", ics),
    interval(4, "Devonian", 419.62, 358.86, "#CB8C37", ics),
    interval(5, "Carboniferous", 358.86, 298.9, "#67A599", ics),
    interval(10, "Wasatchian", 55.8, 50.3, "#FDB46C", nalma),
    interval(11, "Bridgerian", 50.3, 46.2, "#FDC07A", nalma),
  ],
};
