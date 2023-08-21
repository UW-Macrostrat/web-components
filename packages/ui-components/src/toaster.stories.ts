import h from "@macrostrat/hyper";
import { Button } from "@blueprintjs/core";
import type { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";

import { ToasterContext, ToasterContextProps, useToaster } from "./toaster";
import { FlexRow, Box } from "./util";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<ToasterContextProps> = {
  title: "UI components/Toaster",
  component: ToasterContext,
};

export default meta;

type Story = StoryObj<ToasterContextProps>;

function GetToastButton() {
  const toaster = useToaster();
  const counter = useRef(1);
  return h(
    Button,
    {
      disabled: toaster == null,
      onClick: () => {
        toaster.show({ message: `Hello planet ${counter.current}` });
        counter.current += 1;
      },
    },
    ["Show toast"]
  );
}

export const Primary: Story = {
  render: () => {
    const containerRef = useRef<HTMLElement>(null);

    return h(ToasterContext, { containerRef }, [
      h(FlexRow, { gap: 10 }, [
        h(GetToastButton),
        h(Box, { flexGrow: 1, innerRef: containerRef, position: "relative" }, [
          h(
            Box,
            { is: "p", textAlign: "center" },
            "Toasts will be overlaid over this container"
          ),
        ]),
      ]),
    ]);
  },
};
