import { ComponentStory, ComponentMeta } from "@storybook/react-vite";

import { InputGroup } from "@blueprintjs/core";
import h from "@macrostrat/hyper";

export function SearchBar({ onChange, placeholder = "Search..." }) {
  return h(InputGroup, {
    className: "search-bar",
    size: "large",
    fill: true,
    round: false,
    placeholder,
    onChange: (e) => {
      const value = e.target.value;
      onChange(value);
    },
    leftIcon: "search",
  });
}

export default {
  title: "UI components/Search Bar",
  component: SearchBar,
  argTypes: {
    onChange: {
      action: "changed",
      description: "Callback function triggered on input change",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for the search input",
    },
  },
} as ComponentMeta<typeof SearchBar>;

const Template: ComponentStory<typeof SearchBar> = (args) => h(SearchBar, args);

export const Primary = Template.bind({});
Primary.args = {
  placeholder: "Search...",
  onChange: (value) => console.log("Search value:", value),
};
