import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { Pagination } from "../src";
import { useState } from "react";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "UI components/Pagination",
  component: Pagination,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof Pagination>;

export function Basic() {
  const [ix, setIX] = useState(0);
  return h("div", [
    h("p", `Current page: ${ix}`),
    h(Pagination, {
      currentPage: ix,
      nextDisabled: false,
      setPage: (page: number) => setIX(page),
    }),
  ]);
}
