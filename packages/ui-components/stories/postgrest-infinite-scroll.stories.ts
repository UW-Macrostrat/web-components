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

export const CustomMultiselect = Template.bind({});

CustomMultiselect.args = {
  limit: 5,
  id_key: "source_id",
  filterable: true,
  ascending: true,
  route: "https://dev.macrostrat.org/api/pg/sources_metadata",
  delay: 100,
  toggles: h("h1", "Toggles here"),
  searchColumns: [{ value: "name", label: "Name" }],
};


export const Grouping = Template.bind({});

Grouping.args = {
  limit: 20,
  id_key: "id",
  filterable: true,
  ascending: true,
  route: "https://dev2.macrostrat.org/api/pg/autocomplete",
  delay: 100,
  toggles: h("h1", "Toggles here"),
  searchColumns: [{ value: "name", label: "Name" }],
  group_key: "type",
  groups: [
    { value: "minerals", label: "Minerals" },
    { value: "group", label: "Column groups" },
    { value: "econ", label: "Economics" },
  ],
  itemComponent: (item) => {
    console.log("Rendering item:", item);
    return h("div.item", { key: item.id }, [
      h("div.name", item.name),
      h("div.type", item.type),
    ]);
  }
};
