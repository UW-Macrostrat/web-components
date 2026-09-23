/**
 * Pickers for controlled vocabularies: lithologies and environments as
 * multi-valued tag pickers, and a chronostratigraphic position (interval +
 * proportion, age derived). Each is read-only without `onChange`, so the same
 * component shows a value in a viewer and edits it in an editor.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { Card, FormGroup, Switch } from "@blueprintjs/core";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  EnvironmentPicker,
  type EnvironmentValue,
  type IntervalPosition,
  IntervalPositionEditor,
  LithologyPicker,
  type UnitLithologyValue,
} from "../src/pickers";

const h = hyper;

const meta: Meta<any> = {
  title: "Data components/Pickers",
  parameters: { layout: "padded" },
};

export default meta;

/* ------------------------------------------------------------- fixtures */

const lithologies = [
  {
    lith_id: 1,
    name: "sandstone",
    color: "#f4d47c",
    class: "sedimentary",
    type: "siliciclastic",
  },
  {
    lith_id: 2,
    name: "shale",
    color: "#9aa9b8",
    class: "sedimentary",
    type: "siliciclastic",
  },
  {
    lith_id: 3,
    name: "limestone",
    color: "#8fc7e8",
    class: "sedimentary",
    type: "carbonate",
  },
  {
    lith_id: 4,
    name: "dolomite",
    color: "#b7a6d6",
    class: "sedimentary",
    type: "carbonate",
  },
  {
    lith_id: 5,
    name: "conglomerate",
    color: "#e0a56b",
    class: "sedimentary",
    type: "siliciclastic",
  },
  {
    lith_id: 6,
    name: "basalt",
    color: "#6d6d6d",
    class: "igneous",
    type: "volcanic",
  },
  {
    lith_id: 7,
    name: "granite",
    color: "#e88f8f",
    class: "igneous",
    type: "plutonic",
  },
];

const environments = [
  {
    environ_id: 1,
    name: "fluvial",
    color: "#8ccf7a",
    class: "non-marine",
    type: "fluvial",
  },
  {
    environ_id: 2,
    name: "deltaic",
    color: "#b8e07a",
    class: "marginal marine",
    type: "deltaic",
  },
  {
    environ_id: 3,
    name: "shallow marine",
    color: "#6bb3e0",
    class: "marine",
    type: "carbonate",
  },
  {
    environ_id: 4,
    name: "deep marine",
    color: "#3b6fb3",
    class: "marine",
    type: "siliciclastic",
  },
  {
    environ_id: 5,
    name: "eolian",
    color: "#e6c47a",
    class: "non-marine",
    type: "eolian",
  },
];

const intervals = [
  {
    int_id: 1,
    name: "Cambrian",
    b_age: 538.8,
    t_age: 486.85,
    color: "#7FA056",
    rank: 3,
  },
  {
    int_id: 2,
    name: "Ordovician",
    b_age: 486.85,
    t_age: 443.1,
    color: "#009270",
    rank: 3,
  },
  {
    int_id: 3,
    name: "Silurian",
    b_age: 443.1,
    t_age: 419.62,
    color: "#B3E1B6",
    rank: 3,
  },
  {
    int_id: 4,
    name: "Devonian",
    b_age: 419.62,
    t_age: 358.86,
    color: "#CB8C37",
    rank: 3,
  },
  {
    int_id: 5,
    name: "Carboniferous",
    b_age: 358.86,
    t_age: 298.9,
    color: "#67A599",
    rank: 3,
  },
  {
    int_id: 6,
    name: "Permian",
    b_age: 298.9,
    t_age: 251.9,
    color: "#F04028",
    rank: 3,
  },
  {
    int_id: 7,
    name: "Triassic",
    b_age: 251.9,
    t_age: 201.4,
    color: "#812B92",
    rank: 3,
  },
  {
    int_id: 8,
    name: "Jurassic",
    b_age: 201.4,
    t_age: 143.1,
    color: "#34B2C9",
    rank: 3,
  },
  {
    int_id: 9,
    name: "Cretaceous",
    b_age: 143.1,
    t_age: 66.0,
    color: "#7FC64E",
    rank: 3,
  },
];

/* --------------------------------------------------------------- stories */

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

  const liveLiths = useAPIResult(
    live ? "https://macrostrat.org/api/v2/defs/lithologies" : null,
    { all: true },
    (res) => res?.success?.data,
  );
  const liveEnvs = useAPIResult(
    live ? "https://macrostrat.org/api/v2/defs/environments" : null,
    { all: true },
    (res) => res?.success?.data,
  );
  const liveIntervals = useAPIResult(
    live ? "https://macrostrat.org/api/v2/defs/intervals" : null,
    { timescale_id: 11 },
    (res) => res?.success?.data,
  );

  return h(
    "div",
    { style: { maxWidth: "36em", display: "grid", gap: "1em" } },
    [
      h(Switch, {
        label: "Editable",
        checked: editable,
        onChange: () => setEditable(!editable),
      }),
      h(Card, [
        h(
          FormGroup,
          { label: "Lithology" },
          h(LithologyPicker, {
            lithologies: live ? liveLiths : lithologies,
            value: liths,
            onChange: editable ? setLiths : undefined,
          }),
        ),
        h(
          FormGroup,
          { label: "Environment" },
          h(EnvironmentPicker, {
            environments: live ? liveEnvs : environments,
            value: envs,
            onChange: editable ? setEnvs : undefined,
          }),
        ),
        h(
          FormGroup,
          {
            label: "Base of unit",
            helperText:
              "An interval and a position within it; the age follows.",
          },
          h(IntervalPositionEditor, {
            intervals: live ? liveIntervals : intervals,
            value: position,
            onChange: editable ? setPosition : undefined,
          }),
        ),
      ]),
      h(
        "pre",
        { style: { fontSize: "11px", opacity: 0.7 } },
        JSON.stringify({ liths, envs, position }, null, 2),
      ),
    ],
  );
}

export const Fixtures: StoryObj<any> = {
  render: () => h(PickersDemo),
};

/** The same pickers over Macrostrat's live definitions. */
export const LiveDefinitions: StoryObj<any> = {
  render: () => h(PickersDemo, { live: true }),
};
