import { hyperStyled } from "@macrostrat/hyper";
import { useState, useEffect } from "react";
import { Button, Slider, Intent, SliderProps } from "@blueprintjs/core";

import classNames from "classnames";
import styles from "./main.module.sass";

const h = hyperStyled(styles);

const ControlledSlider = (props: SliderProps) => {
  const [value, setValue] = useState<number>(props.value);
  const onChange = (v) => {
    (setValue(v), props.onChange?.(v));
  };
  useEffect(() => setValue(props.value), [props.value]);

  return h(Slider, { ...props, onChange, value });
};

const NullableSlider = (props: SliderProps) => {
  let { value, showTrackFill, className, ...rest } = props;
  if (value == null) {
    value = rest.min ?? 0;
    showTrackFill = false;
    className = classNames(className, "slider-disabled");
  }

  const handleChange = props.onRelease ?? props.onChange;
  const onClick = () => handleChange?.(null);

  return h("div.nullable-slider", [
    h(ControlledSlider, { ...rest, className, value, showTrackFill }),
    h("div.controls", [
      h(Button, {
        minimal: true,
        onClick,
        small: true,
        icon: "cross",
        disabled: props.value == null,
        intent: props.value == null ? null : Intent.DANGER,
      }),
    ]),
  ]);
};

export { ControlledSlider, NullableSlider };
