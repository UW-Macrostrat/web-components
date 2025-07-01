import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { InfiniteScrollView } from "../src/infinite-scroll";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "UI components/Infinite scroll",
  component: InfiniteScrollView,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof InfiniteScrollView>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof InfiniteScrollView> = (args) =>
  h(InfiniteScrollView, args);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
const initialItems = [
  {
    concept_id: 1,
    id: null,
    name: "Aaron",
    rank: null,
    strat_names: "Aaron",
    strat_ids: "60001",
    all_names: "Aaron,Aaron",
    combined_id: 1,
    strat_ranks: "Fm",
  }
];

Primary.args = {
  params: {
    combined_id: "gt." + initialItems[0].combined_id,
    limit: 1,
    order: "combined_id.asc",
  },
  route: "https://dev.macrostrat.org/api/pg/strat_combined",
  getNextParams,
  delay: 200,
  initialItems
};

function getNextParams(response, params) {
  console.log("getNextParams", response, params);
  return {
    ...params,
    combined_id: "gt." + response[response.length - 1].combined_id,
  };
}
