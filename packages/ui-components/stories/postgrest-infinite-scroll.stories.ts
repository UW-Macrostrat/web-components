import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { PostgRESTInfiniteScrollView } from "../src/postgrest-infinite-scroll";
import { MultiSelect } from "@blueprintjs/select";

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

Primary.args = {
  limit: 5,
  id_key: "source_id",
  filterable: true,
  ascending: true,
  route: "https://dev.macrostrat.org/api/pg/sources_metadata",
  delay: 100,
  toggles: h("h1", "Toggles here"),
  searchColumns: [{ value: "name", label: "Name" }],
};

export const Multiselect = Template.bind({});

Multiselect.args = {
  limit: 5,
  id_key: "source_id",
  filterable: true,
  ascending: true,
  route: "https://dev.macrostrat.org/api/pg/sources_metadata",
  delay: 100,
  toggles: h("h1", "Toggles here"),
  searchColumns: [
    { value: "name", label: "Name" },
    { value: "authors", label: "Author" },
  ],
};

export const Grouping = Template.bind({});

Grouping.args = {
  limit: 20,
  id_key: "id",
  filterable: true,
  ascending: true,
  route: "https://dev.macrostrat.org/api/pg/autocomplete",
  delay: 100,
  searchColumns: [{ value: "name", label: "Name" }],
  group_key: "type",
  groups: [
    { value: "econs", label: "Economics" },
    { value: "maps", label: "Maps" },
    { value: "environments", label: "Environments" },
    { value: "groups", label: "Column groups" },
    { value: "columns", label: "Columns" },
    { value: "intervals", label: "Intervals" },
    { value: "lithologies", label: "Lithologies" },
    { value: "lithology_attributes", label: "Lithology attributes" },
    { value: "projects", label: "Projects" },
    { value: "strat_name_concepts", label: "Strat name concepts" },
    { value: "structures", label: "Structures" },
    { value: "minerals", label: "Minerals" },
  ],
  itemComponent: (item) => {
    return h("div.item", { key: item.data.id }, [
      h("div.name", item.data.name),
    ]);
  },
  filter_threshold: 2, // Minimum characters to trigger filtering
  NonIdealStateParams: {
    title: "No data to display",
    description: "Type at least 2 characters to filter results",
    icon: "search",
    className: "no-results",
  },
};
