import h from "@macrostrat/hyper";
import { Button } from "@blueprintjs/core";
import type { Meta, StoryObj } from "@storybook/react";

import { ToasterContext, ToasterContextProps, useToaster } from "./toaster";
import { FlexRow, FlexBox, Box } from "./util";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<ToasterContextProps> = {
  title: "UI components/Toaster",
  component: ToasterContext,
};

export default meta;

type Story = StoryObj<ToasterContextProps>;

function GetToastButton() {
  const toaster = useToaster();
  console.log(toaster);
  return h(
    Button,
    {
      disabled: toaster == null,
      onClick: () => toaster.show({ message: "Hello" }),
    },
    ["Show toast"]
  );
}

export const Primary: Story = {
  render: () => {
    return h(ToasterContext, { createToaster: false }, [
      h(FlexRow, { gap: 10 }, [
        h(GetToastButton),
        h(FlexBox, { grow: 1 }, [
          h(ToasterContext.Toaster),
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
