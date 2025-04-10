import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react";

function HelloWorld(props) {
  let rest = null;
  if (typeof props.children === "string") {
    rest = [" ", props.children];
  } else {
    rest = props.children;
  }

  return h("div", ["Hello world!", rest]);
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Example story",
  component: HelloWorld,
  description: "A basic story to be copied",
} as Meta<typeof HelloWorld>;

export const Default = {
  args: {},
};

export const WithMoreText = {
  args: {
    children: "This is more information",
  },
};

export const WithAnotherParagraph = {
  args: {
    children: h("p", "This is another paragraph"),
  },
};
