import { ComponentStory, ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { RegionalStratigraphy } from "./reg-strat";
import { Physiography } from "./physiography";
import { fetchMapInfo, fetchColumnInfo } from "./fetch";

export default {
  title: "Data components/Location details",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
} as ComponentMeta<any>;

const Template: ComponentStory<typeof RegionalStratigraphy> = (args) =>
  h(RegionalStratigraphy, { ...args });

const lat = 44.60085563149249;
const lng = -96.16783150353609;
const zoom = 3.9392171056922325;

export function RegionalStratigraphyExample() {
  const mapInfo = fetchMapInfo(lng, lat, zoom);
  const columnInfo = fetchColumnInfo(lng, lat);

  return h(RegionalStratigraphy, {
    mapInfo,
    columnInfo,
    columnURL: "https://dev.macrostrat.org/columns/",
  });
}

export function PhysiographyExample() {
  const mapInfo = fetchMapInfo(lng, lat, zoom);

  return h(Physiography, {
    mapInfo,
  });
}