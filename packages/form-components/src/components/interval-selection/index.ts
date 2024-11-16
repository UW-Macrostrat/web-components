import { Button, MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, Select2 } from "@blueprintjs/select";
import { Cell, EditableCell2Props } from "@blueprintjs/table";
import React, { useMemo, memo } from "react";
import { useInDarkMode } from "@macrostrat/ui-components";
import { getColorPair } from "@macrostrat/color-utils";
import { useAPIResult } from "@macrostrat/ui-components";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import h from "@macrostrat/hyper";

interface Timescale {
  timescale_id: number;
  name: string;
}

export interface Interval {
  int_id: number;
  name: string;
  abbrev: string;
  t_age: number;
  b_age: number;
  int_type: string;
  timescales: Timescale[];
  color: string;
}

const IntervalOption: React.FC = ({
  interval,
  props: { handleClick, handleFocus, modifiers, ...restProps },
}) => {
  const inDarkMode = useInDarkMode();
  const colors = getColorPair(interval?.color, inDarkMode);

  if (interval == null) {
    return h(
      MenuItem,
      {
        shouldDismissPopover: true,
        active: modifiers.active,
        disabled: modifiers.disabled,
        key: "",
        label: "",
        onClick: handleClick,
        onFocus: handleFocus,
        text: "",
        roleStructure: "listoption",
        ...restProps,
      },
      []
    );
  }

  return h(
    MenuItem,
    {
      style: colors,
      shouldDismissPopover: true,
      active: modifiers.active,
      disabled: modifiers.disabled,
      key: interval.int_id,
      label: interval.int_id.toString(),
      onClick: handleClick,
      onFocus: handleFocus,
      text: interval.name,
      roleStructure: "listoption",
      ...restProps,
    },
    []
  );
};

const IntervalOptionMemo = memo(IntervalOption);

const IntervalOptionRenderer: ItemRenderer<Interval> = (
  interval: Interval,
  props
) => {
  return h(IntervalOptionMemo, {
    key: interval.int_id,
    interval,
    props,
  });
};

const filterInterval: ItemPredicate<Interval> = (query, interval) => {
  if (interval?.name == undefined) {
    return false;
  }
  return interval.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};

export interface IntervalSelectionProps extends EditableCell2Props {
  intervals: Interval[];
  onPaste: (e) => Promise<boolean>;
  onCopy: (e) => Promise<boolean>;
}

export const IntervalSelection = ({
  value,
  onConfirm,
  intent,
  intervals: providedIntervals,
  onPaste,
  onCopy,
  ...props
}: IntervalSelectionProps) => {
  const [active, setActive] = React.useState(false);

  const intervals = providedIntervals ?? useIntervals();

  console.log(intervals);

  const interval = useMemo(() => {
    if (intervals == null) {
      return null;
    }
    let interval = null;
    if (intervals.length != 0) {
      interval = intervals.filter(
        (interval) => interval.int_id == parseInt(value)
      )[0];
    }

    return interval;
  }, [value, intervals, intent]);

  if (intervals == null) {
    return null;
  }

  return h(
    Cell,
    {
      ...props,
      style: { ...props.style, padding: 0 },
    },
    [
      h(
        Select2<Interval>,
        {
          fill: true,
          items: active ? intervals : [],
          className: "update-input-group",
          popoverProps: {
            position: "bottom",
            minimal: true,
          },
          popoverContentProps: {
            onWheelCapture: (event) => event.stopPropagation(),
          },
          itemPredicate: filterInterval,
          itemRenderer: IntervalOptionRenderer,
          onItemSelect: (interval: Interval, e) => {
            onConfirm(interval.int_id.toString());
          },
          noResults: h(MenuItem, {
            disabled: true,
            text: "No results.",
            roleStructure: "listoption",
          }),
        },
        h(IntervalButton, { interval, intent, setActive })
      ),
    ]
  );
};

function IntervalButton({ interval, intent, setActive }) {
  const inDarkMode = useInDarkMode();
  const colors = getColorPair(interval?.color, inDarkMode);
  return h(
    Button,
    {
      style: {
        ...colors,
        fontSize: "12px",
        minHeight: "0px",
        padding: intent ? "0px 10px" : "1.7px 10px",
        boxShadow: "none",
        border: intent ? "2px solid green" : "none",
      },
      fill: true,
      alignText: "left",
      text: h(
        "span",
        { style: { overflow: "hidden", textOverflow: "ellipses" } },
        interval?.name ?? "Select an Interval"
      ),
      rightIcon: "double-caret-vertical",
      className: "update-input-group",
      placeholder: "Select A Filter",
      onClick: () => setActive(true),
    },
    []
  );
}

function useIntervals(timescaleID: number | null = null): Interval[] {
  const params = useMemo(() => {
    if (timescaleID == null) {
      return { all: true };
    }
    return { timescale_id: timescaleID };
  }, [timescaleID]);

  return useAPIResult(
    "https://macrostrat.org/api/v2/defs/intervals",
    params,
    (res) => res.success.data
  );
}
