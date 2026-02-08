import type { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  RegionalStratigraphy,
  Physiography,
  MacrostratLinkedData,
  XddExpansion,
  FossilCollections,
} from "../src/location-details";
import {
  useMapInfo,
  useColumnInfo,
  useXddInfo,
  useFossilInfo,
} from "./fetch-geological-data";
import { ExpandableDetailsPanel, ExpansionBody } from "../src";
import { LithologyList, Tag, TagField } from "@macrostrat/data-components";
import { Box } from "@macrostrat/ui-components";

export default {
  title: "Map interface/Geological map sidebar",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
  component: MacrostratLinkedDataExample,
} as Meta<any>;

const lat = 44.60085563149249;
const lng = -96.16783150353609;
const zoom = 3.9392171056922325;

export const Primary = {
  args: {},
};

export function LithologyPanel() {
  const mapInfo = useMapInfo(lng, lat, zoom);

  if (mapInfo == null) {
    return null;
  }

  const macrostrat = mapInfo?.mapData[0]?.macrostrat;

  if (macrostrat == null) return null;

  const { liths = null, lith_types = null } = macrostrat;

  if (!liths || liths.length == 0) return null;

  const lithologies = liths.map((lith) => {
    return {
      ...lith,
      name: lith.lith,
      color: lith.color || "#000000",
    };
  });

  return h(
    Box,
    { width: 420 },
    h(
      ExpandableDetailsPanel,
      {
        headerElement: h(TypesList, { label: "Lithology", data: lith_types }),
      },
      h(
        ExpansionBody,
        h(LithologyList, {
          label: "Matched lithologies",
          lithologies,
        }),
      ),
    ),
  );
}

function TypesList(props) {
  /** List for higher-level type/class attributes (e.g. environment types, economic types)
   * that might not have specific IDs
   */
  const { data, label } = props;

  if (!data || data.length == 0) return null;

  return h(
    TagField,
    { label },
    data.map((d) => {
      let name = d.name;
      if (name == null || name == "") name = "other";
      return h(Tag, { name, color: d.color ?? "#888" });
    }),
  );
}

export function RegionalStratigraphyExample() {
  const mapInfo = useMapInfo(lng, lat, zoom);
  const columnInfo = useColumnInfo(lng, lat);

  if (mapInfo == null || columnInfo == null) {
    return null;
  }

  console.log("Map info:", mapInfo);
  console.log("Column info:", columnInfo);

  return h(RegionalStratigraphy, {
    mapInfo,
    columnInfo,
    columnURL: "https://dev.macrostrat.org/columns/",
    expanded: true,
  });
}

export function PhysiographyExample() {
  const mapInfo = useMapInfo(lng, lat, zoom);
  if (mapInfo == null) {
    return null;
  }

  return h(Physiography, {
    mapInfo,
    expanded: true,
  });
}

export function MacrostratLinkedDataExample() {
  const mapInfo = useMapInfo(lng, lat, zoom);

  console.log("MacrostratLinkedData:", mapInfo);

  if (mapInfo == null) {
    return null;
  }

  const source = mapInfo?.mapData[0];

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
  const mapInfo = useMapInfo(lng, lat, zoom);
  const xddInfo = useXddInfo(mapInfo?.mapData?.[0]?.macrostrat?.strat_names);
  if (xddInfo == null || mapInfo == null) {
    return null;
  }

  return h(XddExpansion, { xddInfo, expanded: true, nestedExpanded: true });
}

export function FossilsExample() {
  const fossilInfo = useFossilInfo(-89.3938453, 43.0735407);

  return h(FossilCollections, { data: fossilInfo, expanded: true });
}
