import hyper from "@macrostrat/hyper";
import styles from "./index.module.sass";
import { JSONView } from "@macrostrat/ui-components";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { ReactNode, useState } from "react";
import {
  DataField,
  EnvironmentsList,
  IntervalShort,
  IntervalTag,
  ItemList,
  LithologyList,
  LithologyTagFeature,
} from "@macrostrat/data-components";
import { useUnitSelectionDispatch } from "../units/selection";
import { useMacrostratUnits } from "../store";
import { useMacrostratData, useMacrostratDefs } from "@macrostrat/column-views";
import { Environment, UnitLong } from "@macrostrat/api-types";
import { defaultNameFunction } from "../units/names";
import classNames from "classnames";

const h = hyper.styled(styles);

export function UnitDetailsPanel({
  unit,
  onClose,
  className,
  features = new Set<UnitDetailsFeature>([
    UnitDetailsFeature.AdjacentUnits,
    UnitDetailsFeature.Color,
    UnitDetailsFeature.OutcropType,
    UnitDetailsFeature.JSONToggle,
  ]),
  lithologyFeatures,
  actions,
}: {
  unit: any;
  onClose?: any;
  showLithologyProportions?: boolean;
  className?: string;
  actions?: ReactNode;
  features: Set<UnitDetailsFeature>;
  lithologyFeatures?: Set<LithologyTagFeature>;
}) {
  const [showJSON, setShowJSON] = useState(false);

  let content = null;
  if (showJSON) {
    content = h(JSONView, { data: unit, showRoot: false });
  } else {
    content = h(UnitDetailsContent, { unit, features, lithologyFeatures });
  }

  let title = defaultNameFunction(unit);

  let hiddenActions = null;
  if (features.has(UnitDetailsFeature.JSONToggle)) {
    hiddenActions = h(Button, {
      icon: "code",
      small: true,
      minimal: true,
      key: "json-view-toggle",
      className: classNames("json-view-toggle", { enabled: setShowJSON }),
      onClick(evt) {
        setShowJSON(!showJSON);
        evt.stopPropagation();
      },
    });
  }

  return h("div.unit-details-panel", { className }, [
    h(LegendPanelHeader, {
      onClose,
      title,
      id: unit.unit_id,
      actions,
      hiddenActions,
    }),
    h("div.unit-details-content", content),
  ]);
}

export function LegendPanelHeader({
  title,
  id,
  onClose,
  actions = null,
  hiddenActions,
}: {
  title?: string | null;
  id?: number | null;
  onClose?: () => void;
  actions?: ReactNode | null;
  hiddenActions?: ReactNode | null;
}) {
  return h("header.legend-panel-header", [
    h("div.title-container", [
      h.if(title != null)("h3", title),
      h.if(hiddenActions != null)("div.hidden-actions", hiddenActions),
    ]),
    h("div.spacer"),
    h.if(id != null)("code", id),
    h.if(actions != null)(ButtonGroup, { minimal: true }, actions),
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

enum UnitDetailsFeature {
  AdjacentUnits = "adjacent-units",
  Color = "color",
  OutcropType = "outcrop-type",
  JSONToggle = "json-toggle",
}

function UnitDetailsContent({
  unit,
  lithologyFeatures = new Set([
    LithologyTagFeature.Proportion,
    LithologyTagFeature.Attributes,
  ]),
  features = new Set<UnitDetailsFeature>([
    UnitDetailsFeature.AdjacentUnits,
    UnitDetailsFeature.Color,
    UnitDetailsFeature.OutcropType,
  ]),
}: {
  unit: UnitLong;
  lithologyFeatures?: Set<LithologyTagFeature>;
  features?: Set<UnitDetailsFeature>;
}) {
  const lithMap = useMacrostratDefs("lithologies");
  const envMap = useMacrostratDefs("environments");

  const environments = enhanceEnvironments(unit.environ, envMap);
  const lithologies = enhanceLithologies(unit.lith ?? [], lithMap);

  let outcropField = null;
  if (features.has(UnitDetailsFeature.OutcropType)) {
    // Determine outcrop type
    let outcrop = unit.outcrop;
    if (outcrop == "both") {
      outcrop = "surface and subsurface";
    }
    outcropField = h(DataField, {
      label: "Outcrop",
      value: outcrop,
    });
  }

  return h("div.unit-details-content", [
    h(ThicknessField, { unit }),
    h(LithologyList, {
      label: "Lithology",
      lithologies,
      features: lithologyFeatures,
    }),
    h(
      DataField,
      {
        label: "Age",
        value: `${unit.b_age}–${unit.t_age}`,
        unit: "Ma",
      },
      h(IntervalProportions, { unit })
    ),
    h(EnvironmentsList, { environments }),
    h(
      DataField,
      {
        label: "Stratigraphic name",
      },
      h("span.strat-name-id", unit.strat_name_id)
    ),
    outcropField,
    h.if(features.has(UnitDetailsFeature.AdjacentUnits))([
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
    ]),
    h.if(features.has(UnitDetailsFeature.Color))(
      DataField,
      { label: "Color" },
      h("span.color-swatch", { style: { backgroundColor: unit.color } })
    ),
    h(
      DataField,
      { label: "Source", inline: true },
      h(BibInfo, { refs: unit.refs })
    ),
  ]);
}

function ThicknessField({ unit, label = "Thickness" }) {
  let minThickness = unit.min_thick ?? 0;
  let maxThickness = unit.max_thick ?? unit.min_thick ?? 0;
  let thicknessUnit = "m";
  let thickness = `${minThickness}–${maxThickness}`;

  if (minThickness == maxThickness) {
    thickness = `${minThickness}`;
  }
  if (minThickness == 0 && maxThickness == 0) {
    thickness = "Unknown";
    thicknessUnit = null;
  }

  return h(DataField, {
    label,
    value: thickness,
    unit: thicknessUnit,
  });
}

function BibInfo({ refs }) {
  const refData = useMacrostratData("refs", refs);

  if (refData == null || refData.length === 0) {
    return null;
  }

  if (refData.length == 1) {
    return h(Citation, { data: refData[0], tag: "span" });
  }

  return h(
    "ul.refs",
    refData.map((data) => h(Citation, { data, tag: "li", key: data.ref_id }))
  );
}

function Citation({ data, tag = "p" }) {
  return h(tag, { className: "citation" }, [
    h("span.authors", data.author),
    ", ",
    h("span.year", data.pub_year),
    ", ",
    h("span.title", data.ref),
  ]);
}

function enhanceEnvironments(
  environments: Partial<Environment>,
  envMap: Map<number, Environment>
) {
  return environments.map((env) => {
    return {
      ...(envMap?.get(env.environ_id) ?? {}),
      ...env,
    };
  });
}

function enhanceLithologies(
  lithologies: Partial<UnitLong["lith"]>,
  lithMap: Map<number, any>
) {
  return lithologies.map((lith) => {
    return {
      ...(lithMap?.get(lith.lith_id) ?? {}), // get lithology details
      ...lith, // override with the unit's specific lithology data
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

  return h(
    ItemList,
    { className: "unit-id-list" },
    u1.map((unit) => {
      return h(
        tag,

        { className: "unit-id", onClick: onClickHandler?.(unit), key: unit.id },
        unit
      );
    })
  );
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

  let p0: ReactNode = null;

  if (i0 !== i1 || b_prop !== 0 || t_prop !== 1) {
    // We have a single interval with undefined proportions
    p0 = h(Proportion, { value: b_prop });
  }

  const int1 = intervalMap?.get(i1) ?? {};

  const p1: ReactNode = h(Proportion, { value: t_prop });
  if (i0 === i1) {
    p0 = h("span.joint-proportion", [p0, h("span.sep", "to"), p1]);
  }

  return h("div.interval-proportions", [
    h(IntervalTag, {
      interval: interval0,
      prefix: p0,
    }),
    h.if(i0 != i1)("span.discourage-break", [
      h("span.sep", "to"),
      h(IntervalTag, {
        interval: {
          ...int1,
          id: i1,
          name: unit.t_int_name,
        },
        prefix: p1,
      }),
    ]),
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
