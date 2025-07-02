import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { PostgRESTInfiniteScrollView } from "../src/postgrest-infinite-scroll";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "UI components/PostgREST infinite scroll",
  component: PostgRESTInfiniteScrollView,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof PostgRESTInfiniteScrollView>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof PostgRESTInfiniteScrollView> = (args) =>
  h(PostgRESTInfiniteScrollView, args);

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
    combined_id: 100,
    strat_ranks: "Fm",
  },
];

Primary.args = {
  limit: 1,
  id_key: "combined_id",
  ascending: false,
  route: "https://dev.macrostrat.org/api/pg/strat_combined",
  delay: 200,
  initialItems,
};