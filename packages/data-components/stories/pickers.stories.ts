/**
 * Pickers for controlled vocabularies: lithologies (with their attributes)
 * and environments as multi-valued tag pickers, and a chronostratigraphic
 * position (interval, optional proportion, derived age, an optional timescale
 * constraint). Each is read-only without `onChange`, so the same component
 * shows a value in a viewer and edits it in an editor.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { Switch } from "@blueprintjs/core";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  EnvironmentPicker,
  type EnvironmentValue,
  type IntervalPosition,
  IntervalPositionEditor,
  LithologyPicker,
  type UnitLithologyValue,
} from "../src/pickers";
import styles from "./pickers.stories.module.sass";

const h = hyper.styled(styles);

const meta: Meta<any> = {
  title: "Data components/Pickers",
  parameters: { layout: "padded" },
};

export default meta;

/* ------------------------------------------------------------- fixtures */

function lith(lith_id, name, color, cls, type) {
  return { lith_id, name, color, class: cls, type };
}

const lithologies = [
  lith(1, "sandstone", "#f4d47c", "sedimentary", "siliciclastic"),
  lith(2, "shale", "#9aa9b8", "sedimentary", "siliciclastic"),
  lith(3, "limestone", "#8fc7e8", "sedimentary", "carbonate"),
  lith(4, "dolomite", "#b7a6d6", "sedimentary", "carbonate"),
  lith(5, "conglomerate", "#e0a56b", "sedimentary", "siliciclastic"),
  lith(6, "basalt", "#6d6d6d", "igneous", "volcanic"),
  lith(7, "granite", "#e88f8f", "igneous", "plutonic"),
];

const lithAttributes = [
  { lith_att_id: 1, name: "fine-grained", att_type: "grains" },
  { lith_att_id: 2, name: "coarse-grained", att_type: "grains" },
  { lith_att_id: 3, name: "cross-bedded", att_type: "bedform" },
  { lith_att_id: 4, name: "laminated", att_type: "bedform" },
  { lith_att_id: 5, name: "calcareous", att_type: "lithology" },
  { lith_att_id: 6, name: "arkosic", att_type: "lithology" },
  { lith_att_id: 7, name: "fossiliferous", att_type: "sed structures" },
];

function env(environ_id, name, color, cls, type) {
  return { environ_id, name, color, class: cls, type };
}

const environments = [
  env(1, "fluvial", "#8ccf7a", "non-marine", "fluvial"),
  env(2, "deltaic", "#b8e07a", "marginal marine", "deltaic"),
  env(3, "shallow marine", "#6bb3e0", "marine", "carbonate"),
  env(4, "deep marine", "#3b6fb3", "marine", "siliciclastic"),
  env(5, "eolian", "#e6c47a", "non-marine", "eolian"),
];

const timescales = [
  { timescale_id: 1, timescale: "international periods", n_intervals: 9 },
  {
    timescale_id: 2,
    timescale: "North American land mammal ages",
    n_intervals: 2,
  },
];

function interval(int_id, name, b_age, t_age, color, timescale) {
  return {
    int_id,
    name,
    b_age,
    t_age,
    color,
    rank: 3,
    timescales: [timescale],
  };
}

const [ics, nalma] = timescales;

const intervals = [
  interval(1, "Cambrian", 538.8, 486.85, "#7FA056", ics),
  interval(2, "Ordovician", 486.85, 443.1, "#009270", ics),
  interval(3, "Silurian", 443.1, 419.62, "#B3E1B6", ics),
  interval(4, "Devonian", 419.62, 358.86, "#CB8C37", ics),
  interval(5, "Carboniferous", 358.86, 298.9, "#67A599", ics),
  interval(6, "Permian", 298.9, 251.9, "#F04028", ics),
  interval(7, "Triassic", 251.9, 201.4, "#812B92", ics),
  interval(8, "Jurassic", 201.4, 143.1, "#34B2C9", ics),
  interval(9, "Cretaceous", 143.1, 66.0, "#7FC64E", ics),
  interval(10, "Wasatchian", 55.8, 50.3, "#FDB46C", nalma),
  interval(11, "Bridgerian", 50.3, 46.2, "#FDC07A", nalma),
];

/* --------------------------------------------------------------- stories */

function useLiveDefs(live: boolean) {
  const url = (path: string) =>
    live ? `https://macrostrat.org/api/v2/defs/${path}` : null;
  const unwrap = (res) => res?.success?.data;
  return {
    lithologies: useAPIResult(url("lithologies"), { all: true }, unwrap),
    lithAttributes: useAPIResult(url("lith_atts"), { all: true }, unwrap),
    environments: useAPIResult(url("environments"), { all: true }, unwrap),
    intervals: useAPIResult(url("intervals"), { all: true }, unwrap),
    timescales: useAPIResult(url("timescales"), { all: true }, unwrap),
  };
}

function PickersDemo({ live = false }: { live?: boolean }) {
  const [editable, setEditable] = useState(true);
  const [liths, setLiths] = useState<UnitLithologyValue[]>([
    { lith_id: 1, name: "sandstone", prop: 0.6, atts: ["fine-grained"] },
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
  const [topPosition, setTopPosition] = useState<IntervalPosition>({
    int_id: 5,
    int_name: "Carboniferous",
    prop: null,
  });

  const liveDefs = useLiveDefs(live);
  const defs = live
    ? liveDefs
    : { lithologies, lithAttributes, environments, intervals, timescales };

  return h("div.story", [
    h(
      "p.story-note",
      "Each dashed box is one component; the headings and notes are the story's. Toggle to see the same components as read-only viewers.",
    ),
    h(Switch, {
      label: "Editable",
      checked: editable,
      onChange: () => setEditable(!editable),
    }),
    h(Example, {
      title: "Lithology",
      note: "Pick lithologies; set a proportion; the tag button on each adds attributes, listed by kind.",
      children: h(LithologyPicker, {
        lithologies: defs.lithologies,
        lithAttributes: defs.lithAttributes,
        value: liths,
        onChange: editable ? setLiths : undefined,
      }),
    }),
    h(Example, {
      title: "Environment",
      children: h(EnvironmentPicker, {
        environments: defs.environments,
        value: envs,
        onChange: editable ? setEnvs : undefined,
      }),
    }),
    h(Example, {
      title: "Base of unit",
      note: "An interval and a position in it; the age follows. The timescale dropdown constrains matching.",
      children: h(IntervalPositionEditor, {
        intervals: defs.intervals,
        timescales: defs.timescales,
        value: position,
        onChange: editable ? setPosition : undefined,
      }),
    }),
    h(Example, {
      title: "Top of unit, within one timescale",
      note: "The timescale is imposed from outside, so it is shown by name and only its intervals are offered. The position starts as the interval alone; add a proportion to refine it.",
      children: h(IntervalPositionEditor, {
        intervals: defs.intervals,
        timescale: timescales[0],
        defaultProportion: 1,
        value: topPosition,
        onChange: editable ? setTopPosition : undefined,
      }),
    }),
    h(
      "pre.state",
      JSON.stringify({ liths, envs, position, topPosition }, null, 2),
    ),
  ]);
}

/** Story chrome around one component: a heading and a note that belong to
 * the story, and the component itself in a dashed box. */
function Example({ title, note, children }) {
  return h("div.example", [
    h("h4", title),
    h.if(note != null)("p.story-note", note),
    h("div.component", children),
  ]);
}

export const Fixtures: StoryObj<any> = {
  render: () => h(PickersDemo),
};

/** The same pickers over Macrostrat's live definitions (the imposed
 * timescale is the fixture's, so its constraint matches nothing live — pick
 * "Any timescale" on the first editor to browse the full vocabulary). */
export const LiveDefinitions: StoryObj<any> = {
  render: () => h(PickersDemo, { live: true }),
};
