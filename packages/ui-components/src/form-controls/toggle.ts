import React, { ComponentType } from "react";
import h from "@macrostrat/hyper";

interface SimpleToggleProps extends React.ComponentProps<"a"> {
  isOn: boolean;
  toggle: (a: boolean) => void;
  component?: ComponentType<{ onClick(): void }> | string;
  name?: string;
}

export function SimpleToggle(props: SimpleToggleProps) {
  const { component = "a", isOn, toggle, name, ...rest } = props;
  return h(
    component,
    {
      onClick() {
        toggle(!isOn);
      },
      ...rest,
    },
    [isOn ? "Hide" : "Show", " ", name]
  );
}
