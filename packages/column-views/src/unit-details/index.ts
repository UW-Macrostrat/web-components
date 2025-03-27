import hyper from "@macrostrat/hyper";
import styles from "./index.module.sass";
import { JSONView } from "@macrostrat/ui-components";
import { Button } from "@blueprintjs/core";
import { ReactNode, useState } from "react";
import {
  DataField,
  EnvironmentsList,
  IntervalShort,
  IntervalTag,
  ItemList,
  LithologyList,
} from "@macrostrat/data-components";
import { useUnitSelectionDispatch } from "../units/selection";
import { useMacrostratUnits } from "../store";
import { useMacrostratDefs } from "@macrostrat/column-views";
import { Environment } from "@macrostrat/api-types";

const h = hyper.styled(styles);

export function UnitDetailsPanel({
  unit,
  onClose,
  showLithologyProportions = false,
}: {
  unit: any;
  onClose?: any;
  showLithologyProportions?: boolean;
}) {
  const [showJSON, setShowJSON] = useState(false);

  let content = null;
  if (showJSON) {
    content = h(JSONView, { data: unit, showRoot: false });
  } else {
    content = h(UnitDetailsContent, { unit, showLithologyProportions });
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
          key: "json-view-toggle",
          className: "json-view-toggle",
          onClick(evt) {
            setShowJSON(!showJSON);
            evt.stopPropagation();
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

function UnitDetailsContent({
  unit,
  showLithologyProportions = true,
  showLithologyAttributes = true,
}) {
  const lithMap = useMacrostratDefs("lithologies");
  const envMap = useMacrostratDefs("environments");

  const environments = enhanceEnvironments(unit.environ, envMap);

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
    h(LithologyList, {
      lithologies: unit.lith,
      lithologyMap: lithMap,
      showProportions: showLithologyProportions,
      showAttributes: showLithologyAttributes,
    }),
    h(DataField, {
      label: "Age range",
      value: `${unit.b_age}–${unit.t_age}`,
      unit: "Ma",
    }),
    h(IntervalField, { unit }),
    h(EnvironmentsList, { environments }),
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

function enhanceEnvironments(
  environments: Partial<Environment>,
  envMap: Map<number, Environment>
) {
  return environments.map((env) => {
    console.log(env);
    return {
      ...(envMap?.get(env.environ_id) ?? {}),
      ...env,
    };
  });
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
        { className: "unit-id", onClick: onClickHandler?.(unit), key: unit.id },
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

  const intervalMap = useMacrostratDefs("intervals");
  const int0 = intervalMap?.get(i0) ?? {};

  const interval0: IntervalShort = {
    ...int0,
    id: i0,
    name: unit.b_int_name,
  };

  if (i0 === i1 && b_prop === 0 && t_prop === 1) {
    // We have a single interval with undefined proportions
    return h(IntervalTag, {
      interval: interval0,
    });
  }

  const int1 = intervalMap?.get(i1) ?? {};
  const p0 = h(Proportion, { value: b_prop });

  let p1: ReactNode = h(Proportion, { value: t_prop });
  if (i0 === i1) {
    p1 = h("span.joint-proportion", [p0, h("span.sep", " to "), p1]);
  }

  return h(ItemList, { className: "interval-proportions" }, [
    h.if(i0 != i1)([
      h(IntervalTag, {
        interval: interval0,
        prefix: p0,
      }),
      h("span.sep", " to "),
    ]),
    h(IntervalTag, {
      interval: {
        ...int1,
        id: i1,
        name: unit.t_int_name,
      },
      prefix: p1,
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
