import { ComponentStory, ComponentMeta } from "@storybook/react";
import { useArgs } from "@storybook/client-api";
import h from "@macrostrat/hyper";

import { ColorEditor } from "./color-editor";

export default {
  title: "Controls/ColorPicker",
  component: ColorEditor,
  args: {
    color: "#aaaaaa",
  },
} as ComponentMeta<typeof ColorEditor>;

const Template: ComponentStory<typeof ColorEditor> = (args) => {
  const [{ ...rest }, updateArgs] = useArgs();
  return h(
    "div.container",
    {
      style: {
        height: "300px",
        margin: "20px",
        paddingTop: 100,
      },
    },
    h(ColorEditor, {
      ...rest,
      onChange(c) {
        updateArgs({ ...rest, color: c });
      },
    })
  );
};

export const TestEditor = Template.bind({});
TestEditor.args = { color: "#aaaaaa" };
