import { ComponentMeta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  RegionalStratigraphy,
  Physiography,
  MacrostratLinkedData,
  XddExpansion,
  FossilCollections,
} from "../src/location-details";
import {
  fetchMapInfo,
  fetchColumnInfo,
  fetchXddInfo,
  fetchFossilInfo,
} from "./fetch-geological-data";

export default {
  title: "Map interface/Geological map sidebar",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
  component: RegionalStratigraphy,
} as ComponentMeta<any>;

const lat = 44.60085563149249;
const lng = -96.16783150353609;
const zoom = 3.9392171056922325;

export function RegionalStratigraphyExample() {
  const mapInfo = fetchMapInfo(lng, lat, zoom);
  const columnInfo = fetchColumnInfo(lng, lat);

  if (mapInfo == null || columnInfo == null) {
    return null;
  }

  console.log("mapInfo", mapInfo);
  console.log("columnInfo", columnInfo);

  return h(RegionalStratigraphy, {
    mapInfo,
    columnInfo,
    columnURL: "https://dev.macrostrat.org/columns/",
    expanded: true,
  });
}

export function PhysiographyExample() {
  const mapInfo = fetchMapInfo(lng, lat, zoom);

  return h(Physiography, {
    mapInfo,
    expanded: true,
  });
}

export function MacrostratLinkedDataExample() {
  const mapInfo = fetchMapInfo(lng, lat, zoom);

  if (mapInfo == null) {
    return null;
  }

  const source =
    mapInfo && mapInfo?.mapData && mapInfo?.mapData.length
      ? mapInfo?.mapData[0]
      : {
          name: null,
          descrip: null,
          comments: null,
          liths: [],
          b_int: {},
          t_int: {},
          ref: {},
        };

  return h(MacrostratLinkedData, {
    mapInfo,
    source,
    stratNameURL: "https://dev.macrostrat.org/lex/strat-names",
    environmentURL: "https://dev.macrostrat.org/lex/environments",
    intervalURL: "https://dev.macrostrat.org/lex/intervals",
    lithologyURL: "https://dev.macrostrat.org/lex/lithologies",
    expanded: true,
  });
}

export function xddInfoExample() {
  const mapInfo = fetchMapInfo(lng, lat, zoom);
  const xddInfo = fetchXddInfo(mapInfo?.mapData?.[0]?.macrostrat?.strat_names);

  if (!xddInfo) {
    return null;
  }

  return h(XddExpansion, { xddInfo, expanded: true, nestedExpanded: true });
}

export function FossilsExample() {
  const fossilInfo = fetchFossilInfo(-89.3938453, 43.0735407);

  return h(FossilCollections, { data: fossilInfo, expanded: true });
}
