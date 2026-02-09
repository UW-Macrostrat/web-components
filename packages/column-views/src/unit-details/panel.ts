import hyper from "@macrostrat/hyper";
import styles from "./panel.module.sass";
import { JSONView } from "@macrostrat/ui-components";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { ReactNode, useMemo, useState } from "react";
import {
  DataField,
  EnvironmentsList,
  isClickable,
  ItemInteractionProps,
  ItemList,
  LithologyList,
  LithologyTagFeature,
  MacrostratInteractionManager,
  MacrostratInteractionProvider,
  MacrostratItemIdentifier,
  Parenthetical,
  useInteractionManager,
  useInteractionProps,
  Value,
} from "@macrostrat/data-components";
import { useColumnUnitsMap } from "../data-provider";
import {
  useMacrostratColumnInfo,
  useMacrostratData,
  useMacrostratDefs,
  useStratNames,
} from "@macrostrat/data-provider";
import type {
  Environment,
  Interval,
  Lithology,
  UnitLong,
  UnitLongFull,
} from "@macrostrat/api-types";
import { defaultNameFunction } from "../units/names";
import classNames from "classnames";
import { AgeField, Duration, IntervalProportions } from "./age-range";
import { formatRange, formatSignificance } from "./utils.ts";

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

  const main = h("div.unit-details-panel", { className }, [
    h(LegendPanelHeader, {
      onClose,
      title,
      id: unit.unit_id,
      actions,
      hiddenActions,
    }),
    h("div.unit-details-content-holder", content),
  ]);

  /** Handle unit selection clicks */
  const clickHandlerForItem = useMemo(() => {
    if (onSelectUnit == null && onClickItem == null) return null;
    return (item: MacrostratItemIdentifier) => {
      if ("unit_id" in item && !("col_id" in item)) {
        // We are selecting a unit within the column
        return (event: MouseEvent) => {
          onSelectUnit(item.unit_id);
          // Don't allow event to propagate further (e.g., to open a link)
          event.preventDefault();
        };
      }
      return undefined;
    };
  }, [onSelectUnit, onClickItem]);

  if (clickHandlerForItem != null) {
    // We wrap this in a MacrostratInteractionManager to handle unit selection
    return h(
      MacrostratInteractionProvider,
      {
        clickHandlerForItem,
        inherit: true,
      },
      main,
    );
  }

  return main;
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
}: {
  unit: UnitLong;
  lithologyFeatures?: Set<LithologyTagFeature>;
  features?: Set<UnitDetailsFeature>;
  onClickItem?: MacrostratItemClickHandler;
  getItemHref?: (item: Lithology | Environment | UnitLong) => string | null;
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
    }),
    h.if(unit.strat_name_id != null)(StratNameField, {
      strat_name_id: unit.strat_name_id,
    }),
    outcropField,
    h.if(features.has(UnitDetailsFeature.AdjacentUnits))([
      h.if(unit.units_above != null)(
        DataField,
        { label: "Above" },
        h(UnitIDList, {
          units: unit.units_above,
          showNames: true,
        }),
      ),
      h.if(unit.units_below != null)(
        DataField,
        { label: "Below" },
        h(UnitIDList, {
          units: unit.units_below,
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

function StratNameField(
  props: {
    strat_name_id: number;
    className?: string;
  } & ItemInteractionProps,
) {
  /** Handling for stratigraphic name field */
  const { strat_name_id, className, ...rest } = props;
  const data = useStratNameData(strat_name_id);

  const baseInteractionProps = useInteractionProps({ strat_name_id });

  const coreProps = {
    ...baseInteractionProps,
    ...rest,
  };

  let inner: any = h(Identifier, { id: strat_name_id });
  const name = data?.strat_name_long;
  if (name != null) {
    inner = h("span.strat-name", name);
  }

  const clickable = isClickable(coreProps);

  return h(
    DataField,
    {
      label: "Stratigraphic name",
    },
    h(
      clickable ? "a" : "span",
      {
        className: classNames({ clickable }, className),
        ...coreProps,
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

export function ThicknessField({ unit, label = "Thickness" }) {
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
  className,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & ItemInteractionProps) {
  /** An optionally clickable text element */
  const clickable = isClickable(rest);
  const tag = clickable ? "a" : "span";
  return h(tag, { className: classNames(className, { clickable }), ...rest });
}

export function Identifier({
  id,
  className,
  ...rest
}: {
  id: number | string;
  className?: string;
} & ItemInteractionProps) {
  /** An item that displays a numeric identifier, optionally clickable */
  return h(
    ClickableText,
    {
      className: classNames("identifier", className),
      ...rest,
    },
    id,
  );
}

type UnitInfo = {
  unitID: number;
  colID?: number;
  name?: string;
};

function UnitIDList({ units, showNames = false }) {
  const unitsMap = useColumnUnitsMap();

  const interactionManager = useInteractionManager();

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
    extUnits.map((info) => {
      return h(
        "span.item",
        h(UnitIdentifier, {
          ...info,
          ...interactionManager?.interactionPropsForItem({
            unit_id: info.unitID,
          }),
        }),
      );
    }),
  );
}

function UnitIdentifier({
  unitID,
  colID,
  name,
  ...interactionProps
}: UnitInfo & ItemInteractionProps) {
  if (name != null) {
    return h(
      ClickableText,
      {
        className: "unit-name",
        ...interactionProps,
      },
      name,
    );
  }

  return h(Identifier, {
    className: "unit-id",
    key: unitID,
    id: unitID,
    ...interactionProps,
  });
}
