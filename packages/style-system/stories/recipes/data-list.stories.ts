import { Meta } from "@storybook/react-vite";
import h from "./data-list.module.sass";

const columns = [
  { name: "Uinta Basin", meta: "42 units", selected: true },
  { name: "Green River", meta: "38 units" },
  { name: "Piceance Creek", meta: "27 units" },
  { name: "Sand Wash", meta: "19 units" },
];

function Item({ name, meta, selected }) {
  const className = selected ? "item selected" : "item";
  return h(`div.${className.split(" ").join(".")}`, [
    h("span", name),
    h("span.meta", meta),
  ]);
}

function DataList() {
  return h("div.panel", [
    h("div.header", "Stratigraphic columns"),
    ...columns.map((c) => h(Item, { key: c.name, ...c })),
  ]);
}

export default {
  title: "Style system/Recipes/Data list",
  component: DataList,
} as Meta<typeof DataList>;

export const Default = { args: {} };
