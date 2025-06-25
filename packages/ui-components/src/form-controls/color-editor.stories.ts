import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import h from "@macrostrat/hyper";

import { ColorEditor } from "./color-editor";

export default {
  title: "UI Components/Controls/ColorPicker",
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
