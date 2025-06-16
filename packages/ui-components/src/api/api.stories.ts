import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { ScrollableContainer } from "./infinite-scroll";
import { Card } from "@blueprintjs/core";
import { useAPIResult } from "./provider";

export default {
  title: "UI components/API/Scrollable Container",
  component: ScrollableContainer,
  argTypes: {},
} as ComponentMeta<typeof ScrollableContainer>;

const Template: ComponentStory<typeof ScrollableContainer> = (args) =>
  h(ScrollableContainer, args);

export const Primary = Template.bind({});
Primary.args = {
  startData: [
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
  ],
  useData,
  List,
  idKey: "combined_id",
  SearchBar: null
};

export const Filterable = Template.bind({});
Filterable.args = {
  startData: [
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
  ],
  useData,
  List,
  idKey: "combined_id",
  SearchBar
};

function LinkCard({ href, className, children }) {
  return h(Card,
      { className },
      h("a", { href }, h("div.card-content", children))
    );
}

function useData(lastID, input, pageSize) {
  const url = `https://dev.macrostrat.org/api/pg/strat_combined?limit=${pageSize}&combined_id=gt.${lastID}&order=combined_id.asc&all_names=ilike.*${input}*`;
  const result = useAPIResult(url);

  return result;
}

function Item({ data }) {
  const { concept_id, id } = data;
  const isConcept = !id;

  return h(
    LinkCard,
    {
      href: `/lex/${
        isConcept ? "strat-name-concepts/" + concept_id : "strat-names/" + id
      }`,
      className: isConcept ? "strat-concept-card" : "strat-name-card",
    },
    data.name
  );
}

function List({ data }) {
  return h(
    "div.item-list",
    data.map((d) =>
      h("div.item", h(Item, { data: d }))
    )
  );
}

function SearchBar({ input, setInput }) {
  return h(
    "div.search-bar",
    h("input", {
      type: "text",
      placeholder: "Search...",
      value: input,
      onChange: (e) => setInput(e.target.value),
    })
  );
}