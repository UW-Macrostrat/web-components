import hyper from "@macrostrat/hyper";
import styles from "./index.module.sass";
import { JSONView } from "@macrostrat/ui-components";
import { Button } from "@blueprintjs/core";
import { useState } from "react";
import {
  DataField,
  EnvironmentsList,
  IntervalField,
  LithologyList,
} from "@macrostrat/data-components";

const h = hyper.styled(styles);

export function UnitDetailsPanel({ unit, onClose }) {
  const [showJSON, setShowJSON] = useState(false);

  let content = null;
  if (showJSON) {
    content = h(JSONView, { data: unit, showRoot: false });
  } else {
    content = h(UnitDetailsContent, { unit });
  }

  return h("div.unit-details-panel", [
    h(LegendPanelHeader, {
      onClose,
      title: unit.unit_name,
      id: unit.unit_id,
      actions: [
        h(Button, {
          icon: "code",
          small: true,
          minimal: true,
          className: "json-view-toggle",
          onClick() {
            setShowJSON(!showJSON);
          },
        }),
      ],
    }),
    h("div.unit-details-content", [content]),
  ]);
}

function UnitDetailsContent({ unit }) {
  return h("div.unit-details-content", [
    h(DataField, {
      label: "Thickness",
      value: `${unit.min_thick}–${unit.max_thick}`,
      unit: "m",
    }),
    h(LithologyList, { lithologies: unit.lith }),
    h(DataField, { label: "Outcrop", value: unit.outcrop }),
    h(DataField, {
      label: "Age range",
      value: `${unit.b_age}–${unit.t_age}`,
      unit: "Ma",
    }),
    h(IntervalField, {
      intervals: [
        {
          id: unit.b_int_id,
          name: unit.b_int_name,
          b_age: unit.b_int_age,
          t_age: unit.t_int_age,
        },
        {
          id: unit.t_int_id,
          name: unit.t_int_name,
          t_age: unit.t_int_age,
          b_age: unit.b_int_age,
        },
      ],
    }),
    h(EnvironmentsList, { environments: unit.environ }),
  ]);
}

export function LegendPanelHeader({ title, id, onClose, actions = null }) {
  return h("header.legend-panel-header", [
    h.if(title != null)("h3", title),
    h("div.spacer"),
    h.if(id != null)("code", id),
    actions,
    h.if(onClose != null)(Button, {
      icon: "cross",
      minimal: true,
      small: true,
      onClick() {
        onClose();
      },
    }),
  ]);
}
