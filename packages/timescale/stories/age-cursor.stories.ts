import { Timescale, TimescaleOrientation } from "../src";
import h from "@macrostrat/hyper";
import { useState } from "react";

function TimescaleWithCursor(props) {
  const [cursorPosition, setCursorPosition] = useState(props.cursorPosition);

  return h(Timescale, {
    ...props,
    cursorPosition,
    onClick: (e, data) => {
      const { age } = data;
      setCursorPosition(age);
    },
  });
}

export default {
  title: "Timescale/Age Cursor",
  component: TimescaleWithCursor,
};

export const Primary = {
  args: {
    levels: [0, 5],
    ageRange: [2000, 0],
    orientation: TimescaleOrientation.VERTICAL,
    //cursorPosition: 1500,
  },
};

export const HorizontalWithAbsoluteAges = {
  args: {
    orientation: TimescaleOrientation.HORIZONTAL,
    levels: [0, 5],
    absoluteAgeScale: true,
    length: 2500,
    ageRange: [2000, 0],
    cursorPosition: 1500,
  },
};
