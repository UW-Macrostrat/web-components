import {
  AgeRangeFlavor,
  IntervalAgeRange,
  TagSize,
} from "@macrostrat/data-components";
import classNames from "classnames";
import { useMemo } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { defaultNameFunction } from "../units/names";
import { LegendPanelHeader } from "./panel";
import h from "./multi-unit-panel.module.sass";

export interface MultiUnitPanelProps {
  /** The selected units, listed in the order given */
  units: any[];
  /** Narrow the selection to one unit (called when a row is clicked) */
  onSelectUnit?: (unitID: number) => void;
  onClose?: () => void;
  /** The primary selection (the last unit picked), which is highlighted */
  primaryUnitID?: number | null;
  /** What each row's interval range shows (default: positions) */
  ageRangeFlavor?: AgeRangeFlavor | `${AgeRangeFlavor}`;
  className?: string;
}

/** A condensed view of several selected units: one row each, with the
 * interval range it spans, and the span of the whole selection. Clicking a
 * row narrows the selection to that unit. */
export function MultiUnitPanel({
  units,
  onSelectUnit,
  onClose,
  primaryUnitID,
  ageRangeFlavor = AgeRangeFlavor.Proportion,
  className,
}: MultiUnitPanelProps) {
  const span = useMemo(() => selectionSpan(units), [units]);

  return h("div.multi-unit-panel", { className }, [
    h(LegendPanelHeader, { title: selectionTitle(units.length), onClose }),
    h("div.multi-unit-content", [
      h.if(span != null)("div.selection-span", [
        h("span.span-label", "Spans"),
        h(IntervalAgeRange, {
          unit: span,
          flavor: AgeRangeFlavor.Ages,
          size: TagSize.Small,
          interactive: false,
        }),
      ]),
      h(
        "ul.unit-list",
        units.map((unit) =>
          h(MultiUnitRow, {
            key: unit.unit_id,
            unit,
            primary: unit.unit_id == primaryUnitID,
            flavor: ageRangeFlavor,
            onSelect: onSelectUnit,
          }),
        ),
      ),
    ]),
  ]);
}

function MultiUnitRow({ unit, primary, flavor, onSelect }) {
  const interactive = onSelect != null;

  let interactionProps = {};
  if (interactive) {
    interactionProps = {
      role: "button",
      tabIndex: 0,
      title: "Select only this unit",
      onClick(evt: MouseEvent) {
        // Keep the click from reaching the column, which would clear the
        // selection
        evt.stopPropagation();
        onSelect(unit.unit_id);
      },
      onKeyDown(evt: KeyboardEvent) {
        if (evt.key != "Enter" && evt.key != " ") return;
        evt.preventDefault();
        evt.stopPropagation();
        onSelect(unit.unit_id);
      },
    };
  }

  return h(
    "li.unit-row",
    { className: classNames({ primary, interactive }), ...interactionProps },
    [
      h("span.unit-swatch", {
        style: { "--unit-swatch-color": unit.color },
      }),
      h("span.unit-title", [
        h("span.unit-name", defaultNameFunction(unit)),
        h("code.unit-id", unit.unit_id),
      ]),
      h(
        "span.unit-range",
        h(IntervalAgeRange, {
          unit,
          flavor,
          size: TagSize.Small,
          interactive: false,
        }),
      ),
    ],
  );
}

function selectionTitle(n: number): string {
  if (n == 1) return "1 unit selected";
  return `${n} units selected`;
}

/** From the base of the oldest unit to the top of the youngest */
function selectionSpan(units: any[]) {
  const dated = units.filter((u) => u.b_age != null && u.t_age != null);
  if (dated.length == 0) return null;
  let oldest = dated[0];
  let youngest = dated[0];
  for (const unit of dated) {
    if (unit.b_age > oldest.b_age) oldest = unit;
    if (unit.t_age < youngest.t_age) youngest = unit;
  }
  return {
    b_int_id: oldest.b_int_id,
    b_int_name: oldest.b_int_name,
    b_age: oldest.b_age,
    t_int_id: youngest.t_int_id,
    t_int_name: youngest.t_int_name,
    t_age: youngest.t_age,
  };
}
