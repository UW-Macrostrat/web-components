import { ComponentStory, ComponentMeta } from "@storybook/react";
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
Primary.args = {
  params: {
    combined_id: "gt.10",
    limit: 10,
    order: "combined_id.asc",
  },
  route: "https://dev.macrostrat.org/api/pg/strat_combined",
  getNextParams,
  initialItems: [
    {
      "concept_id": 1,
      "id": null,
      "name": "Aaron",
      "rank": null,
      "strat_names": "Aaron",
      "strat_ids": "60001",
      "all_names": "Aaron,Aaron",
      "combined_id": 1,
      "strat_ranks": "Fm"
    },
    {
      "concept_id": 2,
      "id": null,
      "name": "Abbott",
      "rank": null,
      "strat_names": null,
      "strat_ids": null,
      "all_names": "Abbott,",
      "combined_id": 2,
      "strat_ranks": null
    },
    {
      "concept_id": 3,
      "id": null,
      "name": "Abel Gap",
      "rank": null,
      "strat_names": "Abel Gap",
      "strat_ids": "7637",
      "all_names": "Abel Gap,Abel Gap",
      "combined_id": 3,
      "strat_ranks": "Fm"
    },
    {
      "concept_id": 4,
      "id": null,
      "name": "Aberdeen",
      "rank": null,
      "strat_names": "Aberdeen,Aberdeen Sandstone",
      "strat_ids": "60004,60005",
      "all_names": "Aberdeen,Aberdeen,Aberdeen Sandstone",
      "combined_id": 4,
      "strat_ranks": "Mbr,Mbr"
    },
    {
      "concept_id": 5,
      "id": null,
      "name": "Abingdon",
      "rank": null,
      "strat_names": "Abingdon Coal",
      "strat_ids": "60006",
      "all_names": "Abingdon,Abingdon Coal",
      "combined_id": 5,
      "strat_ranks": "Mbr"
    },
    {
      "concept_id": 6,
      "id": null,
      "name": "Able",
      "rank": null,
      "strat_names": "Able",
      "strat_ids": "6899",
      "all_names": "Able,Able",
      "combined_id": 6,
      "strat_ranks": "Mbr"
    },
    {
      "concept_id": 7,
      "id": null,
      "name": "Abrahams Creek",
      "rank": null,
      "strat_names": "Abrahams Creek",
      "strat_ids": "60008",
      "all_names": "Abrahams Creek,Abrahams Creek",
      "combined_id": 7,
      "strat_ranks": "Mbr"
    },
    {
      "concept_id": 8,
      "id": null,
      "name": "Absalona",
      "rank": null,
      "strat_names": "Absalona,Absalona",
      "strat_ids": "60009,10498",
      "all_names": "Absalona,Absalona,Absalona",
      "combined_id": 8,
      "strat_ranks": "Fm,Fm"
    },
    {
      "concept_id": 9,
      "id": null,
      "name": "Accomac Canyon",
      "rank": null,
      "strat_names": "Accomac Canyon Alloformation",
      "strat_ids": "60011",
      "all_names": "Accomac Canyon,Accomac Canyon Alloformation",
      "combined_id": 9,
      "strat_ranks": "Fm"
    },
    {
      "concept_id": 10,
      "id": null,
      "name": "Accomack",
      "rank": null,
      "strat_names": "Accomack",
      "strat_ids": "60012",
      "all_names": "Accomack,Accomack",
      "combined_id": 10,
      "strat_ranks": "Mbr"
    }
  ],
};

function getNextParams(response, params) {
  console.log("getNextParams", response, params);
  return {
    ...params,
    combined_id: "gt." + response[response.length - 1].combined_id,
  };
}