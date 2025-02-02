import hyper from "@macrostrat/hyper";
import styles from "./index.module.sass";
import { JSONView } from "@macrostrat/ui-components";
import { Button } from "@blueprintjs/core";
import { useState } from "react";
import {
  DataField,
  EnvironmentsList,
  Interval,
  ItemList,
  LithologyList,
  Value,
} from "@macrostrat/data-components";
import { useUnitSelectionDispatch } from "@macrostrat/column-views";
import { useColumnDivisions } from "@macrostrat/column-components";
import { useMacrostratUnits } from "../store";

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

function UnitDetailsContent({ unit }) {
  let outcrop = unit.outcrop;
  if (outcrop == "both") {
    outcrop = "surface and subsurface";
  }

  return h("div.unit-details-content", [
    h(DataField, {
      label: "Thickness",
      value: `${unit.min_thick}–${unit.max_thick}`,
      unit: "m",
    }),
    h(LithologyList, { lithologies: unit.lith }),
    h(DataField, {
      label: "Age range",
      value: `${unit.b_age}–${unit.t_age}`,
      unit: "Ma",
    }),
    h(IntervalField, { unit }),
    h(EnvironmentsList, { environments: unit.environ }),
    h(DataField, { label: "Outcrop", value: outcrop }),
    h(
      DataField,
      {
        label: "Stratigraphic name",
      },
      h("span.strat-name-id", unit.strat_name_id)
    ),
    h(
      DataField,
      { label: "Above" },
      h(UnitIDList, { units: unit.units_above })
    ),
    h(
      DataField,
      { label: "Below" },
      h(UnitIDList, { units: unit.units_below })
    ),
    h(
      DataField,
      { label: "Color" },
      h("span.color-swatch", { style: { backgroundColor: unit.color } })
    ),
  ]);
}

function UnitIDList({ units }) {
  const u1 = units.filter((d) => d != 0);
  const dispatch = useUnitSelectionDispatch();
  const allUnits = useMacrostratUnits();

  if (u1.length === 0) {
    return h("span.no-units", "None");
  }

  let onClickHandler = null;
  let tag = "span";
  if (dispatch != null) {
    onClickHandler = (id: number) => (evt) => {
      console.log(units);
      const unit = allUnits.find((d) => d.unit_id == id);
      dispatch(unit, null, null);
      evt.stopPropagation();
    };
    tag = "a";
  }

  return h(ItemList, { className: "unit-id-list" }, [
    u1.map((unit) => {
      return h(
        tag,
        { className: "unit-id", onClick: onClickHandler?.(unit) },
        unit
      );
    }),
  ]);
}

function IntervalField({ unit }) {
  return h([
    h(
      DataField,
      {
        label: "Intervals",
      },
      h(IntervalProportions, { unit })
    ),
  ]);
}

function IntervalProportions({ unit }) {
  const i0 = unit.b_int_id;
  const i1 = unit.t_int_id;
  let b_prop = unit.b_prop ?? 0;
  let t_prop = unit.t_prop ?? 1;

  if (i0 === i1 && b_prop === 0 && t_prop === 1) {
    // We have a single interval with undefined proportions
    return h(Interval, {
      interval: {
        id: i0,
        name: unit.b_int_name,
      },
    });
  }

  return h(ItemList, { className: "interval-proportions" }, [
    h(Proportion, { value: b_prop }),
    h.if(i0 != i1)(Interval, {
      interval: {
        id: i0,
        name: unit.b_int_name,
      },
      proportion: b_prop,
    }),
    h("span.sep", "to"),
    h(Proportion, { value: t_prop }),
    h(Interval, {
      interval: {
        id: i1,
        name: unit.t_int_name,
      },
      proportion: t_prop,
    }),
  ]);
}

const formatProportion = (d) => {
  if (d == null) return null;
  return d.toFixed(1);
};

function Proportion({ value }) {
  let content = null;
  if (value == 0) {
    content = "base";
  } else if (value == 1) {
    content = "top";
  } else {
    content = formatProportion(value * 100) + "%";
  }

  return h("span.proportion", content);
}
