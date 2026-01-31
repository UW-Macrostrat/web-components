import hyper from "@macrostrat/hyper";
import styles from "./panel.module.sass";
import { JSONView } from "@macrostrat/ui-components";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { ReactNode, useMemo, useState } from "react";
import {
  DataField,
  EnvironmentsList,
  IntervalShort,
  IntervalTag,
  ItemList,
  LithologyList,
  LithologyTagFeature,
  Parenthetical,
  Value,
  MacrostratInteractionManager,
} from "@macrostrat/data-components";
import {
  useColumnUnitsMap,
  useMacrostratColumnInfo,
  useMacrostratData,
  useMacrostratDefs,
  useStratNames,
} from "../data-provider";
import type {
  Environment,
  UnitLong,
  UnitLongFull,
  Lithology,
  Interval,
} from "@macrostrat/api-types";
import { defaultNameFunction } from "../units/names";
import classNames from "classnames";

const h = hyper.styled(styles);

export interface UnitDetailsPanelProps {
  unit: any;
  onClose?: any;
  className?: string;
  actions?: ReactNode;
  hiddenActions?: ReactNode;
  features?: Set<UnitDetailsFeature>;
  lithologyFeatures?: Set<LithologyTagFeature>;
  onSelectUnit?: (unitID: number) => void;
  onClickItem?: MacrostratItemClickHandler;
  interactionManager?: MacrostratInteractionManager;
}

export function UnitDetailsPanel({
  unit,
  onClose,
  className,
  features = new Set<UnitDetailsFeature>([
    UnitDetailsFeature.AdjacentUnits,
    UnitDetailsFeature.OutcropType,
    UnitDetailsFeature.JSONToggle,
    UnitDetailsFeature.DepthRange,
  ]),
  lithologyFeatures,
  actions,
  hiddenActions = null,
  onSelectUnit,
  onClickItem,
  interactionManager,
}: UnitDetailsPanelProps) {
  const [showJSON, setShowJSON] = useState(false);

  let content = null;
  if (showJSON) {
    content = h(JSONView, { data: unit, showRoot: false });
  } else {
    content = h(UnitDetailsContent, {
      unit,
      features,
      lithologyFeatures,
      onClickItem,
      onSelectUnit,
      interactionManager,
    });
  }

  let title = defaultNameFunction(unit);

  if (features.has(UnitDetailsFeature.JSONToggle)) {
    hiddenActions = h([
      h(Button, {
        icon: "code",
        small: true,
        minimal: true,
        key: "json-view-toggle",
        className: classNames("json-view-toggle", { enabled: setShowJSON }),
        onClick(evt) {
          setShowJSON(!showJSON);
          evt.stopPropagation();
        },
      }),
      hiddenActions,
    ]);
  }

  return h("div.unit-details-panel", { className }, [
    h(LegendPanelHeader, {
      onClose,
      title,
      id: unit.unit_id,
      actions,
      hiddenActions,
    }),
    h("div.unit-details-content-holder", content),
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
      h.if(hiddenActions != null)(
        "span.hidden-actions-container",
        h("div.hidden-actions", hiddenActions),
      ),
    ]),
    h("div.spacer"),
    h.if(id != null)("code.unit-id", id),
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

export enum UnitDetailsFeature {
  AdjacentUnits = "adjacent-units",
  Color = "color",
  OutcropType = "outcrop-type",
  JSONToggle = "json-toggle",
  DepthRange = "depth-range",
  ColumnName = "column-name",
}

export type MacrostratItemClickHandler = (
  event: MouseEvent,
  item:
    | Lithology
    | Environment
    | UnitLong
    | Interval
    | { strat_name_id: number },
) => void;

function UnitDetailsContent({
  unit,
  onSelectUnit,
  lithologyFeatures = new Set([
    LithologyTagFeature.Proportion,
    LithologyTagFeature.Attributes,
  ]),
  features = new Set<UnitDetailsFeature>([
    UnitDetailsFeature.AdjacentUnits,
    UnitDetailsFeature.OutcropType,
  ]),
  onClickItem,
  getItemHref,
  interactionManager,
}: {
  unit: UnitLong;
  onSelectUnit?: (unitID: number) => void;
  lithologyFeatures?: Set<LithologyTagFeature>;
  features?: Set<UnitDetailsFeature>;
  onClickItem?: MacrostratItemClickHandler;
  getItemHref?: (item: Lithology | Environment | UnitLong) => string | null;
  interactionManager?: MacrostratInteractionManager;
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

  let thicknessOrHeightRange = null;
  const [thickness, thicknessUnit] = getThickness(unit);
  // Proxy for actual heights in t_pos and b_pos
  if (
    features.has(UnitDetailsFeature.DepthRange) &&
    unit.t_pos != null &&
    unit.b_pos != null &&
    unit.min_thick == unit.max_thick && // We have an actual fixed height
    unit.min_thick != 0 // Not a zero thickness
  ) {
    const label = unit.t_pos < unit.b_pos ? "Depth" : "Height";
    const u1 = "m";

    thicknessOrHeightRange = h(DataField, {
      unit: u1,
      label,
      value: formatRange(unit.b_pos, unit.t_pos),
      children: h(
        Parenthetical,
        h(Value, { value: thickness, unit: thicknessUnit }),
      ),
    });
  }
  thicknessOrHeightRange ??= h(DataField, {
    label: "Thickness",
    value: thickness,
    unit: thicknessUnit,
  });

  /** We are trying to move away from passing the "color" parameter in the API */
  let colorSwatch: ReactNode = null;
  if ("color" in unit && features.has(UnitDetailsFeature.Color)) {
    const unit1 = unit as UnitLongFull;
    colorSwatch = h("div.color-swatch", {
      style: { backgroundColor: unit1.color },
    });
  }

  return h("div.unit-details-content", [
    h.if(features.has(UnitDetailsFeature.ColumnName))(ColumnNameField, {
      col_id: unit.col_id,
    }),
    thicknessOrHeightRange,
    h.if(lithologies != null)(LithologyList, {
      label: "Lithology",
      lithologies,
      features: lithologyFeatures,
      getItemHref,
      onClickItem,
    }),
    h(AgeField, { unit }, [
      h(Parenthetical, h(Duration, { value: unit.b_age - unit.t_age })),
      h(IntervalProportions, {
        unit,
        onClickItem,
      }),
    ]),
    h.if(environments != null)(EnvironmentsList, {
      environments,
      onClickItem,
      getItemHref,
    }),
    h.if(unit.strat_name_id != null)(StratNameField, {
      strat_name_id: unit.strat_name_id,
      interactionManager,
    }),
    outcropField,
    h.if(features.has(UnitDetailsFeature.AdjacentUnits))([
      h.if(unit.units_above != null)(
        DataField,
        { label: "Above" },
        h(UnitIDList, {
          units: unit.units_above,
          onSelectUnit,
          showNames: true,
        }),
      ),
      h.if(unit.units_below != null)(
        DataField,
        { label: "Below" },
        h(UnitIDList, {
          units: unit.units_below,
          onSelectUnit,
          showNames: true,
        }),
      ),
    ]),
    colorSwatch,
    h(ReferencesField, { refs: unit.refs, inline: true }),
  ]);
}

function ColumnNameField({
  col_id,
  showIdentifier = false,
}: {
  col_id: number;
  showIdentifier?: boolean;
}) {
  const colData = useMacrostratColumnInfo(col_id);
  let inner: any = h(Identifier, { id: col_id });
  const name = colData?.col_name;
  if (name != null) {
    inner = h("span.value", [
      h("span.col-name", name),
      h.if(showIdentifier)([" ", h(Parenthetical, inner)]),
    ]);
  }

  return h(
    DataField,
    {
      label: "Column",
    },
    inner,
  );
}

export function ReferencesField({ refs, className = null, ...rest }) {
  if (refs == null || refs.length === 0) {
    return null;
  }

  return h(
    DataField,
    {
      label: "References",
      className: classNames("refs-field", className),
      ...rest,
    },
    h(BibInfo, { refs }),
  );
}

function useStratNameData(strat_name_id: number) {
  const stratNames = useStratNames([strat_name_id]);
  return stratNames?.[0];
}

function StratNameField(props: {
  strat_name_id: number;
  onClick?: (event: MouseEvent) => void;
  href?: string;
  target?: string;
  interactionManager?: MacrostratInteractionManager;
}) {
  /** Handling for stratigraphic name field */
  const { strat_name_id, onClick, interactionManager, href } = props;
  const data = useStratNameData(strat_name_id);

  let target = props.target ?? "_blank";

  let inner: any = h(Identifier, { id: strat_name_id });
  const name = data?.strat_name_long;
  if (name != null) {
    inner = h("span.strat-name", name);
  }

  const interactionProps = interactionManager?.interactionPropsForItem({
    strat_name_id,
  });

  const _onClick = onClick ?? interactionProps?.onClick;
  const _href = href ?? interactionProps?.href;
  const _target = target ?? interactionProps?.target;

  const clickable = _onClick != null || _href != null;

  const className = classNames({
    clickable,
  });

  console.log("StratNameField", _href, _onClick);

  return h(
    DataField,
    {
      label: "Stratigraphic name",
    },
    h(
      clickable ? "a" : "span",
      {
        className,
        onClick: _onClick,
        href: _href,
        target: _target,
      },
      inner,
    ),
  );
}

function getThickness(unit): [string, string] {
  let minThickness = unit.min_thick ?? 0;
  let maxThickness = unit.max_thick ?? unit.min_thick ?? 0;
  let _unit = "m";

  if (minThickness == 0 && maxThickness == 0) {
    return ["Unknown", null];
  }

  if (minThickness < 0.8 && maxThickness < 1.2) {
    // Convert to cm
    minThickness = minThickness * 100;
    maxThickness = maxThickness * 100;
    _unit = "cm";
  } else if (minThickness > 800 && maxThickness > 1200) {
    // Convert to km
    minThickness = minThickness / 1000;
    maxThickness = maxThickness / 1000;
    _unit = "km";
  }

  if (minThickness == maxThickness) {
    return [formatSignificance(minThickness), _unit];
  }

  return [formatRange(minThickness, maxThickness), _unit];
}

function ThicknessField({ unit, label = "Thickness" }) {
  const [value, thicknessUnit] = getThickness(unit);
  return h(DataField, {
    label,
    value,
    unit: thicknessUnit,
  });
}

function BibInfo({ refs }) {
  const refData = useMacrostratData("refs", refs);

  if (refData == null || refData.length === 0) {
    return null;
  }

  if (refData.length == 1) {
    return h(Citation, {
      data: refData[0],
      tag: "span",
      key: refData[0].ref_id,
    });
  }

  return h(
    "ul.refs",
    refData.map((data, i) =>
      h(Citation, { data, tag: "li", key: data.ref_id }),
    ),
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

function AgeField({ unit, children }) {
  const [b_age, t_age, _unit] = getAgeRange(unit);

  return h(
    DataField,
    {
      label: "Age",
      value: formatRange(b_age, t_age),
      unit: _unit,
    },
    children,
  );
}

function getAgeRange(_unit) {
  let b_age = _unit.b_age;
  let t_age = _unit.t_age;
  let unit = "Ma";

  if (b_age < 0.8 && t_age < 1.2) {
    b_age *= 1000;
    t_age *= 1000;
    unit = "ka";
  } else if (b_age > 800 && t_age > 1200) {
    b_age /= 1000;
    t_age /= 1000;
    unit = "Ga";
  }

  return [b_age, t_age, unit];
}

function getAge(value) {
  /** Get the age value in Ma, ka, or Ga as appropriate */
  let unit = "Ma";
  if (value < 0.8) {
    unit = "ka";
    value *= 1000;
    if (value < 5) {
      unit = "yr";
      value *= 1000;
    }
  } else if (value > 1000) {
    unit = "Ga";
    value /= 1000;
  }

  return [value, unit];
}

export function AgeLabel({
  age,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
  className,
}: {
  age: number;
  className?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}) {
  /** Component to display a single age value with unit conversion from
   * Ma to ka or Ga as appropriate.
   */
  const [value, unit] = getAge(age);

  const _value = value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits,
  });

  return h(Value, { value: _value, unit, className });
}

export function Duration({
  value,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
}) {
  let unit = "Myr";
  if (value < 0.8) {
    unit = "kyr";
    value *= 1000;
    if (value < 5) {
      unit = "yr";
      value *= 1000;
    }
  } else if (value > 1000) {
    unit = "Gyr";
    value /= 1000;
  }

  let _value = value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits,
  });

  return h(Value, { value: _value, unit });
}

function enhanceEnvironments(
  environments: Partial<Environment>[] | null,
  envMap: Map<number, Environment>,
) {
  return environments?.map((env) => {
    return {
      ...(envMap?.get(env.environ_id) ?? {}),
      ...env,
    };
  });
}

function enhanceLithologies(
  lithologies: Partial<UnitLong["lith"]>,
  lithMap: Map<number, any>,
) {
  return lithologies?.map((lith) => {
    return {
      ...(lithMap?.get(lith.lith_id) ?? {}), // get lithology details
      ...lith, // override with the unit's specific lithology data
    };
  });
}

export function ClickableText({
  onClick,
  className,
  children,
}: {
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  /** An optionally clickable text element */
  const tag = onClick != null ? "a" : "span";
  return h(tag, { onClick, className }, children);
}

export function Identifier({
  id,
  onClick,
  className,
}: {
  id: number | string;
  onClick?: (id: number | string) => void;
  className?: string;
}) {
  /** An item that displays a numeric identifier, optionally clickable */
  const _onClick = onClick != null ? () => onClick(id) : null;

  return h(
    ClickableText,
    {
      onClick: _onClick,
      className: classNames("identifier", className),
    },
    id,
  );
}

type UnitInfo = {
  unitID: number;
  colID?: number;
  name?: string;
};

function UnitIDList({ units, onSelectUnit, showNames = false }) {
  const unitsMap = useColumnUnitsMap();

  const extUnits: UnitInfo[] = useMemo(() => {
    const u1 = units.filter((d) => d != 0);
    if (showNames) {
      return u1.map((unitID) => {
        const unitData = unitsMap?.get(unitID);
        let name: string = undefined;
        if (unitData != null) {
          name = defaultNameFunction(unitData);
        }
        return {
          unitID,
          colID: unitData?.col_id,
          name,
        };
      });
    } else {
      return u1.map((unitID) => ({ unitID }));
    }
  }, [units, unitsMap]);

  if (extUnits.length === 0) {
    return h("span.no-units", "None");
  }

  return h(
    ItemList,
    { className: "units-list" },
    extUnits.map((info) =>
      h("span.item", h(UnitIdentifier, { ...info, onSelectUnit })),
    ),
  );
}

function UnitIdentifier({
  unitID,
  colID,
  name,
  onSelectUnit,
}: UnitInfo & { onSelectUnit?: (unitID: number) => void }) {
  const onClick = useMemo(() => {
    if (onSelectUnit == null) return null;
    return () => {
      onSelectUnit(unitID);
    };
  }, [onSelectUnit]);

  if (name != null) {
    return h(
      ClickableText,
      {
        className: "unit-name",
        onClick,
      },
      name,
    );
  }

  return h(Identifier, {
    className: "unit-id",
    onClick,
    key: unitID,
    id: unitID,
  });
}

function IntervalProportions({ unit, onClickItem }) {
  if (
    unit.b_int_id == null &&
    unit.t_int_id == null &&
    unit.b_prop == null &&
    unit.t_prop == null
  )
    return null;

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
  const int1 = intervalMap?.get(i1) ?? {};
  const p1: ReactNode = h(Proportion, { value: t_prop });

  if (i0 !== i1 || b_prop !== 0 || t_prop !== 1) {
    // We have a single interval with undefined proportions
    p0 = h(Proportion, { value: b_prop });
  }

  if (i0 === i1 && (b_prop !== 0 || t_prop !== 1)) {
    p0 = h("span.joint-proportion", [p0, h("span.sep", "to"), p1]);
  }

  const clickable = onClickItem != null;

  const handleClick = (event: MouseEvent) => {
    if (onClickItem) {
      onClickItem(event, interval0);
    }
  };

  return h("div.interval-proportions", [
    h(IntervalTag, {
      className: clickable ? "clickable" : "",
      onClick: clickable ? handleClick : undefined,
      interval: interval0,
      prefix: p0,
    }),
    h.if(i0 != i1)("span.discourage-break", [
      h("span.sep", "to"),
      h(IntervalTag, {
        className: clickable ? "clickable" : "",
        onClick: clickable ? handleClick : undefined,
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

function formatRange(min, max, precision = null) {
  if (min == null || max == null) return null;
  if (min === max) {
    return min.toFixed(precision);
  }

  return `${formatSignificance(min, precision)}–${formatSignificance(
    max,
    precision,
  )}`;
}

function formatSignificance(value, precision = null) {
  // Format to preserve a reasonable number of significant figures
  // this could be done with an easier algorithm, probably:

  if (precision == null) {
    return value.toLocaleString();
  }
  if (precision >= 0) {
    return value.toFixed(precision);
  }
  if (precision < 0) {
    return (
      (value / Math.pow(10, -precision)).toFixed(0) + "0".repeat(-precision)
    );
  }
}
